# SVG Lab Outline and Badge

Run `npm ci && npm run build` in this directory, open it in VSCode and press F5 with the launch configuration below. Open `examples/` in the Extension Development Host. Explorer adds `[]` to SVG files; Outline navigates to nested source elements.

Use `npm run test:host` for tests inside a real VSCode Extension Host. The downloaded editor is cached in the OS temporary directory. The parser rejects incomplete XML and does not retain stale symbols.

The extension registers `FileDecorationProvider` and `DocumentSymbolProvider` through VSCode's public API. VSCode owns Explorer, Outline, refresh scheduling and navigation; this extension supplies metadata and source ranges. The CLI editor model is intentionally not loaded.
