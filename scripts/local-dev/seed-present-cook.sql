-- LOCAL DEVELOPMENT DATA ONLY.
--
-- Puts one cook on duty today so the instant-availability path can be exercised end to end.
-- Every row below satisfies the SAME conditions the real candidate query in
-- src/bookings/repositories/schedule-repository.ts checks — active user, active profile in the
-- hub that covers the test point, `present` attendance for today's IST service date, and a shift
-- covering today's ISO day of week. Nothing in the application is bypassed or stubbed: the
-- matcher runs for real against real rows.
BEGIN;

INSERT INTO users (id, phone, role, status, created_at, updated_at)
VALUES ('c0000000-0000-4000-8000-00000000c001', '+919000000001', 'cook', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO cook_profiles
  (user_id, name, hub_id, status, rating_avg, rating_count, created_at, updated_at)
VALUES (
  'c0000000-0000-4000-8000-00000000c001',
  'Rekha',
  '4a55c1f7-c972-5c6c-86d0-8af0b0e0a001',
  'active', 4.8, 42, now(), now()
)
ON CONFLICT (user_id) DO UPDATE SET status = 'active', hub_id = EXCLUDED.hub_id;

-- A shift for today, wide enough that the current clock falls inside it.
INSERT INTO cook_shifts
  (id, cook_id, day_of_week, start_local_time, end_local_time,
   break_start_local_time, break_end_local_time, effective_from, created_at, updated_at)
VALUES (
  'c0000000-0000-4000-8000-00000000501f',
  'c0000000-0000-4000-8000-00000000c001',
  EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Kolkata')::date)::smallint,
  -- The table constrains a shift to exactly 12 hours starting on the hour between 05:00 and
  -- 10:00, with a 2-hour break inside 11:00-16:00. 10:00-22:00 is the latest legal shift, which
  -- is what makes an evening instant booking reachable.
  TIME '10:00', TIME '22:00', TIME '11:00', TIME '13:00',
  DATE '2026-01-01', now(), now()
)
ON CONFLICT (id) DO UPDATE
  SET day_of_week = EXCLUDED.day_of_week,
      start_local_time = EXCLUDED.start_local_time,
      end_local_time = EXCLUDED.end_local_time;

INSERT INTO cook_attendance
  (cook_id, service_date, status, marked_at, updated_at, recorded_by_admin_id, reason)
VALUES (
  'c0000000-0000-4000-8000-00000000c001',
  (now() AT TIME ZONE 'Asia/Kolkata')::date,
  'present', now(), now(),
  '33333333-3333-4333-8333-333333333333',
  'local-development-seed'
)
ON CONFLICT (cook_id, service_date) DO UPDATE SET status = 'present', updated_at = now();

COMMIT;

-- Instant matching additionally requires the cook to have REPORTED themselves available
-- (findEligibleCooks inner-joins this). Scheduled booking does not, which is why the two paths
-- disagree about the same cook.
INSERT INTO cook_operational_availability (cook_id, state, changed_by_user_id, reason, changed_at)
VALUES (
  'c0000000-0000-4000-8000-00000000c001',
  'available',
  'c0000000-0000-4000-8000-00000000c001',
  'local-development-seed',
  now()
)
ON CONFLICT (cook_id) DO UPDATE SET state = 'available', changed_at = now();
