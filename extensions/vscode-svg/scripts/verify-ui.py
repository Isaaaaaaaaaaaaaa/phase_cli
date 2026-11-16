"""Capture the real VSCode workbench via its local Chromium test endpoint.

Launch VSCode with --remote-debugging-port=9238 and the examples workspace first.
Requires Python Playwright. No page is synthesized and the sample is restored.
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[3]
images = root / "docs/images"
images.mkdir(parents=True, exist_ok=True)
original = (root / "extensions/vscode-svg/examples/example.svg").read_text()

with sync_playwright() as playwright:
    browser = playwright.chromium.connect_over_cdp("http://127.0.0.1:9238")
    page = browser.contexts[0].pages[0]
    page.wait_for_load_state("networkidle")
    symbols = page.get_by_role("tree", name="Document Symbols")
    if not page.get_by_role("treeitem", name="rect#start (object)", exact=True).count():
        page.locator(".pane-header").filter(has_text="Outline").click()
    page.get_by_role("treeitem", name="circle#end (object)", exact=True).click()
    page.get_by_text(re.compile(r"^Ln 6, Col")).wait_for()
    page.get_by_role("treeitem", name="rect#start (object)", exact=True).click()
    page.get_by_text(re.compile(r"^Ln 3, Col")).wait_for()
    page.screenshot(path=str(images / "vscode-svg-outline.png"))
    page.screenshot(path=str(images / "vscode-svg-badge.png"))

    def replace(text):
        page.locator(".monaco-editor .view-lines").click()
        page.keyboard.press("Meta+a")
        page.keyboard.press("Backspace")
        expect(page.locator(".monaco-editor .view-lines")).to_have_text("")
        page.keyboard.insert_text(text)

    try:
        replace("<svg><g")
        expect(symbols.get_by_role("treeitem")).to_have_count(0)
        page.screenshot(path=str(images / "vscode-incomplete-xml.png"))
        replace('<svg><circle id="updated"/></svg>')
        page.get_by_role("treeitem", name="circle#updated (object)", exact=True).wait_for()
        page.screenshot(path=str(images / "vscode-edit-updated.png"))
    finally:
        replace(original)
        page.get_by_role("treeitem", name="rect#start (object)", exact=True).wait_for()
        browser.close()
    print("PASS: real VSCode badge, source navigation, live update, invalid XML and recovery")
