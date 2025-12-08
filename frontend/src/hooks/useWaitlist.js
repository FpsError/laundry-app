import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const useWaitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWaitlist = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient.getWaitlist();
            setWaitlist(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch waitlist:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWaitlist();
    }, [fetchWaitlist]);

    return { waitlist, loading, error, fetchWaitlist };
};