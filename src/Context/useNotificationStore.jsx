import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    currentIndex: 0,
    viewData: null,
    type: '',
    mode: '',

    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter(n => n.is_read === 0).length,
        }),

    addNotification: (notification) =>
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        })),

    markAsReadLocal: (id) =>
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, is_read: 1 } : n
            ),
            unreadCount: Math.max(state.unreadCount - 1, 0),
        })),

    setCurrentIndex: (index) => set({ currentIndex: index }),

    setViewData: (type, data) =>
        set({
            type: type,
            viewData: data,
            mode: 'view',
        }),

    setMode: (mode) => set({ mode }),
    setType: (type) => set({ type }),
    resetType: () => set({ type: '', mode: '', viewData: null }),
}));

export default useNotificationStore;
