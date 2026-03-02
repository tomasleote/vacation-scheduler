import React from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

/**
 * Shared CopyButton — replaces 6+ duplicated copy-to-clipboard + button patterns.
 *
 * Renders a button that copies `value` to clipboard and shows "Copied!" feedback.
 *
 * @param {string}  value           — Text to copy
 * @param {string}  [label]         — Button label when idle (default: 'Copy')
 * @param {string}  [copiedLabel]   — Button label after copy (default: 'Copied!')
 * @param {'primary'|'secondary'} [variant] — Style variant
 * @param {string}  [className]     — Additional classes
 * @param {boolean|null} [copiedOverride] — External copied state (for shared useCopyToClipboard)
 * @param {function|null} [onCopyOverride] — External copy function (for shared useCopyToClipboard)
 */
function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied!',
  variant = 'primary',
  className = '',
  copiedOverride,
  onCopyOverride,
}) {
  const { copy: internalCopy, copied: internalCopied } = useCopyToClipboard();

  const copy = onCopyOverride || internalCopy;
  const copied = copiedOverride !== undefined && copiedOverride !== null ? copiedOverride : internalCopied;

  const variantClass =
    variant === 'secondary'
      ? 'bg-dark-700 hover:bg-dark-800 text-gray-300 border border-dark-700'
      : 'bg-blue-500 hover:bg-blue-400 text-white';

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${variantClass}${className ? ` ${className}` : ''}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export default CopyButton;
