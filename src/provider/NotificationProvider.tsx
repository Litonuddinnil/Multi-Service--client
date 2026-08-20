import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NotificationItem } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  /** Active type filter — empty array means "all types". */
  typeFilter: string[];
  availableTypes: string[];
  setTypeFilter: (types: string[]) => void;
  /** Notifications after applying `typeFilter`. */
  filteredNotifications: NotificationItem[];
  filteredUnreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (title: string, message: string, type: NotificationItem['type'], entityUrl: string) => void;
  refresh: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { effectiveUser } = useAuth();
  const userId = effectiveUser?.id || '';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([
    'BOOKING', 'PAYMENT', 'PROJECT', 'VERIFICATION', 'SYSTEM', 'MESSAGE', 'REVIEW', 'COMMISSION', 'PAYOUT'
  ]);
  const streamRef = useRef<{ close: () => void } | null>(null);

  const refresh = useCallback(async () => {
    const data = await ApiService.fetchNotifications({ userId: userId || undefined });
    setNotifications(data);
  }, [userId]);

  // Initial fetch + subscribe to type list once on mount.
  useEffect(() => {
    refresh();
    ApiService.fetchNotificationTypes().then(setAvailableTypes).catch(() => {});
  }, [refresh]);

  // (Re)attach the SSE stream whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) {
      streamRef.current?.close();
      streamRef.current = null;
      return;
    }
    const stream = ApiService.subscribeNotificationStream(userId, {
      onNotification: (n) => {
        setNotifications(prev => {
          if (prev.some(p => p.id === n.id)) return prev;
          return [n, ...prev];
        });
      },
      onError: () => {
        // Reconnect is handled inside subscribeNotificationStream.
      }
    });
    streamRef.current = stream;
    return () => {
      stream.close();
      streamRef.current = null;
    };
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (typeFilter.length === 0) return notifications;
    return notifications.filter(n => typeFilter.includes(String(n.type)));
  }, [notifications, typeFilter]);

  const filteredUnreadCount = useMemo(
    () => filteredNotifications.filter(n => !n.isRead).length,
    [filteredNotifications]
  );

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, isRead: true } : n));
      StorageService.saveNotifications(updated);
      return updated;
    });
    void ApiService.markNotificationRead(id);
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      StorageService.saveNotifications(updated);
      return updated;
    });
    const filterForReadAll = typeFilter.length > 0 ? typeFilter : undefined;
    void ApiService.markAllNotificationsRead({ userId: userId || undefined, type: filterForReadAll });
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type'], entityUrl: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: 'current',
      title,
      message,
      type,
      entityUrl,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      StorageService.saveNotifications(updated);
      return updated;
    });
    // Fire-and-forget server create (also broadcasts via SSE to other devices).
    if (userId) {
      void ApiService.createNotification({
        userId,
        title,
        message,
        type,
        entityUrl
      });
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      typeFilter,
      availableTypes,
      setTypeFilter,
      filteredNotifications,
      filteredUnreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      refresh
    }}>
      {children}
    </NotificationContext.Provider>
  );
};