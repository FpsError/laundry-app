import { useState } from 'react';
import '../../styles/Auth.css';

const LoginForm = ({ onLogin, switchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password, rememberMe);
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="form-options">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                </label>
                <button type="button" className="link-button">Forgot password?</button>
            </div>

            <button type="submit" className="auth-button">
                Sign In
            </button>

            <div className="toggle-section">
                <span className="toggle-text">Don't have an account? </span>
                <button type="button" className="toggle-link" onClick={switchToRegister}>
                    Register
                </button>
            </div>
        </form>
    );
};

export default LoginForm;