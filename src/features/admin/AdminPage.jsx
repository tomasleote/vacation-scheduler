import React, { useState, useCallback } from 'react';
import { updateGroup, deleteGroup } from '../../services/groupService';
import { addParticipant, updateParticipant } from '../../services/participantService';
import { hashPhrase } from '../../services/adminService';
import { exportToCSV } from '../../utils/export';
import { Download, Mail } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useGroupContext } from '../../shared/context';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { validateParticipantName } from '../../utils/participantValidation';
import { Button, LoadingSpinner, Card, TruncatedText, ConfirmDialog } from '../../shared/ui';
import { useGroupData } from './hooks/useGroupData';
import { useParticipantActions } from './hooks/useParticipantActions';
import GroupSettings from './GroupSettings';
import ParticipantTable from './ParticipantTable';
import AdminAvailability from './AdminAvailability';
import OverlapResults from './OverlapResults';

function AdminPage({ onBack }) {
  const { groupId, adminToken } = useGroupContext();
  const { addNotification } = useNotification();
  const [editing, setEditing] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const baseUrl = window.location.origin;
  const participantLink = `${baseUrl}?group=${groupId}`;
  const adminLink = adminToken ? `${baseUrl}?group=${groupId}&admin=${adminToken}` : null;
  const { copy: copyPLink, copied: copiedPLink } = useCopyToClipboard();
  const { copy: copyALink, copied: copiedALink } = useCopyToClipboard();
  const { copy: copyGroupId, copied: copiedGroupId } = useCopyToClipboard();

  const {
    group, setGroup,
    participants, setParticipants,
    loading, error,
    editData, setEditData,
    durationFilter, setDurationFilter,
    overlaps,
    adminParticipantId, setAdminParticipantId,
    adminSavedDays, setAdminSavedDays,
    adminName, setAdminName,
    adminEmail, setAdminEmail,
    adminDuration, setAdminDuration,
  } = useGroupData(groupId, adminToken, onBack);

  const participantActions = useParticipantActions(groupId, group, participants, setParticipants);

  const handleSaveEdit = useCallback(async () => {
    try {
      const updates = { ...editData };
      const normalized = updates.newPassphrase?.trim();
      if (normalized) {
        updates.recoveryPasswordHash = await hashPhrase(normalized);
      }
      delete updates.newPassphrase;

      await updateGroup(groupId, updates);
      setGroup({ ...group, ...updates });
      setEditing(false);
      addNotification({ type: 'success', title: 'Group Updated', message: 'Group settings have been saved.' });
    } catch (err) {
      console.error('[Admin Panel Error] handleSaveEdit failed:', err);
      addNotification({ type: 'error', title: 'Update Failed', message: err.message });
    }
  }, [editData, groupId, group, setGroup, addNotification]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteGroup(groupId);
      onBack();
    } catch (err) {
      console.error('[Admin Panel Error] handleDelete failed:', err);
      addNotification({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [groupId, onBack, addNotification]);

  const handleExport = useCallback(() => {
    try {
      if (group && participants?.length > 0) {
        exportToCSV(group, participants, overlaps);
      }
    } catch (err) {
      console.error('[Admin Panel Error] handleExport failed:', err);
      addNotification({ type: 'error', title: 'Export Failed', message: err.message });
    }
  }, [group, participants, overlaps, addNotification]);

  const handleSendReminder = useCallback(async () => {
    setReminderSending(true);
    try {
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          groupName: group.name,
          startDate: group.startDate,
          participants: participants?.filter(p => p?.email && p.email.trim() !== '').map(p => ({ email: p.email })) || [],
          baseUrl: window.location.origin,
        })
      });
      const data = await response.json();
      if (response.ok) {
        addNotification({ type: 'success', title: 'Reminder Sent', message: 'Reminders have been sent to participants.' });
      } else {
        addNotification({ type: 'error', title: 'Failed to Send Reminder', message: data.error || response.statusText });
      }
    } catch (err) {
      console.error('[Fetch Failure] handleSendReminder failed:', err);
      addNotification({ type: 'error', title: 'Error', message: 'Failed to send reminder. Check your network and try again.' });
    } finally {
      setReminderSending(false);
    }
  }, [groupId, group, participants, addNotification]);

  const handleAdminAvailability = useCallback(async (formData) => {
    try {
      const finalDays = formData.selectedDays || [];

      const nameCheck = validateParticipantName(formData.name, participants, adminParticipantId);
      if (!nameCheck.valid) {
        throw new Error(nameCheck.error || 'Invalid participant name.');
      }

      if (!adminParticipantId) {
        const participantId = await addParticipant(groupId, {
          name: formData.name,
          email: formData.email,
          duration: formData.duration,
          availableDays: finalDays,
          blockType: formData.blockType
        });
        setAdminParticipantId(participantId);
        try {
          localStorage.setItem(
            `vacation_admin_p_${groupId}`,
            JSON.stringify({ participantId, name: formData.name, email: formData.email, duration: formData.duration })
          );
        } catch { }
      } else {
        await updateParticipant(groupId, adminParticipantId, {
          name: formData.name,
          email: formData.email,
          availableDays: finalDays,
          duration: formData.duration,
          blockType: formData.blockType
        });
      }

      setAdminSavedDays(finalDays);
      setAdminName(formData.name);
      setAdminEmail(formData.email || '');
      setAdminDuration(String(formData.duration));
      addNotification({ type: 'success', title: 'Availability Saved', message: 'Your availability has been saved!' });
    } catch (err) {
      console.error('[Admin Auth Error] handleAdminAvailability failed:', err);
      addNotification({ type: 'error', title: 'Error', message: err.message });
    }
  }, [participants, adminParticipantId, groupId, setAdminParticipantId, setAdminSavedDays, setAdminName, setAdminEmail, setAdminDuration, addNotification]);

  if (loading) {
    return <LoadingSpinner label="Loading..." />;
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card variant="default" className="text-center max-w-md">
          <p className="text-rose-400 mb-6 font-medium">Group not found or could not be loaded.</p>
          <Button variant="primary" fullWidth onClick={onBack}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-50 flex-1 text-center truncate">
            <TruncatedText text={group.name} />
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 md:row-span-2">
            <GroupSettings
              group={group}
              participants={participants}
              editing={editing}
              setEditing={setEditing}
              editData={editData}
              setEditData={setEditData}
              onSaveEdit={handleSaveEdit}
              onDelete={() => setShowDeleteConfirm(true)}
              participantLink={participantLink}
              adminLink={adminLink}
              groupId={groupId}
              copiedPLink={copiedPLink}
              copyPLink={copyPLink}
              copiedALink={copiedALink}
              copyALink={copyALink}
              copiedGroupId={copiedGroupId}
              copyGroupId={copyGroupId}
              showPassphrase={showPassphrase}
              setShowPassphrase={setShowPassphrase}
            />
          </div>

          <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 h-full">
            <h3 className="font-semibold text-gray-300 mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                disabled={!participants || participants.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Download size={18} /> Export CSV
              </button>
              <button
                onClick={handleSendReminder}
                disabled={reminderSending || !participants?.some(p => p?.email && p.email.trim() !== '')}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                title={!participants?.some(p => p?.email && p.email.trim() !== '') ? 'No participants have an email address' : ''}
              >
                <Mail size={18} /> {reminderSending ? 'Sending...' : 'Send Reminder'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Delete Group
              </button>
            </div>
          </div>

          <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 h-full">
            <h3 className="font-semibold text-gray-300 mb-4">Statistics</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Total participants: <span className="font-bold">{participants?.length || 0}</span></p>
              <p>Possible periods: <span className="font-bold">{overlaps?.length || 0}</span></p>
              {overlaps?.length > 0 && (
                <p>Best match: <span className="font-bold">{overlaps[0].availabilityPercent}%</span></p>
              )}
            </div>
          </div>
        </div>

        <ParticipantTable
          participants={participants}
          actions={participantActions}
        />

        <OverlapResults
          group={group}
          participants={participants}
          overlaps={overlaps}
          durationFilter={durationFilter}
          onDurationChange={setDurationFilter}
        />

        <AdminAvailability
          group={group}
          adminParticipantId={adminParticipantId}
          adminSavedDays={adminSavedDays}
          adminName={adminName}
          adminEmail={adminEmail}
          adminDuration={adminDuration}
          onSave={handleAdminAvailability}
        />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Group"
          message="Are you sure? This will delete the entire group and all data. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </div>
  );
}

export default AdminPage;
