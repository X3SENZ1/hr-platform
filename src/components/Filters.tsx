import { useEffect, useId, useRef, useState } from 'react';
import { useOutsideClick } from '../lib/hooks';
import { IconChevronRight, IconSearch } from './icons';

export interface SelectOption {
  value: string;
  label: string;
}

export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-field search-field">
      <label className="filter-label" htmlFor={id}>
        {label}
      </label>
      <span className="search-input-wrap">
        <IconSearch size={15} />
        <input
          id={id}
          type="search"
          className="input search-input"
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </div>
  );
}

export function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = `${id}-listbox`;
  const labelId = `${id}-label`;

  useOutsideClick(open, containerRef, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    setActiveIndex(index);
    const timer = window.setTimeout(() => listRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open, options, value]);

  const selected = options.find((option) => option.value === value) ?? options[0];

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + direction + options.length) % options.length);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option.value);
    }
  };

  return (
    <div className="filter-field custom-select" ref={containerRef}>
      <span className="filter-label" id={labelId}>
        {label}
      </span>
      <button
        ref={buttonRef}
        id={id}
        className={`select-button${open ? ' open' : ''}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}`}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((next) => !next)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected?.label ?? 'Выберите значение'}</span>
        <IconChevronRight size={14} className="select-chevron" />
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          className="select-listbox"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${id}-option-${activeIndex}`}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => (
            <li
              id={`${id}-option-${index}`}
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`select-option${index === activeIndex ? ' active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden="true">✓</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CheckboxGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  const groupId = useId();
  return (
    <fieldset className="filter-field filter-fieldset">
      <legend className="filter-label">{legend}</legend>
      <div className="check-row">
        {options.map((option) => (
          <label className="check-control" key={option.value}>
            <input
              type="checkbox"
              name={groupId}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span className="check-box" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6.2 4.6 8.8 10 3.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RadioGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const groupId = useId();
  return (
    <fieldset className="filter-field filter-fieldset">
      <legend className="filter-label">{legend}</legend>
      <div className="radio-row">
        {options.map((option) => (
          <label className="radio-control" key={option.value}>
            <input
              type="radio"
              name={groupId}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="radio-dot" aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
