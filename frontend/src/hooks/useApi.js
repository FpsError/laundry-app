import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const callApi = useCallback(async (apiFunction, ...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFunction(...args);
            setData(result);
            setLoading(false);
            return { success: true, data: result };
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, []);

    return { loading, error, data, callApi };
};