# Commit Message Spell Check

A VS Code extension that spell-checks Git commit messages in the editor that
opens after running `git commit` without `-m`.

## Features

- Activates on VS Code's `git-commit` language id, and falls back to
  matching `COMMIT_EDITMSG`, `MERGE_MSG`, and `TAG_EDITMSG` by filename.
- Spell-checks every line of the commit message using the `nspell` engine
  with the `dictionary-en` word list. Lines starting with `#` (Git's own
  instructional text) are skipped.
- Ignores numbers, ALL-CAPS acronyms, and `camelCase`/`snake_case`
  identifiers, since commit messages frequently reference code symbols.
- Flags misspellings with an underline via the Diagnostics API. A Quick Fix
  on a flagged word offers spelling suggestions or the option to add it to a
  personal dictionary, stored in the `commitSpellCheck.userWords` setting.

## Requirements

- Visual Studio Code
- The `code` CLI available on your `PATH`

| Platform | Notes |
| --- | --- |
| Windows | Included by default when "Add to PATH" is checked during installation. Verify with `code --version` in a new terminal. |
| Linux | Added automatically by most package-manager installs (`apt`, `dnf`, snap). If installed from a `.tar.gz`, add the extracted `bin/` directory to `PATH` manually, or run **Shell Command: Install 'code' command in PATH** from the Command Palette. |

No other runtime is required. This project is not published to the
Marketplace and has no npm dependencies — `nspell`, `dictionary-en`, and
`is-buffer` (its one transitive dependency) are vendored directly under
[`vendor/`](vendor) and required from there, so a clone is ready to run with
no install step. Behavior is otherwise identical across platforms.

## Installation

To run the extension in your regular VS Code instance:

1. Clone this repository.
2. VS Code loads extensions from a specific folder on your machine — the
   "extensions folder":

   | Platform | Extensions folder |
   | --- | --- |
   | Linux | `~/.vscode/extensions/` |
   | Windows | `%USERPROFILE%\.vscode\extensions\` |

   Every installed extension lives there as its own subfolder, named
   `<publisher>.<name>-<version>`. This project's `package.json` currently
   has `"publisher": "Jeremy-Law"`, `"name":
   "commit-message-spellcheck"`, and `"version": "0.1.0"`, so the folder
   name to use is `Jeremy-Law.commit-message-spellcheck-0.1.0`.

   Get this project's contents into a folder of that exact name inside the
   extensions folder, using either a copy (a snapshot, independent of the
   clone) or a symlink (a pointer back to the clone, so `git pull` updates
   the installed copy immediately). Replace `/path/to/commit-spellcheck`
   below with wherever you cloned this repository.

   **Linux:**

   ```bash
   mkdir -p ~/.vscode/extensions

   # Copy:
   cp -r /path/to/commit-spellcheck \
     ~/.vscode/extensions/Jeremy-Law.commit-message-spellcheck-0.1.0

   # Or symlink instead:
   ln -s /path/to/commit-spellcheck \
     ~/.vscode/extensions/Jeremy-Law.commit-message-spellcheck-0.1.0
   ```

   **Windows (PowerShell):**

   ```powershell
   New-Item -ItemType Directory -Force "$env:USERPROFILE\.vscode\extensions" | Out-Null

   # Copy:
   Copy-Item -Recurse "C:\path\to\commit-spellcheck" `
     "$env:USERPROFILE\.vscode\extensions\Jeremy-Law.commit-message-spellcheck-0.1.0"

   # Or symlink instead (requires Developer Mode enabled, or an
   # Administrator PowerShell prompt):
   New-Item -ItemType SymbolicLink `
     -Path "$env:USERPROFILE\.vscode\extensions\Jeremy-Law.commit-message-spellcheck-0.1.0" `
     -Target "C:\path\to\commit-spellcheck"
   ```

3. Reload or restart VS Code. The extension should now appear in the
   Extensions view's installed list as "Commit Message Spell Check".

A manually installed extension does not require a registered Marketplace
publisher ID, so the placeholder value in `package.json` is fine here; that
field only matters for `vsce publish`. Symlinking rather than copying means
future `git pull`s update the installed extension automatically.

<details>
<summary>Alternative: package as a .vsix</summary>

To produce a single distributable file instead, `vsce` can be used. This is
the only point at which Node/npm is involved, and only for the CLI tool
itself — not for any of the extension's own dependencies:

```bash
npm install -g @vscode/vsce
vsce package
```

The resulting `.vsix` can be installed via **Extensions: Install from
VSIX...** in the Command Palette, or `code --install-extension <file>.vsix`.
No `.vsix` is checked into this repository; it is a local build artifact.

</details>

## Development

1. Open this project in VS Code.
2. Press `F5` to launch an Extension Development Host with the extension
   loaded.
3. In that window, open or create a Git repository, stage a file, and run:

   ```bash
   git commit
   ```

   Omitting `-m` opens the commit message editor.

`src/extension.js` is plain JavaScript with no build step, so changes take
effect on the next Extension Development Host reload (`Ctrl+Shift+F5` /
`Cmd+Shift+F5`, or re-pressing `F5`).

## Configuration

| Setting | Description |
| --- | --- |
| `commitSpellCheck.userWords` | Array of words always treated as correctly spelled. |

## Potential enhancements

- Support additional languages by vendoring another `dictionary-<locale>`
  package and adding a setting to select one.
- Recognize and skip Conventional Commit type prefixes (`feat:`, `fix:`,
  etc.) and trailers (`Signed-off-by:`, `Co-authored-by:`).
- Add a status bar item showing the misspelled-word count.
- Explicitly handle the
  `# ------------------------ >8 ------------------------` cut line that
  `git commit --verbose` inserts, to guarantee the diff content below it is
  never spell-checked regardless of how it is prefixed.

## License

Copyright (C) 2026 Jeremy Lawson

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option)
any later version. See [LICENSE](LICENSE) for the full text.
