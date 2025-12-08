import { useState } from 'react';
import '../../styles/Auth.css';

const RegisterForm = ({ onRegister, switchToLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        studentId: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                />
            </div>

            <div className="input-group">
                <label htmlFor="studentId">Student ID *</label>
                <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="S12345"
                    required
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
                    placeholder="you@university.edu"
                    required
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
                    placeholder="Enter your password"
                    required
                />
            </div>

            <button type="submit" className="auth-button">
                Create Account
            </button>

            <div className="toggle-section">
                <span className="toggle-text">Already have an account? </span>
                <button type="button" className="toggle-link" onClick={switchToLogin}>
                    Sign In
                </button>
            </div>
        </form>
    );
};

export default RegisterForm;