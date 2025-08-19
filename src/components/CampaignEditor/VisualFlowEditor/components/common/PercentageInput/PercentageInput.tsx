import React from 'react';

interface PercentageInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  value = 0,
  onChange,
  min = 1,
  max = 200,
  placeholder = "75",
  className = "",
  disabled = false,
  onClick
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue || undefined);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (isNaN(newValue)) {
      onChange(undefined);
    } else {
      // Clamp the value between min and max
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
    }
  };

  const currentValue = typeof value === 'number' ? value : min;

  return (
    <div className={`flex items-center gap-2 ${className}`} onClick={onClick}>
      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        value={currentValue}
        onChange={handleSliderChange}
        disabled={disabled}
        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentValue - min) / (max - min)) * 100}%, #475569 ${((currentValue - min) / (max - min)) * 100}%, #475569 100%)`
        }}
      />
      
      {/* Text Input */}
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={typeof value === 'number' ? value : ''}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-16 bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none text-center"
        />
        <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
          %
        </span>
      </div>
    </div>
  );
};
