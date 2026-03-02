import React from 'react';
import { CalendarRange, Users, Mail, Copy, CheckCircle2, Edit, X, Save, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Input, Label, ReadOnlyInput, CopyButton, TruncatedText } from '../../shared/ui';
import { MAX_GROUP_NAME_LENGTH } from '../../utils/constants/validation';

function GroupSettings({
  group,
  participants,
  editing,
  setEditing,
  editData,
  setEditData,
  onSaveEdit,
  onDelete,
  participantLink,
  adminLink,
  groupId,
  copiedPLink,
  copyPLink,
  copiedALink,
  copyALink,
  copiedGroupId,
  copyGroupId,
  showPassphrase,
  setShowPassphrase,
}) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-50 mb-2">
            <TruncatedText text={group.name} />
          </h2>
          {group.description && (
            <p className="text-gray-400 text-sm mb-3">{group.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-400 flex-wrap mt-1">
            <span className="flex items-center gap-1.5"><CalendarRange size={16} className="text-gray-500" /> {group.startDate} to {group.endDate}</span>
            <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-500" /> {participants?.length || 0} participants</span>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-blue-400 hover:text-blue-300"
        >
          {editing ? <X size={24} /> : <Edit size={24} />}
        </button>
      </div>

      {!editing && (
        <div className="space-y-3">
          <div>
            <Label size="small">
              Participant link (share this):
            </Label>
            <div className="flex gap-2">
              <ReadOnlyInput value={participantLink} />
              <CopyButton
                value={participantLink}
                copiedOverride={copiedPLink}
                onCopyOverride={(v) => copyPLink(v)}
              />
            </div>
          </div>
          {adminLink && (
            <div>
              <Label size="small">
                Your admin link (keep private):
              </Label>
              <div className="flex gap-2 mb-3">
                <ReadOnlyInput value={adminLink} />
                <CopyButton
                  value={adminLink}
                  variant="secondary"
                  copiedOverride={copiedALink}
                  onCopyOverride={(v) => copyALink(v)}
                />
              </div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Group ID:
              </label>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-1.5 border border-dark-700 rounded-lg text-xs font-mono bg-dark-800 text-blue-400 flex items-center">
                  {groupId}
                </code>
                <button
                  onClick={() => copyGroupId(groupId)}
                  className="px-3 py-1.5 bg-dark-700 hover:bg-dark-800 text-gray-300 rounded-lg text-xs font-semibold border border-dark-700 transition-colors flex items-center gap-1"
                >
                  {copiedGroupId ? <CheckCircle2 size={14} className="text-blue-400" /> : <Copy size={14} />}
                  {copiedGroupId ? 'Copied' : 'Copy ID'}
                </button>
              </div>
            </div>
          )}
          <div className="border-t border-dark-700/50 mt-4 pt-3 flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recovery Options</span>
            <div className="flex items-center gap-1.5 text-sm">
              <Mail size={16} className={group.adminEmail ? "text-blue-400" : "text-gray-600"} />
              <span className={group.adminEmail ? "text-gray-300" : "text-gray-500 italic"}>
                {group.adminEmail || "No admin email set"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <KeyRound size={16} className={group.recoveryPasswordHash ? "text-blue-400" : "text-gray-600"} />
              <span className={group.recoveryPasswordHash ? "text-gray-300" : "text-gray-500 italic"}>
                {group.recoveryPasswordHash ? "Passphrase is set" : "No passphrase set"}
              </span>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="space-y-4 border-t border-dark-700 pt-6">
          <div>
            <Label size="compact">Group Name</Label>
            <Input
              type="text"
              size="compact"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              maxLength={MAX_GROUP_NAME_LENGTH}
            />
          </div>

          <div>
            <Label size="compact">
              Description {(editData.description || '').length}/500
            </Label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value.slice(0, 500) })}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
              rows="2"
              maxLength="500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label size="compact">Start Date</Label>
              <Input
                type="date"
                size="compact"
                value={editData.startDate}
                onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label size="compact">End Date</Label>
              <Input
                type="date"
                size="compact"
                value={editData.endDate}
                onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-dark-700/50 pt-4 mt-2 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Recovery Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email</label>
              <Input
                type="email"
                size="compact"
                value={editData.adminEmail || ''}
                onChange={(e) => setEditData({ ...editData, adminEmail: e.target.value })}
                maxLength="254"
                placeholder="your@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">Used for password recovery and sending reminders.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Recovery Passphrase</label>
              <div className="relative">
                <Input
                  type={showPassphrase ? 'text' : 'password'}
                  size="compact"
                  value={editData.newPassphrase || ''}
                  onChange={(e) => setEditData({ ...editData, newPassphrase: e.target.value })}
                  className="pr-10"
                  placeholder={group.recoveryPasswordHash ? "Enter to change existing passphrase" : "Set a new passphrase"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                  aria-pressed={showPassphrase}
                >
                  {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing.</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onSaveEdit}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={18} /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2 px-4 rounded-lg border border-dark-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupSettings;
