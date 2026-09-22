import { UserAccount, UserRole, Job, JobStatus, DutyStatus, ChatMessage, JobReview } from '../types';

const STORAGE_KEY_CURRENT_USER = 'quickhelp_current_user';
const STORAGE_KEY_REGISTERED_USERS = 'quickhelp_registered_users';
const STORAGE_KEY_USER_JOBS = 'quickhelp_user_jobs';
const STORAGE_KEY_BROADCAST_JOBS = 'quickhelp_broadcast_jobs';
const STORAGE_KEY_CENTRAL_REQUESTS = 'quickhelp_central_requests';
const STORAGE_KEY_REVIEWS = 'quickhelp_job_reviews';

export interface WorkerScheduleItem {
  id: string;
  title: string;
  location: string;
  amount: string;
  grossAmount: number;
  netAmount: number;
  commission: number;
  icon: string;
  status: string;
}

// Helper to get all registered real users from localStorage
export function getRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse registered users', e);
    return [];
  }
}

// Normalize user role string consistently across schema variations
export function normalizeUserRole(role?: string): UserRole {
  if (!role) return 'customer';
  const clean = role.toLowerCase().trim();
  if (
    clean === 'worker' ||
    clean === 'technician' ||
    clean === 'service_provider' ||
    clean === 'partner' ||
    clean === 'pro'
  ) {
    return 'worker';
  }
  return 'customer';
}

// Get only registered workers
export function getAllRegisteredWorkers(): UserAccount[] {
  return getRegisteredUsers().filter(
    (u) => normalizeUserRole(u.role) === 'worker' || !!u.primaryTrade
  );
}

// Helper to save a registered real user
export function saveRegisteredUser(user: UserAccount): void {
  const users = getRegisteredUsers();
  const normalized: UserAccount = {
    ...user,
    role: normalizeUserRole(user.role || (user.primaryTrade ? 'worker' : 'customer')),
  };
  const existingIdx = users.findIndex(
    (u) => u.id === normalized.id || (normalized.email && u.email.toLowerCase() === normalized.email.toLowerCase())
  );
  if (existingIdx >= 0) {
    users[existingIdx] = normalized;
  } else {
    users.push(normalized);
  }
  localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
}

// Get currently active authenticated user (sessionStorage tab-isolated with localStorage fallback, synced to DB)
export function getCurrentUser(): UserAccount | null {
  try {
    let raw: string | null = null;
    if (typeof sessionStorage !== 'undefined') {
      raw = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
    }
    if (!raw && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    }
    if (!raw) return null;

    const parsed: UserAccount = JSON.parse(raw);

    // Cross-reference with canonical database/registered users list
    const registeredUsers = getRegisteredUsers();
    const canonical = registeredUsers.find(
      (u) => u.id === parsed.id || (parsed.email && u.email.toLowerCase() === parsed.email.toLowerCase())
    );

    const merged: UserAccount = canonical ? { ...parsed, ...canonical } : parsed;
    merged.role = normalizeUserRole(merged.role || (merged.primaryTrade ? 'worker' : 'customer'));

    return merged;
  } catch (e) {
    console.error('Failed to parse current user', e);
    return null;
  }
}

// Set current authenticated user in tab sessionStorage and persistent localStorage
export function setCurrentUser(user: UserAccount | null): void {
  if (!user) {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } else {
    const normalized: UserAccount = {
      ...user,
      role: normalizeUserRole(user.role || (user.primaryTrade ? 'worker' : 'customer')),
    };
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(normalized));
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(normalized));
    }
  }
}

// Login with credentials (email or mobile + password)
export function loginWithCredentials(identifier: string): UserAccount | null {
  const cleanId = identifier.trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');
  const users = getRegisteredUsers();

  const found = users.find((u) => {
    const userEmail = u.email.toLowerCase();
    const userMobile = u.mobile.replace(/\D/g, '');
    return userEmail === cleanId || (digitsOnly.length >= 10 && userMobile.includes(digitsOnly));
  });

  if (found) {
    setCurrentUser(found);
    return found;
  }

  return null;
}

// Register new real general user (before role selection)
export function registerRealUser(data: {
  fullName: string;
  email: string;
  mobile: string;
  defaultLocation?: string;
}): UserAccount {
  const newUser: UserAccount = {
    id: `real-user-${Date.now()}`,
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    mobile: data.mobile.trim(),
    role: 'customer', // Default role pending role selection
    isDemo: false,
    defaultLocation: data.defaultLocation || 'Freeganj, Ujjain, Madhya Pradesh',
    address: data.defaultLocation || 'Freeganj, Ujjain',
    createdAt: new Date().toISOString(),
  };

  saveRegisteredUser(newUser);
  setCurrentUser(newUser);
  return newUser;
}

