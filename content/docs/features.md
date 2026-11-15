# What Sunrise can do

The highlights: what Sunrise adds to vanilla, how its new mod system works, and what it does not do. Each section links to the full page.

## Highlights for players

- **Light and fast.** It starts quickly, uses little memory and draws efficiently. [Performance](/docs/performance) says what is measured.
- **Distant terrain.** See far past your render distance with LOD. [Settings](/docs/settings#distant-terrain-lod)
- **Controllers.** PlayStation, Xbox, Switch Pro and the Steam Deck work out of the box. [Settings](/docs/settings#controllers)
- **Graphics presets.** Performance, Balanced, Quality or Ultra, each setting with its cost. [Settings](/docs/settings#graphics-presets-simple-and-advanced)
- **Play with friends.** Share your world with an invite code, no server needed. [Multiplayer](/docs/multiplayer)
- **A server without Java.** Host one from the launcher or the command line. [Host a server](/docs/hosting)
- **Optional extras.** Dynamic lights, zoom, a minimap and more, all off by default. [Settings](/docs/settings#extras)

## Checked against vanilla

Sunrise is tested against the real game, automatically.

- A **harness** is a test that gives the same inputs to Sunrise and to Minecraft 26.3, then compares the results.
- There are {{HARNESSES}} of them, from world generation to mobs, redstone and commands.
- Passing them does not prove that nothing else differs. Players still find differences, and those are bugs.

The [status table](/#parity) shows what the harnesses covered when the project started.

## The new mod system

This is the biggest change Sunrise brings. It is Sunrise's mod API.

**One mod is one file.** Every mod ships as a single `.hmod` file, whatever it holds:

- **Data:** blocks, items, recipes, loot tables, tags, models, textures and names in `assets/` and `data/`.
- **Code:** Rust that hooks into the game, such as a HUD, a command or a new behaviour.
- **Both at once,** in the same package, with one `horizon-mod.toml` manifest.

**Code has two build targets, using the same mod API:**

| Target | How it runs |
| --- | --- |
| Native | The launcher compiles the mod's Rust crate against the pinned prebuilt game on the player's machine |
| WebAssembly | The game runs `mod.wasm`, built from the same Rust, in a sandbox |

`cargo horizon-mod` packages the mod. Typed hooks let the compiler check what your code may call.

[How a mod works](/docs/how-mods-work) explains the new system. Have an older mod? [Older systems do not apply](/docs/what-changed).

> [!NOTE]
> This section was checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. There are no Rust snippets on this page to compile.

## What Sunrise is not

- **Not Minecraft itself.** It contains no Minecraft code, assets or data, and never downloads them. You need your own copy of Minecraft: Java Edition 26.3.
- **Not a Java mod loader.** Forge, NeoForge, Fabric and Quilt jars do not run, and neither do Java Mixins. The launcher can carry over some Java mods' data. See [Mods](/docs/mods) and [Modpacks](/docs/modpacks).
- **Not for other versions.** It plays 26.3. Worlds from 1.8 to 26.2 are upgraded the way vanilla upgrades them.
- **Not official.** It is not approved by or associated with Mojang or Microsoft.

## Supported systems

| System | What you need |
| --- | --- |
| **Linux** | x86-64, a graphics card with Vulkan drivers, Ubuntu 22.04 or newer |
| **macOS** | Apple Silicon or Intel, macOS 12 or later |
| **Windows** | x64 or ARM64, Vulkan or DirectX 12 |

- On Windows, Sunrise switches to DirectX 12 by itself when Vulkan does not work. On ARM64 PCs (Snapdragon) it picks DirectX 12 first.
- There is no build for 32-bit systems or ARM Linux. The server can be built from source on other systems.

Next: [install Sunrise](/docs/install).
