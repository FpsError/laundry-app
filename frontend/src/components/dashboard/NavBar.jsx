import '../../styles/Dashboard.css';

const Navbar = ({ user, onLogout }) => {
    return (
        <nav className="dashboard-nav">
            <div className="nav-content">
                <div className="nav-logo">
                    <img
                        src="/Al_Akhawayn_University_Logo.png"
                        alt="University Logo"
                        className="nav-logo-img"
                    />
                    <h2>Laundry Portal</h2>
                </div>
                <div className="user-section">
                    <div className="welcome-text">
                        Welcome back, <span className="user-name">{user?.full_name || user?.email}</span>
                    </div>
                    <button onClick={onLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;