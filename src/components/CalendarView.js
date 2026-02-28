import React, { useState, useEffect } from 'react';
import { getDatesBetween } from '../utils/overlap';
import { Calendar } from 'lucide-react';

function CalendarView({ startDate, endDate, onSubmit, savedDays = [], initialName = '', initialEmail = '', initialDuration = '3' }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [duration, setDuration] = useState(initialDuration);
  const [blockType, setBlockType] = useState('flexible');
  const [selectedDays, setSelectedDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate).getMonth());
  const [currentYear, setCurrentYear] = useState(new Date(startDate).getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dateRange = getDatesBetween(startDate, endDate);
  const start = new Date(startDate);
  const end = new Date(endDate);

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthYear = new Date(currentYear, currentMonth);
  const days = [];
  const startingDayOfWeek = firstDayOfMonth(monthYear);

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth(monthYear); i++) {
    days.push(i);
  }

  const handleDayClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (!isDateInRange(dateStr)) return;

    if (blockType === 'flexible') {
      setSelectedDays(prev => 
        prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
      );
    } else {
      selectDayBlock(dateStr, parseInt(blockType));
    }
  };

  const selectDayBlock = (startDateStr, blockSize) => {
    const blockStart = new Date(startDateStr);
    const blockDates = [];

    for (let i = 0; i < blockSize; i++) {
      const d = new Date(blockStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      if (isDateInRange(dateStr)) {
        blockDates.push(dateStr);
      } else {
        break;
      }
    }

    setSelectedDays(prev => Array.from(new Set([...prev, ...blockDates])));
  };

  const isDateInRange = (dateStr) => dateRange.includes(dateStr);

  const isDaySelected = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDays.includes(dateStr) || savedDays.includes(dateStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name,
        email,
        duration: parseInt(duration),
        blockType,
        selectedDays: selectedDays.sort()
      });
      setSelectedDays([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name,
        email,
        duration: parseInt(duration),
        blockType,
        selectedDays: []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    if (new Date(newYear, newMonth) >= new Date(start.getFullYear(), start.getMonth())) {
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    }
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    if (new Date(newYear, newMonth) <= new Date(end.getFullYear(), end.getMonth())) {
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    }
  };

  const monthName = monthYear.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">How long can you stay? *</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
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

      <button
        type="button"
        onClick={handleSaveDetails}
        disabled={loading}
        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Details Only'}
      </button>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Selection Mode</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="flexible"
              checked={blockType === 'flexible'}
              onChange={(e) => setBlockType(e.target.value)}
              className="mr-2"
            />
            <span>Flexible (pick individual days)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="3"
              checked={blockType === '3'}
              onChange={(e) => setBlockType(e.target.value)}
              className="mr-2"
            />
            <span>3-day block</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="4"
              checked={blockType === '4'}
              onChange={(e) => setBlockType(e.target.value)}
              className="mr-2"
            />
            <span>4-day block</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="5"
              checked={blockType === '5'}
              onChange={(e) => setBlockType(e.target.value)}
              className="mr-2"
            />
            <span>5-day block</span>
          </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold"
          >
            ← Prev
          </button>
          <h3 className="text-lg font-bold text-gray-800">{monthName}</h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-gray-600 text-xs p-2">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const inRange = day ? isDateInRange(dateStr) : false;
            const selected = day ? isDaySelected(day) : false;

            return (
              <button
                key={i}
                type="button"
                onClick={() => day && handleDayClick(day)}
                disabled={!inRange}
                className={`
                  aspect-square p-2 text-sm font-semibold rounded transition
                  ${!day ? 'bg-transparent' : ''}
                  ${!inRange ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : ''}
                  ${selected ? 'bg-indigo-600 text-white' : inRange ? 'bg-white border border-gray-300 hover:bg-indigo-50 text-gray-800' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {(selectedDays.length > 0 || savedDays.length > 0) && (
          <div className="bg-indigo-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              <strong>{Array.from(new Set([...savedDays, ...selectedDays])).length}</strong> day{Array.from(new Set([...savedDays, ...selectedDays])).length !== 1 ? 's' : ''} selected
              {savedDays.length > 0 && selectedDays.length > 0 && (
                <span className="text-gray-500"> ({savedDays.length} saved + {selectedDays.filter(d => !savedDays.includes(d)).length} new)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || selectedDays.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Calendar size={18} />
        {loading ? 'Submitting...' : 'Submit Availability'}
      </button>
    </form>
  );
}

export default CalendarView;
