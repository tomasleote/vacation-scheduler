import React, { useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getDatesBetween, formatDateRange, getTopFilteredOverlaps } from '../utils/overlap';
import { Calendar as CalendarIcon, Users, Edit2, Play, ChevronLeft, ChevronRight, XIcon, PartyPopper, UserX, TrendingUp, Vote } from 'lucide-react';
import { TruncatedText } from '../shared/ui';

/**
 * SlidingOverlapCalendar component displays a visual heatmap of availability
 * and allows users to select an overlap period.
 *
 * @param {Object} props
 * @param {Date|string} props.startDate - The start date of the date range
 * @param {Date|string} props.endDate - The end date of the date range
 * @param {Array} props.participants - List of participants with their availableDays
 * @param {number|string} props.duration - The requested event duration in days
 * @param {Array} props.overlaps - The calculated overlap periods
 * @param {Function} [props.onDurationChange] - Callback when duration changes
 * @param {boolean} [props.singleDay=false] - Whether this is a single day selection mode
 * @param {Function} [props.renderSelectedAction] - Optional render prop for a custom action button or content.
 *   Signature: `(selection) => ReactNode`
 *   The `selection` object contains:
 *   - `startDate` {string|Date}: The start date of the selected block
 *   - `endDate` {string|Date}: The end date of the selected block
 *   - `availableCount` {number}: The number of participants available for this block
 * @param {Object} [props.availabilityMap] - The mapped data for participant availability
 * @param {Object} [props.dailyCounts] - Granular integer map of counts
 */
