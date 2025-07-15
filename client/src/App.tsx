import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
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
        <div className="min-h-screen bg-gaming-bg">
          <Navbar />
          <main className="container mx-auto px-4 mt-20 pb-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/staff-login" element={<StaffLogin />} />
              <Route path="/servers" element={<Servers />} />
              <Route path="/rules" element={<Rules />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
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