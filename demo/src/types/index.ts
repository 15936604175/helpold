export type Role = 'seeker' | 'helper' | 'guardian';

export type HelperStatus = 'online' | 'offline' | 'busy';

export type HelpStatus = 'pending' | 'accepted' | 'cancelled' | 'resolved';

export type TrackingStatus = 'pending' | 'confirmed' | 'denied' | 'timeout';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  role: Role;
  disabilityType?: string;
  disabilityDetail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  sharePhone?: boolean;
  continuousTracking?: boolean;
}

export interface HelpRequest {
  id: string;
  seekerId: string;
  seekerNickname: string;
  latitude: number;
  longitude: number;
  address?: string;
  reason: string;
  disabilityType?: string;
  disabilityDetail?: string;
  sharePhone: boolean;
  seekerPhone?: string;
  status: HelpStatus;
  distance?: number;
  createdAt: string;
  acceptedBy?: string;
  acceptedByNickname?: string;
}

export interface LocationSchedule {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  address: string;
  addressDetail?: string;
  enabled: boolean;
}

export interface CurrentLocation {
  planName: string;
  address: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
}

export interface LocationTracking {
  id: string;
  seekerId: string;
  seekerNickname: string;
  guardianId: string;
  guardianNickname: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status: TrackingStatus;
  requestedAt: string;
  respondedAt?: string;
}

export interface AppNotification {
  id: string;
  type: 'help_request' | 'accepted' | 'cancelled' | 'track_request';
  title: string;
  body: string;
  createdAt: string;
}

export interface Geofence {
  latitude: number;
  longitude: number;
  radius: number;
  enabled: boolean;
}

export type PageName =
  | 'sos-home'
  | 'help-pending'
  | 'help-detail'
  | 'helper-home'
  | 'help-list'
  | 'help-accept'
  | 'location-schedule'
  | 'guardian-panel'
  | 'geofence-config'
  | 'settings';
