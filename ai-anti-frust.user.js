// ==UserScript==
// @name         Universal AI Anti-Frust: Master Edition
// @namespace    https://violentmonkey.github.io/
// @version      8.4
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
    const LOG_PREFIX = '[AI Anti-Frust]';

    // CSS Injektion für den Lösch-Button (Umgeht Content-Security-Policy)
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
    `);

    const btn = document.createElement('button');
    btn.id = 'clear-ai-backup';
    btn.textContent = '🗑️';

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
            btn.style.removeProperty('background');
            btn.title = '';
            return true;
        } catch (_) {
            btn.style.setProperty('background', '#ff8c00', 'important');
            btn.title = 'Speicher voll – Backup konnte nicht gesichert werden!';
            return false;
        }
    }

    function safeStorageRemove(key) {
        try { localStorage.removeItem(key); }
        catch (_) { /* access denied */ }
    }

    function updateLogic() {
        const field = getInputField();
        const savedText = safeStorageGet(STORAGE_KEY);
        const hasBackup = !!(savedText && savedText.trim().length > 0);

        btn.style.setProperty('display', hasBackup ? 'flex' : 'none', 'important');
        if (!field) return;

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

        // BACKUP LOGIK (Event Binding)
        if (!field.dataset.backupBound) {
            const saveAction = () => {
                try {
                    const text = getFieldText(field);
                    if (text && text.trim().length > 0) {
                        if (safeStorageSet(STORAGE_KEY, text)) {
                            safeStorageSet(CURSOR_KEY, getCursorPosition(field));
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

            // Cleanup nach Absenden
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    setTimeout(() => {
                        clearBackup();
                        resetFieldState(field);
                    }, 800);
                }
            });
            field.dataset.backupBound = "true";
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
            if (document.body && !document.getElementById('clear-ai-backup')) {
                document.body.appendChild(btn);
            }
            updateLogic();
        } catch (e) {
            console.warn(LOG_PREFIX, 'Periodic update failed:', e.message);
        }
    }, 1500);

    // Warnung vor Tab-Schließen
    window.addEventListener('beforeunload', (e) => {
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
})();
