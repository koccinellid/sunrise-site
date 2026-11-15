# Recipes: world generation

Copy-paste world generation: an ore, taking a vanilla feature out, changing a biome's weather and colours, a biome of your own, a dimension, and a house in vanilla's villages. Replace `my_mod` with your mod id.

World generation uses **vanilla 26.3's worldgen files** and **NeoForge's biome modifier files**, inside your mod's folder and its one `.hmod`, with one `horizon-mod.toml`. A dimension of your own takes a few lines of Rust in the same mod.

> [!NOTE] Source check
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. The dimension registration Rust snippet was compile-checked against `horizon-mod-api`; the JSON examples were checked against the source, not run in game.

## How worldgen files work

- A **configured feature** says *what* to place: an ore blob, a tree. It goes in `data/my_mod/worldgen/feature/`.
- A **placed feature** says *where and how often*: how many per chunk, at what heights. It goes in `data/my_mod/worldgen/placed_feature/`.
- A **biome modifier** adds placed features (or mob spawns) to biomes you don't own, such as vanilla's. It goes in `data/my_mod/neoforge/biome_modifier/`.
- Modifiers apply when a world loads, before any chunk generates. **Only new chunks** get your ore: explore away from where you've been.

> [!WARNING] 26.3's folder name
> Configured features are in `worldgen/feature/` in 26.3. A file in the older `worldgen/configured_feature/` is not loaded.

## An ore

**Status:** Works today.

**You get:** ruby ore in stone, 40 tries per chunk with starting heights between y = -32 and y = 48, in biomes tagged `minecraft:is_overworld`.

