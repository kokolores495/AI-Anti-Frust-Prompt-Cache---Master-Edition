---
name: localstorage-migration
description: Handle localStorage key format changes between userscript versions. Use when storage schema changes or when adding migration logic for backward compatibility.
---

# localStorage Migration

## Overview

The userscript stores all data in `localStorage` with fixed string keys. When the storage format changes between versions, users need their existing data migrated seamlessly. This skill covers how to write backward-compatible migrations.

## Current Storage Schema (v8.5)

| Key | Format | Purpose |
|-----|--------|--------|
| `ai_draft_backup_universal` | Plain text string | Current draft backup |
| `ai_cursor_pos_universal` | Number (as string) | Cursor position in draft |
| `ai_feature_settings_universal` | JSON object | User settings |
| `ai_prompt_history_universal` | JSON array | Prompt history entries |
| `ai_pending_prompt_universal` | Plain text string | Pending prompt for injection |

### Settings Object Shape

```javascript
{
    showHistoryIcon: true,    // boolean
    showSettingsIcon: true,   // boolean
    maxHistory: 50            // number (1-500)
}
```

### History Entry Shape

```javascript
{
    text: "prompt text",           // string
    host: "gemini.google.com",     // string (hostname)
    ts: 1719600000000              // number (Date.now() timestamp)
}
```

## Migration Patterns

### Pattern 1: Adding New Fields to Settings

When adding a new setting field, `loadSettings()` already handles this via `Object.assign`:

```javascript
const DEFAULT_SETTINGS = { showHistoryIcon: true, showSettingsIcon: true, maxHistory: 50 };

function loadSettings() {
    const raw = safeStorageGet(SETTINGS_KEY);
    if (raw) {
        try {
            return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
        } catch (_) { /* invalid JSON */ }
    }
    return Object.assign({}, DEFAULT_SETTINGS);
}
```

`Object.assign({}, DEFAULT_SETTINGS, stored)` merges stored values over defaults, so any new field added to `DEFAULT_SETTINGS` automatically gets its default value for existing users. No explicit migration needed.

**Example**: Adding `showClearButton: true` to defaults:
```javascript
const DEFAULT_SETTINGS = { 
    showHistoryIcon: true, showSettingsIcon: true, maxHistory: 50,
    showClearButton: true  // new field - existing users get default automatically
};
```

### Pattern 2: Renaming a Storage Key

If you need to rename a key (e.g., changing the prefix):

```javascript
// Migration: run once at script start, before any reads
(function migrateKeys() {
    const OLD_KEY = 'ai_old_key_name';
    const NEW_KEY = 'ai_new_key_name';
    const old = safeStorageGet(OLD_KEY);
    if (old !== null) {
        safeStorageSet(NEW_KEY, old);
        safeStorageRemove(OLD_KEY);
    }
})();
```

Place this at the top of the IIFE, after the storage helper definitions but before any `loadSettings()` or `loadHistory()` calls.

### Pattern 3: Changing Data Shape

If the history entry format changes (e.g., adding a new field to each entry):

```javascript
function loadHistory() {
    const raw = safeStorageGet(HISTORY_KEY);
    if (raw) {
        try {
            const arr = JSON.parse(raw);
            // Migrate: ensure each entry has the new 'platform' field
            return arr.map(function(entry) {
                if (!entry.platform) {
                    entry.platform = entry.host ? guessPlatform(entry.host) : 'unknown';
                }
                return entry;
            });
        } catch (_) { /* invalid JSON */ }
    }
    return [];
}
```

This "migrate on read" pattern is preferred because:
- No separate migration step needed
- Handles partial migrations (some entries old, some new)
- Idempotent - safe to run multiple times

### Pattern 4: Handling Corrupted Data

The `try/catch` blocks in `loadSettings()` and `loadHistory()` already handle corrupted JSON by falling back to defaults. For more targeted recovery:

```javascript
function loadHistory() {
    const raw = safeStorageGet(HISTORY_KEY);
    if (raw) {
        try {
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) {
                // Data is JSON but wrong type - reset
                saveHistory([]);
                return [];
            }
            // Filter out malformed entries
            return arr.filter(function(entry) {
                return entry && typeof entry.text === 'string' && typeof entry.ts === 'number';
            });
        } catch (_) {
            // Completely invalid JSON - reset
            saveHistory([]);
            return [];
        }
    }
    return [];
}
```

### Pattern 5: Storage Quota Management

`localStorage` typically has a 5-10MB quota. The script handles quota exceeded errors in `safeStorageSet()`:

```javascript
function safeStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (_) {
        return false;
    }
}
```

The `backupStorageSet()` wrapper shows a visual warning (orange button) when storage is full. For history, cap length via `settings.maxHistory` to prevent unbounded growth.

To estimate storage usage:
```javascript
function getStorageUsage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        total += key.length + localStorage.getItem(key).length;
    }
    return total; // in characters (roughly 2 bytes each in UTF-16)
}
```

## Testing Migrations

1. **Set up old data**: Manually write old-format data to localStorage
2. **Inject new script**: Load the updated userscript
3. **Verify migration**: Check that data is readable and correctly transformed
4. **Verify no data loss**: Ensure all old entries are preserved
5. **Verify idempotency**: Re-inject the script - data should not change

```python
# Example: set up old-format data for testing
await page.evaluate('''
    // Simulate old settings without the new "showClearButton" field
    localStorage.setItem("ai_feature_settings_universal", 
        JSON.stringify({ showHistoryIcon: true, showSettingsIcon: true, maxHistory: 50 }));
    
    // Simulate old history entries without "platform" field
    localStorage.setItem("ai_prompt_history_universal",
        JSON.stringify([{ text: "old prompt", host: "gemini.google.com", ts: 1700000000000 }]));
''')

# Inject new script
await page.evaluate(polyfill)
await page.evaluate(script_source)

# Verify migration
settings = await page.evaluate('localStorage.getItem("ai_feature_settings_universal")')
# Should include new default field
```

## Key Principles

1. **Never delete user data without explicit confirmation** (the "Clear all history" button uses `confirm()`)
2. **Always fall back to defaults** on parse errors - don't crash
3. **Use `safeStorageGet/Set/Remove`** wrappers - never call `localStorage` directly (they handle access-denied errors in private browsing)
4. **Migrate on read** rather than running one-time migration scripts
5. **Keep storage keys stable** - changing a key name effectively deletes all user data unless you migrate

## Secrets Needed

None.