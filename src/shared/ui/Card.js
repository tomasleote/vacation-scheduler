/**
 * Card — Reusable card wrapper component
 * Variants: default (dark-900 border), secondary (dark-800), info (blue-500 info box)
 */
import React from 'react';

export function Card({
  children,
  className = '',
  variant = 'default',
  title,
  ...props
}) {
  const variantMap = {
    default: 'bg-dark-900 border border-dark-700 rounded-xl p-6',
    secondary: 'bg-dark-800 border border-dark-700/60 rounded-xl p-4',
    info: 'bg-blue-500/10 border border-blue-500/20 rounded-lg p-4',
    danger: 'bg-rose-500/10 border border-rose-500/20 rounded-lg p-4',
    subtle: 'bg-dark-900 border border-dark-700/50 rounded-xl p-6',
  };
  const variantClass = variantMap[variant] || variantMap.default;

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-200 mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export default Card;
