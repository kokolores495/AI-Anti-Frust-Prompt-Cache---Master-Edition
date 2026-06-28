/**
 * Core logic for AI Anti-Frust: Master Edition
 * Extracted for testability. These functions are used by the userscript.
 */

const STORAGE_KEY = 'ai_draft_backup_universal';
const CURSOR_KEY = 'ai_cursor_pos_universal';

/**
 * Sets a value on an input element in a way that React/Vue frameworks detect.
 * Uses native property setters to trigger framework state updates.
 */
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

/**
 * Computes the absolute cursor position within a text field or contenteditable element.
 */
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

/**
 * Finds the AI platform's input field based on the current hostname.
 */
function getInputField() {
    const h = window.location.hostname;
    if (h.includes('gemini')) return document.querySelector('div[contenteditable="true"]');
    if (h.includes('chatgpt')) return document.querySelector('#prompt-textarea');
    if (h.includes('claude')) return document.querySelector('div[contenteditable="true"], .ProseMirror');
    if (h.includes('grok')) return document.querySelector('textarea, div[contenteditable="true"]');
    return null;
}

/**
 * Saves the current text and cursor position to localStorage.
 * Removes backup if the text is empty.
 */
function saveBackup(field) {
    const text = field.tagName === 'TEXTAREA' ? field.value : field.innerText;
    if (text.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY, text);
        localStorage.setItem(CURSOR_KEY, getCursorPosition(field));
    } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CURSOR_KEY);
    }
}

/**
 * Clears the backup from localStorage and resets the input field.
 */
function clearBackup(field) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURSOR_KEY);
    if (field) {
        if (field.tagName === 'TEXTAREA') field.value = "";
        else field.textContent = "";
        field.dataset.restored = "false";
        field.focus();
    }
}

/**
 * Returns whether a backup exists in localStorage.
 */
function hasBackup() {
    const savedText = localStorage.getItem(STORAGE_KEY);
    return !!(savedText && savedText.trim().length > 0);
}

/**
 * Restores the saved text and cursor position into the given field.
 * For textareas, uses setNativeValue + setSelectionRange.
 * For contenteditable elements, uses a DOM walker to place the cursor.
 */
function restoreToField(field) {
    const savedText = localStorage.getItem(STORAGE_KEY);
    const savedPos = parseInt(localStorage.getItem(CURSOR_KEY) || "0");

    if (!savedText || savedText.trim().length === 0) return false;
    if ((field.innerText || field.value || "").trim() !== "") return false;
    if (field.dataset.restored === "true") return false;

    if (field.tagName === 'TEXTAREA') {
        setNativeValue(field, savedText);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.focus();
        field.setSelectionRange(savedPos, savedPos);
    } else {
        field.textContent = savedText;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.focus();

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
        if (!found) { range.selectNodeContents(field); range.collapse(false); }
        sel.removeAllRanges();
        sel.addRange(range);
    }
    field.dataset.restored = "true";
    return true;
}

/**
 * Determines whether the beforeunload warning should fire.
 * Returns true if the field has non-empty text content.
 */
function shouldWarnBeforeUnload(field) {
    if (!field) return false;
    const text = field.tagName === 'TEXTAREA' ? field.value : field.innerText;
    return !!(text && text.trim().length > 0);
}

module.exports = {
    STORAGE_KEY,
    CURSOR_KEY,
    setNativeValue,
    getCursorPosition,
    getInputField,
    saveBackup,
    clearBackup,
    hasBackup,
    restoreToField,
    shouldWarnBeforeUnload,
};
