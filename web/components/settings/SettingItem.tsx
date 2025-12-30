'use client';

import { cn } from '@/lib/utils';

interface BaseSettingProps {
  label: string;
  description?: string;
}

interface ToggleSettingProps extends BaseSettingProps {
  type: 'toggle';
  value: boolean;
  onChange: (value: boolean) => void;
}

interface SliderSettingProps extends BaseSettingProps {
  type: 'slider';
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

interface SelectSettingProps<T extends string | number> extends BaseSettingProps {
  type: 'select';
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T; disabled?: boolean }[];
}

type SettingItemProps =
  | ToggleSettingProps
  | SliderSettingProps
  | SelectSettingProps<string | number>;

export function SettingItem(props: SettingItemProps) {
  const { label, description, type } = props;

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-medium text-white">{label}</h4>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex-shrink-0">
        {type === 'toggle' && <ToggleControl {...props} />}
        {type === 'slider' && <SliderControl {...props} />}
        {type === 'select' && <SelectControl {...props} />}
      </div>
    </div>
  );
}

function ToggleControl({ value, onChange }: ToggleSettingProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors duration-200',
        value ? 'bg-purple-500' : 'bg-gray-600'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200',
          value && 'translate-x-5'
        )}
      />
    </button>
  );
}

function SliderControl({ value, onChange, min, max, step = 1, unit }: SliderSettingProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-24 h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-purple-500
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110"
      />
      <span className="text-xs text-gray-400 w-12 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  );
}

function SelectControl<T extends string | number>({
  value,
  onChange,
  options,
}: SelectSettingProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const newValue = typeof value === 'number'
          ? Number(e.target.value)
          : e.target.value;
        onChange(newValue as T);
      }}
      className="bg-[#1a1a24] border border-white/10 rounded px-2 py-1 text-sm text-white
        focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer
        [&>option]:bg-[#1a1a24] [&>option]:text-white"
    >
      {options.map((opt) => (
        <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Section header component
export function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="bg-[#12121a] rounded-lg p-4 border border-white/5">
        {children}
      </div>
    </div>
  );
}
