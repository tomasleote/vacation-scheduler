import React, { useState } from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import {
    generateGoogleCalendarUrl,
    generateICSContent,
    downloadICSFile,
    buildCalendarEventDetails,
} from '../../utils/calendarEvent';

function CalendarEventButton({ group, overlap, participantCount }) {
    const [showOptions, setShowOptions] = useState(false);

    const { title, description, startDate, endDate } = buildCalendarEventDetails(
        group,
        overlap,
        participantCount
    );

    const handleGoogleCalendar = (e) => {
        e.stopPropagation();
        const url = generateGoogleCalendarUrl({ title, description, startDate, endDate });
        window.open(url, '_blank', 'noopener,noreferrer');
        setShowOptions(false);
    };

    const handleICSDownload = (e) => {
        e.stopPropagation();
        const icsContent = generateICSContent({ title, description, startDate, endDate });
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
        downloadICSFile(icsContent, filename);
        setShowOptions(false);
    };

    const toggleOptions = (e) => {
        e.stopPropagation();
        setShowOptions(!showOptions);
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
                onClick={toggleOptions}
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
                    <div className="absolute right-0 top-full mt-1 z-20 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-1 min-w-[180px]">
                        <button
                            // ensure click closes and navigates
                            onClick={handleGoogleCalendar}
                            className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-700 flex items-center gap-2"
                        >
                            <Calendar size={14} />
                            Google Calendar
                        </button>
                        <button
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
