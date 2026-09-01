const vscode = require('vscode');
const path = require('path');

const dictionaryEn = require('dictionary-en');
const nspell = require('nspell');

let speller;
let spellerReady;

function loadSpeller() {
  return new Promise((resolve, reject) => {
    dictionaryEn((err, dict) => {
      if (err || !dict) {
        reject(err ?? new Error('Failed to load the en dictionary'));
        return;
      }
      speller = nspell(dict);
      resolve();
    });
  });
}

const WORD_RE = /[A-Za-z']+/g;
const DIAGNOSTIC_SOURCE = 'commitSpellCheck';

/** Filters out tokens that aren't worth spell-checking: numbers, ACRONYMS,
 *  camelCase / snake_case identifiers, and very short tokens. */
function isSkippable(word) {
  if (word.length < 2) return true;
  if (/^\d+$/.test(word)) return true;
  if (word === word.toUpperCase()) return true;
  if (/[a-z][A-Z]/.test(word) || word.includes('_')) return true;
  return false;
}

/** True for the files VS Code opens for git-commit, merge, and tag messages. */
function isCommitMessageDocument(doc) {
  if (doc.languageId === 'git-commit') return true;
  const base = path.basename(doc.fileName);
  return base === 'COMMIT_EDITMSG' || base === 'MERGE_MSG' || base === 'TAG_EDITMSG';
}

function getUserWords() {
  return vscode.workspace.getConfiguration('commitSpellCheck').get('userWords', []);
}

async function activate(context) {
  const diagnostics = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
  context.subscriptions.push(diagnostics);

  spellerReady = loadSpeller().catch((err) => {
    console.error('Commit Spell Check: failed to load dictionary', err);
  });

  async function lint(doc) {
    if (!isCommitMessageDocument(doc)) return;
    await spellerReady;
    if (!speller) return;

    for (const w of getUserWords()) {
      speller.add(w);
    }

    const diags = [];
    for (let line = 0; line < doc.lineCount; line++) {
      const text = doc.lineAt(line).text;
      if (text.trimStart().startsWith('#')) continue; // git's own comment lines

      WORD_RE.lastIndex = 0;
      let match;
      while ((match = WORD_RE.exec(text))) {
        const word = match[0];
        if (isSkippable(word) || speller.correct(word)) continue;

        const range = new vscode.Range(line, match.index, line, match.index + word.length);
        const diag = new vscode.Diagnostic(
          range,
          `Possible misspelling: "${word}"`,
          vscode.DiagnosticSeverity.Information
        );
        diag.code = word;
        diag.source = DIAGNOSTIC_SOURCE;
        diags.push(diag);
      }
    }
    diagnostics.set(doc.uri, diags);
  }

  // Lint whatever commit-message documents are already open (e.g. on reload).
  vscode.workspace.textDocuments.forEach(lint);

  vscode.workspace.onDidOpenTextDocument(lint, null, context.subscriptions);
  vscode.workspace.onDidCloseTextDocument((doc) => diagnostics.delete(doc.uri), null, context.subscriptions);

  let debounce;
  vscode.workspace.onDidChangeTextDocument(
    (e) => {
      if (!isCommitMessageDocument(e.document)) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => lint(e.document), 250);
    },
    null,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: 'git-commit' },
      new SpellCodeActionProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'commitSpellCheck.addWordToDictionary',
      async (word, doc) => {
        const config = vscode.workspace.getConfiguration('commitSpellCheck');
        const words = config.get('userWords', []);
        if (!words.includes(word)) {
          await config.update('userWords', [...words, word], vscode.ConfigurationTarget.Global);
        }
        speller?.add(word);
        if (doc) await lint(doc);
      }
    )
  );
}

class SpellCodeActionProvider {
  provideCodeActions(document, _range, context) {
    const actions = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== DIAGNOSTIC_SOURCE || typeof diag.code !== 'string') continue;
      const word = diag.code;

      if (speller) {
        for (const suggestion of speller.suggest(word).slice(0, 5)) {
          const action = new vscode.CodeAction(`Change to "${suggestion}"`, vscode.CodeActionKind.QuickFix);
          action.edit = new vscode.WorkspaceEdit();
          action.edit.replace(document.uri, diag.range, suggestion);
          action.diagnostics = [diag];
          actions.push(action);
        }
      }

      const addAction = new vscode.CodeAction(`Add "${word}" to dictionary`, vscode.CodeActionKind.QuickFix);
      addAction.command = {
        command: 'commitSpellCheck.addWordToDictionary',
        title: 'Add to dictionary',
        arguments: [word, document]
      };
      addAction.diagnostics = [diag];
      actions.push(addAction);
    }

    return actions;
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
