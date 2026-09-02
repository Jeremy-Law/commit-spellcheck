# Commit Message Spell Check

A VS Code extension that spell-checks your Git commit message in the editor
that opens after running `git commit` (with no `-m`).

## Usage

- VS Code assigns the language id `git-commit` to the temporary
  `COMMIT_EDITMSG` file Git opens for editing. This extension activates on
  that language id, plus it also matches `COMMIT_EDITMSG`, `MERGE_MSG`, and
  `TAG_EDITMSG` by filename as a fallback.
- It lints every non-comment line (lines starting with `#` are Git's own
  instructional text and are skipped) using the `nspell` spell-checking
  engine with the `dictionary-en` English word list.
- Misspelled words get an underline (Information severity) via the
  Diagnostics API. Numbers, ALL-CAPS acronyms, and `camelCase`/`snake_case`
  identifiers are ignored, since commit messages often reference code
  symbols.
- Hovering a flagged word and using the lightbulb (Quick Fix) gives you
  spelling suggestions, or an option to permanently add the word to your
  personal dictionary (stored in the `commitSpellCheck.userWords` setting).

### Installing

Install the packaged `.vsix` via "Extensions: Install from VSIX..." in the
Command Palette, or from a terminal:

```bash
code --install-extension <file>.vsix
```

### Configuration

| Setting                      | Description                                           |
| ----------------------------- | ------------------------------------------------------ |
| `commitSpellCheck.userWords` | Array of words to always treat as correctly spelled.  |

## Development

Instructions below are for working on the extension itself.

### Running locally

```bash
npm install
```

Then press `F5` in VS Code to launch an Extension Development Host with the
extension loaded. In that window, open (or create) a Git repo, stage a file,
and run:

```bash
git commit
```

(without `-m`, so the commit message editor actually opens).

The extension is plain JavaScript (`src/extension.js`) — there's no build
step, so changes are picked up on the next Extension Development Host reload
(`Ctrl+Shift+F5` / `Cmd+Shift+F5` in that window, or re-pressing `F5`).

### Packaging

```bash
npm install -g @vscode/vsce
vsce package
```

This produces a `.vsix` file (see [Installing](#installing) above).

### Ideas for extending this

- Support other languages by swapping in `dictionary-<locale>` packages and
  adding a setting to pick one.
- Skip or specially handle Conventional Commit type prefixes (`feat:`,
  `fix:`, etc.) and trailers (`Signed-off-by:`, `Co-authored-by:`).
- Add a status bar item showing the misspelled-word count.
- Respect the `# ------------------------ >8 ------------------------` cut
  line that `git commit --verbose` inserts (everything below it is the diff
  and is already skipped here since diff lines are prefixed, but the `+`/`-`
  markers aren't currently stripped).

## License

Copyright (C) 2026 Jeremy Lawson

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option)
any later version. See [LICENSE](LICENSE) for the full text.
