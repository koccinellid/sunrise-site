# Older mod systems

Sunrise has one mod system: one `.hmod` per mod, described on [How a mod works](/docs/how-mods-work). Mods made for an older system don't load in Sunrise: they have to be rebuilt from their source.

## What doesn't apply to Sunrise

- **`.hnmod` mixin bundles**, with a hand-written `horizon-mixin.toml`, `compatibility.json`, `horizon-native.json`, or `native/` and `mixins/<id>/` folders. Sunrise doesn't read them: a native mod is a Rust crate in a `.hmod`, with a `[native]` section in its `horizon-mod.toml`.
- **The `native_*` hook points** of those bundles (`native_tick`, `native_hud`, `native_key` and the rest). Code answers the methods of `mod_api::Hooks` instead, each with a typed event.
- **Upstream Horizon's first WebAssembly SDK**, with its WIT interface and Wasmtime runtime. Upstream removed it ([game changes](https://github.com/horizon-rust/horizon/pull/3350), [runtime removal](https://github.com/horizon-rust/horizon/pull/3351), [launcher](https://github.com/horizon-rust/horizon/pull/3353)). Sunrise's WebAssembly mods are built from the same Rust API as native mods, so they need their source.

## If you have an old mod

1. Make a new project with the same mod id: `cargo horizon-mod new <id> --template native`.
2. Copy the old mod's `assets/` and `data/` folders into it, and check them against [Blocks, items and data files](/docs/mod-data).
3. Write the code again against the hooks in `src/lib.rs`: [Add code to your mod](/docs/mod-code).
