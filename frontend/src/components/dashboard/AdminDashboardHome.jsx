import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import '../../styles/Dashboard.css';

const AdminDashboardHome = () => {
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeBookings: 0,
        completedToday: 0,
        waitlistCount: 0,
        availableSlots: 0,
        machinesInUse: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        setLoading(true);
        try {
            const [bookings, waitlist, slots] = await Promise.all([
                apiClient.getBookings(),
                apiClient.getWaitlist(),
                apiClient.getTimeSlots()
            ]);

            const today = new Date().toISOString().split('T')[0];

            const activeBookings = bookings.filter(b =>
                ['confirmed', 'received', 'washing'].includes(b.status)
            );

            const completedToday = bookings.filter(b =>
                b.status === 'completed' &&
                b.created_at?.startsWith(today)
            );

            const availableSlots = slots.filter(s => s.available_machines > 0);

            // Get recent bookings (last 5)
            const recent = bookings
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            setStats({
                totalBookings: bookings.length,
                activeBookings: activeBookings.length,
                completedToday: completedToday.length,
                waitlistCount: waitlist.length,
                availableSlots: availableSlots.length,
                machinesInUse: activeBookings.reduce((sum, b) => sum + b.machines_used, 0)
            });

            setRecentBookings(recent);
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'confirmed': '#28a745',
            'received': '#007bff',
            'washing': '#ffc107',
            'completed': '#17a2b8',
            'cancelled': '#dc3545'
        };
        return colors[status] || '#6c757d';
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
            <div style={{ marginBottom: '30px' }}>
                <h1 className="dashboard-title">Admin Dashboard</h1>
                <p className="dashboard-subtitle">System overview and recent activity</p>
            </div>

            {/* Main Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card" style={{ borderLeft: '4px solid #007bff' }}>
                    <div className="stat-icon" style={{ fontSize: '32px' }}>📊</div>
                    <div className="stat-info">
                        <h3>{stats.totalBookings}</h3>
                        <p>Total Bookings</p>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
                    <div className="stat-icon" style={{ fontSize: '32px' }}>🔄</div>
                    <div className="stat-info">
                        <h3>{stats.activeBookings}</h3>
                        <p>Active Bookings</p>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #17a2b8' }}>
                    <div className="stat-icon" style={{ fontSize: '32px' }}>✅</div>
                    <div className="stat-info">
                        <h3>{stats.completedToday}</h3>
                        <p>Completed Today</p>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #ffc107' }}>
                    <div className="stat-icon" style={{ fontSize: '32px' }}>⏱️</div>
                    <div className="stat-info">
                        <h3>{stats.waitlistCount}</h3>
                        <p>In Waitlist</p>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #6f42c1' }}>
                    <div className="stat-icon" style={{ fontSize: '32px' }}>🕐</div>
                    <div className="stat-info">
                        <h3>{stats.availableSlots}</h3>
                        <p>Available Slots</p>
                    </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '4px solid #fd7e14' }}>
                    <div className="stat-icon" style={{ fontSize: '32px' }}>🔧</div>
                    <div className="stat-info">
                        <h3>{stats.machinesInUse}</h3>
                        <p>Machines In Use</p>
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div style={{ marginTop: '40px' }}>
                <h2 className="section-title" style={{ marginBottom: '20px' }}>
                    Recent Bookings
                </h2>

                {recentBookings.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        color: '#666'
                    }}>
                        No recent bookings
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {recentBookings.map(booking => (
                            <div
                                key={booking.id}
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div>
                                    <div style={{
                                        fontWeight: '600',
                                        marginBottom: '4px',
                                        fontSize: '15px'
                                    }}>
                                        Ticket #{booking.ticket_id}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#666'
                                    }}>
                                        User ID: {booking.user_id} • {booking.load_type} load • {booking.machines_used} machine(s)
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        padding: '6px 16px',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        textTransform: 'capitalize',
                                        backgroundColor: getStatusColor(booking.status) + '20',
                                        color: getStatusColor(booking.status)
                                    }}>
                                        {booking.status}
                                    </span>

                                    <button
                                        onClick={() => window.location.hash = '#admin-bookings'}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: '#495057'
                                        }}
                                    >
                                        View →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '40px' }}>
                <h2 className="section-title" style={{ marginBottom: '20px' }}>
                    Quick Actions
                </h2>
                <div className="actions-grid">
                    <button
                        className="action-card"
                        onClick={() => window.location.hash = '#admin-bookings'}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="action-icon">📋</span>
                        <h3>Manage Bookings</h3>
                        <p>View and update all bookings</p>
                    </button>

                    <button
                        className="action-card"
                        onClick={() => window.location.hash = '#admin-slots'}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="action-icon">🕐</span>
                        <h3>Manage Time Slots</h3>
                        <p>Enable, disable, or delete slots</p>
                    </button>

                    <button
                        className="action-card"
                        onClick={() => window.location.hash = '#admin-machines'}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="action-icon">🔧</span>
                        <h3>Machine Status</h3>
                        <p>Monitor machine availability</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHome;