import clsx from 'clsx';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type BaseProps = {
  label: string;
  error?: string;
  icon?: ReactNode;
};

export function InputField({ label, error, icon, className, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">{icon}{label}</span>
      <input
        className={clsx(
          'w-full rounded-lg border bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100',
          error ? 'border-rose-300' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}

export function SelectField({ label, error, children, ...props }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className={clsx(
          'w-full rounded-lg border bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100',
          error ? 'border-rose-300' : 'border-slate-200'
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}

type SearchableOption = {
  id: number | string;
  name: string;
};

type SearchableSelectFieldProps = BaseProps & {
  value: string;
  options: SearchableOption[];
  placeholder: string;
  disabled?: boolean;
  noResultsText?: string;
  onChange: (value: string) => void;
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function SearchableSelectField({
  label,
  error,
  value,
  options,
  placeholder,
  disabled,
  noResultsText = 'Sin resultados',
  onChange
}: SearchableSelectFieldProps) {
  const containerRef = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [open, value]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const search = normalize(query);
    if (!search) return options;
    return options.filter((option) => normalize(option.name).includes(search));
  }, [options, query]);

  const selectOption = (option: SearchableOption) => {
    onChange(option.name);
    setQuery(option.name);
    setOpen(false);
  };

  const syncExactMatch = (nextQuery: string) => {
    const exactOption = options.find((option) => normalize(option.name) === normalize(nextQuery));
    if (exactOption) {
      onChange(exactOption.name);
      return;
    }

    if (!nextQuery.trim()) onChange('');
  };

  return (
    <label ref={containerRef} className="relative block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className={clsx(
            'w-full rounded-lg border bg-white py-3 pl-11 pr-11 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            error ? 'border-rose-300' : 'border-slate-200'
          )}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            syncExactMatch(nextQuery);
          }}
          onBlur={() => {
            const exactOption = options.find((option) => normalize(option.name) === normalize(query));
            if (exactOption) {
              setQuery(exactOption.name);
              onChange(exactOption.name);
              return;
            }

            setQuery(value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setQuery(value);
              inputRef.current?.blur();
            }
            if (event.key === 'Enter' && filteredOptions[0]) {
              event.preventDefault();
              selectOption(filteredOptions[0]);
            }
          }}
        />
        <ChevronDown
          className={clsx(
            'pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition',
            open && 'rotate-180 text-teal-500'
          )}
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = option.name === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={clsx(
                      'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium transition',
                      selected ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                  >
                    <span>{option.name}</span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm font-medium text-slate-500">{noResultsText}</p>
            )}
          </div>
        </div>
      )}
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}

export function TextAreaField({ label, error, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        rows={4}
        className={clsx(
          'w-full resize-none rounded-lg border bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100',
          error ? 'border-rose-300' : 'border-slate-200'
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}
