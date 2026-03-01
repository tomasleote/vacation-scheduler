import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback(({ type = 'info', title, message, duration = 30000 }) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, type, title, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification, removeNotification }}>
            {children}
            <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            <AnimatePresence>
                {notifications.map(notif => (
                    <NotificationItem key={notif.id} notification={notif} removeNotification={removeNotification} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const NotificationItem = ({ notification, removeNotification }) => {
    const { id, type, title, message } = notification;

    const icons = {
        success: <CheckCircle className="text-emerald-400" size={20} />,
        error: <AlertCircle className="text-rose-400" size={20} />,
        warning: <AlertTriangle className="text-amber-400" size={20} />,
        info: <Info className="text-blue-400" size={20} />
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-rose-500/10 border-rose-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full p-4 rounded-xl border backdrop-blur-md shadow-lg pointer-events-auto flex items-start gap-3 ${bgColors[type] || bgColors.info} bg-dark-900/90 overflow-hidden`}
        >
            <div className="shrink-0 mt-0.5">{icons[type] || icons.info}</div>
            <div className="flex-1 min-w-0 pr-6">
                {title && <h4 className="text-sm font-semibold text-gray-50 mb-1">{title}</h4>}
                <p className="text-sm text-gray-300 break-words">{message}</p>
            </div>
            <button
                onClick={() => removeNotification(id)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors p-1"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};
