import { useEffect } from 'react';
import { useWaitlist } from '../../hooks/useWaitlist';
import '../../styles/Dashboard.css';

const Waitlist = () => {
    const { waitlist, loading, error } = useWaitlist();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading waitlist...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="info-message error">
                <span className="info-icon">❌</span>
                <p>Error loading waitlist: {error}</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="dashboard-title">Waitlist</h2>
            <p className="dashboard-subtitle">Your current positions in waitlists</p>

            <div className="waitlist-grid">
                {waitlist.length > 0 ? (
                    waitlist.map((item) => (
                        <div key={item.id} className="waitlist-card">
                            <div className="waitlist-header">
                                <h3>
                                    {item.machine_type === 'both'
                                        ? 'Washer & Dryer'
                                        : `${item.machine_type} #${item.machine_id}`}
                                </h3>
                                <span className="status-badge status-waiting">
                                    Position: #{item.position}
                                </span>
                            </div>
                            <div className="waitlist-details">
                                <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
                                <p><strong>Requested Time:</strong> {item.preferred_time}</p>
                                <p><strong>Joined:</strong> {new Date(item.created_at).toLocaleDateString()}</p>
                                <p><strong>Estimated Wait:</strong> {item.estimated_wait || 'Calculating...'}</p>
                            </div>
                            <p className="info-text">
                                You will be notified when a slot becomes available.
                                Current wait time is approximate and may change.
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">⏱️</span>
                        <p>You are not on any waitlists</p>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.hash = '#book'}
                        >
                            View Available Slots
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Waitlist;