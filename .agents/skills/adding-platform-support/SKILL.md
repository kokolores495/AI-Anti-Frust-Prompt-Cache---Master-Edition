---
name: adding-platform-support
description: Add support for a new AI chat platform to the userscript. Use when the user wants to support a new site like DeepSeek, Perplexity, Copilot, etc.
---

# Adding New Platform Support

## Overview

The userscript supports 4 platforms (Gemini, ChatGPT, Claude, Grok). Adding a new one requires changes in 5 specific locations plus testing.

## Step-by-Step

### 1. Add `@match` to Metadata Block

In the `==UserScript==` header (lines 1-15), add a new `@match` rule:

```
// @match        https://newplatform.com/*
```

Place it after the existing `@match` lines, maintaining alphabetical or logical order.

### 2. Add Selector to `getInputField()`

In `getInputField()` (around line 317), add a new hostname check:

```javascript
function getInputField() {
    const h = window.location.hostname;
    if (h.includes('gemini')) return document.querySelector('div[contenteditable="true"]');
    if (h.includes('chatgpt')) return document.querySelector('#prompt-textarea');
    if (h.includes('claude')) return document.querySelector('div[contenteditable="true"], .ProseMirror');
    if (h.includes('grok')) return document.querySelector('textarea, div[contenteditable="true"]');
    // ADD NEW PLATFORM HERE:
    if (h.includes('newplatform')) return document.querySelector('YOUR_SELECTOR');
    return null;
}
```

#### How to Find the Selector

1. Open the platform in Chrome DevTools
2. Click the input/chat field
3. Inspect the element - look for:
   - `textarea` elements (simplest case)
   - `div[contenteditable="true"]` (rich text editors)
   - `.ProseMirror` (ProseMirror-based editors)
   - Elements with specific IDs or aria-labels
4. Prefer the most specific, stable selector (IDs > aria-labels > class names > generic tags)
5. Test that the selector is unique - `document.querySelectorAll(selector).length` should be 1

### 3. Add New Chat URL to `getNewChatUrl()`

In `getNewChatUrl()` (around line 390), add the new platform's fresh-chat URL:

```javascript
function getNewChatUrl() {
    const h = location.hostname;
    if (h.includes('gemini')) return 'https://gemini.google.com/app';
    if (h.includes('chatgpt')) return 'https://chatgpt.com/';
    if (h.includes('claude')) return 'https://claude.ai/new';
    if (h.includes('grok')) return 'https://grok.com/';
    // ADD NEW PLATFORM HERE:
    if (h.includes('newplatform')) return 'https://newplatform.com/new';
    return null;
}
```

Find the new-chat URL by:
- Looking for a "New chat" button in the platform UI
- Checking what URL it navigates to
- The URL should load with an empty input field

### 4. Check Input Field Type Compatibility

The script handles two input types differently:

- **`textarea`**: Uses `setNativeValue()` for React-safe value setting, reads via `.value`
- **`contenteditable div`**: Uses `.textContent` for setting, `.innerText` for reading

The `isTextarea()` helper (line ~249) distinguishes them:

```javascript
function isTextarea(field) {
    return field && field.tagName === 'TEXTAREA';
}
```

If the new platform uses a textarea with a React/Vue framework, `setNativeValue()` will handle the state sync. If it uses contenteditable, text injection works via `textContent`. No changes needed to these helpers unless the platform uses an unusual editor.

### 5. Verify CSP Compatibility

Check the platform's Content Security Policy:

1. Open DevTools -> Console
2. Look for CSP violation errors when the script runs
3. Common issues:
   - **Trusted Types**: The script avoids `innerHTML` - uses `createElement` + `textContent` instead
   - **style-src**: `GM_addStyle` injects a `<style>` element - if blocked, styles won't apply but functionality still works
   - **script-src**: Not relevant since userscript managers inject before CSP applies

If the platform has strict Trusted Types, ensure no `innerHTML` is used anywhere in the new code path.

### 6. Update README

Add the new platform to:
- The "Unterstuetzte Plattformen" section with an appropriate emoji
- The compatibility matrix if needed

### 7. Test

Using the cross-platform-testing skill, verify:
1. `getInputField()` finds the correct element
2. Typing triggers backup
3. Backup restores on page reload
4. Cursor position is preserved
5. Enter keydown captures to history
6. "New chat" navigates to correct URL
7. Pending prompt injection works on fresh page

## Common Platform Patterns

| Pattern | Platforms Using It | Key Concern |
|---------|-------------------|-------------|
| Plain `textarea` | Grok (sometimes) | Use `setNativeValue()` |
| React `textarea` | ChatGPT | Must use prototype setter |
| `contenteditable` | Gemini, Claude, Grok | Use `.textContent` |
| ProseMirror | Claude, Gemini | May need `compositionend` event |
| Shadow DOM | (none currently) | Would need `shadowRoot` traversal |

## Secrets Needed

None for code changes. Login credentials may be needed for testing the new platform.