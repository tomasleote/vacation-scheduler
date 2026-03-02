import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Input, Label, Button, Card } from '../../shared/ui';

function JoinGroupForm({ onSuccess, onCancel }) {
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const [isAdminFound, setIsAdminFound] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { getGroup } = await import('../../firebase');
      const trimmedGroupId = groupId.trim();
      const group = await getGroup(trimmedGroupId);
      if (!group) {
        addNotification({ type: 'error', message: 'Group not found' });
        return;
      }

      const savedToken = localStorage.getItem(`vacation_admin_${trimmedGroupId}`);
      if (savedToken) {
        setIsAdminFound(true);
        setAdminToken(savedToken);
        setGroupId(trimmedGroupId);
      } else {
        onSuccess(trimmedGroupId);
      }
    } catch (err) {
      console.error('[Join Group Error] handleSubmit failed:', err);
      addNotification({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (isAdminFound) {
    return (
      <div className="space-y-5 py-2">
        <Card variant="info">
          <p className="text-sm text-blue-200">
            <strong>Welcome back, Admin!</strong><br />
            You're the admin of this group. Where would you like to go?
          </p>
        </Card>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            weight="semibold"
            size="sm"
            fullWidth
            onClick={() => onSuccess(groupId)}
          >
            Participant View
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onSuccess(groupId, adminToken)}
          >
            Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Group ID</Label>
        <Input
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          placeholder="Paste group ID here"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          weight="semibold"
          fullWidth
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join'}
        </Button>
      </div>
    </form>
  );
}

export default JoinGroupForm;
