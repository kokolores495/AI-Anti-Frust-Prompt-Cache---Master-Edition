---
name: cross-platform-testing
description: Test the userscript across Gemini, ChatGPT, Claude, and Grok via Playwright CDP injection. Use when verifying cross-platform compatibility.
---

# Cross-Platform Testing

## Overview

The userscript targets 4 AI chat platforms, each with different input field types, DOM structures, and CSP policies. This skill covers platform-specific testing details.

## Platform Input Selectors

From `getInputField()` in `ai-anti-frust.user.js`:

| Platform | Selector | Type | Notes |
|----------|----------|------|-------|
| Gemini | `div[contenteditable="true"]` | contenteditable | ProseMirror-based rich text |
| ChatGPT | `#prompt-textarea` | textarea/contenteditable | React-controlled, needs `setNativeValue()` |
| Claude | `div[contenteditable="true"], .ProseMirror` | contenteditable | ProseMirror editor |
| Grok | `textarea, div[contenteditable="true"]` | textarea preferred | Falls back to contenteditable |

## New Chat URLs

From `getNewChatUrl()`:

| Platform | URL |
|----------|-----|
| Gemini | `https://gemini.google.com/app` |
| ChatGPT | `https://chatgpt.com/` |
| Claude | `https://claude.ai/new` |
| Grok | `https://grok.com/` |

## Testing Each Platform

### Common Setup (all platforms)

```python
import asyncio
from playwright.async_api import async_playwright

POLYFILL = '''
if (typeof GM_addStyle === "undefined") {
    window.GM_addStyle = function(css) {
        var style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        return style;
    };
}
'''

async def inject_and_test(page, url):
    await page.goto(url)
    await asyncio.sleep(3)
    # Clear all storage keys
    await page.evaluate('''
        ["ai_draft_backup_universal","ai_cursor_pos_universal",
         "ai_feature_settings_universal","ai_prompt_history_universal",
         "ai_pending_prompt_universal"].forEach(k => localStorage.removeItem(k));
    ''')
    await page.evaluate(POLYFILL)
    with open('ai-anti-frust.user.js', 'r') as f:
        await page.evaluate(f.read())
    await asyncio.sleep(2)
```

### Gemini

- Works without login for basic UI testing
- Input: contenteditable div with `aria-label="Enter a prompt for Gemini"`
- Set text: `field.textContent = "text"` then dispatch `input` event
- Simulating Enter: `new KeyboardEvent("keydown", { key: "Enter", bubbles: true })`
- CSP: Permissive, `GM_addStyle` polyfill works

### ChatGPT

- **Requires login** (SSO/email)
- Input: `#prompt-textarea` - may be textarea or contenteditable depending on version
- For textarea: use `setNativeValue()` pattern (prototype setter) to trigger React state
- For contenteditable: same as Gemini
- CSP: Strict, but `GM_addStyle` polyfill works via `document.head.appendChild`

### Claude

- **Requires login** (email/Google SSO)
- Input: ProseMirror contenteditable (`.ProseMirror` or `div[contenteditable="true"]`)
- ProseMirror needs special handling: set `textContent` then dispatch both `input` and `compositionend` events
- CSP: Has Trusted Types policy - the script avoids `innerHTML` for this reason

### Grok

- Works without login for basic testing
- Input: prefers `textarea`, falls back to contenteditable
- For textarea: use `setNativeValue()` for React compatibility
- CSP: Relatively permissive

## Per-Platform Test Checklist

For each platform, verify:
1. `getInputField()` returns the correct element (not null)
2. Gear and history icons render (check `display` computed style)
3. Typing in field triggers backup to `ai_draft_backup_universal`
4. Enter keydown captures prompt to history
5. Clear button appears when backup exists
6. Settings panel opens and toggles work
7. History overlay shows entries with correct host name

## Login Automation

For platforms requiring login, use Playwright CDP to script the login flow:

```python
# Example: navigate to login page
await page.goto('https://chatgpt.com/')
# Wait for redirect to login
await asyncio.sleep(3)
# Fill credentials via page.evaluate or Playwright fill()
# After login, cookies persist for the session
```

If login requires 2FA or CAPTCHA, handle manually via the computer tool before running automated tests.

## Secrets Needed

- ChatGPT: Email + password (or use existing browser session)
- Claude: Email + password (or Google SSO via existing browser session)
- Gemini & Grok: None for basic testing