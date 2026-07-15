import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COUNTRIES } from '@/lib/countries';

export default function CountryInput({ value, onChange, required, className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const query = (value || '').trim().toLowerCase();
  const matches = query
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query))
    : COUNTRIES;

  const selectedCountry = COUNTRIES.find((c) => c.name.toLowerCase() === query);

  const Flag = ({ code, className: flagClassName }) => (
    <img
      src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/48x36/${code.toLowerCase()}.png 2x`}
      alt=""
      width={20}
      height={15}
      className={cn('inline-block rounded-sm object-cover shrink-0', flagClassName)}
    />
  );

  return (
    <div className="relative" ref={containerRef}>
      {selectedCountry && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Flag code={selectedCountry.code} />
        </span>
      )}
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        required={required}
        className={cn(selectedCountry && 'pl-9', className)}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
          {matches.map((country) => (
            <button
              type="button"
              key={country.code}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(country.name); setOpen(false); }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Flag code={country.code} />
              <span>{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
