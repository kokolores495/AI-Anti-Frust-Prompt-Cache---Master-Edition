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
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'ai_draft_backup_universal';
    const CURSOR_KEY = 'ai_cursor_pos_universal';

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

    // Hilfsfunktion: Setzt Werte so, dass React/Vue sie erkennt (Trigger State Update)
    function setNativeValue(element, value) {
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
    }

    // Hilfsfunktion: Berechnet die absolute Cursor-Position im Text
    function getCursorPosition(el) {
        if (el.tagName === 'TEXTAREA') return el.selectionStart;
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(el);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            return preCaretRange.toString().length;
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

    function updateLogic() {
        const field = getInputField();
        const savedText = localStorage.getItem(STORAGE_KEY);
        const savedPos = parseInt(localStorage.getItem(CURSOR_KEY) || "0");
        const hasBackup = !!(savedText && savedText.trim().length > 0);

        btn.style.setProperty('display', hasBackup ? 'flex' : 'none', 'important');
        if (!field) return;

        // RESTORE LOGIK
        if (hasBackup && (field.innerText || field.value || "").trim() === "" && !field.dataset.restored) {
            if (field.tagName === 'TEXTAREA') {
                setNativeValue(field, savedText);
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.focus();
                field.setSelectionRange(savedPos, savedPos);
            } else {
                field.textContent = savedText; // Trusted-Types safe
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.focus();

                // Cursor-Wiederherstellung für ContentEditable (DOM Walker)
                const range = document.createRange();
                const sel = window.getSelection();
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
            field.dataset.restored = "true";
        }

        // BACKUP LOGIK (Event Binding)
        if (!field.dataset.backupBound) {
            const saveAction = () => {
                const text = field.tagName === 'TEXTAREA' ? field.value : field.innerText;
                if (text.trim().length > 0) {
                    localStorage.setItem(STORAGE_KEY, text);
                    localStorage.setItem(CURSOR_KEY, getCursorPosition(field));
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(CURSOR_KEY);
                }
                updateLogic();
            };
            field.addEventListener('input', saveAction);
            field.addEventListener('click', saveAction);
            field.addEventListener('keyup', saveAction);

            // Cleanup nach Absenden
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    setTimeout(() => {
                        localStorage.removeItem(STORAGE_KEY);
                        localStorage.removeItem(CURSOR_KEY);
                        field.dataset.restored = "false";
                        updateLogic();
                    }, 800);
                }
            });
            field.dataset.backupBound = "true";
        }
    }

    btn.onclick = (e) => {
        e.preventDefault();
        if (confirm("Backup-Speicher wirklich leeren?")) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(CURSOR_KEY);
            const field = getInputField();
            if (field) {
                if (field.tagName === 'TEXTAREA') field.value = "";
                else field.textContent = "";
                field.dataset.restored = "false";
                field.focus();
            }
            updateLogic();
        }
    };

    // Periodischer Check (falls UI nachgeladen wird)
    setInterval(() => {
        if (!document.getElementById('clear-ai-backup')) document.body.appendChild(btn);
        updateLogic();
    }, 1500);

    // Warnung vor Tab-Schließen
    window.addEventListener('beforeunload', (e) => {
        const field = getInputField();
        const text = field ? (field.tagName === 'TEXTAREA' ? field.value : field.innerText) : "";
        if (text && text.trim().length > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
})();