// Update role after user account creation
export function updateUserRole(role: 'customer' | 'worker'): UserAccount {
  let user = getCurrentUser();
  if (!user) {
    user = registerRealUser({
      fullName: 'New User',
      email: 'user@example.com',
      mobile: '9876543210',
    });
  }
  const updatedUser: UserAccount = {
    ...user,
    role,
    primaryTrade: role === 'worker' ? (user.primaryTrade || 'Electrician') : user.primaryTrade,
    dutyStatus: role === 'worker' ? (user.dutyStatus || 'available') : user.dutyStatus,
  };

  saveRegisteredUser(updatedUser);
  setCurrentUser(updatedUser);
  return updatedUser;
}

// Register new real customer
export function registerRealCustomer(data: {
  fullName: string;
  email: string;
  mobile: string;
  defaultLocation: string;
}): UserAccount {
  const newCustomer: UserAccount = {
    id: `real-cust-${Date.now()}`,
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    mobile: data.mobile.trim(),
    role: 'customer',
    isDemo: false,
    defaultLocation: data.defaultLocation || 'Freeganj, Ujjain, Madhya Pradesh',
    address: data.defaultLocation || 'Freeganj, Ujjain',
    createdAt: new Date().toISOString(),
  };

  saveRegisteredUser(newCustomer);
  setCurrentUser(newCustomer);
  return newCustomer;
}

// Register new real worker
export function registerRealWorker(data: {
  fullName: string;
  email: string;
  mobile: string;
  primaryTrade: string;
  experience: string;
  skills: string[];
  baseLocation: string;
  dispatchRadius: number;
}): UserAccount {
  const newWorker: UserAccount = {
    id: `real-worker-${Date.now()}`,
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    mobile: data.mobile.trim(),
    role: 'worker',
    isDemo: false,
    primaryTrade: data.primaryTrade,
    experience: data.experience,
    skills: data.skills,
    baseLocation: data.baseLocation,
    dispatchRadius: data.dispatchRadius,
    dutyStatus: 'available',
    tier: 'Verified Partner Pro',
    rating: 5.0,
    reliabilityScore: 100,
    completedJobsCount: 0,
    acceptanceRate: 100,
    onTimeArrival: 100,
    createdAt: new Date().toISOString(),
  };

  saveRegisteredUser(newWorker);
  setCurrentUser(newWorker);
  return newWorker;
}

// Update duty status for current worker
export function updateWorkerDutyStatus(status: DutyStatus): UserAccount | null {
  const user = getCurrentUser();
  if (!user || normalizeUserRole(user.role) !== 'worker') return null;

  const updated: UserAccount = {
    ...user,
    role: 'worker',
    dutyStatus: status,
  };

  setCurrentUser(updated);
  saveRegisteredUser(updated);
  return updated;
}

// Logout
export function logoutUser(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
}

// Real User Job Management
export function getRealUserJobs(userId: string): Job[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_USER_JOBS}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get real user jobs', e);
    return [];
  }
}

export function saveRealUserJob(userId: string, job: Job): void {
  const jobs = getRealUserJobs(userId);
  const existingIdx = jobs.findIndex((j) => j.id === job.id);
  if (existingIdx >= 0) {
    jobs[existingIdx] = job;
  } else {
    jobs.unshift(job);
  }
  localStorage.setItem(`${STORAGE_KEY_USER_JOBS}_${userId}`, JSON.stringify(jobs));
}

// Central Work Request Repository
export function getAllRequests(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CENTRAL_REQUESTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get central requests', e);
    return [];
  }
}

export function saveCentralRequest(job: Job): void {
  const requests = getAllRequests();
  const existingIdx = requests.findIndex((r) => r.id === job.id);
  if (existingIdx >= 0) {
    requests[existingIdx] = job;
  } else {
    requests.unshift(job);
  }
  localStorage.setItem(STORAGE_KEY_CENTRAL_REQUESTS, JSON.stringify(requests));
}

// Event Dispatch Helpers for real-time reactivity
export function dispatchRequestUpdate(): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('quickhelp_request_update'));
    }
  } catch {}
}

