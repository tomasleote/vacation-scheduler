import React from 'react';
import {
    FaUmbrellaBeach,
    FaUtensils,
    FaBirthdayCake,
    FaGamepad,
    FaUsers,
    FaCalendarAlt,
} from 'react-icons/fa';

export const EVENT_TYPES = {
    vacation: {
        key: 'vacation',
        label: 'Vacation',
        icon: <FaUmbrellaBeach size={20} />,
        placeholder: 'e.g., Summer Trip 2026',
        descriptionPlaceholder: 'Where are you going? Beach, mountains, city break...',
        singleDay: false,
        defaultDuration: 3,
    },
    dinner: {
        key: 'dinner',
        label: 'Dinner',
        icon: <FaUtensils size={20} />,
        placeholder: 'e.g., Friday Dinner',
        descriptionPlaceholder: 'Restaurant name, cuisine, occasion...',
        singleDay: true,
        defaultDuration: 1,
    },
    party: {
        key: 'party',
        label: 'Party',
        icon: <FaBirthdayCake size={20} />,
        placeholder: "e.g., Sarah's Birthday",
        descriptionPlaceholder: 'Birthday, house party, celebration...',
        singleDay: true,
        defaultDuration: 1,
    },
    gamenight: {
        key: 'gamenight',
        label: 'Game Night',
        icon: <FaGamepad size={20} />,
        placeholder: 'e.g., D&D Session',
        descriptionPlaceholder: 'Board games, D&D, video games, LAN party...',
        singleDay: true,
        defaultDuration: 1,
    },
    team: {
        key: 'team',
        label: 'Team Event',
        icon: <FaUsers size={20} />,
        placeholder: 'e.g., Q3 Offsite Planning',
        descriptionPlaceholder: 'Team meeting, offsite, retreat, all-hands...',
        singleDay: true,
        defaultDuration: 1,
    },
    other: {
        key: 'other',
        label: 'Other',
        icon: <FaCalendarAlt size={20} />,
        placeholder: 'e.g., Custom Event',
        descriptionPlaceholder: 'What are you planning?',
        singleDay: false,
        defaultDuration: 1,
    },
};

export const isSingleDayEvent = (eventType) => {
    if (!eventType) return false;
    return EVENT_TYPES[eventType]?.singleDay ?? false;
};

export const getEventConfig = (eventType) => {
    return EVENT_TYPES[eventType] || EVENT_TYPES.other;
};
