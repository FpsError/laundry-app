import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import '../../styles/Dashboard.css';

const Profile = ({ user: propUser }) => {
    const [user, setUser] = useState(propUser || null);
    const [loading, setLoading] = useState(!propUser);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: ''
    });
    const [updateMessage, setUpdateMessage] = useState(null);

    useEffect(() => {
        // If user prop is provided and has data, use it
        if (propUser && propUser.id) {
            setUser(propUser);
            setEditForm({
                full_name: propUser.full_name || '',
                phone: propUser.phone || ''
            });
            setLoading(false);
            return;
        }

        // Otherwise, fetch user data from API or localStorage
        fetchUserData();
    }, [propUser]);

    const fetchUserData = async () => {
        try {
            // Try to get user from localStorage first (saved during login)
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setEditForm({
                    full_name: userData.full_name || '',
                    phone: userData.phone || ''
                });
                setLoading(false);
                return;
            }

            // If not in localStorage, fetch from API
            const userData = await apiClient.getUserProfile();
            setUser(userData);
            setEditForm({
                full_name: userData.full_name || '',
                phone: userData.phone || ''
            });
            // Save to localStorage for future use
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setUpdateMessage(null);
        if (!isEditing) {
            // Reset form to current values
            setEditForm({
                full_name: user?.full_name || '',
                phone: user?.phone || ''
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUpdateMessage(null);

        try {
            const result = await apiClient.updateUserProfile(editForm);

            // Update local state
            const updatedUser = { ...user, ...editForm };
            setUser(updatedUser);

            // Update localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setUpdateMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'N/A';
        }
    };

    const getRoleName = (role) => {
        const roles = {
            'student': 'Student',
            'admin': 'Administrator',
            'attendant': 'Attendant'
        };
        return roles[role] || 'User';
    };

    if (loading) {
        return (
            <div>
                <h2 className="dashboard-title">Profile</h2>
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h2 className="dashboard-title">Profile</h2>
                <div className="info-message error">
                    <span className="info-icon">❌</span>
                    <p>Error loading profile: {error}</p>
                    <button
                        onClick={fetchUserData}
                        className="btn-primary"
                        style={{ marginTop: '10px' }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="dashboard-title">Profile</h2>
            <p className="dashboard-subtitle">Manage your account information</p>

            {updateMessage && (
                <div
                    className={`info-message ${updateMessage.type === 'success' ? 'success' : 'error'}`}
                    style={{ marginBottom: '20px' }}
                >
                    <span className="info-icon">
                        {updateMessage.type === 'success' ? '✅' : '❌'}
                    </span>
                    <p>{updateMessage.text}</p>
                </div>
            )}

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-avatar">
                        <span className="avatar-icon">
                            {user?.role === 'admin' ? '👨‍💼' : user?.role === 'attendant' ? '👷' : '👤'}
                        </span>
                    </div>
                    <div className="profile-info">
                        <h2>
                            {user?.full_name ||
                                user?.email?.split('@')[0] ||
                                'User Name'}
                        </h2>
                        <p className="profile-role">{getRoleName(user?.role)}</p>
                        {user?.id && (
                            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                                User ID: {user.id}
                            </p>
                        )}
                        {!user?.full_name && (
                            <p style={{
                                fontSize: '12px',
                                color: '#f59e0b',
                                marginTop: '4px',
                                backgroundColor: '#fef3c7',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                            }}>
                                ⚠️ Please update your full name
                            </p>
                        )}
                    </div>
                </div>

                <div className="profile-details">
                    {isEditing ? (
                        <form onSubmit={handleSubmit}>
                            <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <label style={{ fontWeight: '500', marginBottom: '8px' }}>
                                    <span style={{ marginRight: '8px' }}>👤</span>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    style={{
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                    required
                                />
                            </div>

                            <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: '16px' }}>
                                <label style={{ fontWeight: '500', marginBottom: '8px' }}>
                                    <span style={{ marginRight: '8px' }}>📱</span>
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={editForm.phone}
                                    onChange={handleInputChange}
                                    placeholder="+212 6XX-XXXXXX"
                                    style={{
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '20px',
                                paddingTop: '20px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: loading ? '#ccc' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEditToggle}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: 'transparent',
                                        color: '#6b7280',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="detail-row">
                                <span className="detail-label">
                                    <span style={{ marginRight: '8px' }}>📧</span>
                                    Email Address
                                </span>
                                <span className="detail-value">{user?.email || 'Not provided'}</span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    <span style={{ marginRight: '8px' }}>👤</span>
                                    Full Name
                                </span>
                                <span className="detail-value">
                                    {user?.full_name || (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                            Not provided
                                        </span>
                                    )}
                                </span>
                            </div>

                            {user?.student_id && (
                                <div className="detail-row">
                                    <span className="detail-label">
                                        <span style={{ marginRight: '8px' }}>🎓</span>
                                        Student ID
                                    </span>
                                    <span className="detail-value">{user.student_id}</span>
                                </div>
                            )}

                            <div className="detail-row">
                                <span className="detail-label">
                                    <span style={{ marginRight: '8px' }}>📱</span>
                                    Phone Number
                                </span>
                                <span className="detail-value">
                                    {user?.phone || (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                            Not provided
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    <span style={{ marginRight: '8px' }}>👥</span>
                                    Account Type
                                </span>
                                <span className="detail-value">{getRoleName(user?.role)}</span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    <span style={{ marginRight: '8px' }}>📅</span>
                                    Account Created
                                </span>
                                <span className="detail-value">
                                    {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                                </span>
                            </div>

                            <button
                                onClick={handleEditToggle}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}
                            >
                                ✏️ Edit Profile
                            </button>
                        </>
                    )}
                </div>

                {/* Add debug info in development */}
                {import.meta.env.DEV && (
                    <details style={{
                        marginTop: '20px',
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}>
                        <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                            Debug: User Data
                        </summary>
                        <pre style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: '#1f2937',
                            color: '#10b981',
                            borderRadius: '4px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default Profile;