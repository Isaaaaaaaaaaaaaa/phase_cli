import * as vscode from "vscode";
import { XmlOutlineParser } from "./XmlOutlineParser";
import type { XmlOutlineNode } from "./XmlOutlineNode";

export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private readonly parser = new XmlOutlineParser();

  public provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): vscode.DocumentSymbol[] {
    if (token.isCancellationRequested) return [];
    return this.parser.parse(document.getText()).map((node) =>
      this.symbol(document, node));
  }

  private symbol(document: vscode.TextDocument, node: XmlOutlineNode): vscode.DocumentSymbol {
    const symbol = new vscode.DocumentSymbol(
      node.name, "", vscode.SymbolKind.Object,
      new vscode.Range(document.positionAt(node.start), document.positionAt(node.end)),
      new vscode.Range(document.positionAt(node.start), document.positionAt(node.selectionEnd)),
    );
    symbol.children = node.children.map((child) => this.symbol(document, child));
    return symbol;
  }
}
