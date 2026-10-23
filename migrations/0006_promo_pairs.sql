-- Existing purchases keep their quantity and original paid price.
ALTER TABLE orders ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity IN (1,2));
ALTER TABLE orders ADD COLUMN second_participant_name TEXT;
