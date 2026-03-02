import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight } from 'lucide-react';
import { ReadOnlyInput, CopyButton, Button, Card } from '../../shared/ui';

function GroupCreatedScreen({ groupId, adminToken, onEnterAdmin, onBack }) {
  const baseUrl = window.location.origin;
  const participantLink = `${baseUrl}?group=${encodeURIComponent(groupId)}`;
  const adminLink = `${baseUrl}?group=${encodeURIComponent(groupId)}&admin=${encodeURIComponent(adminToken)}`;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <Card className="space-y-6 shadow-2xl rounded-2xl" variant="default">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mb-4">
              <span className="text-3xl">&#10003;</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-50">Group created!</h1>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Share with participants:
            </label>
            <div className="flex gap-2">
              <ReadOnlyInput value={participantLink} />
              <CopyButton value={participantLink} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Your admin link — save this:
            </label>
            <div className="flex gap-2">
              <ReadOnlyInput value={adminLink} />
              <CopyButton value={adminLink} variant="secondary" />
            </div>
            <p className="text-xs text-amber-400/80 mt-1.5">
              Bookmark or save this link — it's the only way to access your admin panel later.
            </p>
          </div>

          {/* Recovery info */}
          <Card variant="secondary">
            <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <KeyRound size={15} className="text-blue-400" /> Lost your admin link?
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              You can recover it anytime from the home page using:
            </p>
            <ul className="text-xs text-gray-400 space-y-1 pl-2">
              <li className="flex items-start gap-1.5">✦ <span><strong className="text-gray-200">Recovery passphrase</strong> — if you set one during group creation</span></li>
              <li className="flex items-start gap-1.5">✦ <span><strong className="text-gray-200">Email magic link</strong> — if you added an admin email</span></li>
            </ul>
            <p className="text-xs text-blue-400/80 pt-1">Click <strong>"Recover"</strong> in the top nav of the home page.</p>
          </Card>

          <Button
            variant="primary"
            size="lg"
            rounding="lg"
            fullWidth
            onClick={onEnterAdmin}
            className="flex items-center justify-center gap-2"
          >
            Open Admin Panel <ArrowRight size={18} />
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}

export default GroupCreatedScreen;
