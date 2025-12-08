import { useState, useCallback, useRef } from 'react';
import { useSlots } from '../../hooks/useSlots';
import '../../styles/Dashboard.css';

const BookingForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [machineType, setMachineType] = useState('washer');
    const [bookingMessage, setBookingMessage] = useState('');

    const { slots, loading, error, createBooking } = useSlots(date);

    // Use ref to prevent multiple clicks
    const isProcessing = useRef(false);

    const handleDateChange = useCallback((e) => {
        const newDate = e.target.value;
        console.log('Date changed to:', newDate);
        setDate(newDate);
        setSelectedSlotId(null);
        setBookingMessage('');
    }, []);

    // Format time from various possible formats
    const formatTime = (timeValue) => {
        if (!timeValue) return 'N/A';

        try {
            // Try to parse as Date
            const dateObj = new Date(timeValue);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }

            // If it's already a time string like "08:00:00"
            if (typeof timeValue === 'string' && timeValue.includes(':')) {
                const [hours, minutes] = timeValue.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minutes} ${ampm}`;
            }

            return String(timeValue);
        } catch (err) {
            console.error('Error formatting time:', timeValue, err);
            return String(timeValue);
        }
    };

    const handleBookSlot = async (slot) => {
        if (isProcessing.current) return;

        console.log('Booking slot:', slot);
        setSelectedSlotId(slot.id);
        setBookingMessage('');
        isProcessing.current = true;

        try {
            const bookingData = {
                slot_id: slot.id,
                date: date,
                machine_type: machineType,
                // Include other required fields based on your API
                ...(slot.pair_id && { pair_id: slot.pair_id }),
                ...(slot.start_time && { start_time: slot.start_time }),
                ...(slot.end_time && { end_time: slot.end_time })
            };

            console.log('Sending booking data:', bookingData);
            const result = await createBooking(bookingData);

            if (result.success) {
                setBookingMessage(result.message || 'Booking successful!');
                setSelectedSlotId(null);
            } else {
                setBookingMessage(`Booking failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Booking error:', err);
            setBookingMessage(`Error: ${err.message}`);
        } finally {
            isProcessing.current = false;
        }
    };

    // Debug: Log slots when they change
    console.log('Current slots:', slots);

    return (
        <div>
            <h2 className="dashboard-title">Book a Machine</h2>
            <p className="dashboard-subtitle">Select a time slot to book a laundry machine</p>

            <div className="booking-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="date">
                            <span className="label-icon">📅</span>
                            Select Date
                        </label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="form-input"
                            min={today}
                            required
                        />
                        <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                            Showing slots for: {date}
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="machineType">
                            <span className="label-icon">🧺</span>
                            Machine Type
                        </label>
                        <select
                            id="machineType"
                            value={machineType}
                            onChange={(e) => setMachineType(e.target.value)}
                            className="form-input"
                        >
                            <option value="washer">Washer</option>
                            <option value="dryer">Dryer</option>
                            <option value="both">Both (Washer & Dryer)</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading available slots...</p>
                        <small>Fetching data for {date}</small>
                    </div>
                ) : error ? (
                    <div className="info-message error">
                        <span className="info-icon">❌</span>
                        <p>Error loading slots: {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                            style={{ marginTop: '10px' }}
                        >
                            Retry
                        </button>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="info-message">
                        <span className="info-icon">📅</span>
                        <p>No available slots found for {date}.</p>
                        <p>Please try another date or check back later.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="slots-header">Available Time Slots</h3>
                            <small style={{ color: '#6b7280' }}>
                                Found {slots.length} slot{slots.length !== 1 ? 's' : ''}
                            </small>
                        </div>

                        {/* Group slots by pair_id if available */}
                        {(() => {
                            // Check if slots have pair_id
                            const hasPairId = slots.some(slot => slot.pair_id);

                            if (hasPairId) {
                                // Group by pair_id
                                const groupedSlots = slots.reduce((groups, slot) => {
                                    const pairId = slot.pair_id || 'unknown';
                                    if (!groups[pairId]) groups[pairId] = [];
                                    groups[pairId].push(slot);
                                    return groups;
                                }, {});

                                return Object.keys(groupedSlots).map(pairId => (
                                    <div key={pairId} className="pair-section">
                                        <div className="pair-header">
                                            <h4>Pair {pairId}</h4>
                                            <span className="pair-info">
                                                {groupedSlots[pairId].length} slot{groupedSlots[pairId].length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="slots-grid">
                                            {groupedSlots[pairId].map((slot) => (
                                                <SlotCard
                                                    key={slot.id}
                                                    slot={slot}
                                                    machineType={machineType}
                                                    onBook={handleBookSlot}
                                                    formatTime={formatTime}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ));
                            } else {
                                // No pair_id, just show all slots
                                return (
                                    <div className="slots-grid">
                                        {slots.map((slot) => (
                                            <SlotCard
                                                key={slot.id}
                                                slot={slot}
                                                machineType={machineType}
                                                onBook={handleBookSlot}
                                                formatTime={formatTime}
                                            />
                                        ))}
                                    </div>
                                );
                            }
                        })()}
                    </div>
                )}

                {bookingMessage && (
                    <div className={`info-message ${bookingMessage.includes('successful') ? 'success' : 'error'}`}>
                        <span className="info-icon">
                            {bookingMessage.includes('successful') ? '✅' : '❌'}
                        </span>
                        <p>{bookingMessage}</p>
                    </div>
                )}

                {/* Debug info (remove in production) */}
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#6b7280'
                }}>
                    <p><strong>Debug Info:</strong></p>
                    <p>Date: {date}</p>
                    <p>Slots loaded: {slots.length}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                    <p>Error: {error || 'None'}</p>
                </div>
            </div>
        </div>
    );
};

