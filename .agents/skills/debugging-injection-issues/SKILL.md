---
name: debugging-injection-issues
description: Troubleshoot when the userscript fails to work on a platform. Covers CSP, Trusted Types, React state, ProseMirror sync, and input detection issues.
---

# Debugging Userscript Injection Issues

## Overview

When the userscript doesn't work on a platform, the problem usually falls into one of 5 categories: input detection, text injection, CSP/Trusted Types, framework state sync, or timing.

## Diagnostic Flowchart

```
Script doesn't work
|-- No UI buttons appear?
|   |-- Check: Is the @match pattern correct?
|   |-- Check: Is GM_addStyle working? (inspect <head> for injected <style>)
|   +-- Check: Is the IIFE executing? (add console.log at top)
|-- Buttons appear but backup doesn't work?
|   |-- Check: Does getInputField() return an element? (not null)
|   |-- Check: Is the field type detected correctly? (textarea vs contenteditable)
|   +-- Check: Are event listeners firing? (add console.log in saveAction)
|-- Backup saves but restore fails?
|   |-- Check: Is setFieldText() working? (React state vs DOM)
|   |-- Check: Is setNativeValue() finding the value setter?
|   +-- Check: Is the field empty when restore runs? (timing issue)
+-- Everything works but "Send" button stays disabled?
    |-- Check: Is the input event dispatched after text injection?
    +-- Check: Does the framework need a specific event type?
```

## Issue 1: Input Field Not Found

**Symptom**: `getInputField()` returns `null`, no backup/restore happens.

**Diagnosis**:
```javascript
// Run in DevTools console on the target page
const h = window.location.hostname;
console.log('Hostname:', h);
console.log('contenteditable:', document.querySelectorAll('div[contenteditable="true"]'));
console.log('textareas:', document.querySelectorAll('textarea'));
console.log('ProseMirror:', document.querySelectorAll('.ProseMirror'));
```

**Common causes**:
- Platform changed their DOM structure (selector no longer matches)
- Input field is inside a Shadow DOM (needs `shadowRoot` traversal)
- Input field loads asynchronously after the script's initial check
- Hostname doesn't match any `h.includes()` check

**Fix**: Update the selector in `getInputField()`. The script's `setInterval(updateLogic, 500)` retries every 500ms, so async loading is usually handled.

## Issue 2: Text Injection Fails (React/Vue State)

**Symptom**: Text appears in the field but the "Send" button stays disabled, or the text disappears on next render.

**Diagnosis**:
```javascript
// Check if setNativeValue finds the setter
const field = document.querySelector('#prompt-textarea');
const proto = Object.getPrototypeOf(field);
console.log('Own setter:', Object.getOwnPropertyDescriptor(field, 'value')?.set);
console.log('Proto setter:', Object.getOwnPropertyDescriptor(proto, 'value')?.set);
```

**Root cause**: React/Vue intercept the `value` property setter. Setting `.value` directly bypasses their state management, so the framework doesn't know the value changed.

**Fix**: The `setNativeValue()` function handles this by calling the prototype's setter directly:
```javascript
const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element), 'value'
)?.set;
prototypeValueSetter.call(element, value);
```

After setting, dispatch an `input` event to trigger React's onChange:
```javascript
field.dispatchEvent(new Event('input', { bubbles: true }));
```

## Issue 3: CSP Blocks Style Injection

**Symptom**: Script runs but UI looks broken (no styling on buttons/panels).

**Diagnosis**: Check DevTools Console for CSP violation errors like:
```
Refused to apply inline style because it violates the following
Content Security Policy directive: "style-src 'self'"
```

**Root cause**: The platform's CSP blocks inline `<style>` elements.

**Fix**: `GM_addStyle` in Violentmonkey/Tampermonkey bypasses CSP because userscript managers inject in a privileged context. If testing via CDP injection (without a userscript manager), the polyfill may be blocked by CSP. In that case:
- The functionality still works, just unstyled
- For testing, you can temporarily disable CSP via Chrome flags or the CDP `Page.setBypassCSP` method:
```python
cdp = await page.context.new_cdp_session(page)
await cdp.send('Page.setBypassCSP', {'enabled': True})
```

## Issue 4: Trusted Types Policy Violation

**Symptom**: Console shows `This document requires 'TrustedHTML' assignment` error.

**Diagnosis**: Check if the platform enforces Trusted Types:
```javascript
// In DevTools console
console.log('Trusted Types required:', !!window.trustedTypes?.defaultPolicy);
```

**Root cause**: Setting `innerHTML` on any element triggers a Trusted Types violation.

**Fix**: The script already avoids this - all DOM is built with `document.createElement()` + `textContent`. If you're adding new code, never use:
- `element.innerHTML = ...`
- `element.outerHTML = ...`
- `element.insertAdjacentHTML(...)`
- `document.write(...)`

Instead use:
```javascript
const el = document.createElement('div');
el.textContent = 'Safe text';
parent.appendChild(el);
```

## Issue 5: ProseMirror Sync Issues

**Symptom**: Text injected into Claude/Gemini's ProseMirror editor doesn't persist or gets overwritten.

**Diagnosis**: ProseMirror maintains its own internal state separate from the DOM. Setting `textContent` on the editable div may not update ProseMirror's document model.

**Fix**: After setting text, dispatch multiple events:
```javascript
field.textContent = text;
field.dispatchEvent(new Event('input', { bubbles: true }));
// Some ProseMirror setups also need:
field.dispatchEvent(new CompositionEvent('compositionend', { data: text, bubbles: true }));
```

The script's `setFieldText()` handles contenteditable via `textContent`, which works for most ProseMirror setups because ProseMirror listens on DOM mutations.

## Issue 6: Timing / Race Conditions

**Symptom**: Script works sometimes but not always, or only after a delay.

**Common timing issues**:
1. **Field not ready**: `getInputField()` runs before the SPA renders the input. The `setInterval(updateLogic, 500)` loop handles this by retrying.
2. **Restore before field is interactive**: The field exists in DOM but isn't fully initialized. The script checks `getFieldText(field).trim() === ""` before restoring.
3. **Event handler ordering**: Backup handler must be bound before pending prompt injection fires its synthetic `input` event (fixed in v8.5 by reordering in `updateLogic()`).

**Diagnosis**: Add logging to `updateLogic()`:
```javascript
console.log('[Debug]', 'field:', !!field, 'hasBackup:', hasBackup, 'restored:', field?.dataset.restored);
```

## Quick Reference: Key Functions

| Function | Purpose | Location |
|----------|---------|----------|
| `getInputField()` | Per-platform input selector | ~line 317 |
| `setNativeValue()` | React-safe value setter | ~line 275 |
| `setFieldText()` | Abstraction over textarea/contenteditable | ~line 256 |
| `getFieldText()` | Read text from field | ~line 252 |
| `getCursorPosition()` | DOM walker for cursor pos | ~line 299 |
| `updateLogic()` | Main coordinator (backup/restore/inject) | ~line 688 |

## Secrets Needed

None.