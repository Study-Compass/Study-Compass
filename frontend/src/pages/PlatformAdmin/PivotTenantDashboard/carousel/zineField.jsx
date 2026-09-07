/**
 * Editable slots on the rendered slide.
 *
 * A frame declares which slot a piece of text belongs to and keeps rendering
 * its resolved value; when the editor is on, the same element becomes typable
 * in place. Editing happens inside the real geometry rather than in a side
 * panel, so what you type is laid out exactly where it will print.
 *
 *   <ZineField path="values.slug">{values.slug}</ZineField>
 *
 * `children` is the resolved display value — which may be a voice default the
 * deck does not own. `path` is where a write lands. Editing shows the raw value
 * so you always edit what this deck actually stores, with the default behind it
 * as placeholder.
 */

import React, { createContext, useCallback, useContext, useRef } from 'react';

const ZineEditContext = createContext(null);

export function ZineEditProvider({ value, children }) {
  return <ZineEditContext.Provider value={value}>{children}</ZineEditContext.Provider>;
}

export function useZineEdit() {
  return useContext(ZineEditContext);
}

/** Read a dotted path out of a raw slide. */
export function readPath(source, path) {
  return String(path).split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), source);
}

/** Write a dotted path, returning a new object and sharing untouched branches. */
export function writePath(source, path, value) {
  const [head, ...rest] = String(path).split('.');
  const base = Array.isArray(source) ? [...source] : { ...(source || {}) };
  base[head] = rest.length ? writePath(base[head], rest.join('.'), value) : value;
  return base;
}

/**
 * Commit on blur, never on keystroke.
 *
 * A contentEditable node that re-renders while it has focus loses the caret, so
 * nothing above it may change until the field is done. That is the whole reason
 * this reads its live text from the DOM rather than from state.
 */
export function ZineField({
  path,
  as: Tag = 'span',
  className = '',
  placeholder = '',
  max,
  children,
}) {
  const ctx = useZineEdit();
  const ref = useRef(null);

  const commit = useCallback(
    (event) => {
      const next = event.currentTarget.textContent.replace(/\s+/g, ' ').trim();
      ctx.onChange(path, max ? next.slice(0, max) : next);
    },
    [ctx, path, max],
  );

  const guard = useCallback(
    (event) => {
      // Enter would insert a <div>; a slot is one run of text, never markup.
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
        return;
      }
      if (event.key === 'Escape') {
        event.currentTarget.textContent = readPath(ctx.slide, path) || '';
        event.currentTarget.blur();
        return;
      }
      // The frames are fixed boxes with no scroll, so the manifest's cap has to
      // hold at the keystroke rather than at save.
      if (
        max
        && event.currentTarget.textContent.length >= max
        && event.key.length === 1
        && !event.metaKey
        && !event.ctrlKey
        && window.getSelection()?.isCollapsed
      ) {
        event.preventDefault();
      }
    },
    [ctx, path, max],
  );

  if (!ctx?.editing) {
    return <Tag className={className}>{children}</Tag>;
  }

  const raw = readPath(ctx.slide, path);
  const owned = typeof raw === 'string' && raw.trim();

  return (
    <Tag
      ref={ref}
      className={`${className} jgz-editable${owned ? '' : ' jgz-editable--empty'}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      tabIndex={0}
      aria-label={path}
      data-placeholder={placeholder || path.split('.').pop()}
      onBlur={commit}
      onKeyDown={guard}
    >
      {owned ? raw : ''}
    </Tag>
  );
}

/**
 * A repeatable slot — the run of show is the only one so far. Rows are added
 * and removed by the editor chrome; the text inside each is an ordinary field.
 */
export function ZineRows({ path, rows, max, render }) {
  const ctx = useZineEdit();
  const list = Array.isArray(rows) ? rows : [];

  if (!ctx?.editing) return list.map(render);

  const addRow = () => {
    const current = readPath(ctx.slide, path) || [];
    if (current.length >= max) return;
    ctx.onChange(path, [...current, { t: '', what: '' }]);
  };

  const dropRow = (index) => {
    const current = readPath(ctx.slide, path) || [];
    ctx.onChange(path, current.filter((_, i) => i !== index));
  };

  return (
    <>
      {list.map((row, index) => (
        <React.Fragment key={`${path}-${index}`}>
          {render(row, index, (
            <button
              type="button"
              className="jgz-rowdrop"
              onClick={() => dropRow(index)}
              aria-label={`Remove row ${index + 1}`}
            >
              ×
            </button>
          ))}
        </React.Fragment>
      ))}
      {list.length < max ? (
        <li className="jgz-rowadd">
          <button type="button" onClick={addRow}>+ add row</button>
        </li>
      ) : null}
    </>
  );
}
