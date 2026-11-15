# Biome regions in the Overworld and the Nether

A **biome region** puts a mod's biomes among vanilla's in the Overworld or the Nether. The world is split into areas,
each area belongs to one region, and inside it the region's own climate points choose the biome. Vanilla's whole
layout is one region of weight 10 alongside your regions.

## Declaring a region

In `register`, call `declare_biome_region(path, region)` once per region. This mod adds one region to each dimension:

```rust
use mod_api::{BiomePoint, BiomeRegion, Hooks, Registrar, RegistrationContext};

/// A point at the surface; the region's points cover every temperature and weirdness, so the
/// whole region is snowy and only the land's shape picks among them.
fn surface(
    biome: &str,
    humidity: (f32, f32),
    continentalness: (f32, f32),
    erosion: (f32, f32),
) -> BiomePoint {
    BiomePoint {
        biome: biome.into(),
        temperature: (-1.0, 1.0),
        humidity,
        continentalness,
        erosion,
        depth: (0.0, 0.0),
        weirdness: (-1.0, 1.0),
        offset: 0.0,
    }
}

/// Vanilla's Nether point: every interval a single value.
fn nether(biome: &str, temperature: f32, humidity: f32, offset: f32) -> BiomePoint {
    BiomePoint {
        biome: biome.into(),
        temperature: (temperature, temperature),
        humidity: (humidity, humidity),
        continentalness: (0.0, 0.0),
        erosion: (0.0, 0.0),
        depth: (0.0, 0.0),
        weirdness: (0.0, 0.0),
        offset,
    }
}

#[derive(Default)]
pub struct RegionsMod;

#[mod_api::horizon_mod]
impl Hooks for RegionsMod {
    fn register(&self, registrar: &mut dyn Registrar, _: &RegistrationContext) {
        // A deliberately simplified snowy layout, not vanilla's parameter points: the bands follow
        // vanilla's order (ocean, coast, then inland by erosion), but frozen_ocean reaches into the deep
        // ocean band (-1.05), inland runs to 1.0, and temperature and humidity are merged into wide ranges.
        let all = (-1.0, 1.0);
        let inland = (-0.11, 1.0);
        let frostlands = BiomeRegion {
            dimension: "minecraft:overworld".into(),
            weight: 5, // half as common as vanilla's whole layout (10)
            points: vec![
                surface("minecraft:frozen_ocean", all, (-1.05, -0.19), all),
                surface("minecraft:snowy_beach", all, (-0.19, -0.11), all),
                surface("minecraft:frozen_peaks", all, inland, (-1.0, -0.78)),
                surface("minecraft:snowy_slopes", all, inland, (-0.78, -0.375)),
                surface("minecraft:snowy_taiga", (0.1, 1.0), inland, (-0.375, 1.0)),
                surface("minecraft:snowy_plains", (-1.0, 0.1), inland, (-0.375, 1.0)),
            ],
        };
        let ashlands = BiomeRegion {
            dimension: "minecraft:nether".into(),
            weight: 5,
            // Vanilla's own points for these two biomes.
            points: vec![
                nether("minecraft:basalt_deltas", -0.5, 0.0, 0.175),
                nether("minecraft:soul_sand_valley", 0.0, -0.5, 0.0),
            ],
        };
        // A refused region already stops the mods at startup, naming the mod and the reason.
        let _ = registrar.declare_biome_region("frostlands", frostlands);
        let _ = registrar.declare_biome_region("ashlands", ashlands);
    }
}
```

- **`path`** is the region's id in the mod's namespace: `frostlands` becomes `<your mod id>:frostlands`.
- **`dimension`** is `minecraft:overworld` or `minecraft:nether`.
- **`weight`** is 1 to 1000, against vanilla's 10. A weight of 5 makes the region about half as common as vanilla's
  layout; with two mods at 1 and 3 and vanilla at 10, they own about 1/14 and 3/14 of the areas.
- **`points`** are the region's biomes by climate, the same `BiomePoint`s as a mod dimension's `Points` source
  ([dimension shape](../world/dimension-shape.md)). The point nearest to the climate at a position wins, among
  this region's points only. The biomes can be vanilla's or the mod's own (`data/<ns>/worldgen/biome/<name>.json`,
  see [content mods](../content-mods.md)).

Cover every climate the region can meet. Terrain shape never reads the biome, so an area keeps vanilla's land and sea
whatever region owns it: give oceans an ocean biome (low continentalness, here `frozen_ocean`), or land biomes end up
under water. Areas are about 512 blocks wide, and a region border changes the surface blocks and carvers, not the
height of the ground.

A malformed or repeated id, an id outside the mod's namespace, another dimension, a weight outside 1 to 1000, no
points, or a point with no biome, an interval outside -2 to 2 or the wrong way round, or an offset outside 0 to 1 is
refused. The call returns the `BiomeRegionError`, and the mods stop at startup with a message naming the mod.

## A world keeps the regions it was made with

A new world saves the installed mods' regions, their points and weights, in `data/horizon/biome_regions.dat` before its
first chunk generates. From then on that file decides, not the mods:

- **A changed region** (new points or weight) or **a new mod's region** does not reach an existing world on its own.
  The game logs the difference when the world opens and keeps generating from the saved layout.
- **Adopting the installed regions:** in the world list, select the world, open **Edit World**, choose
  **Use Installed Biome Regions**, and confirm with **Use Installed Regions**. The option appears when the
  installed regions differ from the saved layout. On a dedicated server, set `adopt_installed = true`
  under `[biome_regions]` in `server.toml`. New chunks use the installed regions: a region the world already had
  keeps its saved weight, a new one takes its declared weight, and a missing mod's region is dropped.
  Chunks that already exist keep their biomes.
- **Removing a mod** whose region the world saved is the case below.

A world made with no region mod installed has no file and generates exactly as vanilla, and so do the End and a mod's
own dimensions.

## When a mod with a region is missing

The world never opens silently without it.

- **Players (singleplayer, LAN host):** picking the world in the list opens **Biome mods are missing**, naming each
  missing mod and region. **Don't Open** goes back to the list and leaves the world as it is. **Open with Vanilla
  Biomes** records the choice in the world and opens it; it is not asked again.
- **Server owners:** the server refuses to start and names the mod and region, until `server.toml` says what to do:

  ```toml
  [biome_regions]
  missing = "vanilla"   # "refuse" (the default) does not start
  ```

With vanilla's biomes chosen, chunks that already exist keep their biomes and blocks, and new chunks in that region's
areas get vanilla's biomes. The region keeps its place and weight, so the other regions' borders do not move. If the
mod comes back, the game logs it and keeps vanilla's biomes there until the owner adopts the installed regions, since
the chunks made in between are vanilla's.
