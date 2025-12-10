import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const useSlots = (date, pairId = null) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (date) {
            fetchSlots();
        }
    }, [date, pairId]);

    const fetchSlots = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiClient.getTimeSlots(date, pairId);
            console.log('Fetched slots:', data);
            setSlots(data);
        } catch (err) {
            console.error('Error fetching slots:', err);
            setError(err.message || 'Failed to fetch time slots');
        } finally {
            setLoading(false);
        }
    };

    const createBooking = async (bookingData) => {
        try {
            const response = await apiClient.createBooking(bookingData);

            console.log('Booking response:', response);

            // Refresh slots after booking attempt
            await fetchSlots();

            // Check if response indicates waitlist (HTTP 202)
            if (response.waitlist) {
                return {
                    success: true,
                    message: response.message,
                    data: {
                        waitlist: true,
                        position: response.position,
                        waitlist_id: response.waitlist_id
                    }
                };
            }

            return {
                success: true,
                message: response.message || 'Booking successful',
                data: response
            };
        } catch (err) {
            console.error('Error creating booking:', err);

            // Check for waitlist full error
            if (err.message?.includes('Waitlist is full')) {
                return {
                    success: false,
                    error: err.message
                };
            }

            return {
                success: false,
                error: err.message || 'Failed to create booking'
            };
        }
    };

    return {
        slots,
        loading,
        error,
        createBooking,
        refreshSlots: fetchSlots
    };
};