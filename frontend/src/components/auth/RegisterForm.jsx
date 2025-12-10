import { useState } from 'react';
import '../../styles/Auth.css';

const RegisterForm = ({ onRegister, switchToLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        student_id: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Remove confirmPassword before sending to backend
            const { confirmPassword, ...registrationData } = formData;

            console.log('Submitting registration with data:', registrationData);
            const result = await onRegister(registrationData);

            if (!result?.success) {
                setError(result?.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            {error && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="input-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    disabled={loading}
                />
            </div>

            <div className="input-group">
                <label htmlFor="student_id">Student ID *</label>
                <input
                    id="student_id"
                    name="student_id"
                    type="text"
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="S12345"
                    required
                    disabled={loading}
                />
            </div>

            <div className="input-group">
                <label htmlFor="email">Email Address *</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@aui.ma"
                    required
                    disabled={loading}
                />
            </div>

            <div className="input-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+212 6XX-XXXXXX"
                    disabled={loading}
                />
            </div>

            <div className="input-group">
                <label htmlFor="password">Password *</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    disabled={loading}
                />
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Must be at least 6 characters long
                </small>
            </div>

            <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    disabled={loading}
                />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="spinner-small"></span>
                        Creating Account...
                    </span>
                ) : (
                    'Create Account'
                )}
            </button>

            <div className="toggle-section">
                <span className="toggle-text">Already have an account? </span>
                <button
                    type="button"
                    className="toggle-link"
                    onClick={switchToLogin}
                    disabled={loading}
                >
                    Sign In
                </button>
            </div>
        </form>
    );
};

export default RegisterForm;