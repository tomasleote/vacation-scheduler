import React, { useState, useMemo } from 'react';
import { getDatesBetween, formatDateRange } from '../utils/overlap';
import { Calendar as CalendarIcon, Users, Edit2, Play, ChevronLeft, ChevronRight, XIcon, PartyPopper, UserX, TrendingUp } from 'lucide-react';

function SlidingOverlapCalendar({ startDate, endDate, participants, duration, overlaps, onDurationChange }) {
    const [currentMonth, setCurrentMonth] = useState(new Date(startDate).getMonth());
    const [currentYear, setCurrentYear] = useState(new Date(startDate).getFullYear());
    const [hoveredDate, setHoveredDate] = useState(null);
    const [lockedDate, setLockedDate] = useState(null);
    const [localDuration, setLocalDuration] = useState(duration);

    // Keep local duration in sync if props change from outside
    React.useEffect(() => {
        setLocalDuration(duration);
    }, [duration]);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange = getDatesBetween(startDate, endDate);

    // 1. Calculate Daily Availability (Heatmap)
    const dailyAvailability = useMemo(() => {
        const counts = {};
        dateRange.forEach(dateStr => {
            let availableCount = 0;
            participants.forEach(p => {
                if (p.availableDays?.includes(dateStr)) {
                    availableCount++;
                }
            });
            counts[dateStr] = availableCount;
        });
        return counts;
    }, [dateRange, participants]);

    // 2. Calendar Pagination Logic
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

    const handlePrevMonth = () => {
        const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (new Date(newYear, newMonth, 1) >= new Date(start.getFullYear(), start.getMonth(), 1)) {
            setCurrentMonth(newMonth);
            setCurrentYear(newYear);
        }
    };

    const handleNextMonth = () => {
        const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        if (new Date(newYear, newMonth, 1) <= new Date(end.getFullYear(), end.getMonth(), 1)) {
            setCurrentMonth(newMonth);
            setCurrentYear(newYear);
        }
    };

    const monthName = monthYear.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // 3. Highlight Logic
    const isDateInRange = (dateStr) => dateRange.includes(dateStr);

    const getHighlightBlock = (startStr) => {
        if (!startStr) return [];

        // Find index of startStr in dateRange
        const startIndex = dateRange.indexOf(startStr);
        if (startIndex === -1) return [];

        // Return up to `duration` days from that index
        return dateRange.slice(startIndex, startIndex + parseInt(duration));
    };

    const activeBlock = getHighlightBlock(lockedDate || hoveredDate);

    const handleDayClick = (dateStr) => {
        if (!isDateInRange(dateStr)) return;

        const block = getHighlightBlock(dateStr);
        if (block.length < parseInt(duration)) return; // Don't allow selecting blocks that go out of bounds

        if (lockedDate === dateStr) {
            setLockedDate(null); // Toggle off
        } else {
            setLockedDate(dateStr);
        }
    };

    const getHeatmapColor = (count, max) => {
        if (max === 0) return 'bg-gray-100';
        if (count === 0) return 'bg-gray-100/50';

        const ratio = count / max;
        if (ratio >= 0.9) return 'bg-indigo-600 text-white font-bold';
        if (ratio >= 0.7) return 'bg-indigo-400 text-white font-semibold';
        if (ratio >= 0.4) return 'bg-indigo-200 text-indigo-900';
        if (ratio > 0) return 'bg-indigo-100 text-indigo-800';
        return 'bg-gray-100';
    };

    // 4. Details Panel Logic
    const getBlockDetails = () => {
        if (activeBlock.length === 0) return null;

        const reqDuration = parseInt(duration);

        const available = [];
        const unavailable = [];

        participants.forEach(p => {
            // Check if participant is available for ALL days in the activeBlock
            const isAvailable = activeBlock.every(day => p.availableDays?.includes(day));
            if (isAvailable && activeBlock.length === reqDuration) {
                available.push(p);
            } else {
                unavailable.push(p);
            }
        });

        return { available, unavailable, start: activeBlock[0], end: activeBlock[activeBlock.length - 1] };
    };

    const blockDetails = getBlockDetails();

    return (
        <div className="bg-white rounded-lg shadow-lg flex flex-col md:flex-row overflow-hidden border border-gray-200">

            {/* LEFT: Calendar Panel */}
            <div className="w-full md:w-[60%] p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={24} className="text-indigo-600" />
                        <h3 className="text-xl font-bold text-gray-800">Availability Heatmap</h3>
                    </div>
                    {onDurationChange ? (
                        <div className="flex items-center gap-1 bg-white pl-3 pr-1 py-1 rounded-full border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                            <input
                                type="number"
                                min="1"
                                max={dateRange.length}
                                value={localDuration}
                                onChange={(e) => {
                                    const valStr = e.target.value;
                                    setLocalDuration(valStr);

                                    // Apply dynamically if it's a valid number
                                    let val = parseInt(valStr);
                                    if (!isNaN(val) && val >= 1) {
                                        if (val > dateRange.length) val = dateRange.length;
                                        onDurationChange(String(val));
                                    }
                                }}
                                onBlur={() => {
                                    let val = parseInt(localDuration);
                                    if (isNaN(val) || val < 1) val = 1;
                                    if (val > dateRange.length) val = dateRange.length;
                                    setLocalDuration(String(val));
                                    onDurationChange(String(val));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.target.blur();
                                    }
                                }}
                                className="w-10 text-center text-sm text-indigo-700 font-bold bg-transparent outline-none p-0"
                            />
                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap pr-2">
                                -Day Period
                            </span>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            {duration}-Day Period
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-semibold text-gray-700 transition"
                        >
                            ← Prev
                        </button>
                        <h4 className="text-lg font-bold text-gray-800">{monthName}</h4>
                        <button
                            onClick={handleNextMonth}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-semibold text-gray-700 transition"
                        >
                            Next →
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-bold text-gray-500 text-xs py-2 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                        {days.map((day, i) => {
                            const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                            const inRange = day ? isDateInRange(dateStr) : false;

                            const count = inRange ? dailyAvailability[dateStr] : 0;
                            const maxParts = participants.length;

                            const isHighlighted = activeBlock.includes(dateStr);
                            const isStartOfBlock = activeBlock[0] === dateStr;
                            const isEndOfBlock = activeBlock[activeBlock.length - 1] === dateStr;

                            // Check if starting a block here would go out of bounds
                            const wouldBeValidBlock = getHighlightBlock(dateStr).length === parseInt(duration);

                            return (
                                <div key={i} className="relative aspect-square">
                                    {day ? (
                                        <button
                                            data-testid={dateStr ? `day-${dateStr}` : undefined}
                                            onMouseEnter={() => inRange && wouldBeValidBlock && !lockedDate && setHoveredDate(dateStr)}
                                            onMouseLeave={() => !lockedDate && setHoveredDate(null)}
                                            onClick={() => day && handleDayClick(dateStr)}
                                            disabled={!inRange || !wouldBeValidBlock}
                                            className={`
                        w-full h-full rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1
                         ${!inRange ? 'text-gray-300 cursor-not-allowed opacity-50' : 'cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1'}
                         ${isHighlighted ? 'ring-2 ring-indigo-600 shadow-md transform scale-[1.02] z-10' : ''}
                         ${inRange && !isHighlighted ? getHeatmapColor(count, maxParts) : ''}
                         ${isHighlighted ? 'bg-indigo-600 text-white font-bold' : ''}
                      `}
                                        >
                                            <span className="text-sm md:text-base">{day}</span>
                                            {inRange && maxParts > 0 && (
                                                <span className={`text-[10px] md:text-xs leading-none ${isHighlighted ? 'text-indigo-100' : 'opacity-70'}`}>
                                                    {count}/{maxParts}
                                                </span>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full h-full"></div>
                                    )}
                                    {/* Highlight connecting bar for contiguous days */}
                                    {isHighlighted && !isEndOfBlock && (new Date(dateStr).getDay() !== 6) && (
                                        <div className="absolute top-1/2 -right-1 md:-right-2 w-2 md:w-4 h-8 -translate-y-1/2 bg-indigo-600 z-0"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Heatmap Legend */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs md:text-sm text-gray-600">
                        <span>Least Available</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded bg-gray-100"></div>
                            <div className="w-4 h-4 rounded bg-indigo-100"></div>
                            <div className="w-4 h-4 rounded bg-indigo-200"></div>
                            <div className="w-4 h-4 rounded bg-indigo-400"></div>
                            <div className="w-4 h-4 rounded bg-indigo-600"></div>
                        </div>
                        <span>Most Available</span>
                    </div>

                </div>
            </div>

            {/* RIGHT: Details Panel */}
            <div className="w-full md:w-[40%] bg-white p-6 flex flex-col h-[500px] md:h-auto overflow-y-auto">

                {/* State 1: A block is highlighted or locked */}
                {activeBlock.length > 0 && blockDetails ? (
                    <div className="animate-in fade-in duration-200 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
                            <div>
                                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                    {lockedDate ? "Selected Period" : "Hovered Period"}
                                </h4>
                                <div className="text-xl md:text-2xl font-bold text-gray-800">
                                    {formatDateRange(blockDetails.start, blockDetails.end)}
                                </div>
                            </div>
                            <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-center font-bold shadow-sm">
                                <div className="text-2xl leading-none">{blockDetails.available.length}</div>
                                <div className="text-xs uppercase mt-1">Available</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            {/* Available Users List */}
                            <div>
                                <h5 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    <Users size={16} className="text-green-500" />
                                    Who can make it
                                </h5>
                                {blockDetails.available.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {blockDetails.available.map((p, i) => (
                                            <div key={i} className="bg-green-50 text-green-800 border border-green-200 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                                                {p.name || 'Unnamed'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Nobody is fully available for this period.</p>
                                )}
                            </div>

                            {/* Unavailable Users List */}
                            <div>
                                <h5 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    <UserX size={16} className="text-red-400" />
                                    Who is holding you back
                                </h5>
                                {blockDetails.unavailable.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {blockDetails.unavailable.map((p, i) => {
                                            // Calculate exactly how many days they are missing for THIS block
                                            const missingCount = activeBlock.filter(day => !p.availableDays?.includes(day)).length;
                                            return (
                                                <div key={i} className="flex justify-between items-center bg-red-50 text-red-900 border border-red-100 px-3 py-2 rounded-lg text-sm">
                                                    <span className="font-medium">{p.name || 'Unnamed'}</span>
                                                    <span className="text-xs text-red-600 bg-white px-2 py-0.5 rounded-full shadow-sm border border-red-100 font-semibold">
                                                        Missing {missingCount} day{missingCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="flex items-center justify-center gap-2 text-sm text-green-600 font-bold bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                        <PartyPopper size={18} /> Everyone can make it!
                                    </p>
                                )}
                            </div>
                        </div>

                        {lockedDate && (
                            <div className="pt-4 mt-auto border-t border-gray-100">
                                <button
                                    onClick={() => setLockedDate(null)}
                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}

                        {!lockedDate && (
                            <div className="pt-4 mt-auto">
                                <p className="text-xs text-center text-gray-400 font-medium">Click on a date to lock this selection.</p>
                            </div>
                        )}
                    </div>
                ) : (

                    /* State 2: No block is highlighted, show Top 3 Rankings */
                    <div className="h-full flex flex-col">
                        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                            <TrendingUp size={20} className="text-indigo-600" />
                            Top Overlap Periods
                        </h4>

                        {!overlaps || overlaps.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <CalendarIcon size={48} className="text-gray-300 mb-4" />
                                <p className="text-gray-600 font-medium mb-1">No matches found</p>
                                <p className="text-sm text-gray-400">Try lowering the duration or getting more participants to respond.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                {overlaps.slice(0, 3).map((overlap, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            // Navigate calendar to this month and lock it
                                            const overlapStart = new Date(overlap.startDate);
                                            setCurrentMonth(overlapStart.getMonth());
                                            setCurrentYear(overlapStart.getFullYear());
                                            setLockedDate(overlapStart.toISOString().split('T')[0]);
                                        }}
                                        className={`w-full text-left bg-white border rounded-xl p-4 transition-all duration-200 
                      ${i === 0 ? 'border-2 border-indigo-400 shadow-md hover:border-indigo-600' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}
                        `}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-bold text-gray-800">
                                                    {formatDateRange(overlap.startDate, overlap.endDate)}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                {overlap.availabilityPercent}%
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
                                            <span className="flex items-center gap-1"><Users size={12} /> {overlap.availableCount} of {overlap.totalParticipants} available</span>
                                        </div>
                                    </button>
                                ))}

                                <p className="text-xs text-center text-gray-400 mt-auto">
                                    Hover over the calendar to explore other options.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SlidingOverlapCalendar;
