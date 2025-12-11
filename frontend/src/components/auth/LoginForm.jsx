import { useState } from 'react';

const LoginForm = ({ onLogin, switchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await onLogin(email, password, rememberMe);

        if (!result.success) {
            setError(result.message || 'Login failed');
        }

        setLoading(false);
    };

    const inputStyle = (isFocused) => ({
        width: '100%',
        padding: '12px 16px',
        border: `2px solid ${isFocused ? '#667eea' : '#e5e7eb'}`,
        borderRadius: '12px',
        fontSize: '15px',
        transition: 'all 0.3s',
        outline: 'none',
        backgroundColor: loading ? '#f9fafb' : 'white'
    });

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div style={{
                    padding: '14px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '12px',
                    marginBottom: '24px',
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

            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                }}>
                    Email Address
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@aui.ma"
                    required
                    disabled={loading}
                    style={inputStyle(false)}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                }}>
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    style={inputStyle(false)}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px'
            }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#4b5563'
                }}>
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                        style={{
                            marginRight: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    />
                    Remember me
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '14px',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseOver={(e) => {
                    if (!loading) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                    }
                }}
                onMouseOut={(e) => {
                    if (!loading) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                    }
                }}
            >
                {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{
                textAlign: 'center',
                marginTop: '24px',
                fontSize: '15px',
                color: '#6b7280'
            }}>
                Don't have an account?{' '}
                <button
                    type="button"
                    onClick={switchToRegister}
                    disabled={loading}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '15px'
                    }}
                >
                    Register
                </button>
            </div>
        </form>
    );
};

export default LoginForm;