import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../../styles/Dashboard.css';

const DashboardLayout = ({ user, children, activeSection, onSectionChange, onLogout }) => {
    console.log('User object:', user); // Check what's in the user object

    return (
        <div className="dashboard-container">
            <Navbar user={user} onLogout={onLogout} />
            <div className="dashboard-layout">
                <Sidebar
                    activeSection={activeSection}
                    onSectionChange={onSectionChange}
                    user={user}  // Pass user to Sidebar
                />
                <main className="dashboard-main">
                    <div className="dashboard-content">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;