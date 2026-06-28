/**
 * @jest-environment jsdom
 */

const {
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
} = require('../src/core');

beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe('constants', () => {
    test('STORAGE_KEY is the expected string', () => {
        expect(STORAGE_KEY).toBe('ai_draft_backup_universal');
    });

    test('CURSOR_KEY is the expected string', () => {
        expect(CURSOR_KEY).toBe('ai_cursor_pos_universal');
    });
});

// ---------------------------------------------------------------------------
// setNativeValue
// ---------------------------------------------------------------------------
describe('setNativeValue', () => {
    test('sets value on a textarea via prototype setter', () => {
        const textarea = document.createElement('textarea');
        setNativeValue(textarea, 'hello');
        expect(textarea.value).toBe('hello');
    });

    test('sets value on an input element', () => {
        const input = document.createElement('input');
        setNativeValue(input, 'world');
        expect(input.value).toBe('world');
    });

    test('uses instance setter when prototype setter is absent', () => {
        const instanceSetter = jest.fn();
        const element = {
            value: '',
        };
        // Define an own setter and a prototype with no setter
        Object.defineProperty(element, 'value', {
            set: instanceSetter,
            get() { return ''; },
            configurable: true,
        });
        // Prototype has no value descriptor at all
        Object.setPrototypeOf(element, {});

        setNativeValue(element, 'test');
        expect(instanceSetter).toHaveBeenCalledWith('test');
    });

    test('falls back to direct assignment when no setter exists', () => {
        const obj = { value: '' };
        // obj has no property descriptor with a setter
        setNativeValue(obj, 'fallback');
        expect(obj.value).toBe('fallback');
    });

    test('prefers prototype setter over instance setter when they differ', () => {
        const textarea = document.createElement('textarea');
        const proto = Object.getPrototypeOf(textarea);
        const protoDesc = Object.getOwnPropertyDescriptor(proto, 'value');
        const protoSetter = protoDesc.set;

        // Define a different instance setter
        const instanceSetter = jest.fn();
        Object.defineProperty(textarea, 'value', {
            set: instanceSetter,
            get: protoDesc.get,
            configurable: true,
        });

        setNativeValue(textarea, 'proto-wins');
        // The prototype setter should have been called (not the instance setter)
        expect(instanceSetter).not.toHaveBeenCalled();
        // Reading via prototype getter should reflect the value
        expect(protoDesc.get.call(textarea)).toBe('proto-wins');
    });
});

// ---------------------------------------------------------------------------
// getCursorPosition
// ---------------------------------------------------------------------------
describe('getCursorPosition', () => {
    test('returns selectionStart for a textarea', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = 'Hello World';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;
        expect(getCursorPosition(textarea)).toBe(5);
    });

    test('returns 0 for a textarea with cursor at the start', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = 'Hello';
        textarea.selectionStart = 0;
        expect(getCursorPosition(textarea)).toBe(0);
    });

    test('returns 0 when no selection range exists for contenteditable', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);
        div.textContent = 'Hello';

        // Clear any existing selection
        window.getSelection().removeAllRanges();
        expect(getCursorPosition(div)).toBe(0);
    });

    test('returns correct position for contenteditable with selection', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);
        div.textContent = 'Hello World';

        const range = document.createRange();
        const textNode = div.firstChild;
        range.setStart(textNode, 5);
        range.collapse(true);

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        expect(getCursorPosition(div)).toBe(5);
    });
});

