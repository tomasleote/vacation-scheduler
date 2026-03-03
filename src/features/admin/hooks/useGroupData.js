import { useState, useEffect, useMemo } from 'react';
import { subscribeToGroup } from '../../../services/groupService';
import { getParticipant, subscribeToParticipants } from '../../../services/participantService';
import { validateAdminToken } from '../../../services/adminService';
import { calculateOverlap } from '../../../utils/overlap';

export function useGroupData(groupId, adminToken, onBack) {
  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState({});
  const [durationFilter, setDurationFilter] = useState('3');

  // Admin participant state
  const [adminParticipantId, setAdminParticipantId] = useState(null);
  const [adminSavedDays, setAdminSavedDays] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminDuration, setAdminDuration] = useState('3');

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

      try { localStorage.setItem(`fad_admin_${groupId}`, adminToken); } catch { }

      try {
        const stored = localStorage.getItem(`fad_admin_p_${groupId}`);
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
        setError(null);
        if (data) {
          setGroup(data);
          setEditData(prev => Object.keys(prev).length === 0 ? data : prev);

          const { isSingleDayEvent } = require('../../../utils/eventTypes');
          if (isSingleDayEvent(data.eventType)) {
            setDurationFilter('1');
            setAdminDuration('1');
          } else {
            setDurationFilter('3');
            setAdminDuration('3');
          }
        } else {
          setGroup(null);
          setEditData({});
        }
        onLoad();
      }, (err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load group data.');
        onLoad();
      });

      unsubParts = subscribeToParticipants(groupId, (data) => {
        if (!isMounted) return;
        setError(null);
        setParticipants(data || []);
        onLoad();
      }, (err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load participants.');
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
  }, [groupId, adminToken, onBack]);

  const overlaps = useMemo(() => {
    if (group && participants?.length > 0) {
      return calculateOverlap(
        participants,
        group.startDate,
        group.endDate,
        parseInt(durationFilter)
      );
    }
    return [];
  }, [group, participants, durationFilter]);

  return {
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
  };
}
