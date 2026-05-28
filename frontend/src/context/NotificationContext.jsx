import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('notifications/');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    }, [user]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('notifications/unread-count/');
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`notifications/${id}/read/`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('notifications/mark-all-read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchUnreadCount();
            const interval = setInterval(() => {
                fetchUnreadCount();
            }, 30000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications, fetchUnreadCount]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
