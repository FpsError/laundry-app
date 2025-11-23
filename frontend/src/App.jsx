import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from "./Dashboard";

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [phone, setPhone] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = async () => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsLoggedIn(true);
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            alert('Error connecting to server: ' + error.message);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !fullName || !studentId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    student_id: studentId,
                    phone
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsLoggedIn(true);
            } else {
                alert('Registration failed: ' + data.message);
            }
        } catch (error) {
            alert('Error connecting to server: ' + error.message);
        }
    };

    if (isLoggedIn) {
        return <Dashboard />;
    }

    return (
        <div className="page-container">
            <div className="signin-card">
                {/* Logo */}
                <div className="logo-container">
                    <img
                        src="/Al_Akhawayn_University_Logo.png"
                        alt="University Logo"
                        className="logo"
                    />
                </div>

                {/* Title */}
                <h1 className="title">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
                <p className="subtitle">
                    {isRegistering ? 'Register for a new account' : 'Sign in to your account'}
                </p>

                {/* Form */}
                <div className="form-container">
                    {/* Registration-only fields */}
                    {isRegistering && (
                        <>
                            <div className="input-group">
                                <label htmlFor="fullName">Full Name *</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="studentId">Student ID *</label>
                                <input
                                    id="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="S12345"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+212 6XX-XXXXXX"
                                />
                            </div>
                        </>
                    )}

                    {/* Email Input */}
                    <div className="input-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@university.edu"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="input-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {/* Remember Me & Forgot Password (Login only) */}
                    {!isRegistering && (
                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <button className="link-button">Forgot password?</button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        onClick={isRegistering ? handleRegister : handleLogin} 
                        className="signin-button"
                    >
                        {isRegistering ? 'Create Account' : 'Sign In'}
                    </button>

                    {/* Toggle between Login/Register */}
                    <div className="toggle-section">
                        <span className="toggle-text">
                            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                        </span>
                        <button 
                            className="toggle-link" 
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                // Clear form when switching
                                setFullName('');
                                setStudentId('');
                                setPhone('');
                                setEmail('');
                                setPassword('');
                            }}
                        >
                            {isRegistering ? 'Sign In' : 'Register'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
        </div>
    );
}