# Make a mod: quickstart

Install the mod tool, make your first mod folder and pack it into one `.hmod` file.

## What you will have at the end

- A folder on your computer with your mod's files in it.
- One file, `my_first_mod.hmod`, that holds the whole mod.

That is the whole idea of Sunrise modding: **one folder while you work, one `.hmod` file when you share it.** The same is true when your mod has Rust code in it. [How a mod works](/docs/how-mods-work) explains why.

## Step 1: Open a terminal

Every command on these pages is typed in a terminal, then run with Enter.

- **Windows:** open the Start menu, type `PowerShell` and open it.
- **macOS:** open **Terminal**, in Applications, then Utilities.
- **Linux:** open your usual terminal.

> [!TIP] One terminal is enough
> The commands are the same on all three systems unless a step says otherwise. Keep the same window open as you go.

## Step 2: Install Rust

The mod tool is written in Rust, and Rust's installer also gives you `cargo`, which runs it.

1. Go to [rustup.rs](https://rustup.rs).
2. **Windows:** download and run `rustup-init.exe`. If it offers to install the Visual Studio C++ build tools, accept: Rust needs them on Windows.
3. **macOS and Linux:** paste this line in the terminal:

   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

4. **Close the terminal and open a new one,** so it finds the new commands.
5. Check it worked:

   ```sh
   cargo --version
   ```

   It prints a version, such as `cargo 1.x.y`. If it says the command is not found, open a new terminal again.

## Step 3: Install the mod tool

`cargo horizon-mod` makes, packs and checks mods. Install it from Sunrise's repository:

```sh
cargo install --locked --git https://github.com/sunrise-org/sunrise cargo-horizon-mod
```

- It compiles the tool from source.
- Run the same line again later to update it.

Check it worked by running it with nothing after it:

```sh
cargo horizon-mod
```

It answers with a long line that starts with `error: usage: cargo horizon-mod new <path>`. The "error" only means you gave it no command: the tool is installed.

## Step 4: Make your mod folder

1. Go to the folder where you keep your projects. For example, your Documents folder:

   ```sh
   cd ~/Documents
   ```

   This works in PowerShell, Terminal and Linux shells alike.

2. Make the mod:

   ```sh
   cargo horizon-mod new my_first_mod --name "My First Mod"
   ```

3. The tool answers:

   ```text
   Created my_first_mod (mod id my_first_mod). Next: cd my_first_mod && cargo horizon-mod build, then copy target/horizon-mod/my_first_mod.hmod into your game folder's horizon-mods/ (docs/modding/src/start/first-content-mod.md)
   ```

You now have a folder `my_first_mod` with a manifest and one example block, Glowing Amethyst.

> [!NOTE] The folder name becomes the mod's id
> ASCII letters and digits are kept, with letters lowercased, and every other character becomes `_`. So `new My-Mod` makes the id `my_mod`. The id is the mod's namespace: its block is `my_first_mod:glowing_amethyst`.

## Step 5: Pack it into one file

1. Go into the folder:

   ```sh
   cd my_first_mod
   ```

2. Pack it:

   ```sh
   cargo horizon-mod build
   ```

3. The tool answers with the path of your new file (on Windows, path separators may appear as `\`):

   ```text
   Built ./target/horizon-mod/my_first_mod.hmod
   ```

That `.hmod` is your whole mod. You can now [test it](/docs/test-a-mod), or send it to a friend.

## Step 6: Pick what to build next

- **[Build your first block](/docs/build-your-first-block).** Walks through every file the tool just made, then adds your own.
- **[Add code to your mod](/docs/mod-code).** One Rust file that greets players when they join.
- **[How a mod works](/docs/how-mods-work).** Registries, ids and where each file goes, explained in plain words.

## The tool's commands

Run them inside your mod's folder.

- `cargo horizon-mod new <folder>` makes a mod from the example template. Add `--name "Name"` to set its display name.
- `cargo horizon-mod new <folder> --template native` makes a mod with Rust code: the manifest, `Cargo.toml` and `src/lib.rs`.
- `cargo horizon-mod build` checks your files and packs them into `target/horizon-mod/<id>.hmod`. For native mods it packs Rust source; Sunrise's launcher builds the installed mod against the pinned prebuilt game.
- `cargo horizon-mod build --wasm` first builds your Rust to `mod.wasm`, for the game's sandbox.
- `cargo horizon-mod run --game <path to horizon-client>` packs a content mod, then starts that game with it turned on. This is for a game you built yourself; code mods run through Sunrise's launcher.
- `cargo horizon-mod check <file>` reads a `.hmod` the way the mod registry does. Add `--json` for JSON.
- `cargo horizon-mod update` repins a native mod to the current Nightly build. Use `--horizon <build>` to select a build.

> [!NOTE] Which build these guides follow
> These guides were checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. The templates and commands on these pages were compared with that source but not run; the Rust greeting in [Add code to your mod](/docs/mod-code) was compile-checked against `horizon-mod-api`.