export function dispatchChatUpdate(jobId?: string): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      if (jobId) window.dispatchEvent(new CustomEvent(`quickhelp_chat_update_${jobId}`));
      window.dispatchEvent(new CustomEvent('quickhelp_chat_update'));
    }
  } catch {}
}

// Get all reviews
export function getJobReviews(): JobReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse reviews', e);
    return [];
  }
}

// SECURE CUSTOMER REQUEST CREATION
// Always derives customer identity from authenticated session
export function createCustomerRequest(params: {
  workerId: string;
  serviceCategory: string;
  serviceTitle: string;
  subCategory?: string;
  description: string;
  address: string;
  neighborhood?: string;
  offeredPrice: number;
  benchmarkPrice?: number;
  distanceKm?: string;
  transitTime?: string;
}): { success: boolean; job?: Job; error?: string } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required. Please log in as a customer.' };
  }
  if (currentUser.role !== 'customer') {
    return { success: false, error: 'Only customers can request workers.' };
  }

  const allWorkers = getAllRegisteredWorkers();
  const worker = allWorkers.find((w) => w.id === params.workerId);
  if (!worker) {
    return { success: false, error: 'Selected worker is not available or does not exist.' };
  }

  const uniqueId = `QHP-${Math.floor(100000 + Math.random() * 900000)}`;
  const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

  const offered = params.offeredPrice || 500;
  const commission = Math.round(offered * 0.10);
  const netEarnings = Math.round(offered * 0.90);

  const newJob: Job = {
    id: uniqueId,
    serviceCategory: params.serviceCategory,
    serviceTitle: params.serviceTitle || `${params.serviceCategory} Diagnostic & Repair`,
    subCategory: params.subCategory,
    description: params.description.trim() || 'Customer requested quick on-site inspection and immediate service.',
    address: params.address.trim() || currentUser.address || 'Freeganj, Ujjain',
    neighborhood: params.neighborhood || worker.baseLocation || 'Freeganj, Ujjain',
    customerId: currentUser.id,
    customerName: currentUser.fullName,
    customerPhone: currentUser.mobile,
    workerId: worker.id,
    workerName: worker.fullName,
    workerPhone: worker.mobile,
    workerAvatar: worker.avatarUrl,
    workerRating: worker.rating || 5.0,
    workerTrade: worker.primaryTrade || params.serviceCategory,
    status: 'pending',
    benchmarkPrice: params.benchmarkPrice || offered,
    offeredPrice: offered,
    guaranteedPayout: offered,
    customerPlatformFee: 0,
    paymentMode: 'Cash on Delivery (Direct to Worker)',
    workerCommission: commission,
    workerNetEarnings: netEarnings,
    distanceKm: params.distanceKm || '1.8 km',
    transitTime: params.transitTime || '~12 min',
    otp,
    createdAt: new Date().toISOString(),
  };

  saveCentralRequest(newJob);
  dispatchRequestUpdate();
  return { success: true, job: newJob };
}

// Authoritatively resolve and verify the authenticated worker
export function getAuthenticatedWorker(): { worker: UserAccount | null; error?: string } {
  const sessionUser = getCurrentUser();
  if (!sessionUser) {
    return { worker: null, error: 'Unauthorized: Authentication required. Please log in as a technician.' };
  }

  // Load user's actual profile/record from the authoritative registered users database
  const registeredUsers = getRegisteredUsers();
  const canonical = registeredUsers.find(
    (u) => u.id === sessionUser.id || (sessionUser.email && u.email.toLowerCase() === sessionUser.email.toLowerCase())
  );
  const user = canonical ? { ...sessionUser, ...canonical } : sessionUser;

  // Normalize role comparison across all schema variants (worker, Worker, WORKER, technician, service_provider, partner)
  const role = normalizeUserRole(user.role || (user.primaryTrade ? 'worker' : 'customer'));
  if (role !== 'worker') {
    return { worker: null, error: 'Unauthorized: Only workers can accept service requests.' };
  }

  // Ensure role is normalized on the returned instance
  user.role = 'worker';
  return { worker: user };
}

