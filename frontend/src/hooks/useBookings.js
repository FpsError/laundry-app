import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const useBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async () => {
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
    }, []); // No dependencies = won't change

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]); // Only runs when fetchBookings changes (which it won't)

    const cancelBooking = useCallback(async (bookingId) => {
        try {
            await apiClient.cancelBooking(bookingId);
            // Refresh bookings after cancellation
            await fetchBookings();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, [fetchBookings]);

    return { bookings, loading, error, fetchBookings, cancelBooking };
};