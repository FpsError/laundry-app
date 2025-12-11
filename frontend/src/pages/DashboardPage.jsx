    import { useState, useEffect } from 'react';
    import DashboardLayout from '../components/dashboard/DashboardLayout';
    import DashboardHome from '../components/dashboard/DashboardHome';
    import AdminDashboardHome from '../components/dashboard/AdminDashboardHome';
    import Bookings from '../components/dashboard/Bookings';
    import BookingForm from '../components/dashboard/BookingForm';
    import Waitlist from '../components/dashboard/Waitlist';
    import Profile from '../components/dashboard/Profile';
    import AdminTimeSlots from '../components/dashboard/AdminTimeSlots';
    import AdminBookings from '../components/dashboard/AdminBookings';
    import AdminMachines from '../components/dashboard/AdminMachines';

    const DashboardPage = ({ user, onLogout }) => {
        const [activeSection, setActiveSection] = useState('dashboard');
        const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

        // Sync activeSection with URL hash
        useEffect(() => {
            const handleHashChange = () => {
                const hash = window.location.hash.slice(1); // Remove the #
                if (hash) {
                    setActiveSection(hash);
                }
            };

            // Listen for hash changes
            window.addEventListener('hashchange', handleHashChange);

            // Check initial hash on mount
            handleHashChange();

            return () => window.removeEventListener('hashchange', handleHashChange);
        }, []);

        const renderContent = () => {
            switch (activeSection) {
                case 'dashboard':
                    // Show different dashboard based on user role
                    return isAdmin ? <AdminDashboardHome /> : <DashboardHome />;
                case 'book':
                    // Pass callback to redirect after booking
                    return <BookingForm onBookingComplete={() => setActiveSection('bookings')} />;
                case 'bookings':
                    return <Bookings />;
                case 'waitlist':
                    return <Waitlist />;
                case 'profile':
                    return <Profile user={user} />;
                // Admin routes
                case 'admin-slots':
                    return <AdminTimeSlots />;
                case 'admin-bookings':
                    return <AdminBookings />;
                case 'admin-users':
                    return <div style={{ padding: '20px' }}><h1>Users Management (Coming Soon)</h1></div>;
                case 'admin-machines':
                    return <AdminMachines />;
                default:
                    return isAdmin ? <AdminDashboardHome /> : <DashboardHome />;
            }
        };

        return (
            <DashboardLayout
                user={user}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onLogout={onLogout}
            >
                {renderContent()}
            </DashboardLayout>
        );
    };

    export default DashboardPage;