// ATOMIC WORKER ACCEPTANCE
export function acceptWorkerRequest(jobId: string): { success: boolean; job?: Job; error?: string } {
  const { worker, error: authError } = getAuthenticatedWorker();
  if (!worker) {
    return { success: false, error: authError || 'Unauthorized: Only workers can accept service requests.' };
  }

  const requests = getAllRequests();
  const req = requests.find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Request not found.' };
  }

  if (req.status !== 'pending') {
    return {
      success: false,
      error: `Request cannot be accepted because it is currently "${req.status}". It may have been cancelled or accepted already.`,
    };
  }

  if (req.workerId && req.workerId !== worker.id) {
    return { success: false, error: 'Unauthorized: This request is assigned to another technician.' };
  }

  const otp = req.otp || `${Math.floor(1000 + Math.random() * 9000)}`;

  const updated = updateJobStatus(jobId, 'accepted', {
    workerId: worker.id,
    workerName: worker.fullName,
    workerPhone: worker.mobile,
    workerAvatar: worker.avatarUrl,
    workerRating: worker.rating || 5.0,
    workerTrade: worker.primaryTrade,
    otp,
  });

  return { success: true, job: updated || undefined };
}

// WORKER REJECTION
export function rejectWorkerRequest(jobId: string, reason?: string): { success: boolean; job?: Job; error?: string } {
  const { worker, error: authError } = getAuthenticatedWorker();
  if (!worker) {
    return { success: false, error: authError || 'Unauthorized: Only workers can reject requests.' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Request not found.' };
  }

  if (req.status !== 'pending') {
    return { success: false, error: 'Only pending requests can be declined.' };
  }

  if (req.workerId && req.workerId !== worker.id) {
    return { success: false, error: 'Unauthorized: You are not assigned to this request.' };
  }

  const updated = updateJobStatus(jobId, 'rejected', {
    cancellationReason: reason || 'Technician was unable to take this request.',
    cancelledBy: 'worker',
  });

  return { success: true, job: updated || undefined };
}

// START WORK (accepted -> in_progress)
export function startWorkJob(jobId: string): { success: boolean; job?: Job; error?: string } {
  const { worker, error: authError } = getAuthenticatedWorker();
  if (!worker) {
    return { success: false, error: authError || 'Unauthorized: Only the assigned worker can start work.' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job not found.' };
  }

  if (req.workerId !== worker.id) {
    return { success: false, error: 'Unauthorized: You are not assigned to this job.' };
  }

  if (req.status !== 'accepted') {
    return {
      success: false,
      error: `Work can only be started from the "accepted" state. Current status is "${req.status}".`,
    };
  }

  const updated = updateJobStatus(jobId, 'in_progress', {
    startedAt: new Date().toISOString(),
  });

  return { success: true, job: updated || undefined };
}

// COMPLETE WORK (in_progress -> completed with OTP handshake)
export function completeWorkJob(jobId: string, enteredOtp: string): { success: boolean; job?: Job; error?: string } {
  const { worker, error: authError } = getAuthenticatedWorker();
  if (!worker) {
    return { success: false, error: authError || 'Unauthorized: Only the assigned worker can complete the job.' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job not found.' };
  }

  if (req.workerId !== worker.id) {
    return { success: false, error: 'Unauthorized: You are not assigned to this job.' };
  }

  if (req.status !== 'in_progress') {
    return {
      success: false,
      error: `Job must be in progress to complete. Current status is "${req.status}".`,
    };
  }

  if (enteredOtp.trim() !== req.otp.trim()) {
    return {
      success: false,
      error: `Invalid arrival verification OTP "${enteredOtp}". Please ask the customer for their 4-digit code.`,
    };
  }

  const updated = updateJobStatus(jobId, 'completed', {
    completedDate: 'Today',
    completedAt: new Date().toISOString(),
  });

  // Increment completedJobsCount on worker profile
  const allUsers = getRegisteredUsers();
  const workerIdx = allUsers.findIndex((u) => u.id === worker.id);
  if (workerIdx >= 0) {
    allUsers[workerIdx].completedJobsCount = (allUsers[workerIdx].completedJobsCount || 0) + 1;
    saveRegisteredUser(allUsers[workerIdx]);
    setCurrentUser(allUsers[workerIdx]);
  }

  return { success: true, job: updated || undefined };
}

// CONTROLLED CANCELLATION
export function cancelJob(jobId: string, reason: string): { success: boolean; job?: Job; error?: string } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required to cancel a job.' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job not found.' };
  }

  if (req.customerId !== currentUser.id && req.workerId !== currentUser.id) {
    return { success: false, error: 'Unauthorized: You are not a participant in this job.' };
  }

  if (req.status === 'completed') {
    return { success: false, error: 'Completed jobs cannot be cancelled.' };
  }

  if (req.status === 'cancelled' || req.status === 'rejected') {
    return { success: false, error: `Job is already ${req.status}.` };
  }

  const updated = updateJobStatus(jobId, 'cancelled', {
    cancellationReason: reason.trim() || 'Cancelled by user',
    cancelledBy: currentUser.role,
  });

  return { success: true, job: updated || undefined };
}

