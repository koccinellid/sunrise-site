# The manifest and the .hmod file

The main fields of `horizon-mod.toml`, and what goes into the `.hmod`. The book's [Mod files](/docs/modding/reference/manifest) reference has the complete rules.

> [!NOTE]
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. This page has no Rust snippets to compile; its TOML examples were checked against the manifest schema, not run through the tools.

## One manifest per mod

- **Where:** `horizon-mod.toml`, at the root of the mod's folder.
- **What:** the mod's id, version and name, for data and code alike. `Cargo.toml`'s version is not the mod's version.
- **Strict:** an unknown key is an error, so a typo never goes unnoticed.

## What goes in the .hmod

`cargo horizon-mod build` packages selected source and resource files into `target/horizon-mod/<id>.hmod`, excluding `.git/` and `target/`. The file has the same flat layout:

```text
my_mod.hmod
├── horizon-mod.toml
├── icon.png         optional
├── assets/my_mod/   when the mod has assets
├── data/my_mod/     when the mod has data
├── Cargo.toml       when the mod has Rust source
├── Cargo.lock       optional source lockfile
├── src/lib.rs       when the mod has Rust source
└── mod.wasm         when the code is built for the sandbox
```

The file holds what the mod has, and its manifest must agree with it:

- Native code needs root `Cargo.toml`, `src/` and a `[native]` section. Sunrise's launcher compiles it against the pinned prebuilt game, without rebuilding the game.
- Wasm code needs root `mod.wasm` and a `[wasm]` section that records its hash. It also carries `Cargo.toml` and `src/`, unless a converter is recorded in `built_with` instead.
- A mod is `[native]` or `[wasm]`, not both. Other executable payloads are refused.

There is no folder named after the mod inside the file, and no second manifest.

## The fields every mod has

```toml
id = "my_mod"
name = "My mod"
version = "0.1.0"
description = "One or two sentences."
authors = ["You"]
license = "MIT"
homepage = "https://example.com"
issues = "https://example.com/issues"
api = "0.2"
side = "both"
capabilities = ["registries"]
```

| Field | Rule |
| --- | --- |
| `id` | 1 to 64 characters of `a-z`, `0-9` and `_`; reserved Windows device names are refused. Also the default resource namespace. Keep it once published. |
| `name` | The name on the Mods screen. |
| `version` | The mod's version, used by dependency requirements and join checks. |
| `description` | Optional text for the Mods screen; defaults to empty. |
| `authors` | An optional list of names; defaults to empty. |
| `api` | Exactly `"0.2"`. |
| `side` | `"client"`, the default, `"both"` or `"server"`. |
| `capabilities` | Exactly `["registries"]`. |

**`side`:** a mod that adds blocks says `"both"`. Its id and version must then match between a server and its players. `"server"` leaves the mod out of that join comparison, not out of installation or integrated-server execution. It cannot carry registry content clients must know, client-bound required payloads or client-only listeners or Parts. A hook's own side still decides where it runs. See the book's [manifest reference](/docs/modding/reference/manifest) for the full rules.

**Optional fields:**

- `license`, `license_url`, `credits`, `homepage`, `issues` fill the Mods screen. Links must start with `http://` or `https://` and be at most 2048 characters.
- `namespaces` lists more namespaces the mod's files use ([Namespaces](/docs/mod-data#namespaces)).

## Rust code: [native]

`cargo horizon-mod new my_mod --template native` writes this section. `cargo horizon-mod update` repins it to a newer game build.

```toml
[native]
game = "26.3"
horizon = "<40-character game commit>"
mixins = "<40-character horizon-mixins commit>"
```

| Field | Rule |
| --- | --- |
| `game` | A nonempty Minecraft version, currently `"26.3"`. |
| `horizon` | The exact game commit the mod builds against: 40 lowercase hex characters. |
| `mixins` | The exact horizon-mixins commit: 40 lowercase hex characters. |

- `[[native.module]]` adds optional support modules: an `id`, the game `file` that receives it, a module `name`, and a `source` file under `src/`.
- Top-level `[[inject]]` tables register API listeners at published slots; they never compile game code: [Injections](/docs/modding/concepts/injections).
- Game-code changes use native-only `[[native.mixin]]`, `[[native.bridge]]`, `[[native.module]]` or `[[native.loop]]`: [The native route](/docs/modding/concepts/native-route).

## Sandboxed code: [wasm]

`cargo horizon-mod build --wasm` writes this section. Don't write it by hand.

| Field | Rule |
| --- | --- |
| `sha512` | The SHA-512 of `mod.wasm`: 128 lowercase hex characters. The game refuses a file that doesn't match. |
| `toolchain` | The nonempty Rust toolchain it was built with. |
| `linked` | Optional: each dependency's id and the SHA-512 of the `mod.wasm` it was linked against. |
| `built_with` | Optional nonempty converter name, for a package with no source. |

`mod.wasm` is at most 64 MiB. Wasm mods cannot declare `[native]` tables.

## Dependencies on other mods

```toml
[dependencies]
base = "^1.2"
extra = { version = "^2", optional = true }
```

- Each key is another mod's id.
- Each version is a semver requirement on that mod's `version`.
- By default, a missing required mod, a wrong version or a dispatch cycle refuses loading and says why. Instance dependency overrides can change logical rules, but never remove physical code-library requirements.
- A missing optional mod is ignored.
- By default, dependencies' content and listeners load or run before this mod's. The optional `order` field changes dispatch ordering, not physical linking: [Dependencies between mods](/docs/modding/concepts/dependencies).

## The icon

`icon.png` at the root, optional, with no manifest key: a nonzero square PNG, at most 512 × 512 pixels and 256 KiB encoded.

## Limits

| What | Limit |
| --- | --- |
| A registry file, as downloaded | 64 MiB |
| Selected source files, excluding the manifest, icon and resources | 511 files, 64 MiB unpacked in total |
| Data and asset files | 65,536 files, 16 MiB each, 512 MiB in total |
| `horizon-mod.toml` | 32 MiB |
| `icon.png` | 256 KiB encoded, 512 × 512 pixels |

Next: [test your mod](/docs/test-a-mod).
