'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * VirtualKeyboardWidget
 *
 * Drop this once near the root of the authenticated layout, alongside
 * <CommandPalette />. Renders:
 *   1. A floating accessibility button (bottom-left) that toggles the keyboard.
 *   2. A draggable on-screen QWERTY keyboard that types into whichever
 *      text input / textarea / contentEditable element was last focused.
 *
 * Fully mouse (or touch) operable — no physical keyboard required to use it.
 */

const ROWS_LOWER = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

const ROWS_UPPER = [
  ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'],
];

// Native setters so React's controlled-input tracking picks up the change.
function getNativeSetter(el) {
  const proto =
    el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  return Object.getOwnPropertyDescriptor(proto, 'value').set;
}

function isEditable(el) {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(type);
  }
  return el.isContentEditable;
}

export default function VirtualKeyboardWidget() {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(false);
  const [caps, setCaps] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const targetRef = useRef(null); // last-focused editable element
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const panelRef = useRef(null);

  // Track the last-focused editable element anywhere on the page.
  useEffect(() => {
    function onFocusIn(e) {
      if (isEditable(e.target)) targetRef.current = e.target;
    }
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  // Default position: bottom-right-ish, once we know window size.
  useEffect(() => {
    if (open && position.x === null) {
      setPosition({
        x: Math.max(20, window.innerWidth / 2 - 320),
        y: Math.max(20, window.innerHeight - 340),
      });
    }
  }, [open, position.x]);

  const insertText = useCallback((text) => {
    const el = targetRef.current;
    if (!el || !document.contains(el)) return;

    el.focus();
    const start = el.selectionStart ?? el.value?.length ?? 0;
    const end = el.selectionEnd ?? el.value?.length ?? 0;
    const current = el.value ?? '';
    const nextValue = current.slice(0, start) + text + current.slice(end);

    const setter = getNativeSetter(el);
    setter.call(el, nextValue);

    const nextCursor = start + text.length;
    el.setSelectionRange(nextCursor, nextCursor);

    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  const backspace = useCallback(() => {
    const el = targetRef.current;
    if (!el || !document.contains(el)) return;

    el.focus();
    const start = el.selectionStart ?? el.value?.length ?? 0;
    const end = el.selectionEnd ?? el.value?.length ?? 0;
    const current = el.value ?? '';

    let nextValue;
    let nextCursor;
    if (start !== end) {
      nextValue = current.slice(0, start) + current.slice(end);
      nextCursor = start;
    } else if (start > 0) {
      nextValue = current.slice(0, start - 1) + current.slice(start);
      nextCursor = start - 1;
    } else {
      return;
    }

    const setter = getNativeSetter(el);
    setter.call(el, nextValue);
    el.setSelectionRange(nextCursor, nextCursor);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  const pressEnter = useCallback(() => {
    const el = targetRef.current;
    if (!el || !document.contains(el)) return;
    if (el.tagName === 'TEXTAREA') {
      insertText('\n');
    } else {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      // Also try submitting the parent form for plain <input> fields.
      el.form?.requestSubmit?.();
    }
  }, [insertText]);

  const handleKeyClick = useCallback(
    (char) => {
      let out = char;
      if (/[a-z]/i.test(char)) {
        const upper = shift !== caps;
        out = upper ? char.toUpperCase() : char.toLowerCase();
      } else if (shift) {
        out = char; // already the shifted symbol via ROWS_UPPER
      }
      insertText(out);
      if (shift) setShift(false); // one-shot shift, like a phone keyboard
    },
    [shift, caps, insertText]
  );

  // Dragging
  const onDragStart = (e) => {
    dragRef.current.dragging = true;
    const point = e.touches ? e.touches[0] : e;
    dragRef.current.offsetX = point.clientX - position.x;
    dragRef.current.offsetY = point.clientY - position.y;
  };

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current.dragging) return;
      const point = e.touches ? e.touches[0] : e;
      const panel = panelRef.current;
      const width = panel?.offsetWidth ?? 640;
      const height = panel?.offsetHeight ?? 280;
      const x = Math.min(
        Math.max(0, point.clientX - dragRef.current.offsetX),
        window.innerWidth - width
      );
      const y = Math.min(
        Math.max(0, point.clientY - dragRef.current.offsetY),
        window.innerHeight - height
      );
      setPosition({ x, y });
    }
    function onUp() {
      dragRef.current.dragging = false;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const rows = shift !== caps ? ROWS_UPPER : ROWS_LOWER;

  return (
    <>
      {/* Accessibility toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        aria-label={open ? 'Hide on-screen keyboard' : 'Show on-screen keyboard'}
        title="On-screen keyboard"
        className="fixed bottom-5 left-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 shadow-lg border border-neutral-700 hover:bg-neutral-700 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M6 14h8M16 14h2" strokeLinecap="round" />
        </svg>
      </button>

      {open && position.x !== null && (
        <div
          ref={panelRef}
          role="group"
          aria-label="Virtual keyboard"
          className="fixed z-[60] select-none rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl"
          style={{ left: position.x, top: position.y, width: 640 }}
        >
          {/* Drag handle / header */}
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            className="flex cursor-grab items-center justify-between rounded-t-xl bg-neutral-800 px-3 py-2 active:cursor-grabbing"
          >
            <span className="text-xs font-semibold text-neutral-300">
              On-screen Keyboard {targetRef.current ? '' : '— click a text field first'}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close on-screen keyboard"
              className="text-neutral-400 hover:text-neutral-100 px-1"
            >
              ✕
            </button>
          </div>

          <div className="p-2 flex flex-col gap-1">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-1 justify-center">
                {i === 1 && (
                  <button
                    type="button"
                    onClick={() => insertText('\t')}
                    className="kbd-key w-14 shrink-0"
                  >
                    Tab
                  </button>
                )}
                {i === 2 && (
                  <button
                    type="button"
                    onClick={() => setCaps((v) => !v)}
                    aria-pressed={caps}
                    className={`kbd-key w-16 shrink-0 ${caps ? 'bg-neutral-600' : ''}`}
                  >
                    Caps
                  </button>
                )}
                {i === 3 && (
                  <button
                    type="button"
                    onClick={() => setShift((v) => !v)}
                    aria-pressed={shift}
                    className={`kbd-key w-16 shrink-0 ${shift ? 'bg-neutral-600' : ''}`}
                  >
                    Shift
                  </button>
                )}

                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleKeyClick(char)}
                    className="kbd-key w-9 shrink-0"
                  >
                    {char}
                  </button>
                ))}

                {i === 0 && (
                  <button
                    type="button"
                    onClick={backspace}
                    className="kbd-key w-16 shrink-0"
                  >
                    ⌫
                  </button>
                )}
                {i === 2 && (
                  <button
                    type="button"
                    onClick={pressEnter}
                    className="kbd-key w-16 shrink-0"
                  >
                    Enter
                  </button>
                )}
                {i === 3 && (
                  <button
                    type="button"
                    onClick={() => setShift((v) => !v)}
                    aria-pressed={shift}
                    className={`kbd-key w-16 shrink-0 ${shift ? 'bg-neutral-600' : ''}`}
                  >
                    Shift
                  </button>
                )}
              </div>
            ))}

            <div className="flex gap-1 justify-center">
              <button type="button" onClick={() => insertText(' ')} className="kbd-key w-64">
                Space
              </button>
            </div>
          </div>

          <style jsx>{`
            .kbd-key {
              height: 36px;
              border-radius: 6px;
              background: #262626;
              color: #e5e5e5;
              font-size: 13px;
              border: 1px solid #3f3f3f;
            }
            .kbd-key:hover {
              background: #333333;
            }
            .kbd-key:active {
              background: #404040;
            }
          `}</style>
        </div>
      )}
    </>
  );
}