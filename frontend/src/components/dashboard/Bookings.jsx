import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import BookingTicket from './BookingTicket';
import '../../styles/Dashboard.css';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showTicket, setShowTicket] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

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
                fetchBookings();
                alert('Booking cancelled successfully');
            } catch (err) {
                alert(`Failed to cancel booking: ${err.message}`);
            }
        }
    };

    const handlePrintTicket = (booking) => {
        const user = JSON.parse(localStorage.getItem('user'));
        setSelectedBooking({ booking, user });
        setShowTicket(true);
    };

    const handleCloseTicket = () => {
        setShowTicket(false);
        setSelectedBooking(null);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            confirmed: { class: 'status-confirmed', label: 'Confirmed' },
            pending: { class: 'status-pending', label: 'Pending' },
            received: { class: 'status-received', label: 'Received' },
            washing: { class: 'status-washing', label: 'Washing' },
            completed: { class: 'status-completed', label: 'Completed' },
            cancelled: { class: 'status-cancelled', label: 'Cancelled' },
            no_show: { class: 'status-no-show', label: 'No Show' }
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
            if (isNaN(date.getTime())) {
                return 'Invalid Time';
            }
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            console.error('Error formatting time:', e, timeString);
            return 'N/A';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Error formatting date:', e, dateString);
            return 'N/A';
        }
    };

    const getMachineTypeLabel = (loadType) => {
        const labels = {
            combined: 'Washer & Dryer (Combined)',
            separate_whites: 'Separate Loads - Whites',
            separate_colors: 'Separate Loads - Colors'
        };
        return labels[loadType] || loadType;
    };

    // Filter bookings based on selected status
    const filteredBookings = statusFilter === 'all'
        ? bookings
        : bookings.filter(booking => booking.status === statusFilter);

    // Get count for each status
    const getStatusCount = (status) => {
        if (status === 'all') return bookings.length;
        return bookings.filter(booking => booking.status === status).length;
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

            {/* Filter Tabs */}
            <div className="filter-tabs" style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '8px'
            }}>
                <button
                    onClick={() => setStatusFilter('all')}
                    className={statusFilter === 'all' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'all' ? '#3b82f6' : '#f3f4f6',
                        color: statusFilter === 'all' ? 'white' : '#6b7280'
                    }}
                >
                    All ({getStatusCount('all')})
                </button>
                <button
                    onClick={() => setStatusFilter('confirmed')}
                    className={statusFilter === 'confirmed' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'confirmed' ? '#10b981' : '#f3f4f6',
                        color: statusFilter === 'confirmed' ? 'white' : '#6b7280'
                    }}
                >
                    Confirmed ({getStatusCount('confirmed')})
                </button>
                <button
                    onClick={() => setStatusFilter('received')}
                    className={statusFilter === 'received' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'received' ? '#8b5cf6' : '#f3f4f6',
                        color: statusFilter === 'received' ? 'white' : '#6b7280'
                    }}
                >
                    Received ({getStatusCount('received')})
                </button>
                <button
                    onClick={() => setStatusFilter('washing')}
                    className={statusFilter === 'washing' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'washing' ? '#06b6d4' : '#f3f4f6',
                        color: statusFilter === 'washing' ? 'white' : '#6b7280'
                    }}
                >
                    Washing ({getStatusCount('washing')})
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={statusFilter === 'completed' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'completed' ? '#22c55e' : '#f3f4f6',
                        color: statusFilter === 'completed' ? 'white' : '#6b7280'
                    }}
                >
                    Completed ({getStatusCount('completed')})
                </button>
                <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={statusFilter === 'cancelled' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'cancelled' ? '#ef4444' : '#f3f4f6',
                        color: statusFilter === 'cancelled' ? 'white' : '#6b7280'
                    }}
                >
                    Cancelled ({getStatusCount('cancelled')})
                </button>
                <button
                    onClick={() => setStatusFilter('no_show')}
                    className={statusFilter === 'no_show' ? 'filter-tab active' : 'filter-tab'}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        backgroundColor: statusFilter === 'no_show' ? '#f97316' : '#f3f4f6',
                        color: statusFilter === 'no_show' ? 'white' : '#6b7280'
                    }}
                >
                    No Show ({getStatusCount('no_show')})
                </button>
            </div>

            <div className="bookings-list">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-header">
                                <h3>
                                    {getMachineTypeLabel(booking.load_type)}
                                    {booking.pair_id && (
                                        <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                                            (Pair {booking.pair_id})
                                        </span>
                                    )}
                                </h3>
                                {getStatusBadge(booking.status)}
                            </div>
                            <div className="booking-details">
                                <p><strong>Date:</strong> {formatDate(booking.date)}</p>
                                <p><strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                <p><strong>Booking ID:</strong> {booking.ticket_id}</p>
                                <p><strong>Machines Used:</strong> {booking.machines_used}</p>
                                {booking.created_at && (
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                        Booked on: {formatDate(booking.created_at)}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {/* Print Ticket Button - show for confirmed, received, washing */}
                                {(booking.status === 'confirmed' || booking.status === 'received' || booking.status === 'washing') && (
                                    <button
                                        onClick={() => handlePrintTicket(booking)}
                                        className="btn-primary"
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            flex: '1',
                                            minWidth: '120px'
                                        }}
                                    >
                                        🖨️ Print Ticket
                                    </button>
                                )}
                                {/* Cancel Button */}
                                {(booking.status === 'confirmed' || booking.status === 'received') && (
                                    <button
                                        onClick={() => handleCancelBooking(booking.id)}
                                        className="btn-cancel"
                                        style={{
                                            flex: '1',
                                            minWidth: '120px'
                                        }}
                                    >
                                        Cancel Booking
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <p>
                            {statusFilter === 'all'
                                ? 'No bookings found'
                                : `No ${statusFilter} bookings`}
                        </p>
                        {statusFilter !== 'all' && (
                            <button
                                className="btn-primary"
                                onClick={() => setStatusFilter('all')}
                                style={{ marginBottom: '10px' }}
                            >
                                View All Bookings
                            </button>
                        )}
                        <button
                            className="btn-primary"
                            onClick={() => window.location.hash = '#book'}
                        >
                            Book a Machine
                        </button>
                    </div>
                )}
            </div>

            {/* Ticket Modal */}
            {showTicket && selectedBooking && (
                <BookingTicket
                    booking={selectedBooking.booking}
                    user={selectedBooking.user}
                    onClose={handleCloseTicket}
                />
            )}
        </div>
    );
};

export default Bookings;