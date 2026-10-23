import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import BookingForm from '../components/BookingForm';
import { BOOKING_LABELS } from '../types';
import type { Slot } from '../types';
import { formatDay, formatTime, groupByDay } from '../utils';

const toStartIso = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined);
const toEndIso = (d: string) => (d ? new Date(`${d}T23:59:59`).toISOString() : undefined);

export default function BookPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState<Slot | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const submittingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getSlots({
        onlyAvailable: true,
        dateFrom: toStartIso(from),
        dateTo: toEndIso(to),
      });
      setError('');
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load slots');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // refresh every 15s so taken slots disappear
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  // show a hint if the first load is slow (database waking up)
  useEffect(() => {
    if (!loading) {
      setSlowLoad(false);
      return;
    }
    const t = setTimeout(() => setSlowLoad(true), 2000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (submittingRef.current) return;
    if (selected && !slots.some((s) => s.id === selected.id)) {
      setSelected(null);
      setNotice('That slot is no longer available.');
    }
  }, [slots, selected]);

  const handleBooked = (slot: Slot) => {
    setConfirmed(slot);
    setSelected(null);
    setNotice('');  
    load();
  };

  const handleConflict = async () => {
    setSelected(null);
    setNotice('Sorry, that slot was just taken. Please pick another one.');
    await load();
  };

  const clearFilter = () => {
    setFrom('');
    setTo('');
    setSelected(null);
  };

  const days = groupByDay(slots);

  return (
    <>
      <h2 className="page-title">Available slots</h2>
      <p className="subtitle">Pick a time and book the hall for your training, match or casual game.</p>

      {notice && <p className="error">{notice}</p>}

      {confirmed && (
        <div className="success">
          <strong>Booked!</strong> {confirmed.teamName} (
          {confirmed.bookingType && BOOKING_LABELS[confirmed.bookingType]}) on{' '}
          {formatDay(confirmed.startTime)}, {formatTime(confirmed.startTime)} to{' '}
          {formatTime(confirmed.endTime)}.
          {confirmed.confirmationMessage && (
            <p style={{ marginTop: 8, fontStyle: 'italic' }}>{confirmed.confirmationMessage}</p>
          )}
        </div>
      )}

      <div className="card form-row" style={{ marginBottom: 20, alignItems: 'end' }}>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setSelected(null);
            }}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setSelected(null);
            }}
          />
        </label>
        <button className="btn secondary" type="button" disabled={!from && !to} onClick={clearFilter}>
          Clear
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && (
        <p className="muted">
          {slowLoad ? 'Waking up the server, this can take a few seconds...' : 'Loading...'}
        </p>
      )}
      {!loading && !error && days.length === 0 && (
        <p className="muted">No free slots for this period.</p>
      )}

      <div className="grid">
        <div>
          {days.map(([key, daySlots]) => (
            <section className="day" key={key}>
              <h3>{formatDay(daySlots[0].startTime)}</h3>
              <div className="slot-list">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    className={`slot-btn ${selected?.id === slot.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelected(slot);
                      setConfirmed(null);
                      setNotice('');
                    }}
                  >
                    <div className="slot-time">{formatTime(slot.startTime)}</div>
                    <div className="slot-meta">{slot.durationMinutes} min</div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {selected && (
          <BookingForm
            key={selected.id}
            slot={selected}
            onBooked={handleBooked}
            onClose={() => setSelected(null)}
            onConflict={handleConflict}
            onSubmittingChange={(value) => {submittingRef.current = value;}}
          />
        )}
      </div>
    </>
  );
}