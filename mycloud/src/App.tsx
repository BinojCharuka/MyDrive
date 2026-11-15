import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StorageProvider } from './context/StorageContext';
import { UploadProvider } from './context/UploadContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import MyFilesPage from './pages/MyFilesPage';
import RecentPage from './pages/RecentPage';
import StarredPage from './pages/StarredPage';
import SharedPage from './pages/SharedPage';
import TrashPage from './pages/TrashPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <StorageProvider>
        <UploadProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="files" element={<MyFilesPage />} />
              <Route path="recent" element={<RecentPage />} />
              <Route path="starred" element={<StarredPage />} />
              <Route path="shared-with-me" element={<SharedPage initialTab="with-me" />} />
              <Route path="shared-by-me" element={<SharedPage initialTab="by-me" />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UploadProvider>
      </StorageProvider>
    </AuthProvider>
  );
};

export default App;

