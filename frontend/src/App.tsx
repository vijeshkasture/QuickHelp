import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserAccount } from './types';
import { getCurrentUser, normalizeUserRole } from './services/storage';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { CustomerSignupPage } from './pages/CustomerSignupPage';
import { WorkerSignupPage } from './pages/WorkerSignupPage';

import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { PriceMatchingPage } from './pages/PriceMatchingPage';
import { CustomerLiveTrackPage } from './pages/CustomerLiveTrackPage';
import { CustomerHistoryPage } from './pages/CustomerHistoryPage';

import { WorkerDashboardPage } from './pages/WorkerDashboardPage';
import { WorkerJobPage } from './pages/WorkerJobPage';
import { WorkerRequestsPage } from './pages/WorkerRequestsPage';
import { WorkerHistoryPage } from './pages/WorkerHistoryPage';
import { SecureJobRoomPage } from './pages/SecureJobRoomPage';

// Route protection for Customer portal
const CustomerRoute: React.FC<{
  currentUser: UserAccount | null;
  children: (user: UserAccount) => React.ReactNode;
}> = ({ currentUser, children }) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  const role = normalizeUserRole(currentUser.role);
  if (role !== 'customer') {
    return <Navigate to="/worker/dashboard" replace />;
  }
  return <>{children(currentUser)}</>;
};

// Route protection for Worker portal
const WorkerRoute: React.FC<{
  currentUser: UserAccount | null;
  children: (user: UserAccount) => React.ReactNode;
}> = ({ currentUser, children }) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  const role = normalizeUserRole(currentUser.role || (currentUser.primaryTrade ? 'worker' : 'customer'));
  if (role !== 'worker') {
    return <Navigate to="/customer/dashboard" replace />;
  }
  return <>{children(currentUser)}</>;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleUserChange = (user: UserAccount | null) => {
    setCurrentUser(user);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Route (Auth-aware) */}
        <Route
          path="/"
          element={
            <LandingPage
              currentUser={currentUser}
              onUserChange={handleUserChange}
            />
          }
        />

        {/* Authentication & Signup Routes */}
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate
                to={normalizeUserRole(currentUser.role) === 'customer' ? '/customer/dashboard' : '/worker/dashboard'}
                replace
              />
            ) : (
              <LoginPage
                currentUser={currentUser}
                onUserChange={handleUserChange}
              />
            )
          }
        />
        <Route
          path="/select-role"
          element={
            <RoleSelectionPage
              currentUser={currentUser}
              onUserChange={handleUserChange}
            />
          }
        />
        <Route
          path="/signup/customer"
          element={<CustomerSignupPage onUserChange={handleUserChange} />}
        />
        <Route
          path="/signup/worker"
          element={<WorkerSignupPage onUserChange={handleUserChange} />}
        />

        {/* Customer Portal Routes (Protected) */}
        <Route
          path="/customer/dashboard"
          element={
            <CustomerRoute currentUser={currentUser}>
              {(user) => (
                <CustomerDashboardPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/matching"
          element={
            <CustomerRoute currentUser={currentUser}>
              {(user) => (
                <PriceMatchingPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/book"
          element={
            <CustomerRoute currentUser={currentUser}>
              {(user) => (
                <PriceMatchingPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/track"
          element={
            <CustomerRoute currentUser={currentUser}>
              {(user) => (
                <CustomerLiveTrackPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/requests"
          element={
            <CustomerRoute currentUser={currentUser}>
              {(user) => (
                <CustomerHistoryPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/history"
          element={
            <CustomerRoute currentUser={currentUser}>
              {(user) => (
                <CustomerHistoryPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </CustomerRoute>
          }
        />

        {/* Worker Portal Routes (Protected) */}
        <Route
          path="/worker/dashboard"
          element={
            <WorkerRoute currentUser={currentUser}>
              {(user) => (
                <WorkerDashboardPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </WorkerRoute>
          }
        />
        <Route
          path="/worker/job"
          element={
            <WorkerRoute currentUser={currentUser}>
              {(user) => (
                <WorkerJobPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </WorkerRoute>
          }
        />
        <Route
          path="/worker/requests"
          element={
            <WorkerRoute currentUser={currentUser}>
              {(user) => (
                <WorkerRequestsPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </WorkerRoute>
          }
        />
        <Route
          path="/worker/history"
          element={
            <WorkerRoute currentUser={currentUser}>
              {(user) => (
                <WorkerHistoryPage
                  currentUser={user}
                  onUserChange={handleUserChange}
                />
              )}
            </WorkerRoute>
          }
        />

        {/* Secure Private Job Room (Customer & Worker Authorized) */}
        <Route
          path="/jobs/:jobId"
          element={
            <SecureJobRoomPage
              currentUser={currentUser}
              onUserChange={handleUserChange}
            />
          }
        />

        {/* Fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
