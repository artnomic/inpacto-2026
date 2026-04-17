-- Add image_url column to sessions table
-- Stores either a single path string ("/Palestrantes/Foto.jpeg")
-- or a JSON array string for multi-speaker sessions ("["/Oficinas/A.jpeg","/Oficinas/B.jpeg"]")
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS image_url text;
