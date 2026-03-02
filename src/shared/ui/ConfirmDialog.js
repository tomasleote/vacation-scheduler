import React from 'react';
import Modal from './Modal';

/**
 * Shared ConfirmDialog — replaces duplicated delete/confirm modal pattern.
 *
 * @param {boolean}        open          — Whether the dialog is visible
 * @param {function}       onClose       — Called when cancel/backdrop clicked
 * @param {function}       onConfirm     — Called when confirm button clicked
 * @param {React.ReactNode} icon         — Icon element displayed above title
 * @param {string}         title         — Dialog title
 * @param {React.ReactNode} message      — Description / body content
 * @param {string}         [confirmLabel] — Confirm button text (default: 'Confirm')
 * @param {string}         [cancelLabel]  — Cancel button text (default: 'Cancel')
 * @param {string}         [loadingLabel] — Loading button text (default: 'Processing...')
 * @param {boolean}        [loading]     — Disable confirm button and show loading text
 * @param {'danger'|'primary'} [variant] — Confirm button color (default: 'danger')
 * @param {object}         [confirmTestId] — data-testid for confirm button
 * @param {object}         [cancelTestId]  — data-testid for cancel button
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  icon,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel = 'Processing...',
  loading = false,
  variant = 'danger',
  confirmTestId,
  cancelTestId,
}) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 text-white'
      : 'bg-blue-500 hover:bg-blue-400 text-white';

  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="text-center mb-6">
        {icon && (
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mb-4">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-50 mb-2">{title}</h2>
        <div className="text-gray-400 text-sm">{message}</div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2 px-4 rounded-lg border border-dark-700 transition-colors"
          data-testid={cancelTestId}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 ${confirmClass} font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50`}
          data-testid={confirmTestId}
        >
          {loading ? loadingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
