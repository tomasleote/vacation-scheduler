import React from 'react';
import { Edit, Trash2, CheckCircle2, Link, Send, Mail, UserPlus, Save } from 'lucide-react';
import { Modal, Input, Label, ConfirmDialog, TruncatedText } from '../../shared/ui';
import { MAX_PARTICIPANT_NAME_LENGTH } from '../../utils/constants/validation';

/**
 * Memoized table row component to prevent unnecessary re-renders
 * when unrelated state changes (e.g., overlaps calculated in AdminPage)
 */
const ParticipantRow = React.memo(function ParticipantRow({
  participant,
  onEdit,
  onDelete,
  onCopyLink,
  onSendInvite,
  copiedLinkId,
  inviteSendingId,
}) {
  return (
    <tr key={participant.id} className="border-b border-dark-700 hover:bg-dark-800 group">
      <td className="px-4 py-2 text-gray-300">
        <TruncatedText text={participant.name || 'N/A'} maxWidth="200px" />
      </td>
      <td className="px-4 py-2 text-gray-300">
        <TruncatedText text={participant.email} maxWidth="200px" />
        {!participant.email && <span className="text-gray-500 italic">No email</span>}
      </td>
      <td className="px-4 py-2 text-gray-300">{participant.duration || 0} days</td>
      <td className="px-4 py-2 text-gray-300">{(participant.availableDays || []).length}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(participant)}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
            title="Edit participant"
            data-testid={`edit-participant-${participant.id}`}
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => onDelete(participant)}
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
            title="Delete participant"
            data-testid={`delete-participant-${participant.id}`}
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => onCopyLink(participant)}
            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
            title="Copy personal link"
            data-testid={`copy-link-${participant.id}`}
          >
            {copiedLinkId === participant.id ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Link size={15} />}
          </button>
          <button
            onClick={() => onSendInvite(participant)}
            disabled={!participant.email || !participant.email.trim() || inviteSendingId === participant.id}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={!participant.email || !participant.email.trim() ? 'No email address' : 'Send invite email'}
            data-testid={`send-invite-${participant.id}`}
          >
            {inviteSendingId === participant.id ? <Mail size={15} className="animate-pulse" /> : <Send size={15} />}
          </button>
        </div>
      </td>
    </tr>
  );
});

function ParticipantTable({ participants, actions }) {
  const {
    showCreateParticipant, setShowCreateParticipant,
    newParticipantName, setNewParticipantName,
    newParticipantEmail, setNewParticipantEmail,
    createLoading,
    handleCreateParticipant,
    showEditParticipant, editingParticipant,
    editParticipantName, setEditParticipantName,
    editParticipantEmail, setEditParticipantEmail,
    editLoading,
    openEditParticipant, handleEditParticipant, closeEditParticipant,
    showDeleteConfirm, deletingParticipant,
    deleteLoading,
    openDeleteConfirmation, handleDeleteParticipant, closeDeleteConfirm,
    inviteSendingId, copiedLinkId,
    handleCopyParticipantLink, handleSendInvite,
  } = actions;

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-50">Participants ({participants?.length || 0})</h3>
        <button
          onClick={() => setShowCreateParticipant(s => !s)}
          className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <UserPlus size={16} /> Add Participant
        </button>
      </div>

      {showCreateParticipant && (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">New Participant</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <Label size="small">Name *</Label>
              <Input
                type="text"
                size="compact"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Participant name"
                maxLength={MAX_PARTICIPANT_NAME_LENGTH}
                data-testid="create-participant-name"
              />
            </div>
            <div>
              <Label size="small">Email (optional)</Label>
              <Input
                type="email"
                size="compact"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                placeholder="email@example.com"
                maxLength="254"
                data-testid="create-participant-email"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateParticipant}
              disabled={createLoading || !newParticipantName.trim()}
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
              data-testid="create-participant-submit"
            >
              {createLoading ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setShowCreateParticipant(false); setNewParticipantName(''); setNewParticipantEmail(''); }}
              className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-semibold py-2 px-4 rounded-lg text-sm border border-dark-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-dark-800 border-b border-dark-700">
            <tr>
              <th className="px-4 py-2 text-left text-gray-300">Name</th>
              <th className="px-4 py-2 text-left text-gray-300">Email</th>
              <th className="px-4 py-2 text-left text-gray-300">Duration</th>
              <th className="px-4 py-2 text-left text-gray-300">Days Available</th>
              <th className="px-4 py-2 text-right text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants?.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                onEdit={openEditParticipant}
                onDelete={openDeleteConfirmation}
                onCopyLink={handleCopyParticipantLink}
                onSendInvite={handleSendInvite}
                copiedLinkId={copiedLinkId}
                inviteSendingId={inviteSendingId}
              />
            ))}
            {(!participants || participants.length === 0) && (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                  No participants yet. Click "Add Participant" or share the participant link above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Participant Modal */}
      <Modal
        open={showEditParticipant && !!editingParticipant}
        onClose={closeEditParticipant}
        title="Edit Participant"
      >
        <div className="space-y-4">
          <div>
            <Label size="compact">Name *</Label>
            <Input
              type="text"
              size="compact"
              value={editParticipantName}
              onChange={(e) => setEditParticipantName(e.target.value)}
              maxLength={MAX_PARTICIPANT_NAME_LENGTH}
              data-testid="edit-participant-name-input"
            />
          </div>
          <div>
            <Label size="compact">Email</Label>
            <Input
              type="email"
              size="compact"
              value={editParticipantEmail}
              onChange={(e) => setEditParticipantEmail(e.target.value)}
              maxLength="254"
              data-testid="edit-participant-email-input"
            />
          </div>
          <p className="text-xs text-gray-500">Note: Participant availability can only be changed by the participant themselves.</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleEditParticipant}
              disabled={editLoading || !editParticipantName.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              data-testid="edit-participant-save"
            >
              <Save size={18} /> {editLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={closeEditParticipant}
              className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2 px-4 rounded-lg border border-dark-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm && !!deletingParticipant}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteParticipant}
        icon={<Trash2 size={24} />}
        title="Delete Participant?"
        message={
          <>Are you sure you want to remove <strong className="text-gray-200">{deletingParticipant?.name}</strong> from this group? This action cannot be undone.</>
        }
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={deleteLoading}
        variant="danger"
        confirmTestId="delete-confirm"
        cancelTestId="delete-cancel"
      />
    </div>
  );
}

export default ParticipantTable;