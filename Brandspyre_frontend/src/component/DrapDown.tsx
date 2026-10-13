// import { useState, useEffect, useRef } from "react";

// interface DropdownOption {
//   value: string | number;
//   label: string;
//   icon?: React.ReactNode;
// }

// interface DropdownProps {
//   options: DropdownOption[];
//   selectedValue?: string | number;
//   onSelect: (value: string | number) => void;
//   placeholder?: string;
//   className?: string;
//   disabled?: boolean;
//   label?: string;
//   name?: string; 
//   required?: boolean; 
// }

// const Dropdown = ({
//   options,
//   selectedValue,
//   onSelect,
//   placeholder = "Select an option",
//   className = "",
//   disabled = false,
//   label,
//   name,
//   required = false,
// }: DropdownProps) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const selectedOption = options.find((opt) => opt.value === selectedValue);

//   const toggleDropdown = () => {
//     if (!disabled) {
//       setIsOpen(!isOpen);
//     }
//   };

//   const handleOptionClick = (value: string | number) => {
//     onSelect(value);
//     setIsOpen(false);
//   };

//   return (
//     <div className={`relative ${className}`} ref={dropdownRef}>
//       {label && (
//         <label
//           htmlFor={name}
//           className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
//         >
//           {label}
//           {required && <span className="text-red-500">*</span>}
//         </label>
//       )}
//       <button
//         type="button"
//         id={name}
//         name={name}
//         onClick={toggleDropdown}
//         disabled={disabled}
//         className={`w-full flex justify-between items-center px-4 py-2 text-sm font-medium rounded-sm border shadow-sm
//           ${
//             disabled
//               ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500"
//               : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300"
//           }
//           border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
//       >
//         <span className="flex items-center truncate">
//           {selectedOption?.icon && (
//             <span className="mr-2">{selectedOption.icon}</span>
//           )}
//           {selectedOption?.label || placeholder}
//         </span>
//         <svg
//           className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
//             isOpen ? "transform rotate-180" : ""
//           }`}
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 20 20"
//           fill="currentColor"
//           aria-hidden="true"
//         >
//           <path
//             fillRule="evenodd"
//             d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//             clipRule="evenodd"
//           />
//         </svg>
//       </button>

//       {isOpen && (
//         <div
//           className={`absolute z-[15] mt-1 w-full rounded-md shadow-lg overflow-hidden
//           bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
//         >
//           <ul
//             className="max-h-60 overflow-auto py-1 text-base focus:outline-none"
//             role="listbox"
//           >
//             {options.map((option) => (
//               <li
//                 key={option.value}
//                 onClick={() => handleOptionClick(option.value)}
//                 className={`flex items-center px-4 py-2 text-sm cursor-pointer select-none
//                   ${
//                     option.value === selectedValue
//                       ? "bg-indigo-100 dark:bg-gray-700/15 text-red-700 dark:text-red-500"
//                       : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-700"
//                   }`}
//               >
//                 {option.icon && <span className="mr-2">{option.icon}</span>}
//                 {option.label}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dropdown;



import { useState, useEffect, useRef } from "react";

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  required?: boolean;
}

const Dropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  label,
  name,
  required = false,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label && option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  };

  const handleOptionClick = (value: string | number) => {
    onSelect(value);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleOptionClick(filteredOptions[highlightedIndex].value);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      const element = document.getElementById(`dropdown-option-${highlightedIndex}`);
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, filteredOptions]);

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        id={name}
        name={name}
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full flex justify-between items-center px-4 py-2 text-sm font-medium rounded-sm border shadow-sm
          ${
            disabled
              ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500"
              : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300"
          }
          border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
      >
        <span className="flex items-center truncate">
          {selectedOption?.icon && <span className="mr-2">{selectedOption.icon}</span>}
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-[15] mt-1 w-full rounded-md shadow-lg overflow-hidden
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
        >
          {/* Search input */}
          <div className="px-2 py-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              className="w-full px-3 py-2 text-sm border rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
          </div>

          <ul
            className="max-h-60 overflow-auto py-1 text-base focus:outline-none"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`dropdown-option-${index}`}
                  onClick={() => handleOptionClick(option.value)}
                  className={`flex items-center px-4 py-2 text-sm cursor-pointer select-none
                    ${
                      option.value === selectedValue
                        ? "bg-indigo-100 dark:bg-gray-700/15 text-red-700 dark:text-red-500"
                        : highlightedIndex === index
                        ? "bg-gray-100 dark:bg-red-700/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-700"
                    }`}
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
