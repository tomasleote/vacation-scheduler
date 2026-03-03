import React from 'react';

const baseClass =
  'w-full px-3 bg-dark-800 border border-dark-700 rounded-lg text-gray-50 ' +
  'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
  'focus:border-brand-500 transition-colors';

const sizeMap = {
  default: 'py-2.5',
  compact: 'py-2',
};

/**
 * Shared Input component — replaces 15+ duplicated input class strings.
 *
 * @param {'default'|'compact'} [size]     — Vertical padding variant (default: 'default')
 * @param {string}              [className] — Additional classes appended after base styles
 * @param {object}              rest        — All standard <input> props forwarded
 */
const Input = React.forwardRef(function Input({ size = 'default', className = '', ...props }, ref) {
  const sizeClass = sizeMap[size] || sizeMap.default;
  return (
    <input
      ref={ref}
      className={`${baseClass} ${sizeClass}${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
});

/**
 * Shared Textarea — same styling as Input but renders <textarea>.
 */
const Textarea = React.forwardRef(function Textarea({ size = 'default', className = '', ...props }, ref) {
  const sizeClass = sizeMap[size] || sizeMap.default;
  return (
    <textarea
      ref={ref}
      className={`${baseClass} ${sizeClass}${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
});

/**
 * Shared Label — replaces duplicated label class strings.
 *
 * @param {'default'|'compact'|'small'} [size]     — 'default', 'compact', or 'small'
 * @param {string}            [className] — Additional classes
 */
const labelSizeMap = {
  default: 'block text-sm font-medium text-gray-300 mb-1.5',
  compact: 'block text-sm font-medium text-gray-300 mb-1',
  small: 'block text-xs font-medium text-gray-400 mb-1',
};

function Label({ size = 'default', className = '', children, ...props }) {
  const sizeClass = labelSizeMap[size] || labelSizeMap.default;
  return (
    <label className={`${sizeClass}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </label>
  );
}

/**
 * ReadOnlyInput — styled readonly input for displaying copy-able links/values.
 */
const ReadOnlyInput = React.forwardRef(function ReadOnlyInput({ className = '', readOnly, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`flex-1 px-3 py-2 border border-dark-700 rounded-lg text-sm bg-dark-800 text-gray-300${className ? ` ${className}` : ''}`}
      {...props}
      readOnly={true}
    />
  );
});

export { Input, Textarea, Label, ReadOnlyInput };
export default Input;
