import { useState, useEffect, useCallback, useRef } from 'react';  // Add useRef
import apiClient from '../api/client';

export const useSlots = (date) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const lastFetchedDate = useRef('');  // Now useRef is defined

    const fetchSlots = useCallback(async () => {
        if (!date) {
            console.log('No date provided, skipping fetch');
            return;
        }

        console.log('Fetching slots for date:', date);
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.getTimeSlots(date);
            console.log('API response received:', response);

            // Handle different possible response structures
            if (Array.isArray(response)) {
                // Response is directly an array
                setSlots(response);
            } else if (response && response.slots) {
                // Response has { slots: [...] } structure
                setSlots(response.slots);
            } else if (response && response.data) {
                // Response has { data: [...] } structure
                setSlots(response.data);
            } else {
                console.warn('Unexpected response format:', response);
                setSlots([]);
            }
        } catch (err) {
            console.error('Failed to fetch slots:', err);
            setError(err.message || 'Failed to load slots');
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        // Only fetch if date changed and we're not already loading
        if (date && date !== lastFetchedDate.current && !loading) {
            console.log('Date changed, fetching slots:', date);
            lastFetchedDate.current = date;
            fetchSlots();
        }
    }, [date, fetchSlots, loading]);

    const createBooking = async (slotData) => {
        try {
            console.log('Creating booking with data:', slotData);
            const response = await apiClient.createBooking(slotData);
            console.log('Booking response:', response);

            // Refresh slots after booking
            await fetchSlots();

            return {
                success: true,
                data: response,
                message: response.message || 'Booking created successfully'
            };
        } catch (err) {
            console.error('Booking failed:', err);
            return {
                success: false,
                error: err.message || 'Booking failed'
            };
        }
    };

    return { slots, loading, error, fetchSlots, createBooking };
};