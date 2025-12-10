import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import '../styles/Auth.css';

const LoginPage = ({ onLogin, onRegister }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    return (
        <div className="page-container">
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                top: '-250px',
                left: '-250px',
                animation: 'float 6s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                bottom: '-150px',
                right: '-150px',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            {/* Main container */}
            <div className="auth-card" style={{
                position: 'relative',
                zIndex: 1,
                animation: 'slideUp 0.5s ease-out'
            }}>
                {/* Logo */}
                <div className="logo-container">
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        🧺
                    </div>
                </div>

                <h1 className="title">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="subtitle">
                    {isRegistering ? 'Sign up to book your laundry slots' : 'Sign in to manage your bookings'}
                </p>

                {/* Forms */}
                {isRegistering ? (
                    <RegisterForm
                        onRegister={onRegister}
                        switchToLogin={() => setIsRegistering(false)}
                    />
                ) : (
                    <LoginForm
                        onLogin={onLogin}
                        switchToRegister={() => setIsRegistering(true)}
                    />
                )}
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;