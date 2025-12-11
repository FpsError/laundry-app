import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const AdminMachines = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchMachines();
    }, []);

    const fetchMachines = async () => {
        setLoading(true);
        try {
            const machinesData = await apiClient.getMachines();
            setMachines(machinesData);
            setMessage(null);
        } catch (error) {
            console.error('Failed to fetch machines:', error);
            setMessage({ type: 'error', text: 'Failed to load machines' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (machineId, currentStatus) => {
        const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
        const action = newStatus === 'available' ? 'enable' : 'disable';

        if (!confirm(`Are you sure you want to ${action} this machine?`)) return;

        try {
            await apiClient.updateMachine(machineId, { status: newStatus });
            setMessage({
                type: 'success',
                text: `Machine ${action}d successfully`
            });
            fetchMachines();
        } catch (error) {
            console.error('Failed to update machine:', error);
            setMessage({
                type: 'error',
                text: `Failed to ${action} machine`
            });
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'available': {
                label: 'Available',
                color: '#10b981',
                bg: '#d1fae5',
                icon: '✓'
            },
            'maintenance': {
                label: 'Maintenance',
                color: '#f59e0b',
                bg: '#fef3c7',
                icon: '🔧'
            },
            'out_of_service': {
                label: 'Out of Service',
                color: '#ef4444',
                bg: '#fee2e2',
                icon: '❌'
            }
        };
        return statusMap[status] || statusMap.available;
    };

    const groupByPair = (machines) => {
        return machines.reduce((acc, machine) => {
            if (!acc[machine.pair_id]) {
                acc[machine.pair_id] = [];
            }
            acc[machine.pair_id].push(machine);
            return acc;
        }, {});
    };

    const groupedMachines = groupByPair(machines);

    // Auto-dismiss messages
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
                    Machines Management
                </h1>
                <p style={{ color: '#666' }}>
                    Monitor and manage washing machine status
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

            {/* Info Banner */}
            <div style={{
                backgroundColor: '#e3f2fd',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #90caf9'
            }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>ℹ️</span>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        <strong>Machine Status Guide:</strong>
                        <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                            <li><strong>Available:</strong> Machine is working and can be booked</li>
                            <li><strong>Maintenance:</strong> Temporarily out of service for repairs</li>
                            <li><strong>Out of Service:</strong> Permanently disabled or removed</li>
                        </ul>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                    }} />
                    <p style={{ marginTop: '20px', color: '#666', fontSize: '16px' }}>
                        Loading machines...
                    </p>
                </div>
            ) : machines.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px'
                }}>
                    <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>
                        🔧
                    </span>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        No machines found
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '24px' }}>
                    {Object.keys(groupedMachines).sort((a, b) => a - b).map(pairId => (
                        <div
                            key={pairId}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '1px solid #e5e7eb'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '20px',
                                paddingBottom: '16px',
                                borderBottom: '2px solid #f3f4f6'
                            }}>
                                <div style={{
                                    backgroundColor: '#e0f2fe',
                                    color: '#0369a1',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '18px'
                                }}>
                                    Pair {pairId}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#6b7280'
                                }}>
                                    {groupedMachines[pairId].length} machine{groupedMachines[pairId].length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '16px'
                            }}>
                                {groupedMachines[pairId].sort((a, b) => a.machine_number - b.machine_number).map(machine => {
                                    const statusInfo = getStatusInfo(machine.status);
                                    const isAvailable = machine.status === 'available';

                                    return (
                                        <div
                                            key={machine.id}
                                            style={{
                                                border: `2px solid ${statusInfo.color}`,
                                                borderRadius: '12px',
                                                padding: '20px',
                                                backgroundColor: statusInfo.bg,
                                                transition: 'all 0.2s',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* Status indicator dot */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: statusInfo.color,
                                                boxShadow: `0 0 0 3px ${statusInfo.bg}`,
                                                animation: isAvailable ? 'pulse 2s infinite' : 'none'
                                            }} />

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{
                                                    fontSize: '32px',
                                                    width: '50px',
                                                    height: '50px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'white',
                                                    borderRadius: '10px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    🧺
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: '700',
                                                        color: '#1f2937'
                                                    }}>
                                                        Machine #{machine.machine_number}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#6b7280',
                                                        marginTop: '2px'
                                                    }}>
                                                        ID: {machine.id}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '16px',
                                                padding: '12px',
                                                backgroundColor: 'white',
                                                borderRadius: '8px'
                                            }}>
                                                <span style={{ fontSize: '20px' }}>{statusInfo.icon}</span>
                                                <span style={{
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: statusInfo.color
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleToggleStatus(machine.id, machine.status)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    backgroundColor: isAvailable ? '#fbbf24' : '#10b981',
                                                    color: isAvailable ? '#000' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                }}
                                            >
                                                {isAvailable ? '🔧 Set to Maintenance' : '✓ Mark as Available'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default AdminMachines;