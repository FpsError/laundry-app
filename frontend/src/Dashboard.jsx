import { useState, useEffect } from 'react';
import './Dashboard.css';
import apiClient from './api/client.js';

export default function Dashboard() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [bookings, setBookings] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get user from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        
        // Load initial data
        loadBookings();
        loadWaitlist();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getBookings();
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWaitlist = async () => {
        try {
            const data = await apiClient.getWaitlist();
            setWaitlist(data);
        } catch (error) {
            console.error('Error loading waitlist:', error);
        }
    };

    const loadTimeSlots = async (date) => {
        try {
            setLoading(true);
            const data = await apiClient.getTimeSlots(date);
            setTimeSlots(data);
        } catch (error) {
            console.error('Error loading time slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        apiClient.logout();
        localStorage.removeItem('user');
        window.location.reload();
    };

    // Calculate stats
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const waitlistCount = waitlist.filter(w => w.status === 'waiting').length;

    return (
        <div className="dashboard-container">
            {/* Top Navigation Bar */}
            <nav className="dashboard-nav">
                <div className="nav-content">
                    <div className="nav-logo">
                        <img
                            src="https://placehold.co/40x40/10b981/white?text=LOGO"
                            alt="Logo"
                            className="nav-logo-img"
                        />
                        <h2>Masbanat Al-Akhawayn</h2>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-layout">
                {/* Sidebar Menu */}
                <aside className="sidebar">
                    <div className="menu">
                        <button
                            className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveSection('dashboard')}
                        >
                            <span className="menu-icon">🏠</span>
                            <span>Dashboard</span>
                        </button>

                        <button
                            className={`menu-item ${activeSection === 'book' ? 'active' : ''}`}
                            onClick={() => setActiveSection('book')}
                        >
                            <span className="menu-icon">📅</span>
                            <span>Book Now</span>
                        </button>

                        <button
                            className={`menu-item ${activeSection === 'bookings' ? 'active' : ''}`}
                            onClick={() => setActiveSection('bookings')}
                        >
                            <span className="menu-icon">🕒</span>
                            <span>My Bookings</span>
                        </button>

                        <button
                            className={`menu-item ${activeSection === 'waitlist' ? 'active' : ''}`}
                            onClick={() => setActiveSection('waitlist')}
                        >
                            <span className="menu-icon">⏰</span>
                            <span>Waitlist</span>
                        </button>

                        <button
                            className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveSection('profile')}
                        >
                            <span className="menu-icon">👤</span>
                            <span>Profile</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="dashboard-main">
                    <div className="dashboard-content">
                        {activeSection === 'dashboard' && (
                            <>
                                <h1 className="dashboard-title">Dashboard</h1>

                                <div className="dashboard-grid">
                                    {/* Stats Cards */}
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-icon">📅</div>
                                            <div className="stat-info">
                                                <h3>{activeBookings}</h3>
                                                <p>Active Bookings</p>
                                            </div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-icon">✅</div>
                                            <div className="stat-info">
                                                <h3>{completedBookings}</h3>
                                                <p>Completed</p>
                                            </div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-icon">⏰</div>
                                            <div className="stat-info">
                                                <h3>{waitlistCount}</h3>
                                                <p>On Waitlist</p>
                                            </div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-icon">📊</div>
                                            <div className="stat-info">
                                                <h3>{bookings.length}</h3>
                                                <p>Total Bookings</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="quick-actions">
                                        <h2 className="section-title">Quick Actions</h2>
                                        <div className="actions-grid">
                                            <button 
                                                className="action-card"
                                                onClick={() => setActiveSection('book')}
                                            >
                                                <span className="action-icon">➕</span>
                                                <h3>New Booking</h3>
                                                <p>Reserve a washing machine</p>
                                            </button>

                                            <button 
                                                className="action-card"
                                                onClick={() => setActiveSection('bookings')}
                                            >
                                                <span className="action-icon">📋</span>
                                                <h3>View Bookings</h3>
                                                <p>Check your reservations</p>
                                            </button>

                                            <button 
                                                className="action-card"
                                                onClick={() => setActiveSection('waitlist')}
                                            >
                                                <span className="action-icon">⏳</span>
                                                <h3>Join Waitlist</h3>
                                                <p>Get notified when available</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="recent-activity">
                                        <h2 className="section-title">Recent Activity</h2>
                                        <div className="activity-list">
                                            <div className="empty-state">
                                                <span className="empty-icon">📭</span>
                                                <p>No recent activity</p>
                                                <button 
                                                    className="btn-primary"
                                                    onClick={() => setActiveSection('book')}
                                                >
                                                    Make Your First Booking
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeSection === 'book' && (
                            <>
                                <h1 className="dashboard-title">Book Now</h1>
                                <p className="dashboard-subtitle">Make a new reservation</p>
                                
                                <div className="booking-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="booking-date">
                                                <span className="label-icon">📅</span>
                                                Select Date
                                            </label>
                                            <input 
                                                id="booking-date"
                                                type="date" 
                                                className="form-input"
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        loadTimeSlots(e.target.value);
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="load-type">
                                                <span className="label-icon">🧺</span>
                                                Load Type
                                            </label>
                                            <select id="load-type" className="form-input">
                                                <option value="combined">Combined (Wash & Dry together)</option>
                                                <option value="separate">Separate (Wash only or Dry only)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="loading-container">
                                            <div className="spinner"></div>
                                            <p>Loading available slots...</p>
                                        </div>
                                    ) : timeSlots.length === 0 ? (
                                        <div className="info-message">
                                            <span className="info-icon">ℹ️</span>
                                            <p>Select a date to view available time slots</p>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="slots-header">Available Time Slots ({timeSlots.length} slots)</h3>
                                            {(() => {
                                                // Group slots by pair_id
                                                const slotsByPair = {};
                                                timeSlots.forEach(slot => {
                                                    if (!slotsByPair[slot.pair_id]) {
                                                        slotsByPair[slot.pair_id] = [];
                                                    }
                                                    slotsByPair[slot.pair_id].push(slot);
                                                });

                                                // Format time to 12-hour format
                                                const formatTime = (isoString) => {
                                                    const date = new Date(isoString);
                                                    return date.toLocaleTimeString('en-US', { 
                                                        hour: 'numeric', 
                                                        minute: '2-digit',
                                                        hour12: true 
                                                    });
                                                };

                                                return Object.entries(slotsByPair).map(([pairId, slots]) => (
                                                    <div key={pairId} className="pair-section">
                                                        <div className="pair-header">
                                                            <h4>🔗 Machine Pair {pairId}</h4>
                                                            <span className="pair-info">2 washing machines available</span>
                                                        </div>
                                                        <div className="slots-grid">
                                                            {slots.map(slot => (
                                                                <div key={slot.id} className={`slot-card ${slot.available_machines === 0 ? 'slot-full' : ''}`}>
                                                                    <div className="slot-header">
                                                                        <div className="slot-time">
                                                                            <span className="time-icon">⏰</span>
                                                                            <div className="time-display">
                                                                                <strong>{formatTime(slot.start_time)}</strong>
                                                                                <span className="time-separator">-</span>
                                                                                <strong>{formatTime(slot.end_time)}</strong>
                                                                            </div>
                                                                        </div>
                                                                        <span className={`availability-badge ${slot.available_machines === 0 ? 'full' : 'available'}`}>
                                                                            {slot.available_machines === 0 ? '❌ Full' : `✅ ${slot.available_machines} Available`}
                                                                        </span>
                                                                    </div>
                                                                    <button 
                                                                        className="btn-book"
                                                                        disabled={slot.available_machines === 0}
                                                                        onClick={async () => {
                                                                            try {
                                                                                const loadType = document.getElementById('load-type').value;
                                                                                await apiClient.createBooking({
                                                                                    slot_id: slot.id,
                                                                                    load_type: loadType
                                                                                });
                                                                                alert('✅ Booking created successfully!');
                                                                                loadBookings();
                                                                                setActiveSection('bookings');
                                                                            } catch (error) {
                                                                                alert('❌ ' + (error.message || 'Error creating booking'));
                                                                            }
                                                                        }}
                                                                    >
                                                                        {slot.available_machines === 0 ? '🚫 Fully Booked' : '📅 Book This Slot'}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {activeSection === 'bookings' && (
                            <>
                                <h1 className="dashboard-title">My Bookings</h1>
                                <p className="dashboard-subtitle">View your current and past reservations</p>
                                
                                {loading ? (
                                    <div className="loading">Loading bookings...</div>
                                ) : bookings.length === 0 ? (
                                    <div className="content-placeholder">
                                        <p>No bookings yet</p>
                                        <button 
                                            className="btn-primary"
                                            onClick={() => setActiveSection('book')}
                                        >
                                            Make Your First Booking
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bookings-list">
                                        {bookings.map(booking => (
                                            <div key={booking.id} className="booking-card">
                                                <div className="booking-header">
                                                    <h3>Booking #{booking.ticket_id}</h3>
                                                    <span className={`status-badge status-${booking.status}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="booking-details">
                                                    <p><strong>Load Type:</strong> {booking.load_type}</p>
                                                    <p><strong>Machines:</strong> {booking.machines_used}</p>
                                                    <p><strong>Created:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                                                </div>
                                                {booking.status === 'confirmed' && (
                                                    <button 
                                                        className="btn-cancel"
                                                        onClick={async () => {
                                                            if (confirm('Cancel this booking?')) {
                                                                try {
                                                                    await apiClient.cancelBooking(booking.id);
                                                                    loadBookings();
                                                                    alert('Booking cancelled');
                                                                } catch (error) {
                                                                    alert('Error cancelling booking');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {activeSection === 'waitlist' && (
                            <>
                                <h1 className="dashboard-title">Waitlist</h1>
                                <p className="dashboard-subtitle">Manage your waitlist status</p>
                                
                                {waitlist.length === 0 ? (
                                    <div className="content-placeholder">
                                        <p>You're not on any waitlist</p>
                                        <p className="info-text">When a time slot is full, you'll be added to the waitlist automatically</p>
                                    </div>
                                ) : (
                                    <div className="waitlist-grid">
                                        {waitlist.map(entry => (
                                            <div key={entry.id} className="waitlist-card">
                                                <div className="waitlist-header">
                                                    <h3>Position #{entry.position}</h3>
                                                    <span className={`status-badge status-${entry.status}`}>
                                                        {entry.status}
                                                    </span>
                                                </div>
                                                <div className="waitlist-details">
                                                    <p><strong>Load Type:</strong> {entry.load_type}</p>
                                                    <p><strong>Joined:</strong> {new Date(entry.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {activeSection === 'profile' && (
                            <>
                                <h1 className="dashboard-title">Profile</h1>
                                <p className="dashboard-subtitle">Account settings and booking history</p>
                                
                                {user && (
                                    <div className="profile-container">
                                        <div className="profile-card">
                                            <div className="profile-avatar">
                                                <span className="avatar-icon">👤</span>
                                            </div>
                                            <div className="profile-info">
                                                <h2>{user.full_name || 'User'}</h2>
                                                <p className="profile-role">{user.role || 'Student'}</p>
                                            </div>
                                        </div>

                                        <div className="profile-details">
                                            <div className="detail-row">
                                                <span className="detail-label">Email</span>
                                                <span className="detail-value">{user.email}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Student ID</span>
                                                <span className="detail-value">{user.student_id || 'N/A'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Total Bookings</span>
                                                <span className="detail-value">{bookings.length}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Completed</span>
                                                <span className="detail-value">{completedBookings}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}