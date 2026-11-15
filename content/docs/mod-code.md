# Add code to your mod

Give a mod behaviour with Rust: a hook that greets each player who joins. The code sits in the same folder as your blocks and items, and ships in the same `.hmod` with one `horizon-mod.toml`.

## What you will make

A mod that, when a player joins, says in chat:

```text
sunrise_hello says hello, Steve!
```

On the way you meet five ideas code mods use: **hooks, events, the host, handles and Parts.**

## Before you start

- You have done the [quickstart](/docs/make-a-mod): Rust and `cargo horizon-mod` are installed. The tool installs with `cargo install --locked --git https://github.com/sunrise-org/sunrise cargo-horizon-mod`.
- You have **Sunrise's launcher** ([Install Sunrise](/docs/install)): it compiles your code against the pinned prebuilt game. The book's [Installing and using mods](/docs/modding/start/installing) shows how to get it and prepare a game.
- You know a little Rust. If not, [the Rust book](https://doc.rust-lang.org/book/)'s first chapters are enough.

## Step 1: Make the project

In your terminal, in your projects folder:

```sh
cargo horizon-mod new sunrise_hello --template native
cd sunrise_hello
```

`--template native` adds the Rust files. The folder looks like this:

```text
sunrise_hello/
├── horizon-mod.toml   the manifest, with a [native] section
├── Cargo.toml         the Rust project
├── src/lib.rs         your code
├── assets/            empty, ready for models and textures
├── data/              empty, ready for blocks and items
└── .horizon/sdk/      the pinned SDK, fetched by the tool, not packed
```

> [!TIP] Already have a mod with blocks?
> Copy its `assets/` and `data/` folders into this one, and its `id`, `name` and `version` into this manifest. Now one mod has both.

## Step 2: Read the manifest

**File:** `horizon-mod.toml`

```toml
id = "sunrise_hello"
name = "sunrise hello"
version = "0.1.0"
description = ""
authors = []
api = "0.2"
side = "both"
capabilities = ["registries"]

[native]
game = "26.3"
horizon = "<40-character game commit>"
mixins = "<40-character horizon-mixins commit>"
```

- The top is the same as for a mod with only data.
- `[native]` selects native code and pins its build.
- `horizon` pins the game build; `mixins` pins the horizon-mixins tool. The launcher compiles against the prebuilt game, never rebuilding the game for a mod.
- The tool pins the current Nightly by default (or `--horizon <build>`). Keep the pins it writes.

The mod's id and version come from this file only, never from `Cargo.toml`.

## Step 3: Read Cargo.toml

**File:** `Cargo.toml`

```toml
[package]
name = "mod-sunrise_hello"
version = "0.1.0"
edition = "2024"

[dependencies]
horizon-mod-api = { path = ".horizon/sdk/api/crates/horizon-mod-api" }
```

- It is an ordinary Rust project.
- Its starter dependency is the mod API from the pinned SDK in `.horizon/sdk/`. Any `cargo horizon-mod` command fetches it again after a fresh clone.
- You rarely edit it. To add a crate from crates.io, see [Use other crates](#use-other-crates) below.

## Step 4: Read the code

**File:** `src/lib.rs`

```rust
use mod_api::{self, Hooks, PlayerLoggedInEvent, ServerHost, Text};

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    /// A player joined the server (NeoForge's `PlayerLoggedInEvent`): greet them.
    fn player_logged_in(&self, host: &mut dyn ServerHost, event: &mut PlayerLoggedInEvent<'_>) {
        let line = format!("sunrise_hello says hello, {}!", event.name);
        if let Some(player) = host.player(event.player) {
            let _ = player.tell(host, Text::literal(line));
        }
    }
}
```

Line by line:

1. `struct Mod;` is your mod. It holds nothing yet.
2. `impl Hooks for Mod` lists the moments your mod reacts to. Each method is one **hook**.
3. `#[mod_api::horizon_mod]` subscribes the mod to exactly the hooks in that block, and no others.
4. `player_logged_in` is the hook for "a player joined".
5. `event` is the **event**: what happened. `event.name` is the player's name, `event.player` their id.
6. `host` is the **host**: your way to reach the game. A server hook gets a `ServerHost`.
7. `host.player(event.player)` turns the id into a **handle**, an object for that player. It returns `None` when that real online player cannot be resolved.
8. `player.tell(host, …)` sends them a system chat line. It returns `Result<bool, TextFormError>`; `let _ =` ignores the result.

## Step 5: Build it for a game

The launcher compiles your mod against the pinned prebuilt game, for one **instance** (one of the launcher's game setups).

1. Make a test instance once, so your other worlds stay untouched:

   ```sh
   horizon-launcher instance create Development
   ```

2. Build the mod for it, from your mod's folder:

   ```sh
   horizon-launcher native-build . --instance Development --trust-native-code
   ```

What each part means:

- `.` is "the mod in this folder".
- `--instance Development` selects the instance that will play the build; this command does not change your other instances.
- `--trust-native-code` is your yes to the launcher's warning. Native code is not sandboxed: it can do anything you can on your computer. Build only code you trust.

> [!NOTE] Build downloads
> The launcher may download the pinned prebuilt game and its Rust tools. Mod builds use the SDK's optimized compilation settings; they do not compile the game.

> [!TIP] Command not found?
> `horizon-launcher` is the launcher program itself. If your terminal does not find it, run it by its full path, from the folder the launcher is installed in.

## Step 6: Try it

1. In the launcher, pick the **Development** instance and press **Play**.
2. Open a world.
3. Read the chat: `sunrise_hello says hello, <your name>!`

**Change it:** edit the text in `format!(...)`, run the `native-build` line again and replay. That loop, edit, build, play, is how you work on a code mod.

## Step 7: Pack it as one file

```sh
cargo horizon-mod build
cargo horizon-mod check target/horizon-mod/sunrise_hello.hmod
```

- `build` packs the manifest, `Cargo.toml`, `src/`, and `assets/`, `data/`, `Cargo.lock` and `icon.png` when they hold something.
- It packs source, not a native binary. The tool may compile-check it to scan API uses and layouts; each player's launcher compiles the source against the prebuilt game.
- `check` reports a mod with code and prints its pins and other checks. Its header includes:

```text
sunrise_hello 0.1.0 (native-mod, format native-1/<horizon commit>/<mixins commit>, for 26.3)
```

## The five ideas, in one place

- **Hooks:** the moments the game lets your code run. Each is a method of `Hooks`. Implement the ones you need.
- **Events:** the moment's data. Writable fields affect the outcome only where the hook's contract says so. `player_logged_in` is a notice, not a way to refuse a join.
- **Host:** how a hook reaches the game. Server hooks get a `ServerHost`, client hooks a `ClientHost`; hooks on both sides can get `HostSide`. Registration hooks use a registrar. The types keep side-only calls on their side.
- **Handles:** names for game objects, such as a player, an entity or a level. Their methods take the host.
- **Parts:** behaviour attached to a block, item or fluid type, beside the data that defines it. Next to them, **attachments** keep your own state on game objects; a serialization codec makes that state persist with the world.

The reference book explains [hooks and the Host](/docs/modding/concepts/hooks-and-the-host), [Parts](/docs/modding/concepts/parts) and [attachments](/docs/modding/concepts/attachments).

## Find the other hooks

In a checkout of [Sunrise's repository](https://github.com/sunrise-org/sunrise), this opens the API's documentation, with every hook, event and host method:

```sh
cargo doc -p horizon-mod-api --open
```

The book's [mod API reference](/docs/modding/reference/api) says more. For a complete starter, read [Your first native mod](/docs/modding/start/first-mod).

## Use other crates

A mod may depend on crates from crates.io. Each registry package needs an exact version and checksum in a `Cargo.lock` beside `Cargo.toml`; the book below covers the other build restrictions.

1. Add the crate to `[dependencies]` in `Cargo.toml`.
2. Make the lock:

   ```sh
   horizon-launcher native-lock .
   ```

3. Keep `Cargo.lock` in the folder: it ships in the `.hmod`.

- `--update-lock` replaces pins you made before.
- Other Git dependencies and paths outside the mod are refused; local crates inside the mod are allowed.
- The book's [The mod's crate](/docs/modding/how-to/native-mods/the-mods-crate) has the rules.

## Build it for the sandbox instead

```sh
cargo horizon-mod build --wasm
```

builds the same crate to `mod.wasm`, records `[wasm]` in the manifest and packs it with its source. A package carries native or wasm code, not both; the wasm package has no `[native]` table. The game checks API layouts and the wasm toolchain before running it in its sandbox. Supported hooks and Parts use the same typed API; APIs marked `Not on wasm` are unavailable. See [Building a mod to mod.wasm](/docs/modding/how-to/wasm-mods).

## Keep it building

Your native binary targets one exact game build. API-only source can fit another build when the surface items it uses are unchanged. To move its SDK pin:

```sh
cargo horizon-mod update
```

- It repins the mod to the current Nightly build.
- It reports changes to API items your mod uses before repinning, or names a mod made for exactly one build.
- Then build again and fix what the compiler names.

[Fitting another build](/docs/modding/reference/sdk/fit) explains compatibility and the pins.

## Where to go next

- Test it properly: [Test a mod](/docs/test-a-mod).
- Every manifest field: [The manifest](/docs/mod-manifest).
- Commands, config files, sounds and more: the [Native mods](/docs/modding/how-to/native-mods) chapters of the book.
- Listen at published points with API-typed `[[inject]]`: [Injections](/docs/modding/concepts/injections), on native and wasm. Game-code changes are native-only, through `[[native.mixin]]`, `[[native.bridge]]`, `[[native.module]]` and `[[native.loop]]`: [The native route](/docs/modding/concepts/native-route).
