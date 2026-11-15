# Build your first block

Make Glowing Amethyst: a block that gives light, can be crafted, and drops itself when mined with a pickaxe. Then add an item of your own. No code, only small JSON files, each explained.

> [!NOTE] API checked
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. This page has no Rust snippets to compile; the JSON and commands were checked against the source, not run in the game.

## Before you start

- You have done the [quickstart](/docs/make-a-mod): Rust and `cargo horizon-mod` are installed.
- You have a text editor. Any one works; [VS Code](https://code.visualstudio.com) is a good free choice.
- You know what an id like `sunrise_example:glowing_amethyst` is. If not, read [How a mod works](/docs/how-mods-work) first: it is short.

## Step 1: Make the project

In your terminal, in the folder where you keep projects:

```sh
cargo horizon-mod new sunrise_example --name "Sunrise Example"
cd sunrise_example
```

Then open the `sunrise_example` folder in your editor. The tool wrote these files:

```text
sunrise_example/
├── horizon-mod.toml
├── assets/sunrise_example/
│   ├── blockstates/glowing_amethyst.json
│   ├── items/glowing_amethyst.json
│   ├── lang/en_us.json
│   └── models/block/glowing_amethyst.json
└── data/
    ├── minecraft/tags/block/mineable/pickaxe.json
    └── sunrise_example/
        ├── horizon/block/glowing_amethyst.json
        ├── loot_table/blocks/glowing_amethyst.json
        └── recipe/glowing_amethyst.json
```

Nine files, plus a `.gitignore` for Git. The next steps go through them one at a time.

## Step 2: The manifest

**File:** `horizon-mod.toml`

```toml
id = "sunrise_example"
name = "Sunrise Example"
version = "0.1.0"
description = ""
authors = []
api = "0.2"
side = "both"
capabilities = ["registries"]
```

- `id` is the mod's default namespace. This tutorial puts all its new content there.
- `name` is what players see on the Mods screen.
- `version` goes up each time you publish.
- `api = "0.2"` selects the content API version. It must be `"0.2"` for this API.
- `side = "both"` means joining clients and the server must have the same mod id and version. A mod that adds blocks needs this setting.
- `capabilities = ["registries"]` lets the mod add blocks and items.

**Try it:** fill in `description` and `authors`, for example `authors = ["Your name"]`.

## Step 3: The block

**File:** `data/sunrise_example/horizon/block/glowing_amethyst.json`

```json
{
  "template": "minecraft:amethyst_block",
  "properties": { "hardness": 2.0, "light": 7 }
}
```

- The path makes the block `sunrise_example:glowing_amethyst`.
- `template` copies vanilla's amethyst block: its sounds, states and shape.
- `hardness` helps determine how long it takes to mine; the tool matters too.
- `light` is the light it gives, from 0 to 15. Here, 7.

The block also gets an item of the same id, so you can hold it.

## Step 4: How it looks

Three small files connect the block to a model.

**File:** `assets/sunrise_example/blockstates/glowing_amethyst.json`

```json
{
  "variants": {
    "": { "model": "sunrise_example:block/glowing_amethyst" }
  }
}
```

This says: in its only state (`""`), draw the block with this model.

**File:** `assets/sunrise_example/models/block/glowing_amethyst.json`

```json
{
  "parent": "minecraft:block/cube_all",
  "textures": { "all": "minecraft:block/amethyst_block" }
}
```

- `cube_all` is vanilla's model for a cube with one texture on every face.
- `all` picks that texture. Here, vanilla's amethyst texture, so you need no picture yet.

**File:** `assets/sunrise_example/items/glowing_amethyst.json`

```json
{
  "model": {
    "type": "minecraft:model",
    "model": "sunrise_example:block/glowing_amethyst"
  }
}
```

This makes the item in your hand and inventory use the same model.

## Step 5: Its name

**File:** `assets/sunrise_example/lang/en_us.json`

```json
{
  "block.sunrise_example.glowing_amethyst": "Glowing Amethyst"
}
```

The key is `block.<mod id>.<block name>`. The value is the name players read.

## Step 6: What it drops

**File:** `data/sunrise_example/loot_table/blocks/glowing_amethyst.json`

```json
{
  "type": "minecraft:block",
  "pools": [
    {
      "condition": { "type": "minecraft:survives_explosion" },
      "entries": [{ "type": "minecraft:item", "name": "sunrise_example:glowing_amethyst" }],
      "rolls": 1
    }
  ],
  "random_sequence": "sunrise_example:blocks/glowing_amethyst"
}
```

- One pool, rolled once, drops one Glowing Amethyst.
- The `survives_explosion` condition means it may drop nothing when blown up, as vanilla blocks do.

**File:** `data/minecraft/tags/block/mineable/pickaxe.json`

```json
{
  "values": ["sunrise_example:glowing_amethyst"]
}
```

This adds your block to vanilla's "mineable with a pickaxe" tag, so a pickaxe mines it fast. It is the one file under `minecraft`: a mod may add to vanilla's tags and atlases, but not replace its other files.

## Step 7: Its recipe

**File:** `data/sunrise_example/recipe/glowing_amethyst.json`

```json
{
  "type": "minecraft:crafting_shapeless",
  "category": "building",
  "ingredients": ["minecraft:amethyst_block", "minecraft:glowstone_dust"],
  "result": { "id": "sunrise_example:glowing_amethyst" }
}
```

- `crafting_shapeless`: put the ingredients anywhere in the crafting grid.
- One amethyst block and one glowstone dust make one Glowing Amethyst.

## Step 8: Pack and check it

In the terminal, inside `sunrise_example`:

```sh
cargo horizon-mod build
cargo horizon-mod check target/horizon-mod/sunrise_example.hmod
```

- `build` validates the content with the same checks the game uses, then writes `target/horizon-mod/sunrise_example.hmod`.
- `check` reads that file as the mod registry would. It answers like this:

```text
sunrise_example 0.1.0 (mod, API 0.2, both)
  2524 bytes, SHA-256 15c72c05…, unsigned
  may add blocks, items, mob effects and entity types to your worlds
  no code: content only, nothing to run
```

Your size and SHA-256 will differ once you edit the files.

## Step 9: Try it in the game

Pick one of two ways.

**With the Sunrise launcher:**

1. Open the launcher's **Settings**.
2. In **Game arguments**, put `--dev-mod` and the full path of your `.hmod`, in quotes. For example, on Windows:

   ```text
   --dev-mod "C:\Users\you\Documents\sunrise_example\target\horizon-mod\sunrise_example.hmod"
   ```

3. Press **Play**. The mod is on while that argument is there. Remove it when you are done.

**With a game you built yourself:**

```sh
cargo horizon-mod run --game /path/to/horizon-client
```

This packs the mod again and starts that game with it turned on.

**Then, in the game:**

1. Open a test world with cheats on.
2. Give yourself the block: `/give @s sunrise_example:glowing_amethyst`
3. Place it in a dark spot: it glows.
4. Switch to Survival and mine it with a pickaxe: it drops itself.

> [!NOTE] Changes need a restart
> The game reads mod files once, when it starts. After you edit a file, build again and restart the game.

## Step 10: Make it yours

Three small changes to try. Build and restart after each.

### Make it brighter

In the block file, set `"light": 15`, vanilla's brightest.

### Use your own texture

1. Draw a 16 × 16 PNG and save it as `assets/sunrise_example/textures/block/glowing_amethyst.png`.
2. In the model file, point `all` at it:

   ```json
   "textures": { "all": "sunrise_example:block/glowing_amethyst" }
   ```

### Add an item

A ruby gem, copying vanilla's diamond. Three new JSON files, a texture and one extra name:

**File:** `data/sunrise_example/horizon/item/ruby.json`

```json
{ "template": "minecraft:diamond", "rarity": "uncommon" }
```

`rarity` colours the item's name: `common`, `uncommon`, `rare` or `epic`.

**File:** `assets/sunrise_example/items/ruby.json`

```json
{
  "model": { "type": "minecraft:model", "model": "sunrise_example:item/ruby" }
}
```

**File:** `assets/sunrise_example/models/item/ruby.json`

```json
{
  "parent": "minecraft:item/generated",
  "textures": { "layer0": "sunrise_example:item/ruby" }
}
```

`item/generated` is vanilla's flat item model. Put a 16 × 16 picture at `assets/sunrise_example/textures/item/ruby.png`.

**Name it** by adding a line to `en_us.json`:

```json
{
  "block.sunrise_example.glowing_amethyst": "Glowing Amethyst",
  "item.sunrise_example.ruby": "Ruby"
}
```

Then `/give @s sunrise_example:ruby`.

## Where to go next

- Every block and item field, tags and namespaces: [Blocks, items and data files](/docs/mod-data).
- Behaviour, such as greeting players: [Add code to your mod](/docs/mod-code). The Rust goes in this same folder.
- More blocks, creative tabs and fluids: [Data mods in depth](/docs/modding/how-to/content-mods) in the reference book.
- Sharing it: [test](/docs/test-a-mod), then [publish](/docs/publish-a-mod).