First make the ore block itself: [A plain block](/docs/recipes-blocks#a-plain-block) with `"template": "minecraft:iron_ore"`, and [its drops](/docs/recipes-loot#an-ore-with-fortune-and-silk-touch).

**File:** `data/my_mod/worldgen/feature/ore_ruby.json` (what: an ore blob with size 9)

```json
{
  "type": "minecraft:ore",
  "size": 9,
  "discard_chance_on_air_exposure": 0.0,
  "targets": [
    {
      "target": { "predicate_type": "minecraft:tag_match", "tag": "minecraft:stone_ore_replaceables" },
      "state": "my_mod:ruby_ore"
    }
  ]
}
```

**File:** `data/my_mod/worldgen/placed_feature/ore_ruby.json` (where and how often)

```json
{
  "feature": "my_mod:ore_ruby",
  "placement": [
    { "type": "minecraft:count", "count": 40 },
    { "type": "minecraft:in_square" },
    {
      "type": "minecraft:height_range",
      "height": { "type": "minecraft:uniform", "min_inclusive": { "absolute": -32 }, "max_inclusive": { "absolute": 48 } }
    },
    { "type": "minecraft:biome" }
  ]
}
```

**File:** `data/my_mod/neoforge/biome_modifier/add_ruby_ore.json` (in which biomes)

```json
{
  "type": "neoforge:add_features",
  "biomes": "#minecraft:is_overworld",
  "features": "my_mod:ore_ruby",
  "step": "underground_ores"
}
```

- `size` is 0 to 64. `discard_chance_on_air_exposure` is 0 to 1: higher hides more ore from caves.
- A second target with `"tag": "minecraft:deepslate_ore_replaceables"` and a deepslate ore block puts a deepslate form below.
- `biomes` is an id, a `#tag` or a list of ids. `features` is an id or a list.

**Try it:** `cargo horizon-mod build`, copy `target/horizon-mod/my_mod.hmod` into your game folder's `horizon-mods/`, start Sunrise, and create a new world. `/place feature my_mod:ore_ruby` places one blob where you stand.

**Common mistakes:**

- No ore, and no error: the chunks were made before the mod. Make a new world or go far away.
- The game starts without any content mods, "content mods not loaded: ..." in the log: a modifier is malformed, such as an unknown `step` or a missing field.
- A modifier naming a feature or biome nobody has is skipped with a warning naming your mod and file. The rest still loads.

## Take a vanilla feature out

**Status:** Works today.

**You get:** the two listed diamond ore placements removed from Overworld biomes, not a guarantee that every diamond placement is gone.

**File:** `data/my_mod/neoforge/biome_modifier/no_diamonds.json`

```json
{
  "type": "neoforge:remove_features",
  "biomes": "#minecraft:is_overworld",
  "features": ["minecraft:ore_diamond", "minecraft:ore_diamond_large"],
  "steps": ["underground_ores"]
}
```

- Leave out `steps` to take the features out of every step.
- Every addition is applied before every removal, so a removal also takes out a feature another mod's modifier added.

## Change a biome's weather and colours

**Status:** Works today.

**You get:** forests that are colder, with blue grass and a pale sky.

**File:** `data/my_mod/neoforge/biome_modifier/blue_forests.json`

```json
{
  "type": "horizon:modify_biome",
  "biomes": "#minecraft:is_forest",
  "temperature": 0.3,
  "has_precipitation": true,
  "effects": { "sky_color": 12632319, "grass_color": "#80a0ff" }
}
```

- You can set `temperature`, `downfall`, `has_precipitation`, `temperature_modifier` (`none` or `frozen`) and the `effects` colours: `sky_color`, `fog_color`, `water_color`, `water_fog_color`, `foliage_color`, `dry_foliage_color`, `grass_color`.
- A colour is an integer from 0 to `0xFFFFFF` (16777215) or `"#rrggbb"`.
- `null` for `foliage_color`, `dry_foliage_color` or `grass_color` removes that override, so the colour map tints it again.
- An `attributes` object also changes ambient particles, sounds and music.
- In Rust, `Registrar::declare_biome_modifier(path, modifier)` declares a `BiomeModifier` with the same operations. Declared modifiers apply when a world loads, just like files.

> [!NOTE] Sunrise's own type
> `horizon:modify_biome` is not a NeoForge type. NeoForge's own modifiers only add and remove. A modifier with a bad value is skipped with a warning naming your mod and file.

Details, with the `attributes` keys: [Making a content mod](/docs/modding/how-to/content-mods#namespaces-and-limits) (scroll to the biome modifiers).

## Spawn your mob in vanilla biomes

**Status:** Works today.

`neoforge:add_spawns` in the same folder adds a mob to biomes: see [Mobs: spawning naturally](/docs/recipes-entities#spawning-naturally). `remove_spawns`, `add_spawn_costs`, `remove_spawn_costs`, `add_carvers` and `remove_carvers` work too.

## Only biomes with a certain climate

**Status:** Works today.

**You get:** the ore only in warm, dry Overworld biomes.

Use this as the modifier's `biomes`:

```json
{
  "type": "neoforge:and",
  "values": [
    "#minecraft:is_overworld",
    { "type": "horizon:climate", "temperature": { "min": 0.8 }, "downfall": { "max": 0.5 } }
  ]
}
```

- `horizon:climate` reads a biome's base `temperature` and `downfall`. Each range takes `min`, `max` or both.
- `neoforge:any`, `neoforge:or`, `neoforge:and` and `neoforge:not` combine sets.
- Climate sets work in `biomes` only, not in `features`.

## A biome of your own

**Status:** Works today. The biome loads; a dimension's biome source, a worldgen file or a biome region must choose it for it to appear.

**You get:** the biome `my_mod:ruby_fields`, for your own dimension below.

**File:** `data/my_mod/worldgen/biome/ruby_fields.json`

Copy a vanilla biome object, such as the `minecraft:plains` entry in the game's prepared `worldgen/biomes.json`, into this file, then change what differs. The format is vanilla 26.3's.

- Use a namespace owned by your manifest, not `minecraft`. Vanilla's biome ids never move.
- A client joining a server gets the biome's data from the server, colours and sounds included.
- A world saved with the mod and opened without it reads your biome as plains.

> [!NOTE] Your biome in the Overworld or Nether
> A Rust mod can call `Registrar::declare_biome_region(path, region)` at registration to put its biomes among vanilla's. A `BiomeRegion` names `minecraft:overworld` or `minecraft:nether`, a weight from 1 to 1000 against vanilla's 10, and climate points. Existing worlds keep their saved regions until the owner opts in. See [Biome regions](/docs/modding/how-to/content-mods/biome-regions).

## A dimension of your own

**Status:** Works today, with Rust code.

**You get:** every world has the level `my_mod:ruby_lands`: the Overworld's shape and terrain, all in your biome.

**File:** `src/lib.rs`

```rust
use mod_api::*;

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    // Once, at startup.
    fn register(&self, r: &mut dyn Registrar, _: &RegistrationContext) {
        r.register_dimension(
            "ruby_lands",
            DimensionSettings {
                // With the default `Fixed` biome source, the one biome everywhere.
                biome: "my_mod:ruby_fields".into(),
                ..Default::default()
            },
        );
    }
}
```

- The default is the Overworld's shape and terrain over plains. Set only what differs.
- `min_y` and `height` are multiples of 16. `has_skylight`, `has_ceiling`, `ambient_light`, `coordinate_scale` and more set the rest of the dimension type.
- `biome_source` picks how biomes are chosen: `Fixed` (one `biome`), `Checkerboard` (a list of `biomes`), `MultiNoise` (vanilla's Overworld or Nether layout, by `biome_preset`), `End`, or `Points` (your own climate points in `biome_points`).
- A data pack can still replace the dimension, as it can a vanilla one.

**Try it:** build the code into a test instance (`horizon-launcher native-build . --instance Development --trust-native-code`), open a world, then `/execute in my_mod:ruby_lands run tp @s 0 100 0`.

**Common mistake:** a bad build height, a vanilla dimension's name or the same id twice stops the mods at startup, with the reason naming your mod.

Details, and how to read a level's shape from code: [Dimension shape](/docs/modding/how-to/world/dimension-shape).

## A house in vanilla's villages

**Status:** Works today.

**You get:** your structure piece can appear among plains village houses.

**File:** `data/my_mod/worldgen/template_pool/plains_houses.json`

```json
{
  "horizon:add_to": "minecraft:village/plains/houses",
  "elements": [
    {
      "weight": 5,
      "element": {
        "element_type": "minecraft:single_pool_element",
        "location": "my_mod:village/plains/ruby_house",
        "processors": "minecraft:empty",
        "projection": "rigid"
      }
    }
  ]
}
```

- `horizon:add_to` appends your elements to a pool you don't own. This file is not a pool itself.
- `location` names your structure file: `data/my_mod/structure/village/plains/ruby_house.nbt`, saved with a structure block.
- Structure sets and processor lists take additions the same way, with `"structures"` or `"processors"`.
- NeoForge structure spawn modifiers also work: `data/my_mod/neoforge/structure_modifier/` reads `neoforge:add_spawns`, `neoforge:remove_spawns` and `neoforge:clear_spawns` for the named `structures`.

Details: [Namespaces and limits](/docs/modding/how-to/content-mods#namespaces-and-limits).

## What isn't here yet

- **Features and placement rules written in code** (Java's `Feature` subclasses). There is no `Feature` registration interface in this mod API. **Workaround:** combine vanilla's feature types in JSON.
- **Your own `placed_feature` tags in a modifier's `features`.** **Not yet:** only vanilla's tags are read. **Workaround:** list the features by id.
- All biome calls and files in one place: [Biomes](/docs/modding/how-to/world/biomes).
