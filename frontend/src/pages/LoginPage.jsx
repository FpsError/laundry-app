import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import '../styles/Auth.css';

const LoginPage = ({ onLogin, onRegister }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    return (
        <div className="page-container">
            <div className="auth-card">
                <div className="logo-container">
                    <img
                        src="/Al_Akhawayn_University_Logo.png"
                        alt="University Logo"
                        className="logo"
                    />
                </div>

                <h1 className="title">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="subtitle">
                    {isRegistering ? 'Register for a new account' : 'Sign in to your account'}
                </p>

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
        </div>
    );
};

export default LoginPage;