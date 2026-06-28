// ==UserScript==
// @name         Universal AI Anti-Frust: Master Edition
// @namespace    https://violentmonkey.github.io/
// @version      8.5
// @description  Backup, Restore & Cursor-Sync für Gemini, ChatGPT, Claude & Grok. CSP & Trusted-Types safe.
// @author       R7sieben & Gemini
// @match        https://gemini.google.com/*
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// @match        https://grok.com/*
// @grant        GM_addStyle
// @noframes
// @connect      none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'ai_draft_backup_universal';
    const CURSOR_KEY = 'ai_cursor_pos_universal';
    const SETTINGS_KEY = 'ai_feature_settings_universal';
    const HISTORY_KEY = 'ai_prompt_history_universal';
    const PENDING_PROMPT_KEY = 'ai_pending_prompt_universal';
    const LOG_PREFIX = '[AI Anti-Frust]';

    // CSS Injektion (Umgeht Content-Security-Policy)
    GM_addStyle(`
        #clear-ai-backup {
            position: fixed !important;
            top: 15px !important;
            right: 220px !important;
            z-index: 2147483647 !important;
            display: none;
            align-items: center;
            justify-content: center;
            background: #d93025 !important;
            color: white !important;
            border: 2px solid white !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            width: 38px !important;
            height: 38px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
            font-size: 20px !important;
            transition: all 0.2s ease;
        }
        #clear-ai-backup:hover { background: #b21f16 !important; transform: scale(1.1); }

        #ai-settings-btn, #ai-history-btn {
            position: fixed !important;
            top: 15px !important;
            z-index: 2147483647 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white !important;
            border: 2px solid white !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            width: 38px !important;
            height: 38px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
            font-size: 18px !important;
            transition: all 0.2s ease;
        }
        #ai-settings-btn {
            right: 270px !important;
            background: #5f6368 !important;
        }
        #ai-settings-btn:hover { background: #3c4043 !important; transform: scale(1.1); }
        #ai-history-btn {
            right: 320px !important;
            background: #1a73e8 !important;
        }
        #ai-history-btn:hover { background: #1558b0 !important; transform: scale(1.1); }

        #ai-settings-panel, #ai-history-overlay {
            position: fixed !important;
            z-index: 2147483647 !important;
            background: #2d2d2d !important;
            color: #e8eaed !important;
            border: 1px solid #5f6368 !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 14px !important;
            display: none;
        }
        #ai-settings-panel {
            top: 60px !important;
            right: 220px !important;
            width: 300px !important;
            padding: 16px !important;
        }
        #ai-history-overlay {
            top: 60px !important;
            right: 220px !important;
            width: 420px !important;
            max-height: 500px !important;
            overflow-y: auto !important;
            padding: 16px !important;
        }

        .ai-panel-title {
            font-size: 16px !important;
            font-weight: 600 !important;
            margin: 0 0 12px 0 !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid #5f6368 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .ai-panel-close {
            background: none !important;
            border: none !important;
            color: #9aa0a6 !important;
            font-size: 20px !important;
            cursor: pointer !important;
            padding: 0 !important;
            line-height: 1 !important;
        }
        .ai-panel-close:hover { color: #e8eaed !important; }

        .ai-setting-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 8px 0 !important;
        }
        .ai-setting-label {
            flex: 1 !important;
            margin-right: 12px !important;
        }
        .ai-toggle {
            position: relative !important;
            width: 40px !important;
            height: 22px !important;
            background: #5f6368 !important;
            border-radius: 11px !important;
            border: none !important;
            cursor: pointer !important;
            transition: background 0.2s !important;
            padding: 0 !important;
        }
        .ai-toggle.active { background: #1a73e8 !important; }
        .ai-toggle::after {
            content: '' !important;
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            width: 18px !important;
            height: 18px !important;
            background: white !important;
            border-radius: 50% !important;
            transition: transform 0.2s !important;
        }
        .ai-toggle.active::after { transform: translateX(18px) !important; }

        .ai-num-input {
            width: 60px !important;
            padding: 4px 8px !important;
            background: #3c4043 !important;
            color: #e8eaed !important;
            border: 1px solid #5f6368 !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            text-align: center !important;
        }

        .ai-history-entry {
            padding: 10px !important;
            margin: 8px 0 !important;
            background: #3c4043 !important;
            border-radius: 8px !important;
        }
        .ai-history-meta {
            font-size: 11px !important;
            color: #9aa0a6 !important;
            margin-bottom: 4px !important;
        }
        .ai-history-text {
            font-size: 13px !important;
            line-height: 1.4 !important;
            margin-bottom: 8px !important;
            word-break: break-word !important;
        }
        .ai-history-actions {
            display: flex !important;
            gap: 6px !important;
        }
        .ai-history-actions button {
            padding: 4px 10px !important;
            border: 1px solid #5f6368 !important;
            border-radius: 6px !important;
            background: #2d2d2d !important;
            color: #e8eaed !important;
            font-size: 12px !important;
            cursor: pointer !important;
            transition: background 0.15s !important;
        }
        .ai-history-actions button:hover { background: #5f6368 !important; }
        .ai-history-actions button.ai-delete-btn { color: #f28b82 !important; }
        .ai-history-actions button.ai-delete-btn:hover { background: #5c2020 !important; }

        .ai-clear-all-btn {
            width: 100% !important;
            padding: 8px !important;
            margin-top: 8px !important;
            background: #5c2020 !important;
            color: #f28b82 !important;
            border: 1px solid #f28b82 !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 13px !important;
            transition: background 0.15s !important;
        }
        .ai-clear-all-btn:hover { background: #7c2d2d !important; }

        .ai-history-empty {
            text-align: center !important;
            color: #9aa0a6 !important;
            padding: 24px 0 !important;
        }
    `);

    const btn = document.createElement('button');
    btn.id = 'clear-ai-backup';
    btn.textContent = '\uD83D\uDDD1\uFE0F';

    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'ai-settings-btn';
    settingsBtn.textContent = '\u2699\uFE0F';

    const historyBtn = document.createElement('button');
    historyBtn.id = 'ai-history-btn';
    historyBtn.textContent = '\uD83D\uDCDC';

    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'ai-settings-panel';

    const historyOverlay = document.createElement('div');
    historyOverlay.id = 'ai-history-overlay';

    // --- Shared Utilities ---

    function isTextarea(el) {
        return el.tagName === 'TEXTAREA';
    }

    function getFieldText(field) {
        return isTextarea(field) ? field.value : field.innerText;
    }

    function setFieldText(field, text) {
        if (isTextarea(field)) {
            setNativeValue(field, text);
        } else {
            field.textContent = text;
        }
    }

    function clearBackup() {
        safeStorageRemove(STORAGE_KEY);
        safeStorageRemove(CURSOR_KEY);
    }

    function resetFieldState(field) {
        delete field.dataset.restored;
        updateLogic();
    }

    // Setzt Werte so, dass React/Vue sie erkennt (Trigger State Update)
    function setNativeValue(element, value) {
        if (!element) {
            console.warn(LOG_PREFIX, 'setNativeValue called with null element');
            return;
        }
        try {
            const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

            if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
                prototypeValueSetter.call(element, value);
            } else if (valueSetter) {
                valueSetter.call(element, value);
            } else {
                element.value = value;
            }
        } catch (e) {
            console.warn(LOG_PREFIX, 'setNativeValue failed:', e.message);
            element.value = value;
        }
    }

    // Berechnet die absolute Cursor-Position im Text
    function getCursorPosition(el) {
        if (!el) return 0;
        try {
            if (isTextarea(el)) return el.selectionStart || 0;
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(el);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                return preCaretRange.toString().length;
            }
        } catch (e) {
            console.warn(LOG_PREFIX, 'getCursorPosition failed:', e.message);
        }
        return 0;
    }

    function getInputField() {
        const h = window.location.hostname;
        if (h.includes('gemini')) return document.querySelector('div[contenteditable="true"]');
        if (h.includes('chatgpt')) return document.querySelector('#prompt-textarea');
        if (h.includes('claude')) return document.querySelector('div[contenteditable="true"], .ProseMirror');
        if (h.includes('grok')) return document.querySelector('textarea, div[contenteditable="true"]');
        return null;
    }

    function clampCursorPos(pos, text) {
        if (typeof pos !== 'number' || isNaN(pos) || pos < 0) return 0;
        return Math.min(pos, text.length);
    }

    function safeStorageGet(key) {
        try { return localStorage.getItem(key); }
        catch (_) { return null; }
    }

    function safeStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (_) {
            return false;
        }
    }

    function backupStorageSet(key, value) {
        const ok = safeStorageSet(key, value);
        if (ok) {
            btn.style.removeProperty('background');
            btn.title = '';
        } else {
            btn.style.setProperty('background', '#ff8c00', 'important');
            btn.title = 'Speicher voll \u2013 Backup konnte nicht gesichert werden!';
        }
        return ok;
    }

    function safeStorageRemove(key) {
        try { localStorage.removeItem(key); }
        catch (_) { /* access denied */ }
    }

    // --- Settings ---

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

    function saveSettings(s) {
        safeStorageSet(SETTINGS_KEY, JSON.stringify(s));
    }

    let settings = loadSettings();

    // --- Prompt History ---

    function loadHistory() {
        const raw = safeStorageGet(HISTORY_KEY);
        if (raw) {
            try { return JSON.parse(raw); }
            catch (_) { /* invalid JSON */ }
        }
        return [];
    }

    function saveHistory(arr) {
        safeStorageSet(HISTORY_KEY, JSON.stringify(arr));
    }

    function addPromptToHistory(text) {
        if (!text || !text.trim()) return;
        const history = loadHistory();
        if (history.length > 0 && history[0].text === text) return;
        history.unshift({ text: text, host: location.hostname, ts: Date.now() });
        const max = settings.maxHistory || 50;
        while (history.length > max) history.pop();
        saveHistory(history);
    }

    // --- New Chat URL ---

    function getNewChatUrl() {
        const h = location.hostname;
        if (h.includes('gemini')) return 'https://gemini.google.com/app';
        if (h.includes('chatgpt')) return 'https://chatgpt.com/';
        if (h.includes('claude')) return 'https://claude.ai/new';
        if (h.includes('grok')) return 'https://grok.com/';
        return null;
    }

    // --- Clipboard ---

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) { /* copy failed */ }
        document.body.removeChild(ta);
    }

    // --- UI Visibility ---

    function applySettingsVisibility() {
        settingsBtn.style.setProperty('display', settings.showSettingsIcon ? 'flex' : 'none', 'important');
        historyBtn.style.setProperty('display', settings.showHistoryIcon ? 'flex' : 'none', 'important');
    }

    // --- Settings Panel ---

    function buildSettingsPanel() {
        settingsPanel.textContent = '';

        const titleRow = document.createElement('div');
        titleRow.className = 'ai-panel-title';
        const titleText = document.createElement('span');
        titleText.textContent = 'Settings';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ai-panel-close';
        closeBtn.textContent = '\u00D7';
        closeBtn.addEventListener('click', function () {
            settingsPanel.style.setProperty('display', 'none', 'important');
        });
        titleRow.appendChild(titleText);
        titleRow.appendChild(closeBtn);
        settingsPanel.appendChild(titleRow);

        // Toggle: Show history icon
        const row1 = document.createElement('div');
        row1.className = 'ai-setting-row';
        const label1 = document.createElement('span');
        label1.className = 'ai-setting-label';
        label1.textContent = 'Show prompt history icon';
        const toggle1 = document.createElement('button');
        toggle1.className = 'ai-toggle' + (settings.showHistoryIcon ? ' active' : '');
        toggle1.addEventListener('click', function () {
            settings.showHistoryIcon = !settings.showHistoryIcon;
            toggle1.className = 'ai-toggle' + (settings.showHistoryIcon ? ' active' : '');
            saveSettings(settings);
            applySettingsVisibility();
        });
        row1.appendChild(label1);
        row1.appendChild(toggle1);
        settingsPanel.appendChild(row1);

        // Toggle: Show settings icon
        const row2 = document.createElement('div');
        row2.className = 'ai-setting-row';
        const label2 = document.createElement('span');
        label2.className = 'ai-setting-label';
        label2.textContent = 'Show settings icon';
        const toggle2 = document.createElement('button');
        toggle2.className = 'ai-toggle' + (settings.showSettingsIcon ? ' active' : '');
        toggle2.addEventListener('click', function () {
            settings.showSettingsIcon = !settings.showSettingsIcon;
            toggle2.className = 'ai-toggle' + (settings.showSettingsIcon ? ' active' : '');
            saveSettings(settings);
            applySettingsVisibility();
        });
        row2.appendChild(label2);
        row2.appendChild(toggle2);
        settingsPanel.appendChild(row2);

        // Numeric: Max history entries
        const row3 = document.createElement('div');
        row3.className = 'ai-setting-row';
        const label3 = document.createElement('span');
        label3.className = 'ai-setting-label';
        label3.textContent = 'Max history entries';
        const numInput = document.createElement('input');
        numInput.type = 'number';
        numInput.className = 'ai-num-input';
        numInput.min = '1';
        numInput.max = '500';
        numInput.value = String(settings.maxHistory);
        numInput.addEventListener('change', function () {
            let val = parseInt(numInput.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            if (val > 500) val = 500;
            numInput.value = String(val);
            settings.maxHistory = val;
            saveSettings(settings);
        });
        row3.appendChild(label3);
        row3.appendChild(numInput);
        settingsPanel.appendChild(row3);
    }

    // --- History Overlay ---

    function formatTimestamp(ts) {
        try {
            const d = new Date(ts);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (_) {
            return '';
        }
    }

    function truncateText(text, maxLen) {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '\u2026';
    }

    function renderHistoryOverlay() {
        historyOverlay.textContent = '';

        const titleRow = document.createElement('div');
        titleRow.className = 'ai-panel-title';
        const titleText = document.createElement('span');
        titleText.textContent = 'Prompt History';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ai-panel-close';
        closeBtn.textContent = '\u00D7';
        closeBtn.addEventListener('click', function () {
            historyOverlay.style.setProperty('display', 'none', 'important');
        });
        titleRow.appendChild(titleText);
        titleRow.appendChild(closeBtn);
        historyOverlay.appendChild(titleRow);

        const history = loadHistory();

        if (history.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ai-history-empty';
            empty.textContent = 'No prompts recorded yet.';
            historyOverlay.appendChild(empty);
            return;
        }

        history.forEach(function (entry, idx) {
            const div = document.createElement('div');
            div.className = 'ai-history-entry';

            const meta = document.createElement('div');
            meta.className = 'ai-history-meta';
            meta.textContent = formatTimestamp(entry.ts) + (entry.host ? ' \u2014 ' + entry.host : '');

            const preview = document.createElement('div');
            preview.className = 'ai-history-text';
            preview.textContent = truncateText(entry.text, 120);

            const actions = document.createElement('div');
            actions.className = 'ai-history-actions';

            const cpBtn = document.createElement('button');
            cpBtn.textContent = 'Copy';
            cpBtn.addEventListener('click', function () {
                copyToClipboard(entry.text);
                cpBtn.textContent = 'Copied!';
                setTimeout(function () { cpBtn.textContent = 'Copy'; }, 1500);
            });

            const newChatBtn = document.createElement('button');
            newChatBtn.textContent = 'New chat';
            newChatBtn.addEventListener('click', function () {
                const url = getNewChatUrl();
                if (url) {
                    skipBeforeUnload = true;
                    clearBackup();
                    safeStorageSet(PENDING_PROMPT_KEY, entry.text);
                    window.location.href = url;
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'ai-delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', function () {
                const h = loadHistory();
                const matchIdx = h.findIndex(function (item) {
                    return item.ts === entry.ts && item.text === entry.text;
                });
                if (matchIdx !== -1) h.splice(matchIdx, 1);
                saveHistory(h);
                renderHistoryOverlay();
            });

            actions.appendChild(cpBtn);
            actions.appendChild(newChatBtn);
            actions.appendChild(deleteBtn);

            div.appendChild(meta);
            div.appendChild(preview);
            div.appendChild(actions);
            historyOverlay.appendChild(div);
        });

        const clearAllBtn = document.createElement('button');
        clearAllBtn.className = 'ai-clear-all-btn';
        clearAllBtn.textContent = 'Clear all history';
        clearAllBtn.addEventListener('click', function () {
            if (confirm('Delete all prompt history?')) {
                saveHistory([]);
                renderHistoryOverlay();
            }
        });
        historyOverlay.appendChild(clearAllBtn);
    }

    // --- Button Handlers ---

    settingsBtn.addEventListener('click', function (e) {
        e.preventDefault();
        historyOverlay.style.setProperty('display', 'none', 'important');
        const isVisible = settingsPanel.style.getPropertyValue('display') === 'block';
        if (isVisible) {
            settingsPanel.style.setProperty('display', 'none', 'important');
        } else {
            buildSettingsPanel();
            settingsPanel.style.setProperty('display', 'block', 'important');
        }
    });

    historyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        settingsPanel.style.setProperty('display', 'none', 'important');
        const isVisible = historyOverlay.style.getPropertyValue('display') === 'block';
        if (isVisible) {
            historyOverlay.style.setProperty('display', 'none', 'important');
        } else {
            renderHistoryOverlay();
            historyOverlay.style.setProperty('display', 'block', 'important');
        }
    });

    // --- Pending Prompt Injection ---

    function injectPendingPrompt(field) {
        const pending = safeStorageGet(PENDING_PROMPT_KEY);
        if (!pending) return;
        if (getFieldText(field).trim() !== '') {
            safeStorageRemove(PENDING_PROMPT_KEY);
            return;
        }
        try {
            setFieldText(field, pending);
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.focus();
        } catch (e) {
            console.warn(LOG_PREFIX, 'Pending prompt injection failed:', e.message);
        }
        safeStorageRemove(PENDING_PROMPT_KEY);
    }

    // --- Core Logic ---

    function updateLogic() {
        const field = getInputField();
        const savedText = safeStorageGet(STORAGE_KEY);
        const hasBackup = !!(savedText && savedText.trim().length > 0);

        btn.style.setProperty('display', hasBackup ? 'flex' : 'none', 'important');
        applySettingsVisibility();

        if (!field) return;

        // BACKUP LOGIK (Event Binding) — must run before pending prompt
        // injection so the input event handler exists when injectPendingPrompt
        // dispatches its synthetic input event.
        if (!field.dataset.backupBound) {
            const saveAction = () => {
                try {
                    const text = getFieldText(field);
                    if (text && text.trim().length > 0) {
                        if (backupStorageSet(STORAGE_KEY, text)) {
                            backupStorageSet(CURSOR_KEY, getCursorPosition(field));
                        }
                    } else {
                        clearBackup();
                    }
                    updateLogic();
                } catch (e) {
                    console.warn(LOG_PREFIX, 'Backup save failed:', e.message);
                }
            };
            field.addEventListener('input', saveAction);
            field.addEventListener('click', saveAction);
            field.addEventListener('keyup', saveAction);

            // Cleanup nach Absenden + History capture
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    try {
                        const promptText = getFieldText(field);
                        if (promptText && promptText.trim()) {
                            addPromptToHistory(promptText);
                        }
                    } catch (err) {
                        console.warn(LOG_PREFIX, 'History capture failed:', err.message);
                    }
                    setTimeout(() => {
                        clearBackup();
                        resetFieldState(field);
                    }, 800);
                }
            });
            field.dataset.backupBound = "true";
        }

        // Pending prompt injection (only when no backup to restore)
        if (!hasBackup && !field.dataset.pendingHandled) {
            injectPendingPrompt(field);
            field.dataset.pendingHandled = 'true';
        }

        // RESTORE LOGIK
        if (hasBackup && getFieldText(field).trim() === "" && !field.dataset.restored) {
            try {
                const savedPos = clampCursorPos(
                    parseInt(safeStorageGet(CURSOR_KEY) || "0", 10),
                    savedText
                );

                setFieldText(field, savedText);
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.focus();

                if (isTextarea(field)) {
                    field.setSelectionRange(savedPos, savedPos);
                } else {
                    // Cursor-Wiederherstellung für ContentEditable (DOM Walker)
                    try {
                        const range = document.createRange();
                        const sel = window.getSelection();
                        if (sel) {
                            let charCount = 0, nodeStack = [field], found = false;
                            while (nodeStack.length > 0 && !found) {
                                let node = nodeStack.pop();
                                if (node.nodeType === 3) {
                                    const nextCount = charCount + node.length;
                                    if (savedPos <= nextCount) {
                                        range.setStart(node, savedPos - charCount);
                                        range.collapse(true);
                                        found = true;
                                    }
                                    charCount = nextCount;
                                } else {
                                    for (let i = node.childNodes.length - 1; i >= 0; i--) nodeStack.push(node.childNodes[i]);
                                }
                            }
                            if (!found) range.selectNodeContents(field), range.collapse(false);
                            sel.removeAllRanges(); sel.addRange(range);
                        }
                    } catch (_) {
                        // Cursor restore failed — field content is still intact
                    }
                }
                field.dataset.restored = "true";
            } catch (e) {
                console.warn(LOG_PREFIX, 'Restore failed:', e.message);
            }
        }
    }

    btn.onclick = (e) => {
        e.preventDefault();
        if (confirm("Backup-Speicher wirklich leeren?")) {
            clearBackup();
            const field = getInputField();
            if (field) {
                try {
                    setFieldText(field, "");
                    field.focus();
                    resetFieldState(field);
                } catch (e) {
                    console.warn(LOG_PREFIX, 'Field clear failed:', e.message);
                }
            } else {
                updateLogic();
            }
        }
    };

    // Periodischer Check (falls UI nachgeladen wird)
    setInterval(() => {
        try {
            if (document.body) {
                if (!document.getElementById('clear-ai-backup')) document.body.appendChild(btn);
                if (!document.getElementById('ai-settings-btn')) document.body.appendChild(settingsBtn);
                if (!document.getElementById('ai-history-btn')) document.body.appendChild(historyBtn);
                if (!document.getElementById('ai-settings-panel')) document.body.appendChild(settingsPanel);
                if (!document.getElementById('ai-history-overlay')) document.body.appendChild(historyOverlay);
            }
            updateLogic();
        } catch (e) {
            console.warn(LOG_PREFIX, 'Periodic update failed:', e.message);
        }
    }, 1500);

    // Warnung vor Tab-Schließen
    let skipBeforeUnload = false;
    window.addEventListener('beforeunload', (e) => {
        if (skipBeforeUnload) return;
        try {
            const field = getInputField();
            const text = field ? getFieldText(field) : "";
            if (text && text.trim().length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        } catch (err) {
            // Fail silently during unload — browser is closing anyway
        }
    });

    // Conditional export for testing (no-op in browser)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            isTextarea,
            getFieldText,
            clampCursorPos,
            getCursorPosition,
            setNativeValue,
            getInputField
        };
    }
})();
