import { useState, useRef, useEffect } from 'react';
import './FilterDropdown.css';

type FilterOption = {
  value: string;
  label: string;
  icon?: string;
};

type FilterDropdownProps = {
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function updateMenuPosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.bottom + 8}px`,
          width: `${rect.width}px`,
          maxWidth: `${rect.width}px`,
          zIndex: 99999,
        });
      } else {
        setMenuStyle({});
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateMenuPosition);
      updateMenuPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      {label && <label className="filter-dropdown-label">{label}</label>}
      <button
        ref={buttonRef}
        className="filter-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="filter-dropdown-button-content">
          {selectedOption.icon && <span className="filter-dropdown-icon">{selectedOption.icon}</span>}
          <span>{selectedOption.label}</span>
        </span>
        <span className={`filter-dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="filter-dropdown-menu" role="listbox" style={menuStyle}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`filter-dropdown-item ${value === option.value ? 'active' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={value === option.value}
            >
              {option.icon && <span className="filter-dropdown-item-icon">{option.icon}</span>}
              <span>{option.label}</span>
              {value === option.value && <span className="filter-dropdown-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

