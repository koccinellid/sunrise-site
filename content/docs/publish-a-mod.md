# Publish a mod

Take your `.hmod` from your computer to other players. You can share the file or your mod's GitHub repository; a registry listing also needs a project page and an explicit version file.

> [!NOTE]
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. This page has no Rust snippets to compile. The sources describe registry formats and checks, but do not establish whether Sunrise's submission form is available.

## Step 1: Get the file ready

1. **Set a new version.** Change `version` in [`horizon-mod.toml`](/docs/mod-manifest). Each published version needs a new one, and a published file never changes.
2. **Build it:**

   ```sh
   cargo horizon-mod build
   ```

   This writes `target/horizon-mod/<id>.hmod`, for content and code mods alike. For a wasm project, use `cargo horizon-mod build --wasm` to compile `mod.wasm` and package it. A native package carries source; Sunrise's launcher compiles it against the pinned prebuilt game.

3. **Give the shared file a clear name**, such as `ruby-1.0.0.hmod`. Its manifest still supplies the mod's id and version; renaming the file does not change them.
4. **Check it:**

   ```sh
   cargo horizon-mod check ruby-1.0.0.hmod
   ```

   It must pass. This checks the package without running the mod's code; it does not replace trying the mod in the game. See [Test a mod](/docs/test-a-mod#check-1-the-file).

5. **Publish the source.** A registry entry requires an HTTPS source address and an [SPDX](https://spdx.org/licenses/) licence expression, such as `MIT`, `Apache-2.0` or `GPL-3.0-only`. Keep the source for each published file available for review.

> [!TIP] Shader packs
> A shader pack in Sunrise's own format is packed with `horizon-shader pack <folder>`, which writes `<id>-<version>.hshader` ([the format](/docs/api/shaders)). It has its own checks; passing the pack command does not by itself establish registry acceptance.

## What the registry accepts today

- **A mod with data only:** the registry format supports content `.hmod` files.
- **A mod with Rust code:** native and wasm mods also use `.hmod`, with one `horizon-mod.toml`. There is no separate code-mod bundle format to choose.

The format alone does not tell you what Sunrise's form currently accepts. To share a code mod without it, publish the `.hmod` as a release of your own repository. State the native mod's pinned game build and which builds you tried. Sunrise's launcher can also install native source through **Add from GitHub**; see [Install from GitHub](/docs/modding/how-to/native-mods/install-from-github).

## Step 2: Sign it (optional, recommended)

A signature lets a reader check a file against your public key. Once a registry project has a key, its versions must be signed with that key; an unsigned file or a signature from another key is refused.

The registry uses [minisign](https://jedisct1.github.io/minisign/) signatures.

1. **Install minisign** using its installation instructions.
2. **Make a key pair, once:**

   ```sh
   minisign -G -p horizon-mods.pub -s horizon-mods.key
   ```

   Use the public key from `horizon-mods.pub`, not the secret key.

3. **Sign each file you publish, and check it:**

   ```sh
   minisign -S -s horizon-mods.key -m ruby-1.0.0.hmod
   cargo horizon-mod check ruby-1.0.0.hmod --key "RW…your public key…" --signature ruby-1.0.0.hmod.minisig
   ```

   The report then says "signature verified".

> [!WARNING] Keep the secret key safe
> Keep `horizon-mods.key` and its password private and backed up. If you lose it, contact the registry's maintainers before publishing another version; changing the project's key affects verification of its existing files.

## Step 3: Fill in the form

If Sunrise offers a submission form, prepare the project page and version file for it. The registry format requires:

- **The file:** its kind, id and version, an HTTPS download URL, size and SHA-256. A mod's metadata must match its manifest.
- **Its page:** the name, a summary of at most 160 characters, a Markdown description of 50–10,000 characters after trimming, authors, licence and source address. A listed project also needs 1–3 categories and a square PNG icon, 64–1024 pixels and at most 256 KiB.
- **Signature:** the project's public key, if signing, and the file's `.minisig` text.

Submit explicit version files, not an entry that follows a repository's future releases. See [Publishing your mod](/docs/modding/how-to/publish) for the publishing workflow and [the registry index](/docs/modding/reference/registry-index) for the fields.

## Step 4: Review

- Make the pull request, source and package-check report available to reviewers.
- Answer review questions on the pull request.
- If the published file must change, publish a new version rather than replacing it.
- Say what the mod does and what permissions it needs. Native code runs with the player's rights; wasm code runs in the game's sandbox.

A registry listing pins the download by SHA-256. The launcher checks the downloaded file against that hash, its metadata and any required signature before installation.

## Updates

- Submit a new version file for each update.
- Keep the published files unchanged. The registry's review checks reject changing an existing version's file or SHA-256.
- If the project has a key, sign the new file with it.

The registry's file formats are in [the mod index reference](/docs/api/mod-index). Acceptance and review policy are the registry maintainers' decision, not a guarantee made by the package format.

## Reports and takedowns

Report harmful projects to the registry's maintainers. The registry records takedowns in `revoked.toml`: it can revoke a file by SHA-256 or every version of a project by id. The launcher refuses revoked files and turns installed copies off with the reason.
