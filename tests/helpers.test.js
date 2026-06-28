/**
 * @jest-environment jsdom
 */

const {
    isTextarea,
    getFieldText,
    clampCursorPos,
    getCursorPosition,
    setNativeValue,
    getInputField
} = require('../ai-anti-frust.user.js');

describe('isTextarea', () => {
    it('returns true for a <textarea> element', () => {
        const el = document.createElement('textarea');
        expect(isTextarea(el)).toBe(true);
    });

    it('returns false for a <div> element', () => {
        const el = document.createElement('div');
        expect(isTextarea(el)).toBe(false);
    });

    it('returns false for an <input> element', () => {
        const el = document.createElement('input');
        expect(isTextarea(el)).toBe(false);
    });
});

describe('getFieldText', () => {
    it('returns .value for a textarea', () => {
        const el = document.createElement('textarea');
        el.value = 'hello world';
        expect(getFieldText(el)).toBe('hello world');
    });

    it('returns .innerText for a contenteditable div', () => {
        const el = document.createElement('div');
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'some text';
        expect(getFieldText(el)).toBe('some text');
    });
});

describe('clampCursorPos', () => {
    it('returns 0 for negative position', () => {
        expect(clampCursorPos(-5, 'hello')).toBe(0);
    });

    it('returns 0 for NaN', () => {
        expect(clampCursorPos(NaN, 'hello')).toBe(0);
    });

    it('returns 0 for undefined', () => {
        expect(clampCursorPos(undefined, 'hello')).toBe(0);
    });

    it('returns 0 for a string input', () => {
        expect(clampCursorPos('abc', 'hello')).toBe(0);
    });

    it('returns the position when in range', () => {
        expect(clampCursorPos(3, 'hello')).toBe(3);
    });

    it('clamps to text length on overflow', () => {
        expect(clampCursorPos(100, 'hello')).toBe(5);
    });

    it('returns 0 for position 0', () => {
        expect(clampCursorPos(0, 'hello')).toBe(0);
    });

    it('returns text.length when position equals text.length', () => {
        expect(clampCursorPos(5, 'hello')).toBe(5);
    });
});

describe('getCursorPosition', () => {
    it('returns 0 for null element', () => {
        expect(getCursorPosition(null)).toBe(0);
    });

    it('returns selectionStart for a textarea', () => {
        const el = document.createElement('textarea');
        el.value = 'hello world';
        document.body.appendChild(el);
        el.setSelectionRange(5, 5);
        expect(getCursorPosition(el)).toBe(5);
        document.body.removeChild(el);
    });

    it('returns 0 for a textarea with no selection', () => {
        const el = document.createElement('textarea');
        el.value = '';
        expect(getCursorPosition(el)).toBe(0);
    });
});

describe('setNativeValue', () => {
    it('sets the value on a textarea', () => {
        const el = document.createElement('textarea');
        setNativeValue(el, 'new value');
        expect(el.value).toBe('new value');
    });

    it('does not throw for null element', () => {
        expect(() => setNativeValue(null, 'test')).not.toThrow();
    });
});

describe('getInputField', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('returns null when no matching elements exist', () => {
        expect(getInputField()).toBeNull();
    });

    it('returns a contenteditable div on gemini hostname', () => {
        Object.defineProperty(window, 'location', {
            value: { hostname: 'gemini.google.com' },
            writable: true
        });
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        document.body.appendChild(div);
        expect(getInputField()).toBe(div);
    });

    it('returns #prompt-textarea on chatgpt hostname', () => {
        Object.defineProperty(window, 'location', {
            value: { hostname: 'chatgpt.com' },
            writable: true
        });
        const el = document.createElement('textarea');
        el.id = 'prompt-textarea';
        document.body.appendChild(el);
        expect(getInputField()).toBe(el);
    });

    it('returns contenteditable div on claude hostname', () => {
        Object.defineProperty(window, 'location', {
            value: { hostname: 'claude.ai' },
            writable: true
        });
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        document.body.appendChild(div);
        expect(getInputField()).toBe(div);
    });

    it('returns textarea on grok hostname', () => {
        Object.defineProperty(window, 'location', {
            value: { hostname: 'grok.com' },
            writable: true
        });
        const el = document.createElement('textarea');
        document.body.appendChild(el);
        expect(getInputField()).toBe(el);
    });
});
