import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { Input, Textarea, Label, Button, Card } from '../../shared/ui';
import { apiCall } from '../../services/apiService';
import { MAX_GROUP_NAME_LENGTH } from '../../utils/constants/validation';
import { EVENT_TYPES, getEventConfig } from '../../utils/eventTypes';
import { Link } from 'react-router-dom';

function CreateGroupForm({ onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('vacation');
  const { addNotification } = useNotification();

  const config = getEventConfig(eventType);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(endDate) < new Date(startDate)) {
      addNotification({ type: 'error', message: 'End Date cannot be before Start Date.' });
      return;
    }

    setLoading(true);

    try {
      const { createGroup, hashPhrase } = await import('../../firebase');
      const recoveryPasswordHash = passphrase.trim() ? await hashPhrase(passphrase.trim()) : null;
      const result = await createGroup({ name, description, startDate, endDate, eventType, adminEmail, recoveryPasswordHash });
      // Best-effort welcome email — does not block group creation
      if (adminEmail) {
        apiCall('/api/send-welcome', {
          method: 'POST',
          body: JSON.stringify({
            groupId: result.groupId,
            adminToken: result.adminToken,
            groupName: name,
            startDate,
            endDate,
            adminEmail,
            baseUrl: window.location.origin,
          }),
        }).catch((err) => { console.error('[send-welcome] fetch failed:', err); });
      }
      onSuccess(result);
    } catch (err) {
      console.error('[Group Creation Error] handleSubmit failed:', err);
      if (err.message === 'Failed to fetch') {
        addNotification({ type: 'error', title: 'Network Error', message: 'You appear to be offline. Failed to create group.' });
      } else {
        addNotification({ type: 'error', title: 'Error', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 mb-3" role="radiogroup" aria-label="Event Type">
        {Object.values(EVENT_TYPES).map((type) => (
          <button
            key={type.key}
            type="button"
            role="radio"
            aria-checked={eventType === type.key}
            aria-label={type.label}
            onClick={() => setEventType(type.key)}
            className={`p-2 flex flex-col items-center justify-center rounded-lg border text-center transition-colors ${eventType === type.key
              ? 'border-brand-500 bg-brand-500/10 text-brand-400'
              : 'border-dark-700 bg-dark-800 text-gray-400 hover:border-gray-500'
              }`}
          >
            <span className="mb-1" aria-hidden="true">{type.icon}</span>
            <span className="text-[10px] font-medium leading-tight">{type.label}</span>
          </button>
        ))}
      </div>

      <div>
        <Label>Group Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={MAX_GROUP_NAME_LENGTH}
          placeholder={config.placeholder}
        />
      </div>

      <div>
        <Label>
          Description (optional) <span className="text-gray-500">{description.length}/500</span>
        </Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder={config.descriptionPlaceholder}
          rows="1"
          maxLength="500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <Card variant="info" className="p-3">
        <div className="flex items-start gap-2">
          <KeyRound size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-300">Admin link recovery (optional)</p>
            <p className="text-[11px] text-gray-400 leading-tight">
              If you lose your admin link, you can recover it using a <strong className="text-gray-200">passphrase</strong> or your <strong className="text-gray-200">email</strong>. We strongly recommend setting at least one.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <Label>Admin Email <span className="text-brand-400 text-xs">(recommended — enables email recovery)</span></Label>
        <Input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          maxLength="254"
          placeholder="your@email.com"
        />
        <p className="text-[10px] text-gray-500 mt-1 leading-tight">
          Used only for recovery and notifications. See our <Link to="/privacy" className="text-brand-500 hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      <div>
        <Label>Recovery Passphrase <span className="text-gray-500 text-xs">(optional)</span></Label>
        <div className="relative">
          <Input
            type={showPassphrase ? 'text' : 'password'}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="pr-10"
            placeholder="Something memorable you won't forget"
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
        <p className="text-xs text-gray-500 mt-1">Hashed in your browser — never stored in plaintext.</p>
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
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default CreateGroupForm;
