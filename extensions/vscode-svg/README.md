# SVG Lab Outline and Badge

Run `npm ci && npm run build` in this directory, open it in VSCode and press F5 with the launch configuration below. Open `examples/` in the Extension Development Host. Explorer adds `[]` to SVG files; Outline navigates to nested source elements.

Use `npm run test:host` for tests inside a real VSCode Extension Host. The downloaded editor is cached in the OS temporary directory. The parser rejects incomplete XML and does not retain stale symbols.

Install the packaged `.vsix` through VSCode's Extensions menu → Install from VSIX. The examples workspace sets SVG to Text Editor; for another workspace choose Open With → Text Editor to see Outline.

`scripts/verify-ui.py` captures the real workbench and validates live source navigation and edits. Launch the development host with `--remote-debugging-port=9238`, open the examples workspace, then run the Python script with Playwright installed. It restores the original example buffer after testing.

The extension registers `FileDecorationProvider` and `DocumentSymbolProvider` through VSCode's public API. VSCode owns Explorer, Outline, refresh scheduling and navigation; this extension supplies metadata and source ranges. The CLI editor model is intentionally not loaded.
