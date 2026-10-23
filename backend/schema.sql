CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes BETWEEN 15 AND 480),
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,

  team_name TEXT,
  booking_type TEXT CHECK (booking_type IN ('training', 'match', 'casual')),
  players_count INT CHECK (players_count > 0),
  contact_name TEXT,
  contact_email TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT end_after_start CHECK (end_time > start_time),

  CONSTRAINT slots_no_overlap
    EXCLUDE USING gist (tstzrange(start_time, end_time) WITH &&)
);