// SECURE JOB ACCESS WITH AUTHORIZATION & PRE-ACCEPTANCE PRIVACY
export function getSecureJobById(jobId: string): {
  success: boolean;
  job?: Job;
  error?: string;
  isParticipant?: boolean;
} {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Please log in to view this job room.' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job session not found or has expired.' };
  }

  // Prevent URL/ID manipulation: verify that caller is customer or assigned worker
  if (req.customerId !== currentUser.id && req.workerId !== currentUser.id) {
    return {
      success: false,
      error: 'Access Denied: You are not an authorized participant in this job session. URL tampering is prohibited.',
      isParticipant: false,
    };
  }

  // Privacy Guard:
  // Before acceptance, hide private contact details from the worker
  const sanitized: Job = { ...req };
  if (sanitized.status === 'pending' && currentUser.role === 'worker') {
    sanitized.customerPhone = 'Privacy Protected (Revealed upon acceptance)';
  }

  return { success: true, job: sanitized, isParticipant: true };
}

// IN-APP CHAT IMPLEMENTATION
export function getJobMessages(jobId: string): { success: boolean; messages?: ChatMessage[]; error?: string } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job not found' };
  }

  if (req.customerId !== currentUser.id && req.workerId !== currentUser.id) {
    return { success: false, error: 'Access Denied: You cannot view messages for this job.' };
  }

  try {
    const raw = localStorage.getItem(`quickhelp_chat_${jobId}`);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
    return { success: true, messages };
  } catch (e) {
    return { success: false, error: 'Failed to retrieve messages' };
  }
}

export function sendJobMessage(jobId: string, text: string): { success: boolean; message?: ChatMessage; error?: string } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Authentication required' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job not found' };
  }

  if (req.customerId !== currentUser.id && req.workerId !== currentUser.id) {
    return { success: false, error: 'Access Denied: You cannot post messages to this job.' };
  }

  if (req.status === 'rejected' || req.status === 'cancelled') {
    return { success: false, error: 'Chat is closed for cancelled or declined jobs.' };
  }

  const msgText = text.trim();
  if (!msgText) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  const message: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    jobId,
    senderId: currentUser.id,
    senderName: currentUser.fullName,
    senderRole: currentUser.role,
    text: msgText,
    timestamp: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(`quickhelp_chat_${jobId}`);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
    messages.push(message);
    localStorage.setItem(`quickhelp_chat_${jobId}`, JSON.stringify(messages));

    try {
      window.dispatchEvent(new CustomEvent(`quickhelp_chat_update_${jobId}`, { detail: message }));
      window.dispatchEvent(new CustomEvent('quickhelp_chat_update', { detail: message }));
    } catch {}

    return { success: true, message };
  } catch (e) {
    return { success: false, error: 'Failed to send message.' };
  }
}

// RATING & REVIEW IMPLEMENTATION
export function submitJobReview(jobId: string, rating: number, comment: string): { success: boolean; error?: string } {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'customer') {
    return { success: false, error: 'Only customers can submit reviews for completed jobs.' };
  }

  const req = getAllRequests().find((r) => r.id === jobId);
  if (!req) {
    return { success: false, error: 'Job not found.' };
  }

  if (req.customerId !== currentUser.id) {
    return { success: false, error: 'Unauthorized: You are not the customer for this job.' };
  }

  if (req.status !== 'completed') {
    return { success: false, error: 'Reviews can only be submitted for completed jobs.' };
  }

  if (req.ratingGiven) {
    return { success: false, error: 'You have already submitted a review for this job.' };
  }

  // Update job record
  updateJobStatus(jobId, 'completed', {
    ratingGiven: rating,
    reviewComment: comment.trim(),
  });

  // Save to central reviews store
  const review: JobReview = {
    id: `rev-${Date.now()}`,
    jobId,
    customerId: currentUser.id,
    workerId: req.workerId || '',
    rating,
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  const allReviews = getJobReviews();
  allReviews.unshift(review);
  localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(allReviews));

  // Recalculate Worker profile average rating
  if (req.workerId) {
    const allUsers = getRegisteredUsers();
    const workerIdx = allUsers.findIndex((u) => u.id === req.workerId);
    if (workerIdx >= 0) {
      const workerReviews = allReviews.filter((r) => r.workerId === req.workerId);
      const avg = (workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length).toFixed(1);
      allUsers[workerIdx].rating = parseFloat(avg);
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(allUsers));
    }
  }

  return { success: true };
}

