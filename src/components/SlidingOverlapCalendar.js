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
        if (max === 0) return 'bg-dark-800';
        if (count === 0) return 'bg-dark-800/50';

        const ratio = count / max;
        if (ratio >= 0.9) return 'bg-blue-500 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)]';
        if (ratio >= 0.7) return 'bg-blue-600 text-white font-semibold';
        if (ratio >= 0.4) return 'bg-blue-800 text-blue-200';
        if (ratio > 0) return 'bg-blue-900/60 text-blue-300';
        return 'bg-dark-800';
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
        <div className="bg-dark-900 rounded-xl flex flex-col md:flex-row overflow-hidden border border-dark-700">

            {/* LEFT: Calendar Panel */}
            <div className="w-full md:w-[60%] p-6 border-b md:border-b-0 md:border-r border-dark-700 bg-dark-900">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={24} className="text-blue-400" />
                        <h3 className="text-xl font-bold text-gray-50">Availability Heatmap</h3>
                    </div>
                    {onDurationChange ? (
                        <div className="flex items-center gap-1 bg-dark-800 pl-3 pr-1 py-1 rounded-full border border-dark-700 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
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
                                className="w-10 text-center text-sm text-blue-400 font-bold bg-transparent outline-none p-0"
                            />
                            <span className="text-sm text-gray-400 font-medium whitespace-nowrap pr-2">
                                -Day Period
                            </span>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 font-medium bg-dark-800 px-3 py-1 rounded-full border border-dark-700">
                            {duration}-Day Period
                        </div>
                    )}
                </div>

                <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="px-3 py-1.5 bg-dark-700 hover:bg-dark-800 rounded-md text-sm font-semibold text-gray-300 transition"
                        >
                            ← Prev
                        </button>
                        <h4 className="text-lg font-bold text-gray-50">{monthName}</h4>
                        <button
                            onClick={handleNextMonth}
                            className="px-3 py-1.5 bg-dark-700 hover:bg-dark-800 rounded-md text-sm font-semibold text-gray-300 transition"
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
                         ${!inRange ? 'text-gray-600 cursor-not-allowed opacity-50' : 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:ring-offset-dark-800'}
                         ${isHighlighted ? 'ring-2 ring-blue-500 shadow-md transform scale-[1.02] z-10' : ''}
                         ${inRange && !isHighlighted ? getHeatmapColor(count, maxParts) : ''}
                         ${isHighlighted ? 'bg-blue-500 text-white font-bold' : ''}
                      `}
                                        >
                                            <span className="text-sm md:text-base">{day}</span>
                                            {inRange && maxParts > 0 && (
                                                <span className={`text-[10px] md:text-xs leading-none ${isHighlighted ? 'text-blue-100' : 'opacity-70'}`}>
                                                    {count}/{maxParts}
                                                </span>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full h-full"></div>
                                    )}
                                    {/* Highlight connecting bar for contiguous days */}
                                    {isHighlighted && !isEndOfBlock && (new Date(dateStr).getDay() !== 6) && (
                                        <div className="absolute top-1/2 -right-1 md:-right-2 w-2 md:w-4 h-8 -translate-y-1/2 bg-blue-500 z-0"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Heatmap Legend */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs md:text-sm text-gray-400">
                        <span>Least Available</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded bg-dark-800"></div>
                            <div className="w-4 h-4 rounded bg-blue-900/60"></div>
                            <div className="w-4 h-4 rounded bg-blue-800"></div>
                            <div className="w-4 h-4 rounded bg-blue-600"></div>
                            <div className="w-4 h-4 rounded bg-blue-500"></div>
                        </div>
                        <span>Most Available</span>
                    </div>

                </div>
            </div>

            {/* RIGHT: Details Panel */}
            <div className="w-full md:w-[40%] bg-dark-900 p-6 flex flex-col h-[500px] md:h-auto overflow-y-auto">

                {/* State 1: A block is highlighted or locked */}
                {activeBlock.length > 0 && blockDetails ? (
                    <div className="animate-in fade-in duration-200 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-dark-700">
                            <div>
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">
                                    {lockedDate ? "Selected Period" : "Hovered Period"}
                                </h4>
                                <div className="text-xl md:text-2xl font-bold text-gray-50">
                                    {formatDateRange(blockDetails.start, blockDetails.end)}
                                </div>
                            </div>
                            <div className="bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg text-center font-bold">
                                <div className="text-2xl leading-none">{blockDetails.available.length}</div>
                                <div className="text-xs uppercase mt-1">Available</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            {/* Available Users List */}
                            <div>
                                <h5 className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                                    <Users size={16} className="text-emerald-400" />
                                    Who can make it
                                </h5>
                                {blockDetails.available.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {blockDetails.available.map((p, i) => (
                                            <div key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-sm font-medium">
                                                {p.name || 'Unnamed'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic bg-dark-800 p-3 rounded-lg border border-dark-700">Nobody is fully available for this period.</p>
                                )}
                            </div>

                            {/* Unavailable Users List */}
                            <div>
                                <h5 className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                                    <UserX size={16} className="text-rose-400" />
                                    Who is holding you back
                                </h5>
                                {blockDetails.unavailable.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {blockDetails.unavailable.map((p, i) => {
                                            // Calculate exactly how many days they are missing for THIS block
                                            const missingCount = activeBlock.filter(day => !p.availableDays?.includes(day)).length;
                                            return (
                                                <div key={i} className="flex justify-between items-center bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 rounded-lg text-sm">
                                                    <span className="font-medium">{p.name || 'Unnamed'}</span>
                                                    <span className="text-xs text-rose-400 bg-dark-800 px-2 py-0.5 rounded-full border border-rose-500/20 font-semibold">
                                                        Missing {missingCount} day{missingCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                                        <PartyPopper size={18} /> Everyone can make it!
                                    </p>
                                )}
                            </div>
                        </div>

                        {lockedDate && (
                            <div className="pt-4 mt-auto border-t border-dark-700">
                                <button
                                    onClick={() => setLockedDate(null)}
                                    className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold rounded-lg border border-dark-700 transition"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}

                        {!lockedDate && (
                            <div className="pt-4 mt-auto">
                                <p className="text-xs text-center text-gray-500 font-medium">Click on a date to lock this selection.</p>
                            </div>
                        )}
                    </div>
                ) : (

                    /* State 2: No block is highlighted, show Top 3 Rankings */
                    <div className="h-full flex flex-col">
                        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-50 mb-6 pb-4 border-b border-dark-700">
                            <TrendingUp size={20} className="text-blue-400" />
                            Top Overlap Periods
                        </h4>

                        {!overlaps || overlaps.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-dark-800 rounded-xl border border-dashed border-dark-700">
                                <CalendarIcon size={48} className="text-gray-600 mb-4" />
                                <p className="text-gray-300 font-medium mb-1">No matches found</p>
                                <p className="text-sm text-gray-500">Try lowering the duration or getting more participants to respond.</p>
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
                                        className={`w-full text-left bg-dark-800 border rounded-xl p-4 transition-all duration-200
                      ${i === 0 ? 'border-2 border-blue-500/50 shadow-md hover:border-blue-400' : 'border-dark-700 hover:border-dark-700 hover:shadow-sm'}
                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${i === 0 ? 'bg-blue-500 text-white' : 'bg-dark-700 text-gray-300'}
                        `}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-bold text-gray-50">
                                                    {formatDateRange(overlap.startDate, overlap.endDate)}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                {overlap.availabilityPercent}%
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-400 ml-8">
                                            <span className="flex items-center gap-1"><Users size={12} /> {overlap.availableCount} of {overlap.totalParticipants} available</span>
                                        </div>
                                    </button>
                                ))}

                                <p className="text-xs text-center text-gray-500 mt-auto">
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
