import React, { useState, useEffect, useCallback } from 'react';

export interface PercentageInputProps {
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
  value,
  onChange,
  min = 1,
  max = 200,
  placeholder = "75",
  className = "",
  disabled = false,
  onClick
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [sliderValue, setSliderValue] = useState<number>(min);

  // Sincronizza lo stato interno con il valore esterno
  useEffect(() => {
    if (typeof value === 'number') {
      setInputValue(value.toString());
      setSliderValue(value);
    } else {
      setInputValue('');
      setSliderValue(min);
    }
  }, [value, min]);

  // Handler per il cambio del slider
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setSliderValue(newValue);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [onChange]);

  // Handler per il cambio dell'input di testo
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const parsedValue = parseInt(newValue);
    if (!isNaN(parsedValue) && parsedValue >= min && parsedValue <= max) {
      setSliderValue(parsedValue);
      onChange(parsedValue);
    } else if (newValue === '') {
      onChange(undefined);
    }
  }, [onChange, min, max]);

  // Handler per il blur dell'input (validazione finale)
  const handleInputBlur = useCallback(() => {
    if (inputValue === '') {
      onChange(undefined);
      setSliderValue(min);
      return;
    }

    const parsedValue = parseInt(inputValue);
    if (isNaN(parsedValue) || parsedValue < min || parsedValue > max) {
      // Ripristina il valore valido più vicino
      const clampedValue = Math.max(min, Math.min(max, isNaN(parsedValue) ? min : parsedValue));
      setInputValue(clampedValue.toString());
      setSliderValue(clampedValue);
      onChange(clampedValue);
    }
  }, [inputValue, onChange, min, max]);

  return (
    <div className={`flex items-center gap-2 ${className}`} onClick={onClick}>
      {/* Slider */}
      <div className="flex-1 relative">
        <input
          type="range"
          min={min}
          max={max}
          value={sliderValue}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((sliderValue - min) / (max - min)) * 100}%, #374151 ${((sliderValue - min) / (max - min)) * 100}%, #374151 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Input numerico */}
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-16 bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 
                     focus:border-blue-600 focus:outline-none text-center"
        />
        <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
          %
        </span>
      </div>
    </div>
  );
};