const SlidingOverlapCalendar = forwardRef(function SlidingOverlapCalendar({ startDate, endDate, participants, availabilityMap = {}, dailyCounts = {}, duration, overlaps, onDurationChange, singleDay = false, renderSelectedAction, votingMode, highlightedCandidates }, ref) {
    const [currentMonth, setCurrentMonth] = useState(new Date(startDate).getMonth());
    const [currentYear, setCurrentYear] = useState(new Date(startDate).getFullYear());
    const [hoveredDate, setHoveredDate] = useState(null);
    const [lockedDate, setLockedDate] = useState(null);
    const [localDuration, setLocalDuration] = useState(duration);
    const [debouncedDuration, setDebouncedDuration] = useState(duration);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [hoveredCandidateId, setHoveredCandidateId] = useState(null);

    useImperativeHandle(ref, () => ({
        clearSelection: () => {
            setSelectedCandidateId(null);
            setHoveredCandidateId(null);
            setLockedDate(null);
        },
    }), []);

    const { start, end, dateRange } = useMemo(() => ({
        start: new Date(startDate),
        end: new Date(endDate),
        dateRange: getDatesBetween(startDate, endDate)
    }), [startDate, endDate]);

    // Keep local duration in sync if props change from outside
    React.useEffect(() => {
        setLocalDuration(duration);
    }, [duration]);

    // Debounce the duration input
    React.useEffect(() => {
        const handler = setTimeout(() => {
            let val = parseInt(localDuration);
            if (!isNaN(val) && val >= 1) {
                if (val > (dateRange?.length || 100)) val = dateRange.length;
                setDebouncedDuration(String(val));
                if (onDurationChange && String(val) !== String(duration)) {
                    onDurationChange(String(val));
                }
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [localDuration, dateRange?.length, duration, onDurationChange]);

    // 1. Calculate Daily Availability (Heatmap)
    const dailyAvailability = useMemo(() => {
        // Fallback: If `dailyCounts` doesn't exist yet, we parse via `availabilityMap`
        // or old `participants` in this transitional period.
        if (Object.keys(dailyCounts).length > 0) {
            return dailyCounts;
        }

        // Pre-convert each participant's available days to a Set for O(1) lookups
        const pSets = participants.map(p => {
            const datesObj = availabilityMap[p.id] || {};
            const datesFromMap = Object.keys(datesObj).filter(k => datesObj[k]);
            return new Set(datesFromMap.length > 0 ? datesFromMap : (p.availableDays || []));
        });

        const counts = {};
        dateRange.forEach(dateStr => {
            let availableCount = 0;
            pSets.forEach(s => { if (s.has(dateStr)) availableCount++; });
            counts[dateStr] = availableCount;
        });
        return counts;
    }, [dateRange, participants, availabilityMap, dailyCounts]);

    // Maps each date string to an array of its candidateIds when voting is active
    const candidateDateMap = useMemo(() => {
        if (!votingMode?.active || !votingMode.poll?.candidates) return {};
        const map = {};
        Object.entries(votingMode.poll.candidates).forEach(([id, c]) => {
            getDatesBetween(c.startDate, c.endDate).forEach(d => {
                if (!map[d]) map[d] = [];
                map[d].push(id);
            });
        });
        return map;
    }, [votingMode]);

    // Ordered array of candidates for display (sorted by label)
    const orderedCandidates = useMemo(() => {
        if (!votingMode?.active || !votingMode.poll?.candidates) return [];
        return Object.entries(votingMode.poll.candidates)
            .map(([id, c]) => ({ id, ...c }))
            .sort((a, b) => a.label - b.label);
    }, [votingMode]);

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
    const dateRangeSet = useMemo(() => new Set(dateRange), [dateRange]);
    const dateIndexMap = useMemo(() => {
        const map = new Map();
        dateRange.forEach((d, i) => map.set(d, i));
        return map;
    }, [dateRange]);

    const isDateInRange = useCallback((dateStr) => dateRangeSet.has(dateStr), [dateRangeSet]);

    const getHighlightBlock = (startStr) => {
        if (!startStr) return [];
        const startIndex = dateIndexMap.get(startStr);
        if (startIndex === undefined) return [];
        return dateRange.slice(startIndex, startIndex + parseInt(duration));
    };

    const activeCandidateId = votingMode?.active
        ? (selectedCandidateId || hoveredCandidateId)
        : null;

    const activeBlock = (() => {
        if (votingMode?.active && activeCandidateId) {
            const candidate = votingMode.poll?.candidates?.[activeCandidateId];
            return candidate ? getDatesBetween(candidate.startDate, candidate.endDate) : [];
        }
        return getHighlightBlock(lockedDate || hoveredDate);
    })();

    // Unified "is something locked" across both modes
    const isLocked = votingMode?.active ? Boolean(selectedCandidateId) : Boolean(lockedDate);

    const clearSelection = () => {
        if (votingMode?.active) {
            setSelectedCandidateId(null);
        } else {
            setLockedDate(null);
        }
    };

    const handleDayClick = (dateStr) => {
        if (votingMode?.active) {
            const cids = candidateDateMap[dateStr];
            if (!cids || cids.length === 0) return;
            // Select the best candidate (default to first, or toggle)
            const activeIds = cids.filter(cid => cid === selectedCandidateId);
            if (activeIds.length > 0) {
                setSelectedCandidateId(null); // toggle off
            } else {
                setSelectedCandidateId(cids[0]);
                setHoveredCandidateId(null);
            }
            return;
        }

        // Original logic
        if (!isDateInRange(dateStr)) return;
        const block = getHighlightBlock(dateStr);
        if (block.length < parseInt(duration)) return;
        if (lockedDate === dateStr) {
            setLockedDate(null);
        } else {
            setLockedDate(dateStr);
        }
    };

    const getHeatmapColor = (count, max) => {
        if (max === 0) return 'bg-dark-800';
        if (count === 0) return 'bg-dark-800/50';

        const ratio = count / max;
        if (ratio >= 0.9) return 'bg-brand-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.3)]';
        if (ratio >= 0.7) return 'bg-brand-600 text-white font-semibold';
        if (ratio >= 0.4) return 'bg-amber-500 text-amber-100';
        if (ratio > 0) return 'bg-brand-900/60 text-brand-300';
        return 'bg-dark-800';
    };

    // 4. Details Panel Logic
    const getBlockDetails = () => {
        if (activeBlock.length === 0) return null;

        // In voting mode the candidate defines its own duration
        const reqDuration = votingMode?.active ? activeBlock.length : parseInt(duration);

        const available = [];
        const unavailable = [];

        participants.forEach(p => {
            // Check if participant is available for ALL days in the activeBlock
            const datesObj = availabilityMap[p.id] || {};
            const availableDays = Object.keys(datesObj).length > 0 ? Object.keys(datesObj).filter(k => datesObj[k]) : (p.availableDays || []);

            const isAvailable = activeBlock.every(day => availableDays.includes(day));
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
                        <CalendarIcon size={24} className="text-brand-400" />
                        <h3 className="text-xl font-bold text-gray-50">Availability Heatmap</h3>
                    </div>
                    {!votingMode?.active && onDurationChange && !singleDay ? (
                        <div className="flex items-center gap-1 bg-dark-800 pl-3 pr-1 py-1 rounded-full border border-dark-700 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500">
                            <input
                                type="number"
                                min="1"
                                max={dateRange.length}
                                value={localDuration}
                                onChange={(e) => {
                                    const valStr = e.target.value;
                                    // State is updated; debounced effect handles the callback
                                    setLocalDuration(valStr);
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
                                className="w-10 text-center text-sm text-brand-400 font-bold bg-transparent outline-none p-0"
                            />
                            <span className="text-sm text-gray-400 font-medium whitespace-nowrap pr-2">
                                -Day Period
                            </span>
                        </div>
                    ) : !votingMode?.active ? (
                        <div className="text-sm text-gray-400 font-medium bg-dark-800 px-3 py-1 rounded-full border border-dark-700">
                            {singleDay ? 'Single Day' : `${duration}-Day Period`}
                        </div>
                    ) : null}
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

                            const effectivelyDisabled = votingMode?.active
                                ? (!candidateDateMap[dateStr] || candidateDateMap[dateStr].length === 0)
                                : (!inRange || !wouldBeValidBlock);

                            return (
                                <div key={i} className="relative aspect-square">
                                    {day ? (
                                        <button
                                            data-testid={dateStr ? `day-${dateStr}` : undefined}
                                            onMouseEnter={() => {
                                                if (votingMode?.active) {
                                                    const cids = candidateDateMap[dateStr];
                                                    if (cids && cids.length > 0 && !selectedCandidateId) setHoveredCandidateId(cids[0]);
                                                    return;
                                                }
                                                inRange && wouldBeValidBlock && !lockedDate && setHoveredDate(dateStr);
                                            }}
                                            onMouseLeave={() => {
                                                if (votingMode?.active) {
                                                    if (!selectedCandidateId) setHoveredCandidateId(null);
                                                    return;
                                                }
                                                !lockedDate && setHoveredDate(null);
                                            }}
                                            onClick={() => day && handleDayClick(dateStr)}
                                            disabled={effectivelyDisabled}
                                            className={`
                        w-full h-full rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1
                         ${effectivelyDisabled ? 'text-gray-600 cursor-not-allowed opacity-20' : 'cursor-pointer hover:ring-2 hover:ring-brand-400 hover:ring-offset-1 hover:ring-offset-dark-800'}
                         ${isHighlighted ? 'ring-2 ring-brand-500 shadow-md transform scale-[1.02] z-10' : ''}
                         ${!votingMode?.active && highlightedCandidates?.some(c => getDatesBetween(c.startDate, c.endDate).includes(dateStr)) && !isHighlighted
                                                    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-dark-800'
                                                    : ''}
                         ${!effectivelyDisabled && !isHighlighted ? getHeatmapColor(count, maxParts) : ''}
                         ${activeBlock.length > 0 && !effectivelyDisabled && !isHighlighted ? 'opacity-30' : ''}
                         ${isHighlighted ? 'bg-brand-500 text-white font-bold' : ''}
                      `}
                                        >
                                            <span className="text-sm md:text-base">{day}</span>
                                            {inRange && maxParts > 0 && (
                                                <span className={`text-[10px] md:text-xs leading-none ${isHighlighted ? 'text-brand-100' : 'opacity-70'}`}>
                                                    {count}/{maxParts}
                                                </span>
                                            )}

                                            {/* Candidate number label — voting mode active */}
                                            {votingMode?.active && (() => {
                                                const cids = candidateDateMap[dateStr];
                                                if (!cids || cids.length === 0) return null;
                                                return (
                                                    <div className="absolute top-0.5 left-0.5 flex gap-0.5 pointer-events-none z-20">
                                                        {cids.map(cid => {
                                                            const candidate = votingMode.poll?.candidates?.[cid];
                                                            if (!candidate || candidate.startDate !== dateStr) return null;
                                                            return (
                                                                <span key={cid} className="w-4 h-4 flex items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-bold shadow-[0_0_2px_rgba(0,0,0,0.5)]">
                                                                    {candidate.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}

                                            {/* Candidate number label — admin setup mode (highlightedCandidates) */}
                                            {!votingMode?.active && highlightedCandidates && (() => {
                                                const idx = highlightedCandidates.findIndex(c => c.startDate === dateStr);
                                                if (idx < 0) return null;
                                                return (
                                                    <span className="absolute top-0.5 left-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-amber-400 text-dark-900 text-[9px] font-bold z-20">
                                                        {idx + 1}
                                                    </span>
                                                );
                                            })()}

                                            {/* Vote checkmark */}
                                            {votingMode?.active && (() => {
                                                const cids = candidateDateMap[dateStr];
                                                if (!cids || cids.length === 0) return null;
                                                const myVote = votingMode.poll?.votes?.[votingMode.currentParticipantId];
                                                const votedCids = cids.filter(cid => myVote?.candidateIds?.includes(cid) && votingMode.poll?.candidates?.[cid] && getDatesBetween(votingMode.poll.candidates[cid].startDate, votingMode.poll.candidates[cid].endDate).includes(dateStr));
                                                if (votedCids.length === 0) return null;
                                                return (
                                                    <div className="absolute top-0.5 right-0.5 flex gap-0.5 z-20">
                                                        {votedCids.map(cid => (
                                                            <span key={cid} className="text-emerald-400 text-[10px] font-bold drop-shadow-md">✓</span>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </button>
                                    ) : (
                                        <div className="w-full h-full"></div>
                                    )}
                                    {/* Highlight connecting bar for contiguous days */}
                                    {isHighlighted && !isEndOfBlock && (new Date(dateStr).getDay() !== 6) && (
                                        <div className="absolute top-1/2 -right-1 md:-right-2 w-2 md:w-4 h-8 -translate-y-1/2 bg-brand-500 z-0"></div>
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
                            <div className="w-4 h-4 rounded bg-brand-900/60"></div>
                            <div className="w-4 h-4 rounded bg-amber-500"></div>
                            <div className="w-4 h-4 rounded bg-brand-600"></div>
                            <div className="w-4 h-4 rounded bg-brand-500"></div>
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
                                <h4 className="text-sm font-bold text-brand-400 uppercase tracking-wider mb-1">
                                    {lockedDate ? (singleDay ? "Selected Date" : "Selected Period") : (singleDay ? "Hovered Date" : "Hovered Period")}
                                </h4>
                                <div className="text-xl md:text-2xl font-bold text-gray-50">
                                    {formatDateRange(blockDetails.start, blockDetails.end)}
                                </div>
                            </div>
                            <div className="bg-brand-500/10 text-brand-400 px-3 py-2 rounded-lg text-center font-bold">
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
                                {blockDetails?.available?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {blockDetails.available.map((p, i) => (
                                            <div key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-sm font-medium">
                                                <TruncatedText text={p.name || 'Unnamed'} maxWidth="150px" />
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
                                {blockDetails?.unavailable?.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {blockDetails.unavailable.map((p, i) => {
                                            const datesObj = availabilityMap[p.id] || {};
                                            const availableDays = Object.keys(datesObj).length > 0 ? Object.keys(datesObj).filter(k => datesObj[k]) : (p.availableDays || []);
                                            // Calculate exactly how many days they are missing for THIS block
                                            const missingCount = activeBlock.filter(day => !availableDays.includes(day)).length;
                                            return (
                                                <div key={i} className="flex justify-between items-center bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 rounded-lg text-sm">
                                                    <span className="font-medium">
                                                        <TruncatedText text={p.name || 'Unnamed'} maxWidth="150px" />
                                                    </span>
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

                        {isLocked && (
                            <div className="pt-4 mt-auto border-t border-dark-700 space-y-3">
                                {renderSelectedAction && renderSelectedAction({
                                    startDate: blockDetails.start,
                                    endDate: blockDetails.end,
                                    availableCount: blockDetails.available.length,
                                    candidateId: activeCandidateId,
                                })}
                                <button
                                    onClick={clearSelection}
                                    className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold rounded-lg border border-dark-700 transition"
                                >
                                    {votingMode?.active ? 'Deselect Period' : 'Clear Selection'}
                                </button>
                            </div>
                        )}

                        {!isLocked && (
                            <div className="pt-4 mt-auto">
                                <p className="text-xs text-center text-gray-500 font-medium">
                                    {votingMode?.active
                                        ? 'Click a highlighted period to vote.'
                                        : 'Click on a date to lock this selection.'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (

                    /* State 2: No block is highlighted */
                    <div className="h-full flex flex-col">
                        {votingMode?.active ? (
                            /* Voting mode: show candidates list */
                            <>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-50 mb-6 pb-4 border-b border-dark-700">
                                    <Vote size={20} className="text-brand-400" />
                                    {votingMode.poll?.status === 'closed' ? 'Poll Results' : 'Vote on a Period'}
                                </h4>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {orderedCandidates.map((candidate) => {
                                        const votes = votingMode.poll?.votes || {};
                                        const voteCount = Object.values(votes).filter(v =>
                                            v.candidateIds?.includes(candidate.id)
                                        ).length;
                                        const totalVoters = Object.keys(votes).length;
                                        const myVote = votes[votingMode.currentParticipantId];
                                        const hasVoted = myVote?.candidateIds?.includes(candidate.id);
                                        const isWinner = votingMode.poll?.status === 'closed' && voteCount === Math.max(
                                            ...Object.entries(votingMode.poll.candidates).map(([id]) =>
                                                Object.values(votes).filter(v => v.candidateIds?.includes(id)).length
                                            )
                                        ) && voteCount > 0;

                                        return (
                                            <button
                                                key={candidate.id}
                                                onClick={() => {
                                                    const month = new Date(candidate.startDate);
                                                    setCurrentMonth(month.getMonth());
                                                    setCurrentYear(month.getFullYear());
                                                    setSelectedCandidateId(candidate.id);
                                                }}
                                                className={`w-full text-left rounded-xl p-4 transition-all duration-200 border ${isWinner
                                                    ? 'border-2 border-brand-500/70 bg-brand-500/10'
                                                    : hasVoted
                                                        ? 'border-emerald-500/40 bg-emerald-500/5'
                                                        : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isWinner ? 'bg-brand-500 text-white' : 'bg-dark-700 text-gray-300'
                                                            }`}>
                                                            {candidate.label}
                                                        </span>
                                                        <span className="font-bold text-gray-50 text-sm">
                                                            {formatDateRange(candidate.startDate, candidate.endDate)}
                                                        </span>
                                                    </div>
                                                    {hasVoted && <span className="text-emerald-400 text-xs font-bold">✓ Voted</span>}
                                                    {isWinner && <span className="text-brand-400 text-xs font-bold">Winner</span>}
                                                </div>
                                                <div className="ml-8">
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                        <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                                                        <span>{totalVoters > 0 ? Math.round(voteCount / totalVoters * 100) : 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-brand-500 transition-all duration-500"
                                                            style={{ width: `${totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {orderedCandidates.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center">No candidates yet.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Normal mode: existing Top Overlaps list */
                            <>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-50 mb-6 pb-4 border-b border-dark-700">
                                    <TrendingUp size={20} className="text-brand-400" />
                                    {singleDay ? 'Top Overlap Dates' : 'Top Overlap Periods'}
                                </h4>

                                {(() => {
                                    const topFilteredOverlaps = getTopFilteredOverlaps(overlaps);

                                    if (!topFilteredOverlaps || topFilteredOverlaps.length === 0) {
                                        return (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-dark-800 rounded-xl border border-dashed border-dark-700">
                                                <CalendarIcon size={48} className="text-gray-600 mb-4" />
                                                <p className="text-gray-300 font-medium mb-1">No matches &gt; 50% found</p>
                                                <p className="text-sm text-gray-500">Try lowering the duration or getting more participants to respond.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                            {topFilteredOverlaps.map((overlap, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        const overlapStart = new Date(overlap.startDate);
                                                        setCurrentMonth(overlapStart.getMonth());
                                                        setCurrentYear(overlapStart.getFullYear());
                                                        setLockedDate(overlapStart.toISOString().split('T')[0]);
                                                    }}
                                                    className={`w-full text-left bg-dark-800 border rounded-xl p-4 transition-all duration-200
                                                ${i === 0 ? 'border-2 border-brand-500/50 shadow-md hover:border-brand-400' : 'border-dark-700 hover:border-dark-700 hover:shadow-sm'}
                                            `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                                        ${i === 0 ? 'bg-brand-500 text-white' : 'bg-dark-700 text-gray-300'}
                                                    `}>
                                                                {i + 1}
                                                            </span>
                                                            <span className="font-bold text-gray-50">
                                                                {formatDateRange(overlap.startDate, overlap.endDate)}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                                                            {overlap.availabilityPercent}%
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-gray-400 ml-8">
                                                        <span className="flex items-center gap-1"><Users size={12} /> {overlap.availableCount} of {overlap.totalParticipants} available</span>
                                                    </div>
                                                </button>
                                            ))}

                                            <p className="text-xs text-center text-gray-500 mt-auto pt-4">
                                                Hover over the calendar to explore other options.
                                            </p>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export default SlidingOverlapCalendar;
