import * as vscode from "vscode";

export class SvgFileDecorationProvider implements vscode.FileDecorationProvider {
  private readonly changes = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  public readonly onDidChangeFileDecorations = this.changes.event;

  public async provideFileDecoration(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): Promise<vscode.FileDecoration | undefined> {
    if (!uri.path.endsWith(".svg") || token.isCancellationRequested) return undefined;
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if ((stat.type & vscode.FileType.Directory) !== 0 ||
          (stat.type & vscode.FileType.File) === 0 ||
          token.isCancellationRequested) return undefined;
      const decoration = new vscode.FileDecoration("[]", "SVG vector image");
      decoration.propagate = false;
      return decoration;
    } catch { return undefined; }
  }

  public refresh(): void { this.changes.fire(undefined); }
  public dispose(): void { this.changes.dispose(); }
}
