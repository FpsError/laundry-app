import React from 'react';

const BookingTicket = ({ booking, user, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const date = new Date(timeString);
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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getMachineTypeLabel = (loadType) => {
        const labels = {
            combined: 'Combined Load (1 Machine)',
            separate_whites: 'Separate Whites (2 Machines)',
            separate_colors: 'Separate Colors (2 Machines)'
        };
        return labels[loadType] || loadType;
    };

    return (
        <>
            {/* Modal Overlay */}
            <div className="ticket-overlay" onClick={onClose}>
                <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Ticket Content */}
                    <div className="ticket-container">
                        <div className="ticket-header">
                            <h1>🧺 Laundry Booking Ticket</h1>
                            <p className="ticket-subtitle">Present this ticket to the laundry attendant</p>
                        </div>

                        <div className="ticket-body">
                            {/* Ticket ID - Large and prominent */}
                            <div className="ticket-section ticket-id-section">
                                <div className="ticket-id-label">Ticket ID</div>
                                <div className="ticket-id-value">{booking.ticket_id}</div>
                            </div>

                            {/* Student Information */}
                            <div className="ticket-section">
                                <h3 className="section-title">Student Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Name:</span>
                                        <span className="info-value">{user.full_name || 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Student ID:</span>
                                        <span className="info-value">{user.student_id || 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">User ID:</span>
                                        <span className="info-value">{user.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="ticket-section">
                                <h3 className="section-title">Booking Details</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Date:</span>
                                        <span className="info-value">{formatDate(booking.date)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Time:</span>
                                        <span className="info-value">
                                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Machine Pair:</span>
                                        <span className="info-value">Pair {booking.pair_id}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Load Type:</span>
                                        <span className="info-value">{getMachineTypeLabel(booking.load_type)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Machines Used:</span>
                                        <span className="info-value">{booking.machines_used}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="ticket-section ticket-instructions">
                                <h3 className="section-title">Instructions</h3>
                                <ol className="instructions-list">
                                    <li>Arrive at the laundry during your time slot</li>
                                    <li>Present this ticket to the attendant</li>
                                    <li>Hand over your laundry items</li>
                                    <li>Keep this ticket for pickup reference</li>
                                </ol>
                            </div>

                            <div className="ticket-footer">
                                <p>Thank you for using our laundry service!</p>
                                <p className="ticket-timestamp">
                                    Booked on: {formatDate(booking.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Hidden when printing */}
                    <div className="ticket-actions no-print">
                        <button onClick={handlePrint} className="btn-print">
                            🖨️ Print Ticket
                        </button>
                        <button onClick={onClose} className="btn-close">
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                /* Modal Styles */
                .ticket-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .ticket-modal {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                /* Ticket Container */
                .ticket-container {
                    padding: 40px;
                    background: white;
                }

                .ticket-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px dashed #e5e7eb;
                }

                .ticket-header h1 {
                    font-size: 28px;
                    font-weight: bold;
                    color: #1f2937;
                    margin: 0 0 8px 0;
                }

                .ticket-subtitle {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 0;
                }

                /* Ticket ID Section - FIXED: Solid dark blue background */
                .ticket-id-section {
                    background: #2563eb !important; /* Solid blue color */
                    color: white;
                    padding: 24px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 24px;
                    border: 2px solid #1d4ed8;
                    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
                }

                .ticket-id-label {
                    font-size: 14px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.95;
                    margin-bottom: 12px;
                    color: white;
                }

                .ticket-id-value {
                    font-size: 36px;
                    font-weight: 800;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 2px;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                /* Sections */
                .ticket-section {
                    margin-bottom: 24px;
                    padding: 20px;
                    background: #f9fafb;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 16px 0;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e5e7eb;
                }

                .info-grid {
                    display: grid;
                    gap: 12px;
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                }

                .info-label {
                    font-weight: 500;
                    color: #6b7280;
                    font-size: 14px;
                }

                .info-value {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 14px;
                    text-align: right;
                }

                /* Instructions */
                .ticket-instructions {
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                }

                .instructions-list {
                    margin: 0;
                    padding-left: 20px;
                    color: #78350f;
                }

                .instructions-list li {
                    margin-bottom: 8px;
                    font-size: 14px;
                    line-height: 1.6;
                }

                /* Footer */
                .ticket-footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 3px dashed #e5e7eb;
                    color: #6b7280;
                }

                .ticket-footer p {
                    margin: 4px 0;
                    font-size: 14px;
                }

                .ticket-timestamp {
                    font-size: 12px;
                    color: #9ca3af;
                }

                /* Action Buttons */
                .ticket-actions {
                    display: flex;
                    gap: 12px;
                    padding: 20px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }

                .btn-print, .btn-close {
                    flex: 1;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-print {
                    background: #3b82f6;
                    color: white;
                }

                .btn-print:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                .btn-close {
                    background: #e5e7eb;
                    color: #1f2937;
                }

                .btn-close:hover {
                    background: #d1d5db;
                }

                /* Print Styles - FIXED: Use solid colors for printing */
                @media print {
                    /* Hide EVERYTHING on the page */
                    body * {
                        visibility: hidden;
                    }

                    /* Show only the ticket */
                    .ticket-overlay,
                    .ticket-overlay * {
                        visibility: visible;
                    }

                    /* Position ticket at top of page */
                    .ticket-overlay {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        padding: 0;
                        margin: 0;
                        overflow: visible;
                    }

                    .ticket-modal {
                        max-width: 100%;
                        max-height: 100%;
                        box-shadow: none;
                        border-radius: 0;
                        margin: 0;
                        padding: 0;
                        overflow: visible;
                        position: relative;
                        top: 0;
                        left: 0;
                        transform: none;
                    }

                    .ticket-container {
                        padding: 20px;
                        margin: 0;
                        page-break-inside: avoid;
                    }

                    /* Hide buttons */
                    .no-print,
                    .ticket-actions {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    .ticket-section {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* FIXED: Use solid color for print */
                    .ticket-id-section {
                        background: #2563eb !important;
                        background-color: #2563eb !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        border: 2px solid #1d4ed8 !important;
                        color: white !important;
                    }

                    .ticket-id-label,
                    .ticket-id-value {
                        color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Ensure all sections print with colors */
                    .ticket-section {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }

                    .ticket-instructions {
                        background: #fef3c7 !important;
                        border: 1px solid #fbbf24 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                    }

                    /* Ensure text is black on white */
                    .info-value, .section-title, .ticket-header h1 {
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .ticket-container {
                        padding: 20px;
                    }

                    .ticket-header h1 {
                        font-size: 24px;
                    }

                    .ticket-id-value {
                        font-size: 28px;
                    }

                    .info-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 4px;
                    }

                    .info-value {
                        text-align: left;
                    }
                }
            `}</style>
        </>
    );
};

export default BookingTicket;