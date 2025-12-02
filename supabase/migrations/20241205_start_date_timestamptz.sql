-- Ensure conferences.start_date exists with consistent type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conferences'
      AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.conferences
      ADD COLUMN start_date timestamptz;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conferences'
      AND column_name = 'start_date'
      AND data_type = 'date'
  ) THEN
    ALTER TABLE public.conferences
      ALTER COLUMN start_date TYPE timestamptz USING start_date::timestamptz;
  END IF;
END$$;

COMMENT ON COLUMN public.conferences.start_date IS 'Start datetime of the conference (tz-aware)';
