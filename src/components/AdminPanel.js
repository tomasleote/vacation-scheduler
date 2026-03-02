import React, { useState, useEffect } from 'react';
import { getGroup, updateGroup, getParticipants, deleteGroup, addParticipant, updateParticipant, deleteParticipant, getParticipant, validateAdminToken, subscribeToGroup, subscribeToParticipants, hashPhrase } from '../firebase';
import { calculateOverlap, getBestOverlapPeriods, formatDateRange } from '../utils/overlap';
import { exportToCSV } from '../utils/export';
import { validateParticipantName, validateEmail, sanitizeName, sanitizeEmail, generateParticipantLink } from '../utils/participantValidation';
import { CalendarRange, Users, Mail, Copy, CheckCircle2, ChevronDown, ChevronUp, Edit, X, Trash2, Download, Save, KeyRound, Eye, EyeOff, UserPlus, Link, Send } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import SlidingOverlapCalendar from './SlidingOverlapCalendar';
import CalendarView from './CalendarView';

function AdminPanel({ groupId, adminToken, onBack }) {
  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [durationFilter, setDurationFilter] = useState('3');
  const [overlaps, setOverlaps] = useState([]);
  const [reminderSending, setReminderSending] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const { addNotification } = useNotification();

  const baseUrl = window.location.origin;
  const participantLink = `${baseUrl}?group=${groupId}`;
  const adminLink = adminToken ? `${baseUrl}?group=${groupId}&admin=${adminToken}` : null;
  const [copiedPLink, setCopiedPLink] = useState(false);
  const [copiedALink, setCopiedALink] = useState(false);
  const [copiedGroupId, setCopiedGroupId] = useState(false);

  const [adminParticipantId, setAdminParticipantId] = useState(null);
  const [adminSavedDays, setAdminSavedDays] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminDuration, setAdminDuration] = useState('3');
  const [showAvailability, setShowAvailability] = useState(false);

  // Participant management state
  const [showCreateParticipant, setShowCreateParticipant] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [showEditParticipant, setShowEditParticipant] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editParticipantName, setEditParticipantName] = useState('');
  const [editParticipantEmail, setEditParticipantEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingParticipant, setDeletingParticipant] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [inviteSendingId, setInviteSendingId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);


  useEffect(() => {
    let unsubGroup = () => { };
    let unsubParts = () => { };
    let isMounted = true;

    const initAdmin = async () => {
      if (!adminToken) {
        onBack();
        return;
      }

      try {
        const isValid = await validateAdminToken(groupId, adminToken);
        if (!isValid) {
          onBack();
          return;
        }
      } catch {
        onBack();
        return;
      }

      if (!isMounted) return;

      if (adminToken) {
        try { localStorage.setItem(`vacation_admin_${groupId}`, adminToken); } catch { }
      }

      try {
        const stored = localStorage.getItem(`vacation_admin_p_${groupId}`);
        if (stored) {
          const { participantId, name, email, duration } = JSON.parse(stored);
          getParticipant(groupId, participantId).then(p => {
            if (p && isMounted) {
              setAdminParticipantId(participantId);
              setAdminSavedDays(p.availableDays || []);
              setAdminName(p.name || name || '');
              setAdminEmail(p.email || email || '');
              setAdminDuration(String(p.duration || duration || '3'));
            }
          }).catch(() => { });
        }
      } catch { }

      let initialLoads = 2;
      const onLoad = () => {
        initialLoads--;
        if (initialLoads <= 0 && isMounted) setLoading(false);
      };

      unsubGroup = subscribeToGroup(groupId, (data) => {
        if (!isMounted) return;
        if (data) {
          setGroup(data);
          setEditData(prev => Object.keys(prev).length === 0 ? data : prev);
        } else {
          setGroup(null);
          setEditData({});
        }
        onLoad();
      });

      unsubParts = subscribeToParticipants(groupId, (data) => {
        if (!isMounted) return;
        setParticipants(data || []);
        onLoad();
      });
    };

    setLoading(true);
    initAdmin();

    return () => {
      isMounted = false;
      unsubGroup();
      unsubParts();
    };
  }, [groupId, adminToken]);

  useEffect(() => {
    if (group && participants?.length > 0) {
      const results = calculateOverlap(
        participants,
        group.startDate,
        group.endDate,
        parseInt(durationFilter)
      );
      setOverlaps(results);
    } else {
      setOverlaps([]);
    }
  }, [group, participants, durationFilter]);

  const handleAdminAvailability = async (formData) => {
    try {
      const finalDays = formData.selectedDays || [];

      // Duplicate name check
      const normalizedName = formData.name.trim().toLowerCase();
      const isDuplicate = participants?.some(
        p => p.name.trim().toLowerCase() === normalizedName && p.id !== adminParticipantId
      );
      if (isDuplicate) {
        throw new Error('A participant with this name already exists. Please choose another name.');
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
  };

  const handleSaveEdit = async () => {
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
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure? This will delete the entire group and all data.')) return;
    try {
      await deleteGroup(groupId);
      onBack();
    } catch (err) {
      console.error('[Admin Panel Error] handleDelete failed:', err);
      addNotification({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const handleExport = () => {
    try {
      if (group && participants?.length > 0) {
        exportToCSV(group, participants, overlaps);
      }
    } catch (err) {
      console.error('[Admin Panel Error] handleExport failed:', err);
      addNotification({ type: 'error', title: 'Export Failed', message: err.message });
    }
  };

  const handleSendReminder = async () => {
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
        addNotification({
          type: 'success',
          title: 'Reminder Sent',
          message: 'Reminders have been sent to participants.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Failed to Send Reminder',
          message: data.error || response.statusText
        });
      }
    } catch (err) {
      console.error('[Fetch Failure] handleSendReminder failed:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to send reminder. Check your network and try again.'
      });
    } finally {
      setReminderSending(false);
    }
  };

  // ─── Participant Management Handlers ─────────────────────────────

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
    // Optimistic: create a temporary participant entry
    const tempId = 'temp-' + Date.now();
    const tempParticipant = { id: tempId, name, email, duration: 3, availableDays: [], createdAt: new Date().toISOString() };
    setParticipants(prev => [...prev, tempParticipant]);

    try {
      await addParticipant(groupId, { name, email, duration: 3, availableDays: [] });
      addNotification({ type: 'success', title: 'Participant Created', message: `${name} has been added to the group.` });
      setShowCreateParticipant(false);
      setNewParticipantName('');
      setNewParticipantEmail('');
      // Real data will arrive via the real-time subscription, remove temp entry
      setParticipants(prev => prev.filter(p => p.id !== tempId));
    } catch (err) {
      console.error('[Admin Panel] handleCreateParticipant failed:', err);
      // Rollback optimistic update
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
    // Capture original values for targeted rollback
    const originalEntry = participants.find(p => p.id === editingParticipant.id);
    const editId = editingParticipant.id;
    // Optimistic update
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
      // Targeted rollback: only revert this participant, preserve concurrent realtime updates
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

  const openDeleteConfirmation = (participant) => {
    setDeletingParticipant(participant);
    setShowDeleteConfirm(true);
  };

  const handleDeleteParticipant = async () => {
    if (!deletingParticipant) return;

    setDeleteLoading(true);
    // Capture original entry for targeted rollback
    const originalEntry = { ...deletingParticipant };
    const deleteId = deletingParticipant.id;
    const deletedName = deletingParticipant.name || 'Participant';
    // Optimistic removal
    setParticipants(prev => prev.filter(p => p.id !== deleteId));

    try {
      await deleteParticipant(groupId, deleteId);
      addNotification({ type: 'success', title: 'Participant Deleted', message: `${deletedName} has been removed from the group.` });
      setShowDeleteConfirm(false);
      setDeletingParticipant(null);
    } catch (err) {
      console.error('[Admin Panel] handleDeleteParticipant failed:', err);
      // Targeted rollback: re-insert deleted participant if not already present
      setParticipants(prev => {
        const exists = prev.some(p => p.id === deleteId);
        return exists ? prev : [...prev, originalEntry];
      });
      addNotification({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 max-w-md text-center">
          <p className="text-rose-400 mb-6 font-medium">Group not found or could not be loaded.</p>
          <button
            onClick={onBack}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors";

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
          <h1 className="text-3xl font-bold text-gray-50 flex-1 text-center">Admin Panel</h1>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 md:row-span-2">
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-50 mb-2">{group.name}</h2>
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
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Participant link (share this):
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={participantLink}
                        className="flex-1 px-3 py-2 border border-dark-700 rounded-lg text-sm bg-dark-800 text-gray-300"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(participantLink);
                            setCopiedPLink(true);
                            setTimeout(() => setCopiedPLink(false), 2000);
                          } catch (err) {
                            addNotification({ type: 'error', title: 'Copy Failed', message: err.message || 'Could not copy to clipboard.' });
                          }
                        }}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {copiedPLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  {adminLink && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Your admin link (keep private):
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          readOnly
                          value={adminLink}
                          className="flex-1 px-3 py-2 border border-dark-700 rounded-lg text-sm bg-dark-800 text-gray-300"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(adminLink);
                              setCopiedALink(true);
                              setTimeout(() => setCopiedALink(false), 2000);
                            } catch (err) {
                              addNotification({ type: 'error', title: 'Copy Failed', message: err.message || 'Could not copy to clipboard.' });
                            }
                          }}
                          className="px-3 py-2 bg-dark-700 hover:bg-dark-800 text-gray-300 rounded-lg text-sm font-semibold border border-dark-700 transition-colors"
                        >
                          {copiedALink ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Group ID:
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 px-3 py-1.5 border border-dark-700 rounded-lg text-xs font-mono bg-dark-800 text-blue-400 flex items-center">
                          {groupId}
                        </code>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(groupId);
                              setCopiedGroupId(true);
                              setTimeout(() => setCopiedGroupId(false), 2000);
                            } catch (err) {
                              addNotification({ type: 'error', title: 'Copy Failed', message: err.message || 'Could not copy to clipboard.' });
                            }
                          }}
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Group Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      maxLength="30"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description {(editData.description || '').length}/500
                    </label>
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value.slice(0, 500) })}
                      className={inputClass}
                      rows="2"
                      maxLength="500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editData.startDate}
                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={editData.endDate}
                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-700/50 pt-4 mt-2 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Recovery Settings</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email</label>
                      <input
                        type="email"
                        value={editData.adminEmail || ''}
                        onChange={(e) => setEditData({ ...editData, adminEmail: e.target.value })}
                        maxLength="30"
                        className={inputClass}
                        placeholder="your@email.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Used for password recovery and sending reminders.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Recovery Passphrase</label>
                      <div className="relative">
                        <input
                          type={showPassphrase ? 'text' : 'password'}
                          value={editData.newPassphrase || ''}
                          onChange={(e) => setEditData({ ...editData, newPassphrase: e.target.value })}
                          className={`${inputClass} pr-10`}
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
                      onClick={handleSaveEdit}
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
                onClick={handleDelete}
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

          {/* Create Participant inline form */}
          {showCreateParticipant && (
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">New Participant</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Participant name"
                    maxLength="100"
                    className={inputClass}
                    data-testid="create-participant-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={newParticipantEmail}
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                    placeholder="email@example.com"
                    maxLength="255"
                    className={inputClass}
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
                  <tr key={p.id || p.name} className="border-b border-dark-700 hover:bg-dark-800 group">
                    <td className="px-4 py-2 text-gray-300">{p.name || 'N/A'}</td>
                    <td className="px-4 py-2 text-gray-300">{p.email || <span className="text-gray-500 italic">No email</span>}</td>
                    <td className="px-4 py-2 text-gray-300">{p.duration || 0} days</td>
                    <td className="px-4 py-2 text-gray-300">{(p.availableDays || []).length}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditParticipant(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                          title="Edit participant"
                          data-testid={`edit-participant-${p.id}`}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation(p)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          title="Delete participant"
                          data-testid={`delete-participant-${p.id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          onClick={() => handleCopyParticipantLink(p)}
                          className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                          title="Copy personal link"
                          data-testid={`copy-link-${p.id}`}
                        >
                          {copiedLinkId === p.id ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Link size={15} />}
                        </button>
                        <button
                          onClick={() => handleSendInvite(p)}
                          disabled={!p.email || !p.email.trim() || inviteSendingId === p.id}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={!p.email || !p.email.trim() ? 'No email address' : 'Send invite email'}
                          data-testid={`send-invite-${p.id}`}
                        >
                          {inviteSendingId === p.id ? <Mail size={15} className="animate-pulse" /> : <Send size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
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
        </div>

        {/* Edit Participant Modal */}
        {showEditParticipant && editingParticipant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowEditParticipant(false); setEditingParticipant(null); }}>
            <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-50">Edit Participant</h2>
                <button onClick={() => { setShowEditParticipant(false); setEditingParticipant(null); }} className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Close modal">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editParticipantName}
                    onChange={(e) => setEditParticipantName(e.target.value)}
                    maxLength="100"
                    className={inputClass}
                    data-testid="edit-participant-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editParticipantEmail}
                    onChange={(e) => setEditParticipantEmail(e.target.value)}
                    maxLength="255"
                    className={inputClass}
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
                    onClick={() => { setShowEditParticipant(false); setEditingParticipant(null); }}
                    className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2 px-4 rounded-lg border border-dark-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingParticipant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowDeleteConfirm(false); setDeletingParticipant(null); }}>
            <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mb-4">
                  <Trash2 size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-50 mb-2">Delete Participant?</h2>
                <p className="text-gray-400 text-sm">
                  Are you sure you want to remove <strong className="text-gray-200">{deletingParticipant.name}</strong> from this group? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletingParticipant(null); }}
                  className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2 px-4 rounded-lg border border-dark-700 transition-colors"
                  data-testid="delete-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteParticipant}
                  disabled={deleteLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  data-testid="delete-confirm"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {overlaps?.length > 0 && (
          <div className="mb-8">
            <SlidingOverlapCalendar
              startDate={group.startDate}
              endDate={group.endDate}
              participants={participants}
              duration={durationFilter}
              overlaps={overlaps}
              onDurationChange={setDurationFilter}
            />
          </div>
        )}

        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-50">
              {adminParticipantId ? `Your Availability (${adminName})` : 'Add Your Availability'}
            </h3>
            <button
              onClick={() => setShowAvailability(s => !s)}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              {showAvailability ? 'Hide' : adminParticipantId ? 'Update' : 'Add'}
            </button>
          </div>

          {adminParticipantId && !showAvailability && (
            <p className="text-gray-400 text-sm">
              {adminSavedDays.length} day{adminSavedDays.length !== 1 ? 's' : ''} selected. Click "Update" to change.
            </p>
          )}

          {!adminParticipantId && !showAvailability && (
            <p className="text-gray-400 text-sm">
              As the organizer, add your own availability so it's included in the overlap results.
            </p>
          )}



          {showAvailability && (
            <CalendarView
              startDate={group.startDate}
              endDate={group.endDate}
              onSubmit={handleAdminAvailability}
              savedDays={adminSavedDays}
              initialName={adminName}
              initialEmail={adminEmail}
              initialDuration={adminDuration}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminPanel;
