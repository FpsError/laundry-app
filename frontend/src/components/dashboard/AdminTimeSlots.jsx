import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const AdminTimeSlots = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [filterPairId, setFilterPairId] = useState('');
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSlots();
    }, [selectedDate, filterPairId]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            // Fetch ALL slots for admin, not filtered
            const params = new URLSearchParams();
            params.append('date', selectedDate);
            if (filterPairId) params.append('pair_id', filterPairId);

            const response = await fetch(`/api/timeslots?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch slots');
            }

            const allSlots = await response.json();
            setSlots(allSlots);
            setMessage(null);
        } catch (error) {
            console.error('Failed to fetch slots:', error);
            setMessage({ type: 'error', text: 'Failed to load time slots' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisableSlot = async (slotId) => {
        if (!confirm('Are you sure you want to disable this time slot? Students will not be able to book it.')) return;

        try {
            await apiClient.disableTimeSlot(slotId);
            setMessage({ type: 'success', text: 'Time slot disabled successfully' });
            // Refresh the slots list
            await fetchSlots();
        } catch (error) {
            console.error('Failed to disable slot:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to disable slot' });
        }
    };

    const handleEnableSlot = async (slotId) => {
        try {
            await apiClient.enableTimeSlot(slotId);
            setMessage({ type: 'success', text: 'Time slot enabled successfully' });
            // Refresh the slots list
            await fetchSlots();
        } catch (error) {
            console.error('Failed to enable slot:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to enable slot' });
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm('Are you sure you want to delete this time slot? This cannot be undone and may affect existing bookings.')) return;

        try {
            await apiClient.deleteTimeSlot(slotId);
            setMessage({ type: 'success', text: 'Time slot deleted successfully' });
            // Refresh the slots list
            await fetchSlots();
        } catch (error) {
            console.error('Failed to delete slot:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to delete slot. It may have active bookings.' });
        }
    };

    const handleRegenerateSlots = async () => {
        if (!confirm('This will generate slots for the next 15 days. Continue?')) return;

        setLoading(true);
        try {
            await apiClient.regenerateSlots();
            setMessage({ type: 'success', text: 'Slots regenerated successfully for the next 15 days' });
            await fetchSlots();
        } catch (error) {
            console.error('Failed to regenerate slots:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to regenerate slots' });
        } finally {
            setLoading(false);
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
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Auto-dismiss success messages after 5 seconds
    useEffect(() => {
        if (message?.type === 'success') {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Time Slots Management
                </h1>
                <p style={{ color: '#666' }}>
                    Manage, enable, disable, or delete time slots
                </p>
            </div>

            {message && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{message.text}</span>
                    <button
                        onClick={() => setMessage(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'inherit'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'flex-end'
            }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Select Date
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Filter by Pair
                    </label>
                    <select
                        value={filterPairId}
                        onChange={(e) => setFilterPairId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">All Pairs</option>
                        <option value="1">Pair 1 (Machines 1-2)</option>
                        <option value="2">Pair 2 (Machines 3-4)</option>
                        <option value="3">Pair 3 (Machines 5-6)</option>
                        <option value="4">Pair 4 (Machines 7-8)</option>
                        <option value="5">Pair 5 (Machines 9-10)</option>
                    </select>
                </div>

                <button
                    onClick={handleRegenerateSlots}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}
                >
                    🔄 Regenerate Slots
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
                    <p style={{ marginTop: '16px', color: '#666' }}>Loading slots...</p>
                </div>
            ) : slots.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <p style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
                        No time slots found for {formatDate(selectedDate)}
                    </p>
                    <button
                        onClick={handleRegenerateSlots}
                        style={{
                            marginTop: '16px',
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Generate Slots
                    </button>
                </div>
            ) : (
                <div>
                    <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        <strong>ℹ️ Slot Management:</strong>
                        <ul style={{ marginTop: '8px', marginLeft: '20px', lineHeight: '1.6' }}>
                            <li><strong>Disable:</strong> Prevents students from booking (sets available machines to 0)</li>
                            <li><strong>Enable:</strong> Allows students to book again (recalculates available machines)</li>
                            <li><strong>Delete:</strong> Permanently removes the slot (only if no active bookings)</li>
                        </ul>
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                        Pair ID
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                        Date
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                        Time
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                        Available Machines
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                        Status
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {slots.map((slot) => {
                                    const isDisabled = slot.available_machines === 0;

                                    return (
                                        <tr key={slot.id} style={{
                                            borderBottom: '1px solid #e0e0e0',
                                            backgroundColor: isDisabled ? '#fff3cd' : 'white'
                                        }}>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1976d2',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: '500'
                                                }}>
                                                    Pair {slot.pair_id}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#333' }}>
                                                {formatDate(slot.date)}
                                            </td>
                                            <td style={{ padding: '12px', color: '#333' }}>
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    color: slot.available_machines > 0 ? '#28a745' : '#dc3545'
                                                }}>
                                                    {slot.available_machines} / 2
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {isDisabled ? (
                                                    <span style={{
                                                        backgroundColor: '#f8d7da',
                                                        color: '#721c24',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: '500'
                                                    }}>
                                                        🚫 Disabled
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        backgroundColor: '#d4edda',
                                                        color: '#155724',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: '500'
                                                    }}>
                                                        ✓ Available
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {isDisabled ? (
                                                        <button
                                                            onClick={() => handleEnableSlot(slot.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '500'
                                                            }}
                                                            title="Enable this slot for student booking"
                                                        >
                                                            ✓ Enable
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDisableSlot(slot.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#ffc107',
                                                                color: '#000',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '500'
                                                            }}
                                                            title="Disable this slot (students cannot book)"
                                                        >
                                                            ⊘ Disable
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '500'
                                                        }}
                                                        title="Permanently delete this slot"
                                                    >
                                                        🗑 Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
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

export default AdminTimeSlots;