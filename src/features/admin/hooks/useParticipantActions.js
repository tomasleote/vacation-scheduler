import { useState } from 'react';
import { addParticipant, updateParticipant, deleteParticipant } from '../../../services/participantService';
import { validateParticipantName, validateEmail, sanitizeName, sanitizeEmail, generateParticipantLink } from '../../../utils/participantValidation';
import { useNotification } from '../../../context/NotificationContext';

export function useParticipantActions(groupId, group, participants, setParticipants) {
  const { addNotification } = useNotification();

  // Create state
  const [showCreateParticipant, setShowCreateParticipant] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit state
  const [showEditParticipant, setShowEditParticipant] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editParticipantName, setEditParticipantName] = useState('');
  const [editParticipantEmail, setEditParticipantEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingParticipant, setDeletingParticipant] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Per-row state
  const [inviteSendingId, setInviteSendingId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  const baseUrl = window.location.origin;

  const handleCreateParticipant = async () => {
    const name = sanitizeName(newParticipantName);
    const email = sanitizeEmail(newParticipantEmail);

    const nameCheck = validateParticipantName(name, participants);
    if (!nameCheck.valid) {
      addNotification({ type: 'error', title: 'Validation Error', message: nameCheck.error });
      return;
    }
    if (email) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        addNotification({ type: 'error', title: 'Validation Error', message: emailCheck.error });
        return;
      }
    }

    setCreateLoading(true);
    const tempId = 'temp-' + Date.now();
    const tempParticipant = { id: tempId, name, email, duration: 3, availableDays: [], createdAt: new Date().toISOString() };
    setParticipants(prev => [...prev, tempParticipant]);

    try {
      await addParticipant(groupId, { name, email, duration: 3, availableDays: [] });
      addNotification({ type: 'success', title: 'Participant Created', message: `${name} has been added to the group.` });
      setShowCreateParticipant(false);
      setNewParticipantName('');
      setNewParticipantEmail('');
      setParticipants(prev => prev.filter(p => p.id !== tempId));
    } catch (err) {
      console.error('[Admin Panel] handleCreateParticipant failed:', err);
      setParticipants(prev => prev.filter(p => p.id !== tempId));
      addNotification({ type: 'error', title: 'Create Failed', message: err.message });
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditParticipant = (participant) => {
    setEditingParticipant(participant);
    setEditParticipantName(participant.name || '');
    setEditParticipantEmail(participant.email || '');
    setShowEditParticipant(true);
  };

  const handleEditParticipant = async () => {
    if (!editingParticipant) return;
    const name = sanitizeName(editParticipantName);
    const email = sanitizeEmail(editParticipantEmail);

    const nameCheck = validateParticipantName(name, participants, editingParticipant.id);
    if (!nameCheck.valid) {
      addNotification({ type: 'error', title: 'Validation Error', message: nameCheck.error });
      return;
    }
    if (email) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        addNotification({ type: 'error', title: 'Validation Error', message: emailCheck.error });
        return;
      }
    }

    setEditLoading(true);
    const originalEntry = participants.find(p => p.id === editingParticipant.id);
    const editId = editingParticipant.id;
    setParticipants(prev =>
      prev.map(p => p.id === editId ? { ...p, name, email } : p)
    );

    try {
      await updateParticipant(groupId, editId, { name, email });
      addNotification({ type: 'success', title: 'Participant Updated', message: `${name}'s details have been saved.` });
      setShowEditParticipant(false);
      setEditingParticipant(null);
    } catch (err) {
      console.error('[Admin Panel] handleEditParticipant failed:', err);
      if (originalEntry) {
        setParticipants(prev => {
          const exists = prev.some(p => p.id === editId);
          if (exists) {
            return prev.map(p => p.id === editId ? originalEntry : p);
          }
          return [...prev, originalEntry];
        });
      }
      addNotification({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditParticipant = () => {
    setShowEditParticipant(false);
    setEditingParticipant(null);
  };

  const openDeleteConfirmation = (participant) => {
    setDeletingParticipant(participant);
    setShowDeleteConfirm(true);
  };

  const handleDeleteParticipant = async () => {
    if (!deletingParticipant) return;

    setDeleteLoading(true);
    const originalEntry = { ...deletingParticipant };
    const deleteId = deletingParticipant.id;
    const deletedName = deletingParticipant.name || 'Participant';
    setParticipants(prev => prev.filter(p => p.id !== deleteId));

    try {
      await deleteParticipant(groupId, deleteId);
      addNotification({ type: 'success', title: 'Participant Deleted', message: `${deletedName} has been removed from the group.` });
      setShowDeleteConfirm(false);
      setDeletingParticipant(null);
    } catch (err) {
      console.error('[Admin Panel] handleDeleteParticipant failed:', err);
      setParticipants(prev => {
        const exists = prev.some(p => p.id === deleteId);
        return exists ? prev : [...prev, originalEntry];
      });
      addNotification({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingParticipant(null);
  };

  const handleCopyParticipantLink = async (participant) => {
    const link = generateParticipantLink(baseUrl, groupId, participant.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(participant.id);
      addNotification({ type: 'success', title: 'Link Copied', message: `Personal link for ${participant.name} copied to clipboard.` });
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      addNotification({ type: 'error', title: 'Copy Failed', message: err.message || 'Could not copy to clipboard.' });
    }
  };

  const handleSendInvite = async (participant) => {
    if (!participant.email || !participant.email.trim()) {
      addNotification({ type: 'warning', title: 'No Email', message: `${participant.name} doesn't have an email address.` });
      return;
    }

    setInviteSendingId(participant.id);
    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: participant.name,
          participantEmail: participant.email,
          groupId,
          groupName: group.name,
          participantId: participant.id,
          baseUrl: window.location.origin,
        })
      });
      const data = await response.json();
      if (response.ok) {
        addNotification({ type: 'success', title: 'Invite Sent', message: `Invitation email sent to ${participant.email}.` });
      } else {
        addNotification({ type: 'error', title: 'Invite Failed', message: data.error || 'Failed to send invite email.' });
      }
    } catch (err) {
      console.error('[Admin Panel] handleSendInvite failed:', err);
      addNotification({ type: 'error', title: 'Network Error', message: 'Failed to send invite. Check your connection.' });
    } finally {
      setInviteSendingId(null);
    }
  };

  return {
    // Create
    showCreateParticipant, setShowCreateParticipant,
    newParticipantName, setNewParticipantName,
    newParticipantEmail, setNewParticipantEmail,
    createLoading,
    handleCreateParticipant,
    // Edit
    showEditParticipant, editingParticipant,
    editParticipantName, setEditParticipantName,
    editParticipantEmail, setEditParticipantEmail,
    editLoading,
    openEditParticipant, handleEditParticipant, closeEditParticipant,
    // Delete
    showDeleteConfirm, deletingParticipant,
    deleteLoading,
    openDeleteConfirmation, handleDeleteParticipant, closeDeleteConfirm,
    // Per-row actions
    inviteSendingId, copiedLinkId,
    handleCopyParticipantLink, handleSendInvite,
  };
}
