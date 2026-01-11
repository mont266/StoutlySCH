import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, id }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer select-none">
      <span className="mr-3 text-sm font-medium text-gray-300">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-gradient-to-r from-purple-500 to-blue-600' : 'bg-gray-600'}`}></div>
        <div
          className={`
            dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform
            ${checked ? 'transform translate-x-6' : ''}
          `}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;