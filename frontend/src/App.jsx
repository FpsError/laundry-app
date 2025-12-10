import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import apiClient from './api/client';
import './styles/App.css';

function AppContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                setIsLoggedIn(true);
            } catch (error) {
                console.error('Error parsing saved user:', error);
                // Clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        setIsLoading(false);
    }, []);

    const handleLogin = async (email, password, rememberMe) => {
        try {
            const data = await apiClient.login(email, password);
            setUser(data.user);
            setIsLoggedIn(true);

            // Store in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // If "remember me" is not checked, set a flag to clear on browser close
            if (!rememberMe) {
                sessionStorage.setItem('isSession', 'true');
            }

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

            // Store in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const handleLogout = () => {
        console.log('Logging out...');

        // Clear API client token
        apiClient.logout();

        // Clear all localStorage items
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear sessionStorage
        sessionStorage.removeItem('isSession');

        // Update state
        setUser(null);
        setIsLoggedIn(false);

        console.log('Logout complete');
    };

    // Check if this is a session-only login (no "remember me")
    useEffect(() => {
        const isSession = sessionStorage.getItem('isSession');

        if (isSession === 'true') {
            // This is a session-only login
            // Clear on window close would happen automatically with sessionStorage

            // Optional: Add a beforeunload listener if you want to clear localStorage too
            const handleBeforeUnload = () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, []);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p>Loading...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

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