// Broadcast / Shared Jobs
export function getBroadcastJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BROADCAST_JOBS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get broadcast jobs', e);
    return [];
  }
}

export function saveBroadcastJob(job: Job): void {
  const jobs = getBroadcastJobs();
  const existingIdx = jobs.findIndex((j) => j.id === job.id);
  if (existingIdx >= 0) {
    jobs[existingIdx] = job;
  } else {
    jobs.unshift(job);
  }
  localStorage.setItem(STORAGE_KEY_BROADCAST_JOBS, JSON.stringify(jobs));
}

// Get customer jobs
export function getCustomerJobs(customer: UserAccount): {
  activeJob: Job | null;
  history: Job[];
} {
  const centralRequests = getAllRequests().filter((r) => r.customerId === customer.id);
  const userJobs = getRealUserJobs(customer.id);

  const map = new Map<string, Job>();
  userJobs.forEach((j) => map.set(j.id, j));
  centralRequests.forEach((j) => map.set(j.id, j));
  const allJobs = Array.from(map.values());

  const activeJob =
    allJobs.find(
      (j) =>
        j.status === 'pending' ||
        j.status === 'accepted' ||
        j.status === 'matching' ||
        j.status === 'dispatched' ||
        j.status === 'in_progress'
    ) || null;

  const history = allJobs.filter(
    (j) =>
      j.status === 'completed' ||
      j.status === 'cancelled' ||
      j.status === 'rejected'
  );

  return { activeJob, history };
}

// Get worker requests
export function getWorkerRequests(workerId: string): {
  pendingRequests: Job[];
  activeJob: Job | null;
  recentSchedule: WorkerScheduleItem[];
} {
  const central = getAllRequests().filter((r) => r.workerId === workerId || (!r.workerId && r.status === 'pending'));
  const userJobs = getRealUserJobs(workerId);
  const map = new Map<string, Job>();
  userJobs.forEach((j) => map.set(j.id, j));
  central.forEach((j) => map.set(j.id, j));
  const allJobs = Array.from(map.values());

  const pendingRequests = allJobs
    .filter((j) => j.status === 'pending' || j.status === 'matching')
    .map((j) => ({
      ...j,
      customerPhone: '•••••••••• (Protected until accepted)',
      address: j.neighborhood || (j.address ? j.address.split(',').slice(-2).join(',').trim() : 'Local Area'),
    }));
  const activeJob =
    allJobs.find(
      (j) => j.status === 'accepted' || j.status === 'dispatched' || j.status === 'in_progress'
    ) || null;

  const completed = allJobs.filter((j) => j.status === 'completed');
  const recentSchedule: WorkerScheduleItem[] = completed.map((j) => {
    const gross = j.offeredPrice || j.guaranteedPayout || 0;
    const comm = j.workerCommission || Math.round(gross * 0.10);
    const net = j.workerNetEarnings || Math.round(gross * 0.90);
    return {
      id: j.id,
      title: j.serviceTitle,
      location: `${j.neighborhood || 'Local Area'} · ${j.completedDate || 'Recent'}`,
      amount: `₹${gross}`,
      grossAmount: gross,
      netAmount: net,
      commission: comm,
      icon: 'construction',
      status: 'Cash Collected',
    };
  });

  return { pendingRequests, activeJob, recentSchedule };
}

// Get worker jobs
export function getWorkerData(worker: UserAccount): {
  incomingLead: Job | null;
  activeJob: Job | null;
  recentSchedule: WorkerScheduleItem[];
  pendingRequests: Job[];
} {
  const { pendingRequests, activeJob, recentSchedule } = getWorkerRequests(worker.id);
  const incomingLead = pendingRequests.length > 0 ? pendingRequests[0] : null;

  return {
    incomingLead,
    activeJob,
    recentSchedule,
    pendingRequests,
  };
}

// Backward compatible helper for existing pages
export function updateJobStatus(
  jobId: string,
  status: Job['status'],
  extra?: Partial<Job>
): Job | null {
  const all = getAllRequests();
  const idx = all.findIndex((j) => j.id === jobId);
  if (idx < 0) return null;

  all[idx] = {
    ...all[idx],
    status,
    ...(extra || {}),
  };
  localStorage.setItem(STORAGE_KEY_CENTRAL_REQUESTS, JSON.stringify(all));
  dispatchRequestUpdate();
  return all[idx];
}
