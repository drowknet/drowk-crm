-- PWM WP-02 due policies produce calendar dates, not source clock times.
-- Keep due_at for genuine timestamp obligations; do not manufacture midnight.
ALTER TABLE work_items ADD COLUMN due_date date NULL;
