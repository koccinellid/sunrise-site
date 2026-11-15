# Mods and data packs

Sunrise has its own mods, made for Sunrise. Java mods don't run, but their data can carry over, and data packs work in part. This page says what you can use today and how.

## Sunrise mods

A Sunrise mod is **one `.hmod` file**, with one `horizon-mod.toml`. What it can do depends on what is inside:

- **Data and assets only:** new blocks, items, recipes, loot tables, tags, models, textures and structures, under `data/` and `assets/`. Nothing compiles: the game reads the files. This is also what the launcher's [modpack](/docs/modpacks) carry-over makes.
- **Native Rust code as well:** a HUD, keys, commands, settings, new behaviour. The launcher compiles the mod's Rust source against the pinned prebuilt game on your computer; it does not rebuild the game.
- **WebAssembly code:** `mod.wasm`, loaded into the game's sandbox. API-only Rust mods can build for native or wasm, using the same hooks and Parts. Game-code changes through `[native]` sub-tables are native only.

Reviewed mods are listed at [playsunrise.net/mods](/mods) and on the launcher's Mods page.

### Install a mod

1. Install it from the launcher's **Mods** page. Or copy its `.hmod` into the game folder ([where that is](/docs/install#first-launch)): content and wasm mods go in `horizon-mods/`, native source mods in `horizon-native-mods/`.
2. Turn it on in the launcher. A mod copied in by hand turns on with `mod.<id>:true` in `horizon-mods.txt`, beside `options.txt`. Newly installed mods start off.
3. Restart for registry entries, world-generation changes or wasm code; build native mods as below. Content with only assets and reloadable data can reload without a restart when installed through the game's **Browse Mods**. On someone else's server, content waits for the server.

**Options > Mods** lists installed mods and their details, not on/off switches. A mod that failed to load says why, in red, on its row. **Browse Mods** in that screen installs content mods only.

### A mod with code: what to expect

Native code is not sandboxed: it can do anything you can on your computer. The launcher builds it for the selected instance, only with your permission. Wasm mods instead run in the game's sandbox and need no native build.

1. Pick an instance in the launcher and install the native mod from its **Mods** page. The first install shows a trust notice.
2. Use the launcher's **Build** action for that instance and accept the native-code warning before building. Permission can be revoked in **Settings > Storage**.
3. The build downloads the pinned Rust toolchain if needed and compiles the selected mods against the prebuilt game.
4. Play that instance. Builds and enabled-mod selections belong to each instance.
5. In the game, **Options > Mods** lists each mod and offers **Config** when it registers settings. Turn mods off in the launcher; rebuild native mods to leave them out.

> [!WARNING] Install native code only from people you trust
> A native mod runs with your rights. Registry listings include its source link and a notice that the source was reviewed before listing. Review is not a sandbox.

### Make your own

[Make a mod](/docs/make-a-mod) takes you from a project to a `.hmod`. The [modding book](/docs/modding) covers content, native and wasm mods.

### Why Java mods don't run

Java mod jars call and patch Minecraft's Java classes, and Sunrise has none. What carries over is the data and assets inside a jar: see [modpacks](/docs/modpacks).

## Finding resource packs and modpacks

The launcher's **Mods** page searches [Modrinth](https://modrinth.com) for Java mods, resource packs, modpacks and data packs, and Sunrise's registry for its own packages.

- Each result says how well it runs: **Works**, **Partly** or **Doesn't run**. For Java mods and resource packs, the default search selects versions made for 26.3; **Show everything** includes other versions. Things that don't run aren't offered for install.
- **Install** downloads the file, checks it against the source's checksum, refuses anything that doesn't match, and puts it in the right folder with the packs it needs.
- **Update** and **Remove** are there too.

After installing:

- A **resource pack** still has to be turned on in the game's Resource Packs screen.
- A **modpack** is imported on the [Modpacks page](/docs/modpacks).

CurseForge is shown as coming soon: the page doesn't search it yet. The same things work from a terminal: `horizon-launcher mods search`, `install`, `update` and `remove`.

## Java mods from the Mods page

Java code doesn't run in Sunrise, but much of what a Java mod adds is data: blocks, items, recipes, loot tables, tags, worldgen, textures.

The Mods page lists Fabric, NeoForge and Forge mods made for 26.3. Before offering one, it downloads the jar, checks Modrinth's checksum and reads it, without running it, to say what Sunrise can use:

- **Works:** its content carries over; any code only registers that content. This does not mean its Java code runs.
- **Partly:** its data carries over. The row lists what doesn't, such as machines, mobs, blocks with behaviour of their own, or Mixins.
- **Doesn't run:** there is nothing to carry over, as with performance mods, libraries and mods that are all code. It is not offered.

**Install** brings the mod over into `horizon-mods/<mod id>/` and turns it on. Start the game again to load it.

> [!NOTE] Carried-over blocks are close, not exact
> They take the closest vanilla block's shape, hardness and sounds, so one can break faster or slower than in Java. Read each mod's verdict and the list of what doesn't carry over.

## Data packs

A world's data packs go in its `datapacks` folder, as folders or `.zip` files with a `pack.mcmeta`, as in vanilla.

**Works today, in single player and open-to-LAN worlds:**

- **Functions** (`.mcfunction`, with macros and line continuation) and **function tags**, such as `minecraft:load` and `minecraft:tick`.
- **Predicates** and **item modifiers**.
- The `/function`, `/datapack` and `/reload` commands, and the choice of which packs are on, kept with the world.

**Not applied from data packs yet:** custom recipes, loot tables, advancements and world generation. Sunrise reads those from the vanilla data it prepared, and from mods.

Vanilla's own data is always on, and it matches vanilla: commands run as vanilla's do, and recipes, loot and world generation are checked against the real game.
