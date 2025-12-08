import '../../styles/Dashboard.css';

const Profile = ({ user }) => {
    return (
        <div>
            <h2 className="dashboard-title">Profile</h2>
            <p className="dashboard-subtitle">Manage your account information</p>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-avatar">
                        <span className="avatar-icon">👤</span>
                    </div>
                    <div className="profile-info">
                        <h2>{user?.full_name || 'User Name'}</h2>
                        <p className="profile-role">Student</p>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="detail-row">
                        <span className="detail-label">Email Address</span>
                        <span className="detail-value">{user?.email || 'user@example.com'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Student ID</span>
                        <span className="detail-value">{user?.student_id || 'S12345'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Phone Number</span>
                        <span className="detail-value">{user?.phone || '+212 6XX-XXXXXX'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Account Created</span>
                        <span className="detail-value">January 2024</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;