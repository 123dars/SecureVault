import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './AuthContext';
import { Toaster } from 'react-hot-toast'; 

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Vault from './pages/Vault';
import Settings from './pages/Settings';
import MfaSetup from './pages/MfaSetup'; 
import ForgotPassword from './pages/ForgotPassword'; // <--- Make sure this exists

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="bottom-right" reverseOrder={false} />
        
        <Routes>
          {/* Public Routes - Note: ForgotPassword is NOT protected */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> 

          {/* Protected Routes */}
          <Route 
            path="/mfa-setup" 
            element={
              <ProtectedRoute>
                <MfaSetup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vault" 
            element={
              <ProtectedRoute>
                <Vault />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Default Route - Redirects logged-in users to vault, others to login */}
          <Route path="*" element={<Navigate to="/vault" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;