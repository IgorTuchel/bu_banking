import { useEffect, useRef, useState } from "react";
import "./account-dropdown.css";

export default function AccountDropdown({
  label,
  value,
  onChange,
  options,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleToggle() {
    setIsOpen((current) => !current);
  }

  function handleSelect(nextValue) {
    onChange(nextValue);
    setIsOpen(false);
  }

  function handleButtonKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  return (
    <div
      className={`account-dropdown-section ${className}`.trim()}
      ref={containerRef}
    >
      {label && <label className="account-dropdown-label">{label}</label>}

      <div className="account-dropdown-wrapper">
        <button
          type="button"
          className={`account-dropdown-trigger ${
            isOpen ? "account-dropdown-trigger-open" : ""
          }`}
          onClick={handleToggle}
          onKeyDown={handleButtonKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="account-dropdown-trigger-text">
            {selectedOption?.label ?? "Select account"}
          </span>

          <span
            className={`account-dropdown-icon ${
              isOpen ? "account-dropdown-icon-open" : ""
            }`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {isOpen && (
          <div className="account-dropdown-popover" role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`account-dropdown-option ${
                    isSelected ? "account-dropdown-option-selected" : ""
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="account-dropdown-option-text">
                    {option.label}
                  </span>

                  {isSelected && (
                    <span
                      className="account-dropdown-option-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}