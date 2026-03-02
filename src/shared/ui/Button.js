import React from 'react';

const variantMap = {
  primary: 'bg-blue-500 hover:bg-blue-400 text-white',
  secondary: 'bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-700',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  ghost: 'text-gray-400 hover:text-gray-200',
};

const sizeMap = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-2.5 px-4',
  lg: 'py-3 px-6',
  xl: 'py-3 px-4',
};

const roundingMap = {
  sm: 'rounded-lg',
  md: 'rounded-lg',
  lg: 'rounded-xl',
};

const weightMap = {
  semibold: 'font-semibold',
  bold: 'font-bold',
};

/**
 * Shared Button component — replaces inconsistent button styling.
 *
 * @param {'primary'|'secondary'|'danger'|'success'|'ghost'} [variant] — Style variant (default: 'primary')
 * @param {'sm'|'md'|'lg'|'xl'} [size]     — Padding size (default: 'md')
 * @param {'semibold'|'bold'} [weight]   — Font weight (default: 'bold')
 * @param {'sm'|'md'|'lg'} [rounding]    — Border radius (default: 'sm')
 * @param {boolean}        [fullWidth]   — Whether to apply w-full
 * @param {string}         [className]   — Additional classes
 * @param {object}         rest          — All standard <button> props forwarded
 */
const Button = React.forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    weight = 'bold',
    rounding = 'sm',
    fullWidth = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const variantClass = variantMap[variant] || variantMap.primary;
  const sizeClass = sizeMap[size] || sizeMap.md;
  const roundingClass = roundingMap[rounding] || roundingMap.sm;
  const weightClass = weightMap[weight] || weightMap.bold;
  const widthClass = fullWidth ? 'w-full' : '';
  const baseClass = 'transition-colors disabled:opacity-50';

  return (
    <button
      type="button"
      ref={ref}
      className={`${baseClass} ${variantClass} ${sizeClass} ${roundingClass} ${weightClass}${widthClass ? ` ${widthClass}` : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
