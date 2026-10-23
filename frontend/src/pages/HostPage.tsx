import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { BOOKING_LABELS } from '../types';
import type { Slot } from '../types';
import { formatDay, formatTime, groupByDay } from '../utils';

const DURATIONS = [30, 60, 90, 120];

export default function HostPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);


//Shows all the slots that have been created by the host 
  const load = useCallback(async () => {
    try {
      setError('');
      setSlots(await api.getSlots());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load slots');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const startTime = new Date(`${date}T${time}`).toISOString();
      await api.createSlot(startTime, duration);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slot: Slot) => {
    if (!window.confirm('Delete this free slot?')) return;
    try {
      await api.deleteSlot(slot.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const days = groupByDay(slots);

  return (
    <>
      <h2 className="page-title">Host dashboard</h2>
      <p className="subtitle">Publish free slots and see who booked the hall.</p>

      <div className="grid">
        <div>
          {error && <p className="error">{error}</p>}
          {days.length === 0 && <p className="muted">No slots yet. Add the first one.</p>}

          {days.map(([key, daySlots]) => (
            <section className="day" key={key}>
              <h3>{formatDay(daySlots[0].startTime)}</h3>
              
              <div className="card">
                {daySlots.map((slot) => (
                  <div className="row" key={slot.id}>
                    <div>
                      <div>
                        <strong>
                          {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                        </strong>{' '}
                        <span className={`badge ${slot.isBooked && slot.bookingType ? slot.bookingType : 'free'}`}>
                          {slot.isBooked && slot.bookingType ? BOOKING_LABELS[slot.bookingType] : 'Free'}
                        </span>
                      </div>
                      {slot.isBooked && (
                        <div className="slot-meta">
                          {slot.teamName}, {slot.playersCount} players. {slot.contactName} ({slot.contactEmail})
                        </div>
                      )}
                    </div>
                    <div className="row-actions">
                      {!slot.isBooked && (
                        <button className="btn danger small" onClick={() => handleDelete(slot)}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <form className="card form" onSubmit={handleCreate}>
          <h3>Add a slot</h3>
          <label>
            Date
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <div className="form-row">
            <label>
              Start time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </label>
            <label>
              Duration
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </label>
          </div>
          {formError && <p className="error">{formError}</p>}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add slot'}
          </button>
        </form>
      </div>
    </>
  );
}