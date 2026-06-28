---
name: testing-userscript
description: Test the AI Anti-Frust userscript end-to-end via Playwright CDP injection. Use when verifying UI features, backup/restore, settings, or prompt history.
---

# Testing the AI Anti-Frust Userscript

## Overview

This userscript runs on AI chat platforms (Gemini, ChatGPT, Claude, Grok) via Violentmonkey/Tampermonkey. Since we can't install browser extensions in CI, we test by injecting the script via Playwright CDP into Chrome.

## Test Environment Setup

1. Chrome is already running with CDP at `http://localhost:29229`
2. Playwright is available via `pip` or `npm` (prefer the Python API for scripting)
3. Navigate to a supported platform (Gemini works without login for basic UI testing)

## Injection Approach

The userscript depends on `GM_addStyle` from the userscript manager. Polyfill it before injecting:

```python
from playwright.async_api import async_playwright

polyfill = '''
if (typeof GM_addStyle === "undefined") {
    window.GM_addStyle = function(css) {
        var style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        return style;
    };
}
'''

async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp('http://localhost:29229')
    context = browser.contexts[0]
    page = context.pages[0]
    
    await page.goto('https://gemini.google.com/app')
    await asyncio.sleep(3)
    
    # Clear localStorage for clean state
    await page.evaluate('''
        localStorage.removeItem("ai_draft_backup_universal");
        localStorage.removeItem("ai_cursor_pos_universal");
        localStorage.removeItem("ai_feature_settings_universal");
        localStorage.removeItem("ai_prompt_history_universal");
        localStorage.removeItem("ai_pending_prompt_universal");
    ''')
    
    await page.evaluate(polyfill)
    
    with open('ai-anti-frust.user.js', 'r') as f:
        await page.evaluate(f.read())
```

## Key Testing Notes

- **Display scaling**: The VM display is 1600x1200 but the computer tool uses 1024x768 coordinates. Scale factor is 0.64x. Use `getBoundingClientRect()` via Playwright to get actual element positions, then multiply by 0.64 for computer tool clicks.
- **Prefer Playwright `page.evaluate()` over computer tool clicks** for reliability, especially for the injected UI elements which may overlap with the platform's own UI.
- **Input field on Gemini**: The contenteditable div has `aria-label="Enter a prompt for Gemini"`. Set text via `field.textContent = "..."` then dispatch `new Event("input", { bubbles: true })`.
- **Simulating Enter**: Dispatch `new KeyboardEvent("keydown", { key: "Enter", bubbles: true })` on the input field to trigger history capture and prompt submission.
- **Re-injection test**: Navigate to `gemini.google.com/app` again and re-inject the script. Settings in localStorage should persist and be picked up by the new instance.
- **Gemini might not require login** for basic testing, but some features (like actual prompt submission responses) may behave differently when not logged in.

## What to Test

1. **UI Elements**: Gear and history icons render with `display:flex`, clear button hidden when no backup
2. **Settings Panel**: Opens on gear click, has 3 controls (2 toggles + 1 number input), toggles immediately hide/show icons, changes persist to localStorage key `ai_feature_settings_universal`
3. **History Capture**: Empty state shows "No prompts recorded yet.", typing + Enter captures prompt to `ai_prompt_history_universal` with `{text, host, ts}` structure
4. **History Actions**: Copy button text changes to "Copied!" for 1.5s, Delete removes entry and re-renders overlay, New Chat clears backup + sets pending prompt + navigates
5. **Backup Regression**: Typing triggers backup to `ai_draft_backup_universal`, clear button appears, no false "storage full" warning from settings/history writes
6. **Settings Persistence**: Changed settings survive page reload + re-injection

## Devin Secrets Needed

None - Gemini basic testing works without authentication.