// ---------------------------------------------------------------------------
// getInputField
// ---------------------------------------------------------------------------
describe('getInputField', () => {
    function setHostname(hostname) {
        Object.defineProperty(window, 'location', {
            value: { hostname },
            writable: true,
            configurable: true,
        });
    }

    test('returns contenteditable div for gemini.google.com', () => {
        setHostname('gemini.google.com');
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        document.body.appendChild(div);
        expect(getInputField()).toBe(div);
    });

    test('returns #prompt-textarea for chatgpt.com', () => {
        setHostname('chatgpt.com');
        const textarea = document.createElement('textarea');
        textarea.id = 'prompt-textarea';
        document.body.appendChild(textarea);
        expect(getInputField()).toBe(textarea);
    });

    test('returns contenteditable or ProseMirror for claude.ai', () => {
        setHostname('claude.ai');
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        document.body.appendChild(div);
        expect(getInputField()).toBe(div);
    });

    test('returns ProseMirror element for claude.ai', () => {
        setHostname('claude.ai');
        const div = document.createElement('div');
        div.className = 'ProseMirror';
        document.body.appendChild(div);
        expect(getInputField()).toBe(div);
    });

    test('returns textarea for grok.com', () => {
        setHostname('grok.com');
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        expect(getInputField()).toBe(textarea);
    });

    test('returns contenteditable for grok.com when no textarea', () => {
        setHostname('grok.com');
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        document.body.appendChild(div);
        expect(getInputField()).toBe(div);
    });

    test('returns null for unknown hostname', () => {
        setHostname('example.com');
        expect(getInputField()).toBeNull();
    });

    test('returns null when no matching element exists', () => {
        setHostname('gemini.google.com');
        // No contenteditable div in the DOM
        expect(getInputField()).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// saveBackup
// ---------------------------------------------------------------------------
describe('saveBackup', () => {
    test('saves textarea value and cursor position to localStorage', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = 'my prompt text';
        textarea.selectionStart = 7;
        textarea.selectionEnd = 7;

        saveBackup(textarea);

        expect(localStorage.getItem(STORAGE_KEY)).toBe('my prompt text');
        expect(localStorage.getItem(CURSOR_KEY)).toBe('7');
    });

    test('saves contenteditable innerText to localStorage', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);
        div.innerText = 'editable content';

        // Clear selection so getCursorPosition returns 0
        window.getSelection().removeAllRanges();

        saveBackup(div);

        expect(localStorage.getItem(STORAGE_KEY)).toBe('editable content');
        expect(localStorage.getItem(CURSOR_KEY)).toBe('0');
    });

    test('removes backup when text is empty', () => {
        localStorage.setItem(STORAGE_KEY, 'old');
        localStorage.setItem(CURSOR_KEY, '3');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';

        saveBackup(textarea);

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(localStorage.getItem(CURSOR_KEY)).toBeNull();
    });

    test('removes backup when text is only whitespace', () => {
        localStorage.setItem(STORAGE_KEY, 'old');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '   \n  ';

        saveBackup(textarea);

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// clearBackup
// ---------------------------------------------------------------------------
describe('clearBackup', () => {
    test('removes keys from localStorage and clears textarea', () => {
        localStorage.setItem(STORAGE_KEY, 'backup');
        localStorage.setItem(CURSOR_KEY, '5');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = 'some text';
        textarea.dataset.restored = 'true';

        clearBackup(textarea);

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(localStorage.getItem(CURSOR_KEY)).toBeNull();
        expect(textarea.value).toBe('');
        expect(textarea.dataset.restored).toBe('false');
    });

    test('clears contenteditable element', () => {
        localStorage.setItem(STORAGE_KEY, 'backup');

        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);
        div.textContent = 'some content';

        clearBackup(div);

        expect(div.textContent).toBe('');
        expect(div.dataset.restored).toBe('false');
    });

    test('handles null field gracefully', () => {
        localStorage.setItem(STORAGE_KEY, 'backup');
        localStorage.setItem(CURSOR_KEY, '3');

        clearBackup(null);

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(localStorage.getItem(CURSOR_KEY)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// hasBackup
// ---------------------------------------------------------------------------
describe('hasBackup', () => {
    test('returns false when no backup exists', () => {
        expect(hasBackup()).toBe(false);
    });

    test('returns false when backup is empty string', () => {
        localStorage.setItem(STORAGE_KEY, '');
        expect(hasBackup()).toBe(false);
    });

    test('returns false when backup is only whitespace', () => {
        localStorage.setItem(STORAGE_KEY, '   ');
        expect(hasBackup()).toBe(false);
    });

    test('returns true when backup has content', () => {
        localStorage.setItem(STORAGE_KEY, 'hello world');
        expect(hasBackup()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// restoreToField
// ---------------------------------------------------------------------------
describe('restoreToField', () => {
    test('restores text to an empty textarea', () => {
        localStorage.setItem(STORAGE_KEY, 'restored text');
        localStorage.setItem(CURSOR_KEY, '8');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';

        const result = restoreToField(textarea);

        expect(result).toBe(true);
        expect(textarea.value).toBe('restored text');
        expect(textarea.dataset.restored).toBe('true');
    });

    test('does not restore when field already has content', () => {
        localStorage.setItem(STORAGE_KEY, 'backup');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = 'existing content';

        expect(restoreToField(textarea)).toBe(false);
    });

    test('does not restore when field is already restored', () => {
        localStorage.setItem(STORAGE_KEY, 'backup');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';
        textarea.dataset.restored = 'true';

        expect(restoreToField(textarea)).toBe(false);
    });

    test('does not restore when no backup exists', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';

        expect(restoreToField(textarea)).toBe(false);
    });

    test('does not restore when backup is only whitespace', () => {
        localStorage.setItem(STORAGE_KEY, '   ');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';

        expect(restoreToField(textarea)).toBe(false);
    });

    test('restores text to a contenteditable div', () => {
        localStorage.setItem(STORAGE_KEY, 'ce content');
        localStorage.setItem(CURSOR_KEY, '3');

        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);

        const result = restoreToField(div);

        expect(result).toBe(true);
        expect(div.textContent).toBe('ce content');
        expect(div.dataset.restored).toBe('true');
    });

    test('cursor is placed at correct position in contenteditable', () => {
        localStorage.setItem(STORAGE_KEY, 'Hello World');
        localStorage.setItem(CURSOR_KEY, '5');

        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);

        restoreToField(div);

        const sel = window.getSelection();
        expect(sel.rangeCount).toBeGreaterThan(0);
        const range = sel.getRangeAt(0);
        expect(range.startOffset).toBe(5);
    });

    test('cursor collapses to end when savedPos exceeds text length', () => {
        localStorage.setItem(STORAGE_KEY, 'Hi');
        localStorage.setItem(CURSOR_KEY, '100');

        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);

        restoreToField(div);

        expect(div.textContent).toBe('Hi');
        expect(div.dataset.restored).toBe('true');
    });

    test('defaults cursor position to 0 when CURSOR_KEY missing', () => {
        localStorage.setItem(STORAGE_KEY, 'some text');
        // No CURSOR_KEY set

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';

        restoreToField(textarea);

        expect(textarea.value).toBe('some text');
        // selectionStart should be set to 0
        expect(textarea.selectionStart).toBe(0);
    });

    test('dispatches input event on textarea restore', () => {
        localStorage.setItem(STORAGE_KEY, 'event test');
        localStorage.setItem(CURSOR_KEY, '0');

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = '';

        const handler = jest.fn();
        textarea.addEventListener('input', handler);

        restoreToField(textarea);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('dispatches input event on contenteditable restore', () => {
        localStorage.setItem(STORAGE_KEY, 'event test');
        localStorage.setItem(CURSOR_KEY, '0');

        const div = document.createElement('div');
        div.contentEditable = 'true';
        document.body.appendChild(div);

        const handler = jest.fn();
        div.addEventListener('input', handler);

        restoreToField(div);

        expect(handler).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// shouldWarnBeforeUnload
// ---------------------------------------------------------------------------
describe('shouldWarnBeforeUnload', () => {
    test('returns false when field is null', () => {
        expect(shouldWarnBeforeUnload(null)).toBe(false);
    });

    test('returns false when textarea is empty', () => {
        const textarea = document.createElement('textarea');
        textarea.value = '';
        expect(shouldWarnBeforeUnload(textarea)).toBe(false);
    });

    test('returns false when textarea has only whitespace', () => {
        const textarea = document.createElement('textarea');
        textarea.value = '   \n  ';
        expect(shouldWarnBeforeUnload(textarea)).toBe(false);
    });

    test('returns true when textarea has content', () => {
        const textarea = document.createElement('textarea');
        textarea.value = 'unsaved work';
        expect(shouldWarnBeforeUnload(textarea)).toBe(true);
    });

    test('returns true when contenteditable div has content', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.innerText = 'unsaved work';
        expect(shouldWarnBeforeUnload(div)).toBe(true);
    });

    test('returns false when contenteditable div is empty', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.innerText = '';
        expect(shouldWarnBeforeUnload(div)).toBe(false);
    });
});
