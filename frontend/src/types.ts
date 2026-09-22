export type UserRole = 'customer' | 'worker';
export type DutyStatus = 'available' | 'busy' | 'offline';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  isDemo?: boolean;
  avatarUrl?: string;
  createdAt: string;

  // Customer specific
  defaultLocation?: string;
  address?: string;

  // Worker specific
  primaryTrade?: string;
  experience?: string;
  skills?: string[];
  baseLocation?: string;
  dispatchRadius?: number; // in km
  dutyStatus?: DutyStatus;
  tier?: string;
  rating?: number;
  reliabilityScore?: number;
  completedJobsCount?: number;
  acceptanceRate?: number;
  onTimeArrival?: number;
}

export type JobStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'matching'
  | 'dispatched'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Job {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  subCategory?: string;
  description: string;
  address: string;
  neighborhood: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  workerId?: string;
  workerName?: string;
  workerPhone?: string;
  workerAvatar?: string;
  workerRating?: number;
  workerTrade?: string;
  status: JobStatus;
  benchmarkPrice: number;
  offeredPrice: number;
  guaranteedPayout: number;
  distanceKm: string;
  transitTime: string;
  otp: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  completedDate?: string;
  ratingGiven?: number;
  reviewComment?: string;
  cancellationReason?: string;
  cancelledBy?: UserRole;
  attachedPhotoUrl?: string;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface JobReview {
  id: string;
  jobId: string;
  customerId: string;
  workerId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}
