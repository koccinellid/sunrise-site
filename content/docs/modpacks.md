# Modpacks

Java mod jars do not run in Sunrise. Instead, the launcher reads a modpack, tells you which of its mods Sunrise can carry over, and brings over the ones it can. This page explains what that means today and where the limits are.

> [!NOTE]
> Importing a pack does not mean every mod works. What carries over automatically is supported data and assets: blocks, items, recipes, loot tables, tags, models, textures and structures. The mods' Java code does not run.

## What the Modpacks page does

Open **Mods** in the launcher, then its **Modpacks** tab.

1. **Import a pack.** Choose **Import a pack file…** for a Modrinth `.mrpack` or a CurseForge zip, or **Import an instance folder…** for a Prism, MultiMC or CurseForge instance. The **Mods** page can also find a Modrinth modpack and import it for you (see [Mods and data packs](/docs/mods#finding-resource-packs-and-modpacks)). The browser also ports what it can in the same step; a successful port lets you press **Play**.
2. **Read the coverage report.** For every mod in the pack it says **Ported**, **Partial**, **Not yet** or **Not needed**, with the reason. You can filter the list by status.
3. **Port.** **Port N mods** gets the jars of the mods this computer can carry over today, and carries them over for the version you picked. It copies the jars from a folder you have, or downloads them from the pack's own links (or the same file from Modrinth's download network), and checks their hashes. Direct CurseForge downloads are not supported, so for files that only CurseForge has, choose **Use jars from my instance…** and point it at your installed instance.
4. **Play.** **Play with N mods** starts the game as the pack's own profile, with its own saves and options, and those mods on.

Nothing is uploaded or shared. The mod jars and what is made from them stay on your computer.

## What carries over, and what does not

**Carries over today:** supported data and assets from mods. Blocks and items built on vanilla's shapes, recipes, loot tables, tags, models, textures and language files, and structures that are described in data, such as the structure mods that use jigsaw pools. Carried loot tables and structures are available in your world. Not all data formats carry over: mods made for Minecraft 1.20 or older are left off when they use the old data-folder layout.

**Not yet:**

- **Mods with Java code:** machines, magic, new mob behaviour, anything that needs the mod's own logic. That logic must be rewritten as a Sunrise [mod with Rust code](/docs/mod-code), built as native code or WebAssembly. Importing a pack does not do this rewrite.
- **World generation written in code:** custom biomes, terrain shaping and structure types that are Java classes.
- **Scripts** such as KubeJS, and recipe viewers and map mods that are built around Java.

**Not needed:** performance mods such as Sodium, Lithium or FerriteCore (Sunrise is the replacement), and libraries whose job is to give mods a common API. The report says which is which.

So a pack is a list of mods, and today Sunrise can bring over a part of that list. The coverage report is the honest answer for your pack.

If two ported mods claim the same namespace, the game can only load one of them. The launcher keeps the first, leaves the other off, and lists it under the pack.

The source repository records a test on three packs on 2026-10-22: Vanilla Perfected (108 files) ported 2 mods, Slimes Adventure (105) ported 20, and All the Mods 10 (496) ported 42. Each opened a world without a crash in that test. Every ported mod was partial: supported data and assets came over, but its Java code did not. These are recorded results, not a guarantee for other pack versions or the current build.

## Example: All the Mods 10

The recorded All the Mods 10 list has 495 jars and one data pack. The report sorts the jars: about 290 add content, 80 are libraries, and the rest are integrations, interface mods, tools and performance mods. A few dozen of the content-adding mods carried over in the recorded test. The measurements are in [docs/modpacks.md](https://github.com/sunrise-org/sunrise/blob/main/docs/modpacks.md).

## From the command line

```text
horizon-launcher modpack list
horizon-launcher modpack import <pack>
horizon-launcher modpack port <pack> [--from <dir>]
horizon-launcher modpack play <pack>
horizon-launcher modpack remove <pack>
```

For `import`, `<pack>` is the pack file or instance folder. For `port`, `play` and `remove`, it is the imported pack's folder name shown by `list`. **Remove also deletes the pack profile's saves**, as well as its jars and ports.

## Licences

Mods have their own licences. Sunrise does not redistribute anyone's jars: the ports are made on your computer, from jars you downloaded, and stay there.
