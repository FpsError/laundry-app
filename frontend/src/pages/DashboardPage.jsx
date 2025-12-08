import { useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import Bookings from '../components/dashboard/Bookings';
import BookingForm from '../components/dashboard/BookingForm';
import Waitlist from '../components/dashboard/Waitlist';
import Profile from '../components/dashboard/Profile';

const DashboardPage = ({ user, onLogout }) => {
    const [activeSection, setActiveSection] = useState('dashboard');

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardHome />;
            case 'book':
                return <BookingForm />;
            case 'bookings':
                return <Bookings />;
            case 'waitlist':
                return <Waitlist />;
            case 'profile':
                return <Profile user={user} />;
            default:
                return <DashboardHome />;
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