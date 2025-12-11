import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import '../../styles/Dashboard.css';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        upcomingBookings: 0,
        completedWashes: 0,
        waitlistPosition: 0,
        favoriteMachine: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            // Fetch multiple data sources
            const [bookings, waitlist] = await Promise.all([
                apiClient.getBookings(),
                apiClient.getWaitlist()
            ]);

            // Calculate stats
            const upcoming = bookings.filter(b =>
                b.status === 'confirmed' || b.status === 'pending'
            ).length;

            const completed = bookings.filter(b =>
                b.status === 'completed'
            ).length;

            const waitlistPos = waitlist.length > 0 ? waitlist[0].position : 0;

            setStats({
                upcomingBookings: upcoming,
                completedWashes: completed,
                waitlistPosition: waitlistPos,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p className="dashboard-subtitle">Welcome to your laundry management portal</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <h3>{stats.upcomingBookings}</h3>
                        <p>Upcoming Bookings</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>{stats.completedWashes}</h3>
                        <p>Completed Washes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-info">
                        <h3>{stats.waitlistPosition}</h3>
                        <p>Waitlist Position</p>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="actions-grid">
                    <button
                        className="action-card"
                        onClick={() => window.location.hash = '#book'}
                    >
                        <span className="action-icon">🧺</span>
                        <h3>Book a Machine</h3>
                        <p>Schedule your laundry time slot</p>
                    </button>
                    <button
                        className="action-card"
                        onClick={() => window.location.hash = '#bookings'}
                    >
                        <span className="action-icon">📋</span>
                        <h3>View Bookings</h3>
                        <p>Check your upcoming reservations</p>
                    </button>
                    <button
                        className="action-card"
                        onClick={() => window.location.hash = '#waitlist'}
                    >
                        <span className="action-icon">⏱️</span>
                        <h3>Check Waitlist</h3>
                        <p>See your position in waitlist</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;