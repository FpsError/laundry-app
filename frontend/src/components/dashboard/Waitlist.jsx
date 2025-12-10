import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import '../../styles/Dashboard.css';

const Waitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [slots, setSlots] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchWaitlist();
    }, []);

    const fetchWaitlist = async () => {
        setLoading(true);
        try {
            const waitlistData = await apiClient.getWaitlist();

            // Fetch slot details for each waitlist entry
            const slotIds = [...new Set(waitlistData.map(item => item.slot_id))];
            const slotPromises = slotIds.map(async (slotId) => {
                try {
                    const response = await fetch(`/api/timeslots`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    const allSlots = await response.json();
                    return allSlots.find(s => s.id === slotId);
                } catch (err) {
                    console.error(`Failed to fetch slot ${slotId}:`, err);
                    return null;
                }
            });

            const slotsData = await Promise.all(slotPromises);
            const slotsMap = {};
            slotsData.forEach((slot) => {
                if (slot) {
                    slotsMap[slot.id] = slot;
                }
            });

            setWaitlist(waitlistData);
            setSlots(slotsMap);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch waitlist:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveWaitlist = async (waitlistId) => {
        if (!confirm('Are you sure you want to leave this waitlist?')) return;

        try {
            await apiClient.leaveWaitlist(waitlistId);
            setMessage({ type: 'success', text: 'Successfully left the waitlist' });
            fetchWaitlist();
        } catch (err) {
            console.error('Failed to leave waitlist:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to leave waitlist' });
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return 'N/A';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getLoadTypeLabel = (loadType) => {
        const labels = {
            combined: 'Combined Load (1 machine)',
            separate_whites: 'Separate Whites (2 machines)',
            separate_colors: 'Separate Colors (2 machines)'
        };
        return labels[loadType] || loadType;
    };

    const getStatusBadge = (position) => {
        if (position === 1) {
            return (
                <span style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500'
                }}>
                    🥇 Position #{position} - Next in line!
                </span>
            );
        } else if (position <= 3) {
            return (
                <span style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500'
                }}>
                    Position #{position}
                </span>
            );
        } else {
            return (
                <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500'
                }}>
                    Position #{position}
                </span>
            );
        }
    };

    // Auto-dismiss success messages
    useEffect(() => {
        if (message?.type === 'success') {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (loading) {
        return (
            <div>
                <h2 className="dashboard-title">Waitlist</h2>
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading waitlist...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h2 className="dashboard-title">Waitlist</h2>
                <div className="info-message error">
                    <span className="info-icon">❌</span>
                    <p>Error loading waitlist: {error}</p>
                    <button
                        onClick={fetchWaitlist}
                        className="btn-primary"
                        style={{ marginTop: '10px' }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="dashboard-title">Waitlist</h2>
            <p className="dashboard-subtitle">Your current positions in waitlists</p>

            {message && (
                <div
                    className={`info-message ${message.type === 'success' ? 'success' : 'error'}`}
                    style={{ marginBottom: '20px' }}
                >
                    <span className="info-icon">
                        {message.type === 'success' ? '✅' : '❌'}
                    </span>
                    <p>{message.text}</p>
                </div>
            )}

            {/* Info box explaining waitlist system */}
            <div style={{
                padding: '12px 16px',
                marginBottom: '20px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #90caf9',
                borderRadius: '8px',
                fontSize: '14px'
            }}>
                <strong>ℹ️ How Waitlist Works:</strong>
                <ul style={{ marginTop: '8px', marginLeft: '20px', lineHeight: '1.6' }}>
                    <li>Join a waitlist when your desired time slot is full</li>
                    <li>When a booking is cancelled, you'll be automatically promoted</li>
                    <li>Your booking will be created automatically when you reach position #1</li>
                    <li>Maximum 10 people per waitlist</li>
                </ul>
            </div>

            <div className="waitlist-grid" style={{ display: 'grid', gap: '16px' }}>
                {waitlist.length > 0 ? (
                    waitlist.map((item) => {
                        const slot = slots[item.slot_id];

                        return (
                            <div
                                key={item.id}
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '16px'
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                                            {getLoadTypeLabel(item.load_type)}
                                        </h3>
                                        {slot && (
                                            <p style={{ fontSize: '14px', color: '#6b7280' }}>
                                                Machine Pair {slot.pair_id}
                                            </p>
                                        )}
                                    </div>
                                    {getStatusBadge(item.position)}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gap: '12px',
                                    marginBottom: '16px'
                                }}>
                                    {slot ? (
                                        <>
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                                    📅 Date & Time
                                                </div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {formatDate(slot.date)}
                                                </div>
                                                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ color: '#ef4444' }}>
                                            ⚠️ Slot information unavailable
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                            ⏰ Joined Waitlist
                                        </div>
                                        <div style={{ fontWeight: '500' }}>
                                            {formatDate(item.created_at)}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                            📊 Waitlist Status
                                        </div>
                                        <div style={{ fontWeight: '500', color: item.status === 'waiting' ? '#f59e0b' : '#22c55e' }}>
                                            {item.status === 'waiting' ? '⏳ Waiting' : '✅ ' + item.status}
                                        </div>
                                    </div>
                                </div>

                                {item.position === 1 ? (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#fef3c7',
                                        border: '1px solid #fbbf24',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        marginBottom: '12px'
                                    }}>
                                        🎉 <strong>You're next!</strong> Your booking will be automatically created when a spot opens up.
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        marginBottom: '12px'
                                    }}>
                                        💡 You're #{item.position} in line. We'll notify you when you move up or get a booking.
                                    </div>
                                )}

                                <button
                                    onClick={() => handleLeaveWaitlist(item.id)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: 'transparent',
                                        color: '#dc2626',
                                        border: '1px solid #dc2626',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                >
                                    Leave Waitlist
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">⏱️</span>
                        <p>You are not on any waitlists</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                            When you try to book a full time slot, you'll be added to the waitlist automatically.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.hash = '#book'}
                            style={{ marginTop: '16px' }}
                        >
                            View Available Slots
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Waitlist;