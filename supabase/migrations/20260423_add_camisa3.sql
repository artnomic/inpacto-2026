-- Insert Camisa 3 into Mocidade products (skip if already exists by name)
INSERT INTO products (category, name, price, emoji, description)
SELECT 'shop', 'Camisa 3', 89.80, '👕', 'Camisa exclusiva Mocidade.'
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE category = 'shop' AND name = 'Camisa 3'
);
