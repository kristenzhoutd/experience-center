import { useState, useRef, type KeyboardEvent } from 'react';

interface ChipInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function ChipInput({ value, onChange, placeholder = 'Add item...' }: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-white min-h-[38px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
        >
          {chip}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeChip(i); }}
            className="w-3.5 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputValue.trim()) addChip(inputValue); }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] text-xs text-gray-700 placeholder-gray-400 outline-none bg-transparent"
      />
    </div>
  );
}
