import { create } from 'zustand';
import type {
  Role,
  PageName,
  HelperStatus,
  HelpRequest,
  LocationSchedule,
  LocationTracking,
  AppNotification,
  Geofence,
  CurrentLocation,
} from '@/types';
import {
  users,
  mockHelpRequests,
  mockSchedules,
  mockTrackingHistory,
  mockNotifications,
  mockGeofence,
  mockCurrentLocation,
} from '@/data/mockData';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface DemoState {
  // 角色与导航
  role: Role;
  page: PageName;
  selectedHelpId: string | null;
  setRole: (role: Role) => void;
  navigate: (page: PageName, helpId?: string) => void;

  // 帮助者状态
  helperStatus: HelperStatus;
  currentLocation: CurrentLocation | null;
  setHelperStatus: (status: HelperStatus) => void;

  // 数据
  helpRequests: HelpRequest[];
  schedules: LocationSchedule[];
  trackingHistory: LocationTracking[];
  notifications: AppNotification[];
  geofence: Geofence;

  // 操作
  acceptHelp: (helpId: string) => void;
  cancelHelp: (helpId: string) => void;
  toggleSchedule: (id: string) => void;
  requestTracking: (seekerId: string, seekerNickname: string) => void;
  setGeofenceRadius: (radius: number) => void;
  toggleGeofence: () => void;
  clearNotifications: () => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;
}

const rolePages: Record<Role, PageName> = {
  seeker: 'sos-home',
  helper: 'helper-home',
  guardian: 'helper-home',
};

export const useDemoStore = create<DemoState>((set, get) => ({
  role: 'seeker',
  page: 'sos-home',
  selectedHelpId: null,
  setRole: (role) => set({ role, page: rolePages[role] }),

  navigate: (page, helpId) =>
    set({ page, selectedHelpId: helpId ?? get().selectedHelpId }),

  helperStatus: 'offline',
  currentLocation: null,
  setHelperStatus: (status) => {
    const isOnline = status === 'online';
    set({
      helperStatus: status,
      currentLocation: isOnline ? mockCurrentLocation : null,
    });
    if (isOnline) {
      get().showToast(`已上线，当前位置：${mockCurrentLocation.address}`, 'success');
    }
  },

  helpRequests: mockHelpRequests,
  schedules: mockSchedules,
  trackingHistory: mockTrackingHistory,
  notifications: mockNotifications,
  geofence: mockGeofence,

  acceptHelp: (helpId) => {
    set((state) => ({
      helpRequests: state.helpRequests.map((r) =>
        r.id === helpId
          ? {
              ...r,
              status: 'accepted' as const,
              acceptedBy: users.helper.id,
              acceptedByNickname: users.helper.nickname,
            }
          : r,
      ),
    }));
    get().showToast('接单成功', 'success');
  },

  cancelHelp: (helpId) => {
    set((state) => ({
      helpRequests: state.helpRequests.map((r) =>
        r.id === helpId ? { ...r, status: 'cancelled' as const } : r,
      ),
    }));
  },

  toggleSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s,
      ),
    }));
  },

  requestTracking: (seekerId, seekerNickname) => {
    const newTracking: LocationTracking = {
      id: `lt-${Date.now()}`,
      seekerId,
      seekerNickname,
      guardianId: users.guardian.id,
      guardianNickname: users.guardian.nickname,
      latitude: 39.9925,
      longitude: 116.4105,
      address: '北京市朝阳区望京花园小区北门',
      status: 'confirmed',
      requestedAt: new Date().toISOString(),
      respondedAt: new Date().toISOString(),
    };
    set((state) => ({
      trackingHistory: [newTracking, ...state.trackingHistory],
    }));
    get().showToast(`已获取${seekerNickname}的位置`, 'success');
  },

  setGeofenceRadius: (radius) =>
    set((state) => ({ geofence: { ...state.geofence, radius } })),

  toggleGeofence: () =>
    set((state) => ({ geofence: { ...state.geofence, enabled: !state.geofence.enabled } })),

  clearNotifications: () => set({ notifications: [] }),

  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
