# How a mod works

The few ideas behind every Sunrise mod: one file, ids and namespaces, registries, and when each part of a mod runs. Read this once and the rest of the guides make sense.

> [!NOTE]
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. This page has no Rust snippets to compile.

## A mod is one folder, then one file

While you work, your mod is a **folder**. When you share it, it is one **`.hmod` file**: a zip containing the mod's manifest, content and code, not your build cache.

```text
my_mod/
├── horizon-mod.toml     the manifest: id, name, version
├── icon.png             optional: the picture on the Mods screen
├── assets/my_mod/       how things look: models, textures, names
├── data/my_mod/         what things are: blocks, items, recipes, loot
├── Cargo.toml           only if the mod has Rust code
├── src/lib.rs           only if the mod has Rust code
└── mod.wasm             for a wasm mod, produced by the wasm build
```

`cargo horizon-mod build` packs it into `target/horizon-mod/my_mod.hmod`. The packaged files keep their paths relative to the mod folder. Use `cargo horizon-mod build --wasm` to compile and package the wasm module; plain `build` does not compile Rust.

## Data and code live in the same file

There is no separate package format to choose. A mod holds the parts it needs:

- **Data and assets** (`data/`, `assets/`) add blocks, items, recipes and the rest. The game reads them when it starts. Nothing compiles.
- **Rust code** (`Cargo.toml`, `src/`) reacts to things that happen in the game: a player joins, a block breaks, a key is pressed.
- **Both together** is normal. A machine mod has its block in `data/` and its behaviour in `src/lib.rs`, in one folder, one manifest and one `.hmod`.

> [!NOTE] Have an old mod?
> Older mod systems do not apply to this API. See [What changed](/docs/what-changed).

## Ids and namespaces

Registered content in Minecraft has an **id** with two parts: `namespace:name`.

- `minecraft:stone` is vanilla's stone. Its namespace is `minecraft`.
- `my_mod:glowing_amethyst` is your block. Its namespace is your **mod id**, `my_mod`.

Your mod id is set in `horizon-mod.toml`:

```toml
id = "my_mod"
```

- It is 1 to 64 characters of `a-z`, `0-9` and `_`.
- It names your folders: `assets/my_mod/` and `data/my_mod/`.
- Keep it once you publish: changing it makes a different mod.

## What a registry is

A **registry** is one of the game's lists of things of one kind. There is a list of every block, one of every item, one of every entity type, and so on. Each entry in a list has an id.

When the game starts, it fills these lists: first with vanilla's entries, then with your mod's. That is how your block becomes a real block, with an id other files can point to.

**Your mod adds an entry with one file.** For a block, the file's path gives the id:

```text
data/my_mod/horizon/block/glowing_amethyst.json   →   the block my_mod:glowing_amethyst
```

and the file says what the block copies from vanilla:

```json
{ "template": "minecraft:amethyst_block", "properties": { "light": 7 } }
```

- `template` is a vanilla block. Yours inherits its states and shape unless you declare overrides.
- `properties` changes what differs. Here, it gives light.

**Your manifest declares this capability:**

```toml
capabilities = ["registries"]
```

This is the required capability list for the shared mod manifest.

> [!TIP] "Registry" has a second meaning
> The **mod registry** is something else: the index of published mod packages that the launcher reads. When these pages say "the registry checks your file", they mean that one.

## Where each file goes

The path of a file says what it is. Replace `my_mod` with your mod id.

**Things that exist** (`data/`):

- A block: `data/my_mod/horizon/block/<name>.json`
- An item: `data/my_mod/horizon/item/<name>.json`
- A recipe: `data/my_mod/recipe/<name>.json`
- What a block drops: `data/my_mod/loot_table/blocks/<name>.json`
- Your own tags: `data/my_mod/tags/`
- Adding to vanilla's tags, such as "mineable with a pickaxe": `data/minecraft/tags/block/mineable/pickaxe.json`

**How they look** (`assets/`):

- A block's states: `assets/my_mod/blockstates/<name>.json`
- A model: `assets/my_mod/models/block/<name>.json`
- An item's look in the inventory: `assets/my_mod/items/<name>.json`
- A texture: `assets/my_mod/textures/block/<name>.png`
- The names players see: `assets/my_mod/lang/en_us.json`

These recipes, loot tables, tags and assets use vanilla's data pack and resource pack formats. The declarations under `data/my_mod/horizon/` are Sunrise's content format. [Blocks, items and data files](/docs/mod-data) has the details.

## When each part runs

- **Data and assets** load when the game starts. After you change a file, rebuild the package and start the game again.
- **Native Rust code** is compiled by Sunrise's launcher against the pinned prebuilt game, after a trust notice. The game itself is not rebuilt. Native code can do anything you can on your computer.
- **Rust written against the mod API and built to `mod.wasm`** runs in the game's sandbox instead, using the shared-memory Wire layout, with no rebuild of the game. Game-code changes through `[[native.mixin]]`, `[[native.bridge]]`, `[[native.module]]` and `[[native.loop]]` are native only.

## Next

- Make one: [Build your first block](/docs/build-your-first-block).
- Add behaviour: [Add code to your mod](/docs/mod-code).
- Every manifest field: [The manifest](/docs/mod-manifest).
