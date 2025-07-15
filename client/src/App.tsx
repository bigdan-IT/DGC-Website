import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import StaffLogin from './pages/StaffLogin';
import Servers from './pages/Servers';
import Rules from './pages/Rules';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-gaming-bg floating-particles">
          <Navbar />
          <main className="page-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/staff-login" element={<StaffLogin />} />
              <Route path="/servers" element={<Servers />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/staff" element={<Admin />} />
              <Route path="/admin" element={<Admin />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 