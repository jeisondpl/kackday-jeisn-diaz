import type { ChangeEvent } from 'react';

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateInput({ label, value, onChange, className = '' }: DateInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <input
        type="date"
        value={value}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
      />
    </div>
  );
}
