import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import {
    generateGoogleCalendarUrl,
    generateICSContent,
    downloadICSFile,
    buildCalendarEventDetails,
} from '../../utils/calendarEvent';

function CalendarEventButton({ group, overlap, participantCount }) {
    const [showOptions, setShowOptions] = useState(false);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const { title, description, startDate, endDate } = buildCalendarEventDetails(
        group,
        overlap,
        participantCount
    );

    useEffect(() => {
        if (showOptions && menuRef.current) {
            const firstItem = menuRef.current.querySelector('[role="menuitem"]');
            if (firstItem) {
                firstItem.focus();
            }
        }
    }, [showOptions]);

    const handleGoogleCalendar = (e) => {
        e.stopPropagation();
        const url = generateGoogleCalendarUrl({ title, description, startDate, endDate });
        window.open(url, '_blank', 'noopener,noreferrer');
        setShowOptions(false);
        triggerRef.current?.focus();
    };

    const handleICSDownload = (e) => {
        e.stopPropagation();
        const icsContent = generateICSContent({ title, description, startDate, endDate });
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
        downloadICSFile(icsContent, filename);
        setShowOptions(false);
        triggerRef.current?.focus();
    };

    const toggleOptions = (e) => {
        e.stopPropagation();
        setShowOptions(!showOptions);
    };

    const handleMenuKeyDown = (e) => {
        if (!showOptions) return;

        if (e.key === 'Escape') {
            e.stopPropagation();
            setShowOptions(false);
            triggerRef.current?.focus();
            return;
        }

        if (e.key === 'Tab') {
            setShowOptions(false);
            return;
        }

        const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'));
        if (items.length === 0) return;

        const currentIndex = items.indexOf(document.activeElement);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            const nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
            items[prevIndex]?.focus();
        }
    };

    return (
        <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
            {/* Primary action: Google Calendar */}
            <button
                onClick={handleGoogleCalendar}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 transition-colors"
                title="Add to Google Calendar"
            >
                <Calendar size={14} />
                Add to Calendar
            </button>

            {/* Dropdown toggle for more options */}
            <button
                ref={triggerRef}
                onClick={toggleOptions}
                aria-haspopup="menu"
                aria-expanded={showOptions}
                className="flex items-center px-1.5 py-1.5 text-xs rounded-r-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-l-0 border-brand-500/30 transition-colors"
                title="More calendar options"
            >
                <ChevronDown size={12} />
            </button>

            {/* Dropdown menu */}
            {showOptions && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={toggleOptions}
                    />
                    <div
                        ref={menuRef}
                        role="menu"
                        onKeyDown={handleMenuKeyDown}
                        className="absolute right-0 top-full mt-1 z-20 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-1 min-w-[180px]"
                    >
                        <button
                            role="menuitem"
                            tabIndex={0}
                            onClick={handleGoogleCalendar}
                            className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-700 flex items-center gap-2"
                        >
                            <Calendar size={14} />
                            Google Calendar
                        </button>
                        <button
                            role="menuitem"
                            tabIndex={0}
                            onClick={handleICSDownload}
                            className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-700 flex items-center gap-2"
                        >
                            <Download size={14} />
                            Download .ics file
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default CalendarEventButton;
