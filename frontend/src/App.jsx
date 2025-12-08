import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import apiClient from './api/client';
import './styles/App.css';

function AppContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLogin = async (email, password) => {
        try {
            const data = await apiClient.login(email, password);
            setUser(data.user);
            setIsLoggedIn(true);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const handleRegister = async (userData) => {
        try {
            const data = await apiClient.register(userData);
            setUser(data.user);
            setIsLoggedIn(true);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const handleLogout = () => {
        apiClient.logout();
        setUser(null);
        setIsLoggedIn(false);
    };

    if (isLoggedIn) {
        return <DashboardPage user={user} onLogout={handleLogout} />;
    }

    return (
        <LoginPage
            onLogin={handleLogin}
            onRegister={handleRegister}
        />
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}