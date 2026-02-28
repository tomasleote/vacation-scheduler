import React, { useState, useEffect } from 'react';
import { getDatesBetween } from '../utils/overlap';
import { Calendar, User, Mail, Clock, Sparkles, CalendarRange } from 'lucide-react';

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

  // Custom block size input state (if not flexible)
  const [customBlockSize, setCustomBlockSize] = useState(() => {
    return (initialDuration && initialDuration !== 'flexible') ? String(initialDuration) : '3';
  });
  const [localDuration, setLocalDuration] = useState(String(initialDuration));
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
      selectDayBlock(dateStr, parseInt(customBlockSize));
    }
  };

  const selectDayBlock = (startDateStr, blockSize) => {
    const blockStart = new Date(startDateStr);
    const blockDates = [];

    // BUG-J fix: no break — iterate the full window and only include in-range dates
    // (clamps naturally to the allowed range without stopping at the first gap)
    for (let i = 0; i < blockSize; i++) {
      const d = new Date(blockStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      if (isDateInRange(dateStr)) {
        blockDates.push(dateStr);
      }
    }

    // BUG-H fix: toggle — if every date in the block is already selected, deselect all of them
    setSelectedDays(prev => {
      const allSelected = blockDates.length > 0 && blockDates.every(d => prev.includes(d));
      if (allSelected) {
        return prev.filter(d => !blockDates.includes(d));
      }
      return Array.from(new Set([...prev, ...blockDates]));
    });
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
        duration: parseInt(localDuration),
        blockType: blockType === 'flexible' ? 'flexible' : String(customBlockSize),
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
        duration: parseInt(localDuration),
        blockType: blockType === 'flexible' ? 'flexible' : String(customBlockSize),
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full relative">
      {/* --- DASHBOARD ROW --- */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 shrink-0">

        <div className="flex flex-wrap items-center gap-3">

          {/* Name Pill */}
          <div className="relative group flex-1 min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              required
              className="w-full bg-gray-50 hover:bg-white text-gray-800 font-medium pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="Your Name *"
              maxLength="30"
            />
          </div>

          {/* Email Pill */}
          <div className="relative group flex-1 min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 hover:bg-white text-gray-800 font-medium pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="Email (optional)"
            />
          </div>

          {/* Duration Pill */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all shrink-0">
            <Clock size={16} className="text-gray-400" />
            <input
              type="number"
              min="1"
              max={dateRange.length}
              value={localDuration}
              onChange={(e) => setLocalDuration(e.target.value)}
              onBlur={() => {
                let val = parseInt(localDuration);
                if (isNaN(val) || val < 1) val = 1;
                if (val > dateRange.length) val = dateRange.length;
                const strVal = String(val);
                setLocalDuration(strVal);
                setDuration(strVal);
              }}
              className="w-8 text-center bg-transparent font-bold text-gray-800 focus:outline-none p-0"
            />
            <span className="text-gray-600 font-medium pr-2 text-sm">days trip</span>
          </div>

          {/* Segmented Control - Selection Mode */}
          <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => setBlockType('flexible')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${blockType === 'flexible'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Sparkles size={16} className={blockType === 'flexible' ? 'text-indigo-500' : 'text-gray-400'} />
              Flexible
            </button>
            <button
              type="button"
              onClick={() => setBlockType('custom')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${blockType !== 'flexible'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <CalendarRange size={16} className={blockType !== 'flexible' ? 'text-indigo-500' : 'text-gray-400'} />
              Block

              {/* Embedded Block Size Input */}
              {blockType !== 'flexible' && (
                <input
                  type="number"
                  min="1"
                  max={dateRange.length}
                  value={customBlockSize}
                  onChange={(e) => setCustomBlockSize(e.target.value)}
                  onBlur={() => {
                    let val = parseInt(customBlockSize);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > dateRange.length) val = dateRange.length;
                    setCustomBlockSize(String(val));
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent toggling the button when clicking the input
                  className="w-8 text-center bg-indigo-50 font-bold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded-md p-0"
                />
              )}
            </button>
          </div>

          {/* Save Details Only Pill */}
          <button
            type="button"
            onClick={handleSaveDetails}
            disabled={loading}
            className="flex items-center justify-center shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-full transition-all border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 h-[38px] my-auto"
          >
            {loading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
      {/* --- END DASHBOARD ROW --- */}

      {/* --- CALENDAR GRID AREA --- */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 shrink-0">

        {/* Month Navigation Row */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition"
          >
            ← Prev
          </button>
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">{monthName}</h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-gray-400 text-xs py-2 uppercase tracking-wide">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const inRange = day ? isDateInRange(dateStr) : false;
            const selected = day ? isDaySelected(day) : false;

            const ariaLabel = day
              ? `${monthName}, day ${day}${selected ? ' (selected)' : ''}`
              : undefined;
            const testId = day
              ? `day-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : undefined;

            return (
              <button
                key={i}
                type="button"
                onClick={() => day && handleDayClick(day)}
                disabled={!inRange}
                aria-label={ariaLabel}
                data-testid={testId}
                className={`
                  aspect-square p-2 text-sm md:text-base font-bold rounded-xl transition-all duration-200
                  ${!day ? 'bg-transparent' : ''}
                  ${!inRange ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : ''}
                  ${selected ? 'bg-indigo-600 text-white shadow-md transform scale-[1.02]' : inRange ? 'bg-white border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Dynamic Selection Counter */}
        {(selectedDays.length > 0 || savedDays.length > 0) && (
          <div className="bg-indigo-50 text-indigo-800 p-3 rounded-xl border border-indigo-100 mt-6 flex justify-center items-center gap-2 font-medium">
            <span data-testid="day-count">
              <strong>{Array.from(new Set([...savedDays, ...selectedDays])).length}</strong> day{Array.from(new Set([...savedDays, ...selectedDays])).length !== 1 ? 's' : ''} selected
            </span>
            {savedDays.length > 0 && selectedDays.length > 0 && (
              <span className="text-indigo-500 text-sm"> ({savedDays.length} saved + {selectedDays.filter(d => !savedDays.includes(d)).length} new)</span>
            )}
          </div>
        )}

        {/* Global Error Message */}
        {error && (
          <div className="mt-6 mb-2">
            <p className="text-red-600 font-bold text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading || (selectedDays.length === 0 && savedDays.length === 0)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-95"
          >
            <Calendar size={18} />
            {loading ? 'Submitting...' : 'Submit Availability'}
          </button>
        </div>

      </div>
      {/* --- END CALENDAR GRID AREA --- */}
    </form>
  );
}

export default CalendarView;
