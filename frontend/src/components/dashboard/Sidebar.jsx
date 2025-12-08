import '../../styles/Dashboard.css';

const Sidebar = ({ activeSection, onSectionChange }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'book', label: 'Book Machine', icon: '🧺' },
        { id: 'bookings', label: 'My Bookings', icon: '📋' },
        { id: 'waitlist', label: 'Waitlist', icon: '⏱️' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <div className="sidebar">
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