// Separate SlotCard component for better organization
const SlotCard = ({ slot, machineType, onBook, formatTime }) => {
    const isAvailable =
        slot.available_machines > 0 ||
        slot.is_available ||
        slot.status === 'available';

    // Calculate if this slot can be booked with selected machine type
    const canBookCombined = machineType === 'both' &&
        (slot.can_book_combined !== false && slot.available_machines >= 2);

    const canBookSingle = machineType !== 'both' &&
        (slot.can_book_separate !== false && slot.available_machines >= 1);

    const isBookable = isAvailable && (canBookCombined || canBookSingle);

    return (
        <div className={`slot-card ${!isBookable ? 'slot-full' : ''}`}>
            <div className="slot-header">
                <div className="slot-time">
                    <span className="time-icon">🕘</span>
                    <div className="time-display">
                        <strong>{formatTime(slot.start_time)}</strong>
                        <span className="time-separator">-</span>
                        <strong>{formatTime(slot.end_time)}</strong>
                    </div>
                </div>
                <span className={`availability-badge ${isBookable ? 'available' : 'full'}`}>
                    {isBookable ? '✅ Available' : '❌ Not Available'}
                </span>
            </div>
            <div className="slot-info">
                <div>
                    {slot.available_machines !== undefined && (
                        <span>
                            {slot.available_machines} machine{slot.available_machines !== 1 ? 's' : ''} available
                        </span>
                    )}
                    {slot.pair_id && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Pair: {slot.pair_id}
                        </div>
                    )}
                </div>
                {slot.can_book_combined !== undefined && (
                    <div style={{ fontSize: '12px' }}>
                        {slot.can_book_combined && <span style={{ color: '#059669', marginRight: '8px' }}>✓ Combined</span>}
                        {slot.can_book_separate && <span style={{ color: '#2563eb' }}>✓ Separate</span>}
                    </div>
                )}
            </div>
            <button
                onClick={() => onBook(slot)}
                className="btn-book"
                disabled={!isBookable}
            >
                {machineType === 'both' ? 'Book Both Machines' : `Book ${machineType}`}
            </button>
        </div>
    );
};

export default BookingForm;