import * as assert from "node:assert/strict";
import * as vscode from "vscode";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SvgFileDecorationProvider } from "./SvgFileDecorationProvider";
import { XmlOutlineParser } from "./XmlOutlineParser";

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension("course-svg-team.svg-lab-outline");
  assert.ok(extension);
  await extension.activate();
  const directory = mkdtempSync(join(tmpdir(), "svg-host-test-"));
  const path = join(directory, "example.svg");
  const source = '<svg><g id="outer"><g><rect id="a"/><text>无 id</text></g></g></svg>';
  writeFileSync(path, source);
  writeFileSync(join(directory, "plain.txt"), "plain");
  mkdirSync(join(directory, "folder.svg"));
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path));
  await vscode.window.showTextDocument(document);
  const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
    "vscode.executeDocumentSymbolProvider", document.uri);
  assert.equal(symbols?.[0]?.name, "svg");
  assert.equal(symbols?.[0]?.children[0]?.name, "g#outer");
  const rect = symbols?.[0]?.children[0]?.children[0]?.children[0];
  assert.equal(rect?.name, "rect#a");
  assert.equal(document.offsetAt(rect!.selectionRange.start), source.indexOf("<rect"));
  assert.equal(symbols?.[0]?.children[0]?.children[0]?.children[1]?.name, "text");
  const token = new vscode.CancellationTokenSource();
  const badge = new SvgFileDecorationProvider();
  assert.equal((await badge.provideFileDecoration(document.uri, token.token))?.badge, "[]");
  assert.equal(await badge.provideFileDecoration(vscode.Uri.file(join(directory, "plain.txt")), token.token), undefined);
  assert.equal(await badge.provideFileDecoration(vscode.Uri.file(join(directory, "folder.svg")), token.token), undefined);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(source.length)), "<svg><circle id=\"updated\"/></svg>");
  assert.equal(await vscode.workspace.applyEdit(edit), true);
  const updated = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>("vscode.executeDocumentSymbolProvider", document.uri);
  assert.equal(updated?.[0]?.children[0]?.name, "circle#updated");
  const broken = new vscode.WorkspaceEdit();
  broken.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), "<svg><g");
  await vscode.workspace.applyEdit(broken);
  const incomplete = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>("vscode.executeDocumentSymbolProvider", document.uri);
  assert.equal(incomplete?.length ?? 0, 0);
  assert.equal(new XmlOutlineParser().parse("<svg><!-- <g/> --><text><![CDATA[<g/>]]></text></svg>")[0]?.children.length, 1);
  badge.dispose();
  token.dispose();
  console.log("SVG_HOST_TESTS: nested, unnamed, source-navigation, badge, directories, editing, incomplete XML: PASS");
}
