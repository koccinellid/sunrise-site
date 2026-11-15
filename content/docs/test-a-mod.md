# Test a mod

Three checks, in order: the file checker, your own unit tests, then the game. Each one catches a different kind of mistake.

## Check 1: the file

Pack the mod and read it the way the mod registry will:

```sh
cargo horizon-mod build
cargo horizon-mod check target/horizon-mod/my_mod.hmod
```

Replace `my_mod` with the `id` in your `horizon-mod.toml`.

- **`build`** checks your data with the game's own rules. A block file with an unknown key fails here, not in a player's log.
- **`check`** reads the `.hmod`: its size and SHA-256, its manifest, its data and, for code, its pins. It runs no mod code.

Useful options for `check`:

- `--json` prints the report as JSON, for scripts.
- `--key <public key> --signature <file>.minisig` also checks your signature ([Publish](/docs/publish-a-mod#step-2-sign-it-optional-recommended)).

It also reads `.hpack`, resource pack `.zip` and `.hshader` files.

## Check 2: unit tests

Code that doesn't call the game, such as formatting, maths or parsing a command's arguments, is ordinary Rust.

- Keep that logic in plain functions.
- Keep your hooks thin: they call those functions.
- Test them with `#[test]` and run:

```sh
cargo test
```

## Check 3: the game

### A mod with data only

```sh
cargo horizon-mod run
```

- It packs the mod and starts `horizon-client` with it turned on.
- Add `--game <path>` when `horizon-client` isn't on your `PATH`.
- Arguments after `--` go to the game.
- Using Sunrise's launcher instead? See [Try it in the game](/docs/build-your-first-block#step-9-try-it-in-the-game).

**Try each of these:**

- Place each block, mine it with and without the right tool, and look at what drops.
- Make each recipe in a crafting table or furnace, and find it in the recipe book.
- Look at names and textures, in the inventory and in the world.
- Read the log and check the Mods screen for load refusals. Invalid content can keep a whole mod from loading, not just one file.

> [!NOTE] Restart after each change
> After editing mod files, build again and restart the game to test the new package.

### A mod with Rust code

`cargo horizon-mod run` refuses a project with `Cargo.toml`. For a native mod, build it into a test instance with Sunrise's launcher instead:

```sh
horizon-launcher native-build . --instance Development --trust-native-code
```

Then play that instance and trigger each hook and Part you wrote.

**Try each of these:**

- The **Mods** screen: your mod's row, its version, and its Config page if it has one.
- Every command: with no arguments, with good ones and with wrong ones.
- A single-player world and a server. A `side = "both"` mod needs matching IDs and versions on both ends: join with and without it, and read the refusal.
- Quit and start again, for a mod that keeps settings.

> [!WARNING] Native code is not sandboxed
> Native code runs with the player's rights. Don't use panics for expected failures; handle `Option` and `Result` values explicitly.

### The same code in the sandbox

For API-only code, build with `cargo horizon-mod build --wasm` and test the resulting `target/horizon-mod/<id>.hmod` on its own. It is the same source, but it crosses a sandbox boundary the native build doesn't have. A wasm mod has no `[native]` table: engine-code changes through `[[native.mixin]]`, `[[native.bridge]]`, `[[native.module]]` or `[[native.loop]]` are native only. See [WebAssembly mods](/docs/modding/how-to/wasm-mods).

## On a dedicated server

A dedicated server runs native code from a standalone engine export, not from an instance.

- [Standalone server export](/docs/modding/how-to/native-mods/standalone-server-export) explains how to build and run the export.

## Against a game you built yourself

To test against game source you changed, install your checkout as a local unsigned developer base and pin an instance to it: [A local unsigned developer base](/docs/modding/how-to/native-mods/local-developer-builds).

Next: [publish it](/docs/publish-a-mod).
