import '../../styles/Dashboard.css';

const Sidebar = ({ activeSection, onSectionChange, user }) => {
    // Check if user is admin
    const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

    const studentMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'book', label: 'Book Machine', icon: '🧺' },
        { id: 'bookings', label: 'My Bookings', icon: '📋' },
        { id: 'waitlist', label: 'Waitlist', icon: '⏱️' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'admin-bookings', label: 'All Bookings', icon: '📋' },
        { id: 'admin-slots', label: 'Manage Slots', icon: '🕐' },
        { id: 'admin-machines', label: 'Machines', icon: '🔧' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

    return (
        <div className="sidebar">
            {isAdmin && (
                <div style={{
                    padding: '16px',
                    marginBottom: '16px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffc107',
                    textAlign: 'center'
                }}>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#856404'
                    }}>
                        🔑 Admin Panel
                    </span>
                </div>
            )}

            <div className="menu">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => onSectionChange(item.id)}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;