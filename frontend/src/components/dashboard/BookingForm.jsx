import { useState, useCallback, useRef } from 'react';
import { useSlots } from '../../hooks/useSlots';
import '../../styles/Dashboard.css';

const BookingForm = ({ onBookingComplete }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [loadType, setLoadType] = useState('combined');
    const [bookingMessage, setBookingMessage] = useState('');

    const { slots, loading, error, createBooking } = useSlots(date);

    const isProcessing = useRef(false);

    const handleDateChange = useCallback((e) => {
        const newDate = e.target.value;
        console.log('Date changed to:', newDate);
        setDate(newDate);
        setSelectedSlotId(null);
        setBookingMessage('');
    }, []);

    const formatTime = (timeValue) => {
        if (!timeValue) return 'N/A';

        try {
            const dateObj = new Date(timeValue);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }

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
                load_type: loadType
            };

            console.log('Sending booking data:', bookingData);
            const result = await createBooking(bookingData);

            if (result.success) {
                console.log('SUCCESS BRANCH - result.data:', result.data);
                console.log('Checking waitlist:', result.data?.waitlist);
                // Check if added to waitlist
                if (result.data?.waitlist) {
                    window.location.hash = '#waitlist';
                    return;
                } else {
                    setBookingMessage('✅ ' + (result.message || 'Booking successful!'));
                    setTimeout(() => {
                        if (onBookingComplete) {
                            onBookingComplete();
                        }
                    }, 2000);
                }
                setSelectedSlotId(null);
            } else {
                // Handle specific error messages
                if (result.error?.includes('already on the waitlist')) {
                    setBookingMessage(`ℹ️ You're already on the waitlist for this slot. Check the Waitlist page.`);
                } else if (result.error?.includes('Waitlist is full')) {
                    setBookingMessage(`❌ ${result.error}`);
                } else if (result.error?.includes('already have a booking')) {
                    setBookingMessage(`ℹ️ You already have a booking for this time slot.`);
                } else {
                    setBookingMessage(`❌ Booking failed: ${result.error}`);
                }
            }
        } catch (err) {
            console.error('Booking error:', err);
            setBookingMessage(`❌ Error: ${err.message}`);
        } finally {
            isProcessing.current = false;
        }
    };

    const getMachinesNeeded = (type) => {
        return type === 'combined' ? 1 : 2;
    };

    // DON'T filter out full slots - show them all
    const displaySlots = slots;

    console.log('=== SLOT DEBUG ===');
    console.log('Total slots received:', slots.length);
    console.log('Slots to display:', displaySlots.length);
    console.log('All slots:', slots);
    console.log('================');

    return (
        <div>
            <h2 className="dashboard-title">Book a Washing Machine</h2>
            <p className="dashboard-subtitle">Select your preferred time slot and load type</p>

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
                        <label htmlFor="loadType">
                            <span className="label-icon">🧺</span>
                            Load Type
                        </label>
                        <select
                            id="loadType"
                            value={loadType}
                            onChange={(e) => setLoadType(e.target.value)}
                            className="form-input"
                        >
                            <option value="combined">Combined Load (1 Machine)</option>
                            <option value="separate_whites">Separate Whites (2 Machines)</option>
                            <option value="separate_colors">Separate Colors (2 Machines)</option>
                        </select>
                        <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                            {getMachinesNeeded(loadType) === 1
                                ? '✓ Uses 1 machine - all clothes together'
                                : '✓ Uses 2 machines - clothes separated'}
                        </small>
                    </div>
                </div>

                <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #90caf9',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    <strong>ℹ️ Load Type Guide:</strong>
                    <ul style={{ marginTop: '8px', marginLeft: '20px', lineHeight: '1.6' }}>
                        <li><strong>Combined:</strong> Wash all clothes together in one machine</li>
                        <li><strong>Separate Whites:</strong> Separate whites from colors (uses 2 machines)</li>
                        <li><strong>Separate Colors:</strong> Separate different colored clothes (uses 2 machines)</li>
                    </ul>
                </div>

                {/* Waitlist Info */}
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    <strong>⏱️ Waitlist Feature:</strong>
                    <ul style={{ marginTop: '8px', marginLeft: '20px', lineHeight: '1.6' }}>
                        <li>Full slots can still be selected to join the waitlist</li>
                        <li>Maximum 10 people per waitlist</li>
                        <li>You'll be automatically promoted when a spot opens</li>
                        <li>Check your position on the Waitlist page</li>
                    </ul>
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
                ) : displaySlots.length === 0 ? (
                    <div className="info-message">
                        <span className="info-icon">📅</span>
                        <p>No time slots found for {date}.</p>
                        <p>Please try another date or check back later.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="slots-header">Time Slots</h3>
                            <small style={{ color: '#6b7280' }}>
                                Found {displaySlots.length} slot{displaySlots.length !== 1 ? 's' : ''}
                            </small>
                        </div>

                        {(() => {
                            const hasPairId = displaySlots.some(slot => slot.pair_id);

                            if (hasPairId) {
                                const groupedSlots = displaySlots.reduce((groups, slot) => {
                                    const pairId = slot.pair_id || 'unknown';
                                    if (!groups[pairId]) groups[pairId] = [];
                                    groups[pairId].push(slot);
                                    return groups;
                                }, {});

                                return Object.keys(groupedSlots).sort().map(pairId => (
                                    <div key={pairId} className="pair-section">
                                        <div className="pair-header">
                                            <h4>Machine Pair {pairId}</h4>
                                            <span className="pair-info">
                                                {groupedSlots[pairId].length} slot{groupedSlots[pairId].length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="slots-grid">
                                            {groupedSlots[pairId].map((slot) => (
                                                <SlotCard
                                                    key={slot.id}
                                                    slot={slot}
                                                    loadType={loadType}
                                                    getMachinesNeeded={getMachinesNeeded}
                                                    onBook={handleBookSlot}
                                                    formatTime={formatTime}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ));
                            } else {
                                return (
                                    <div className="slots-grid">
                                        {displaySlots.map((slot) => (
                                            <SlotCard
                                                key={slot.id}
                                                slot={slot}
                                                loadType={loadType}
                                                getMachinesNeeded={getMachinesNeeded}
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
                    <div className={`info-message ${
                        bookingMessage.includes('successful') || bookingMessage.includes('waitlist')
                            ? 'success'
                            : 'error'
                    }`}>
                        <span className="info-icon">
                            {bookingMessage.includes('successful') ? '✅' :
                                bookingMessage.includes('waitlist') ? '⏱️' : '❌'}
                        </span>
                        <p>{bookingMessage}</p>
                        {bookingMessage.includes('successful') && (
                            <small style={{ display: 'block', marginTop: '8px' }}>
                                Redirecting to My Bookings...
                            </small>
                        )}
                        {bookingMessage.includes('waitlist') && (
                            <small style={{ display: 'block', marginTop: '8px' }}>
                                Redirecting to Waitlist page...
                            </small>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const SlotCard = ({ slot, loadType, getMachinesNeeded, onBook, formatTime }) => {
    const machinesNeeded = getMachinesNeeded(loadType);
    const isBookable = slot.available_machines >= machinesNeeded;
    const isFull = slot.available_machines === 0;

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
                    {isBookable ? '✅ Available' : (isFull ? '❌ Full' : '⚠️ Limited')}
                </span>
            </div>
            <div className="slot-info">
                <div>
                    <span style={{ fontWeight: '500' }}>
                        {slot.available_machines} / 2 machines available
                    </span>
                    {slot.pair_id && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Machine Pair: {slot.pair_id}
                        </div>
                    )}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {machinesNeeded === 1 ? 'Needs 1 machine' : 'Needs 2 machines'}
                </div>
            </div>

            {/* Remove disabled attribute - let all buttons be clickable */}
            {isBookable ? (
                <button
                    onClick={() => onBook(slot)}
                    className="btn-book"
                >
                    Book {machinesNeeded} Machine{machinesNeeded > 1 ? 's' : ''}
                </button>
            ) : (
                <button
                    onClick={() => onBook(slot)}
                    className="btn-book"
                    style={{
                        backgroundColor: '#f59e0b',
                        borderColor: '#f59e0b',
                        opacity: 1  // Force full opacity
                    }}
                >
                    {isFull ? '⏱️ Join Waitlist' : `Need ${machinesNeeded} - Join Waitlist`}
                </button>
            )}
        </div>
    );
};

export default BookingForm;