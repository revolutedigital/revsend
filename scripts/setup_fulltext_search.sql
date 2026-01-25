-- Add full-text search index for contacts
-- This enables fast search across name, phone, email, and company fields

-- Create tsvector column for Portuguese full-text search
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index on the tsvector column
CREATE INDEX IF NOT EXISTS contacts_search_vector_idx
ON contacts USING gin(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION contacts_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.phone_number, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.email, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(
      (NEW.extra_fields->>'company')::text,
      (NEW.extra_fields->>'empresa')::text,
      ''
    )), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS contacts_search_vector_trigger ON contacts;

CREATE TRIGGER contacts_search_vector_trigger
BEFORE INSERT OR UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION contacts_search_vector_update();

-- Update existing rows
UPDATE contacts SET search_vector =
  setweight(to_tsvector('portuguese', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(phone_number, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(email, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(
    (extra_fields->>'company')::text,
    (extra_fields->>'empresa')::text,
    ''
  )), 'D');

-- Usage example:
-- SELECT * FROM contacts
-- WHERE search_vector @@ to_tsquery('portuguese', 'joao & silva')
-- ORDER BY ts_rank(search_vector, to_tsquery('portuguese', 'joao & silva')) DESC;
