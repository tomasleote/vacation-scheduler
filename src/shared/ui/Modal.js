import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Shared Modal component — replaces duplicated overlay wrappers.
 *
 * @param {boolean} open        — Whether the modal is visible
 * @param {function} onClose    — Called when backdrop or close button is clicked
 * @param {string}  [title]     — Optional header title (renders header row with close X)
 * @param {string}  [maxWidth]  — 'sm' | 'md' (default) | 'lg'
 * @param {boolean} [animated]  — Enable framer-motion enter/exit (default false)
 * @param {React.ReactNode} children
 */
function Modal({ open, onClose, title, maxWidth = 'md', animated = false, children }) {
  const widthClass = maxWidthMap[maxWidth] || maxWidthMap.md;

  const backdrop = (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full ${widthClass} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-label={!title ? "Modal dialog" : undefined}
      >
        {title && (
          <div className="flex justify-between items-center mb-6">
            <h2 id="modal-title" className="text-xl font-bold text-gray-50">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const animatedBackdrop = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className={`bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full ${widthClass} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-label={!title ? "Modal dialog" : undefined}
      >
        {title && (
          <div className="flex justify-between items-center mb-6">
            <h2 id="modal-title" className="text-xl font-bold text-gray-50">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );

  if (animated) {
    return (
      <AnimatePresence>
        {open && animatedBackdrop}
      </AnimatePresence>
    );
  }

  return open ? backdrop : null;
}

export default Modal;
