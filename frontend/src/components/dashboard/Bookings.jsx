import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import '../../styles/Dashboard.css';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getBookings();
            setBookings(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await apiClient.cancelBooking(bookingId);
                // Refresh bookings list
                fetchBookings();
                alert('Booking cancelled successfully');
            } catch (err) {
                alert(`Failed to cancel booking: ${err.message}`);
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            confirmed: { class: 'status-confirmed', label: 'Confirmed' },
            pending: { class: 'status-pending', label: 'Pending' },
            completed: { class: 'status-completed', label: 'Completed' },
            cancelled: { class: 'status-cancelled', label: 'Cancelled' },
            waiting: { class: 'status-waiting', label: 'Waiting' }
        };
        const config = statusConfig[status] || { class: '', label: status };
        return (
            <span className={`status-badge ${config.class}`}>
                {config.label}
            </span>
        );
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return timeString;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your bookings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="info-message error">
                <span className="info-icon">❌</span>
                <p>Error loading bookings: {error}</p>
                <button onClick={fetchBookings} className="btn-primary" style={{ marginTop: '10px' }}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            <h2 className="dashboard-title">My Bookings</h2>
            <p className="dashboard-subtitle">Manage your laundry machine reservations</p>

            <div className="bookings-list">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-header">
                                <h3>
                                    {booking.machine_type === 'both'
                                        ? 'Washer & Dryer'
                                        : `${booking.machine_type?.charAt(0).toUpperCase() + booking.machine_type?.slice(1)}`}
                                    {booking.pair_id && (
                                        <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                                            (Pair {booking.pair_id})
                                        </span>
                                    )}
                                </h3>
                                {getStatusBadge(booking.status)}
                            </div>
                            <div className="booking-details">
                                <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                <p><strong>Booking ID:</strong> {booking.booking_id || booking.id}</p>
                                {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                            </div>
                            {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="btn-cancel"
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <p>No bookings found</p>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.hash = '#book'}
                        >
                            Book a Machine
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;  // Make sure this line exists!