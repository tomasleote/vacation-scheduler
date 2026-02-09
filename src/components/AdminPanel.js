import React, { useState, useEffect } from 'react';
import { getGroup, updateGroup, getParticipants, deleteGroup } from '../firebase';
import { calculateOverlap, getBestOverlapPeriods, formatDateRange } from '../utils/overlap';
import { exportToCSV } from '../utils/export';
import { Copy, Download, Edit, Save, X, Mail } from 'lucide-react';
import ResultsDisplay from './ResultsDisplay';

function AdminPanel({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [copied, setCopied] = useState(false);
  const [durationFilter, setDurationFilter] = useState('3');
  const [overlaps, setOverlaps] = useState([]);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [groupId]);

  useEffect(() => {
    if (group && participants.length > 0) {
      const results = calculateOverlap(
        participants,
        group.startDate,
        group.endDate,
        parseInt(durationFilter)
      );
      setOverlaps(results);
    }
  }, [group, participants, durationFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      const participantsData = await getParticipants(groupId);
      
      if (!groupData) {
        setError('Group not found');
        return;
      }

      setGroup(groupData);
      setEditData(groupData);
      setParticipants(participantsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    try {
      await updateGroup(groupId, editData);
      setGroup(editData);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure? This will delete the entire group and all data.')) return;
    try {
      await deleteGroup(groupId);
      onBack();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = () => {
    if (group && participants.length > 0) {
      exportToCSV(group, participants, overlaps);
    }
  };

  const handleSendReminder = async () => {
    try {
      await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          groupName: group.name,
          adminEmail: group.adminEmail,
          participantCount: participants.length,
          daysRemaining: Math.ceil((new Date(group.startDate) - new Date()) / (1000 * 60 * 60 * 24))
        })
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setError('Failed to send reminder');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Group not found'}</p>
          <button
            onClick={onBack}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex-1 text-center">Admin Panel</h1>
          <div className="w-20"></div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{group.name}</h2>
              <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                <span>📅 {group.startDate} to {group.endDate}</span>
                <span>👥 {participants.length} participants</span>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              {editing ? <X size={24} /> : <Edit size={24} />}
            </button>
          </div>

          {!editing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Group ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{groupId}</code></span>
                <button
                  onClick={handleCopyId}
                  className="text-indigo-600 hover:text-indigo-700"
                  title="Copy to clipboard"
                >
                  <Copy size={18} />
                </button>
                {copied && <span className="text-green-600 text-sm">Copied!</span>}
              </div>
              {group.adminEmail && <div className="text-gray-700">📧 Admin: {group.adminEmail}</div>}
            </div>
          )}

          {editing && (
            <div className="space-y-4 border-t pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                disabled={participants.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={18} /> Export CSV
              </button>
              <button
                onClick={handleSendReminder}
                disabled={!group.adminEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail size={18} /> Send Reminder
              </button>
              {emailSent && <p className="text-green-600 text-sm text-center">Email sent!</p>}
              <button
                onClick={handleDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Delete Group
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Filter by Duration</h3>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1">1 day</option>
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="7">1 week</option>
              <option value="10">10 days</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Statistics</h3>
            <div className="space-y-2 text-sm">
              <p>Total participants: <span className="font-bold">{participants.length}</span></p>
              <p>Possible periods: <span className="font-bold">{overlaps.length}</span></p>
              {overlaps.length > 0 && (
                <p>Best match: <span className="font-bold">{overlaps[0].availabilityPercent}%</span></p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Participants ({participants.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Days Available</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{p.name || 'N/A'}</td>
                    <td className="px-4 py-2">{p.email || 'N/A'}</td>
                    <td className="px-4 py-2">{p.duration} days</td>
                    <td className="px-4 py-2">{(p.availableDays || []).length}</td>
                  </tr>
                ))}
                {participants.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                      No participants yet. Share the group ID: <code className="bg-gray-100 px-2 py-1 rounded">{groupId}</code>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {overlaps.length > 0 && (
          <ResultsDisplay overlaps={getBestOverlapPeriods(overlaps, 10)} />
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
