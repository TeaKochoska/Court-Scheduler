import { useState } from 'react';
import { ApiError, api } from '../api';
import { BOOKING_LABELS, BOOKING_TYPES } from '../types';
import type { BookingType, Slot } from '../types';
import { formatDay, formatTime } from '../utils';

interface Props {
  slot: Slot;
  onBooked: (slot: Slot) => void;
  onClose: () => void;
  onConflict: () => void;
  onSubmittingChange?: (value: boolean) => void;
}

export default function BookingForm({ slot, onBooked, onClose, onConflict, onSubmittingChange }: Props) {
  const [teamName, setTeamName] = useState('');
  const [bookingType, setBookingType] = useState<BookingType>('training');
  const [playersCount, setPlayersCount] = useState(10);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const booked = await api.bookSlot(slot.id, {
        teamName,
        bookingType,
        playersCount,
        contactName,
        contactEmail,
      });
      onBooked(booked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      if (err instanceof ApiError && err.status === 409) onConflict();
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div>
        <h3>Book this slot</h3>
        <p className="muted">
          {formatDay(slot.startTime)}, {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
        </p>
      </div>

      <label>
        Club or team name
        <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
      </label>

      <div className="form-row">
        <label>
          Type
          <select value={bookingType} onChange={(e) => setBookingType(e.target.value as BookingType)}>
            {BOOKING_TYPES.map((t) => (
              <option key={t} value={t}>{BOOKING_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label>
          Players
          <input
            type="number"
            min={1}
            max={60}
            value={playersCount}
            onChange={(e) => setPlayersCount(Number(e.target.value))}
            required
          />
        </label>
      </div>

      <label>
        Contact name
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
      </label>

      <label>
        Contact email
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-row">
        <button type="button" className="btn secondary" onClick={onClose}>Close</button>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Booking...' : 'Confirm booking'}
        </button>
      </div>
    </form>
  );
}