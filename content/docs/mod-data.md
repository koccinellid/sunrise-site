# Blocks, items and data files

The reference for a mod's data: common block and item fields, where vanilla-format files go, namespaces and limits. For a guided first block, see [Build your first block](/docs/build-your-first-block).

## How data works

- Each new block or item **copies a vanilla template** and changes what differs. Items copy data components, not every behaviour tied to a vanilla item's identity.
- Recipes, loot tables, tags, models, textures and names use **vanilla 26.3's own formats**, as in data packs and resource packs.
- Sunrise loads block and item declarations **at startup**. Rebuild and restart after changing them. The data files themselves need no compilation, even when their mod also has Rust code.

These files sit in the same mod as any Rust code: one folder, one `.hmod`. See [How a mod works](/docs/how-mods-work).

## An example mod

A ruby gem and a block of ruby:

```text
ruby/
├── horizon-mod.toml
├── data/ruby/horizon/block/ruby_block.json
├── data/ruby/horizon/item/ruby.json
├── data/ruby/recipe/ruby_block.json
├── data/ruby/recipe/ruby_from_ruby_block.json
├── data/ruby/loot_table/blocks/ruby_block.json
├── data/minecraft/tags/block/mineable/pickaxe.json
├── data/minecraft/tags/block/needs_iron_tool.json
├── assets/ruby/blockstates/ruby_block.json
├── assets/ruby/models/block/ruby_block.json
├── assets/ruby/models/item/ruby.json
├── assets/ruby/items/ruby.json
├── assets/ruby/items/ruby_block.json
├── assets/ruby/textures/block/ruby_block.png
├── assets/ruby/textures/item/ruby.png
└── assets/ruby/lang/en_us.json
```

- `data/ruby/horizon/` declares the block and the item.
- `data/ruby/recipe/` and `loot_table/` are vanilla data pack files.
- `data/minecraft/tags/` adds the block to vanilla's tags.
- `assets/ruby/` is vanilla resource pack files: how things look and what they are called.

Its manifest is the usual one, with `api = "0.2"` and `capabilities = ["registries"]`. For this content to work on both a server and its clients, set `side = "both"`: see [The manifest](/docs/mod-manifest).

## Blocks

**Where:** `data/<namespace>/horizon/block/<name>.json` becomes the block `<namespace>:<name>`. The namespace is your mod id or one listed in `namespaces`.

```json
{
  "template": "minecraft:iron_block",
  "properties": { "hardness": 4.0, "light": 3, "sounds": "minecraft:amethyst_block", "map_color": 28 }
}
```

**`template`** is the vanilla block it copies, such as `minecraft:iron_block`, `minecraft:oak_door` or `minecraft:diamond_ore`. A door copies a door's states and shape, an ore an ore's.

**`properties`** change what differs. Every one you leave out is the template's.

| Property | What it sets |
| --- | --- |
| `hardness` | How long it takes to mine. `-1` cannot be broken. |
| `explosion_resistance` | How well it stands up to explosions. |
| `light` | The light it gives, 0 to 15. |
| `requires_tool` | `true`: it drops nothing unless mined with the right tool. Tags say which tool. |
| `friction` | How slippery it is, 0 to 2. |
| `map_color` | Its colour on maps: a vanilla map colour id, 0 to 61. |
| `sounds` | A vanilla block whose sounds it uses. |

**`item`** is `false` for a block with no item. By default, a block gets an item of the same id.

## Items

**Where:** `data/<namespace>/horizon/item/<name>.json` becomes the item `<namespace>:<name>`, in a namespace your mod owns.

```json
{ "template": "minecraft:diamond", "rarity": "uncommon" }
```

| Field | What it sets |
| --- | --- |
| `template` | The vanilla item it copies. |
| `max_stack_size` | 1 to 99. |
| `rarity` | `common`, `uncommon`, `rare` or `epic`: the colour of its name. |

Items can also set or remove data components with `components`. These tables cover the common fields, not every declaration option; see the [content reference](/docs/modding/how-to/content-mods) for the rest.

## Vanilla-format files

These follow vanilla 26.3 exactly, so the [Minecraft Wiki's data pack pages](https://minecraft.wiki/w/Data_pack) apply.

- **Recipes:** `data/<id>/recipe/`
- **Loot tables:** `data/<id>/loot_table/`
- **Your own tags:** `data/<id>/tags/`
- **Vanilla's tags**, such as which pickaxe mines the block: `data/minecraft/tags/`
- **Convention tags** shared by NeoForge and Fabric mods: `data/c/tags/`
- **Block states, models, item models, textures:** `assets/<id>/`, as in a resource pack. Models can use vanilla parents such as `minecraft:block/cube_all`.
- **Names:** `assets/<id>/lang/en_us.json`, for example `"block.ruby.ruby_block": "Block of Ruby"` and `"item.ruby.ruby": "Ruby"`.

> [!NOTE] Tags add, they don't replace
> A tag file adds to the tag, as a data pack's does. `"replace": true` drops what came before it, and the log says so.

**Structures.** A mod can also carry structures, template pools and structure sets in its namespace, and add pieces to vanilla's villages or another mod's pools. The reference book's [data chapter](/docs/modding/how-to/content-mods) has the details.

## Namespaces

- Your files go under your mod id: `assets/<id>/` and `data/<id>/`.
- You may also write to `data/minecraft/tags/`, `data/c/tags/` and `assets/minecraft/atlases/`. Only tags and atlas files may use `minecraft`.
- A mod made from a Java mod whose files use other names lists them in the manifest: `namespaces = ["kaisyn", "towns_and_towers"]`. Blocks and items may be declared under `data/<owned_namespace>/horizon/` too.
- `minecraft`, `c` and `horizon` can't be listed.
- Two mods that are on can't own the same namespace. Sunrise keeps the first in load order, leaves the other's content out and logs the clash.

## Limits and errors

- Content is limited to 65,536 files, 16 MiB each and 512 MiB in all. Paths under `assets/` and `data/` use lowercase letters, digits, `_`, `.`, `-` and `/`, with no empty, `.` or `..` path segments.
- A content mod whose declarations fail validation is left out, with the reason in the log. Do not assume a bad file is simply skipped; read the log while you work.
- An unknown key in a block or item file is **refused**, not silently ignored.
- Content mods work in single player, on LAN and on dedicated servers. Clients need matching registry content; `side = "both"` also makes Sunrise compare mod ids and versions when they join.

## Java jars as a source

A mod can use the assets and data of a Java mod's jar without copying them:

```sh
cargo horizon-mod use-jar /path/to/original-mod.jar
```

- It adds a `[[jar]]` table to the manifest, with the jar's id, version and SHA-512.
- The jar stays outside the `.hmod`. Only its `assets/` and `data/` are read: no Java code runs.
- Details: [Java jars as external assets](/docs/modding/how-to/content-mods#java-jars-as-external-assets).
