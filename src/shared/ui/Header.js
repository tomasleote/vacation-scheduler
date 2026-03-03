import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarRange, KeyRound } from 'lucide-react';

export function Header({ onRecover, onCreate, onJoin }) {
    const navigate = useNavigate();

    const handleRecover = () => {
        if (onRecover) onRecover();
        else navigate('/?action=recover');
    };

    const handleCreate = () => {
        if (onCreate) onCreate();
        else navigate('/?action=create');
    };

    const handleJoin = () => {
        if (onJoin) onJoin();
        else navigate('/?action=join');
    };

    return (
        <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-50 relative bg-transparent">
            <Link to="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2 text-white">
                <span className="text-brand-500"><CalendarRange size={24} /></span>
                <span>Find <span className="text-brand-500">A</span> Day</span>
            </Link>
            <div className="flex items-center gap-4">
                <button
                    onClick={handleRecover}
                    className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:flex items-center gap-1.5"
                >
                    <KeyRound size={14} />
                    Recover
                </button>
                <button
                    onClick={handleJoin}
                    className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block"
                >
                    Join
                </button>
                <button
                    onClick={handleCreate}
                    className="px-5 py-2 rounded-full bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95 transition-transform hover:shadow-brand-500/30"
                >
                    Create Event
                </button>
            </div>
        </nav>
    );
}
