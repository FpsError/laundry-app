import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [slots, setSlots] = useState({});
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState(() => {
        // Set today's date as default
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const bookingsData = await apiClient.getBookings();

            // Fetch slot details for each booking
            const slotPromises = bookingsData.map(booking =>
                fetch(`/api/timeslots?slot_id=${booking.slot_id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).then(r => r.json())
            );

            const slotsData = await Promise.all(slotPromises);
            const slotsMap = {};
            slotsData.forEach((slotArray, idx) => {
                if (slotArray && slotArray.length > 0) {
                    slotsMap[bookingsData[idx].slot_id] = slotArray[0];
                }
            });

            setBookings(bookingsData);
            setSlots(slotsMap);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            setMessage({ type: 'error', text: 'Failed to load bookings' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            await apiClient.updateBooking(bookingId, { status: newStatus });
            setMessage({ type: 'success', text: `Booking status updated to ${newStatus}` });
            fetchBookings();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update booking status' });
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await apiClient.cancelBooking(bookingId);
            setMessage({ type: 'success', text: 'Booking cancelled successfully' });
            fetchBookings();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to cancel booking' });
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'confirmed': { bg: '#d4edda', text: '#155724' },
            'received': { bg: '#cce5ff', text: '#004085' },
            'washing': { bg: '#fff3cd', text: '#856404' },
            'completed': { bg: '#d1ecf1', text: '#0c5460' },
            'cancelled': { bg: '#f8d7da', text: '#721c24' }
        };
        return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredBookings = bookings.filter(booking => {
        if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
        if (filterDate) {
            const slot = slots[booking.slot_id];
            if (!slot || slot.date !== filterDate) return false;
        }
        return true;
    });

    const groupedBookings = filteredBookings.reduce((acc, booking) => {
        const slot = slots[booking.slot_id];
        const date = slot?.date || 'Unknown';
        if (!acc[date]) acc[date] = [];
        acc[date].push(booking);
        return acc;
    }, {});

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                    All Bookings
                </h1>
                <p style={{ color: '#666' }}>
                    View and manage all student bookings
                </p>
            </div>

            {message && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Filter by Status
                    </label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="received">Received</option>
                        <option value="washing">Washing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Filter by Date
                    </label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <button
                    onClick={() => {
                        setFilterStatus('all');
                        setFilterDate('');
                    }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        alignSelf: 'flex-end'
                    }}
                >
                    Clear Filters
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #3498db',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                    }} />
                    <p style={{ marginTop: '16px', color: '#666' }}>Loading bookings...</p>
                </div>
            ) : Object.keys(groupedBookings).length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        No bookings found
                    </p>
                </div>
            ) : (
                Object.keys(groupedBookings).sort().reverse().map(date => (
                    <div key={date} style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: '#333'
                        }}>
                            {formatDate(date)}
                        </h2>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            {groupedBookings[date].map(booking => {
                                const slot = slots[booking.slot_id];
                                const statusColor = getStatusColor(booking.status);

                                return (
                                    <div
                                        key={booking.id}
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e0e0e0',
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
                                                <div style={{
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    marginBottom: '8px'
                                                }}>
                                                    Ticket #{booking.ticket_id}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '14px' }}>
                                                    User ID: {booking.user_id}
                                                </div>
                                            </div>
                                            <span style={{
                                                backgroundColor: statusColor.bg,
                                                color: statusColor.text,
                                                padding: '6px 16px',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                textTransform: 'capitalize'
                                            }}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '16px',
                                            marginBottom: '16px'
                                        }}>
                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    marginBottom: '4px'
                                                }}>
                                                    Time Slot
                                                </div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {slot ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}` : 'N/A'}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    marginBottom: '4px'
                                                }}>
                                                    Machine Pair
                                                </div>
                                                <div style={{ fontWeight: '500' }}>
                                                    Pair {slot?.pair_id || 'N/A'}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    marginBottom: '4px'
                                                }}>
                                                    Load Type
                                                </div>
                                                <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                                                    {booking.load_type}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    marginBottom: '4px'
                                                }}>
                                                    Machines Used
                                                </div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {booking.machines_used}
                                                </div>
                                            </div>
                                        </div>

                                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                paddingTop: '16px',
                                                borderTop: '1px solid #e0e0e0'
                                            }}>
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'received')}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        Mark as Received
                                                    </button>
                                                )}

                                                {booking.status === 'received' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'washing')}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#ffc107',
                                                            color: '#000',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        Mark as Washing
                                                    </button>
                                                )}

                                                {booking.status === 'washing' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        Mark as Completed
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AdminBookings;