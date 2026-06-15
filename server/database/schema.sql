-- Pep Restaurant Database Schema
-- Script completo per inizializzare o resettare il database di sviluppo.

BEGIN;

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone VARCHAR(30),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_role_check CHECK (
    role IN ('cliente', 'cameriere', 'cuoco', 'admin')
  ),
  CONSTRAINT users_email_format_check CHECK (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

CREATE TABLE restaurant_tables (
  id SERIAL PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  seats INT NOT NULL,
  area VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'libero',
  occupied_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT restaurant_tables_number_check CHECK (table_number > 0),
  CONSTRAINT restaurant_tables_seats_check CHECK (seats > 0),
  CONSTRAINT restaurant_tables_status_check CHECK (
    status IN ('libero', 'occupato', 'prenotato', 'in_pulizia')
  )
);

CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  prep_time INT NOT NULL DEFAULT 0,
  image VARCHAR(255),
  veg BOOLEAN NOT NULL DEFAULT false,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT menu_items_price_check CHECK (price > 0),
  CONSTRAINT menu_items_prep_time_check CHECK (prep_time >= 0)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  table_number INT REFERENCES restaurant_tables(table_number)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_attesa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_status_check CHECK (
    status IN ('in_attesa', 'in_preparazione', 'pronto', 'servito', 'annullato')
  )
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_status_check CHECK (
    status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')
  )
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guests INT NOT NULL,
  table_number INT REFERENCES restaurant_tables(table_number)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  occasion VARCHAR(50),
  special_requests TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_attesa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bookings_guests_check CHECK (guests > 0 AND guests <= 12),
  CONSTRAINT bookings_status_check CHECK (
    status IN ('in_attesa', 'confermata', 'annullata')
  ),
  CONSTRAINT bookings_email_format_check CHECK (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  min_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inventory_items_quantity_check CHECK (quantity >= 0),
  CONSTRAINT inventory_items_total_quantity_check CHECK (total_quantity > 0),
  CONSTRAINT inventory_items_min_quantity_check CHECK (min_quantity >= 0),
  CONSTRAINT inventory_items_quantity_limit_check CHECK (quantity <= total_quantity),
  CONSTRAINT inventory_items_unit_check CHECK (
    unit IN ('kg', 'g', 'l', 'ml', 'pz', 'bottiglie', 'vasetti')
  )
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_items_set_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX idx_bookings_table_number ON bookings(table_number);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);

INSERT INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@test.it',
  '$2b$10$aiGGoRQWbjFKgcCOLMCi6.A62X4z1v4YJPa/5VSOUKv4Sz178ufjW',
  'admin'
);

INSERT INTO restaurant_tables (table_number, seats, area, status, notes)
VALUES
  (1, 2, 'Sala principale', 'libero', NULL),
  (2, 2, 'Sala principale', 'libero', NULL),
  (3, 4, 'Sala principale', 'libero', NULL),
  (4, 4, 'Sala principale', 'libero', NULL),
  (5, 6, 'Sala principale', 'libero', NULL),
  (6, 2, 'Veranda', 'libero', NULL),
  (7, 4, 'Veranda', 'libero', NULL),
  (8, 6, 'Veranda', 'libero', NULL);

INSERT INTO menu_items (id, name, description, price, category, prep_time, image, veg, available)
VALUES
  (1, 'Risotto allo Zafferano', 'Carnaroli mantecato con zafferano puro di Navelli e foglia d''oro 23k.', 24.00, 'Primi', 22, 'risotto-allo-zafferano.webp', true, true),
  (2, 'Ossobuco alla Milanese', 'Stinco di vitello brasato 6 ore, gremolada di limone e prezzemolo.', 32.00, 'Secondi', 30, 'ossobuco-alla-milanese.jpg', false, true),
  (3, 'Tiramisu d''Autore', 'Mascarpone montato a mano, savoiardi al caffe espresso e cacao Valrhona.', 12.00, 'Dolci', 8, 'tiramisu-d-autore.jpg', true, true),
  (4, 'Tagliere della Casa', 'Salumi selezionati, formaggi affinati, giardiniera croccante e pane caldo.', 18.00, 'Antipasti', 12, 'tagliere-della-casa.jpg', false, true),
  (5, 'Branzino agli Agrumi', 'Filetto di branzino scottato, salsa agli agrumi e verdure di stagione.', 29.00, 'Secondi', 24, 'branzino-agli-agrumi.webp', false, true),
  (6, 'Calice Nebbiolo', 'Rosso elegante, tannino fine, profumi di viola, spezie e piccoli frutti.', 10.00, 'Vini', 3, 'calice-nebbiolo.avif', true, true),
  (7, 'Spaghettone Cacio e Pepe', 'Pasta trafilata al bronzo, pecorino romano DOP e pepe nero tostato.', 18.00, 'Primi', 16, 'spaghettone-cacio-e-pepe.avif', true, true),
  (8, 'Ravioli di Ricotta e Limone', 'Pasta fresca ripiena, burro alle erbe, scorza di limone e salvia croccante.', 21.00, 'Primi', 20, 'ravioli-di-ricotta-e-limone.jpg', true, true),
  (9, 'Pappardelle al Ragu Bianco', 'Pappardelle fatte in casa con ragu bianco di vitello e rosmarino.', 23.00, 'Primi', 24, 'pappardelle-al-ragu-bianco.webp', false, true),
  (10, 'Gnocchi al Pomodoro Arrosto', 'Gnocchi di patate, crema di pomodoro arrosto, basilico e stracciatella.', 19.00, 'Primi', 18, 'gnocchi-al-pomodoro-arrosto.webp', true, true),
  (11, 'Lasagnetta Verde', 'Sfoglia agli spinaci, besciamella leggera, verdure di stagione e Parmigiano.', 20.00, 'Primi', 25, 'lasagnetta-verde.jpg', true, true),
  (12, 'Filetto al Pepe Verde', 'Filetto di manzo scottato, salsa al pepe verde e patate novelle.', 36.00, 'Secondi', 28, 'filetto-al-pepe-verde.webp', false, true),
  (13, 'Polpo Croccante', 'Polpo alla piastra, crema di patate affumicate e olive taggiasche.', 31.00, 'Secondi', 26, 'polpo-croccante.jpg', false, true),
  (14, 'Cotoletta alla Milanese', 'Costoletta di vitello dorata nel burro chiarificato con insalata di campo.', 34.00, 'Secondi', 30, 'cotoletta-alla-milanese.webp', false, true),
  (15, 'Melanzana alla Parmigiana', 'Melanzane fritte leggere, pomodoro San Marzano, basilico e mozzarella.', 22.00, 'Secondi', 24, 'melanzana-alla-parmigiana.webp', true, true),
  (16, 'Guancia Brasata', 'Guancia di manzo cotta lentamente, fondo al vino rosso e purea morbida.', 33.00, 'Secondi', 32, 'guancia-brasata.webp', false, true),
  (17, 'Panna Cotta alla Vaniglia', 'Panna cotta morbida con vaniglia Bourbon e coulis di frutti rossi.', 10.00, 'Dolci', 6, 'panna-cotta-alla-vaniglia.jpg', true, true),
  (18, 'Crostata al Pistacchio', 'Frolla al burro, crema al pistacchio e granella tostata.', 12.00, 'Dolci', 7, 'crostata-al-pistacchio.jpg', true, true),
  (19, 'Millefoglie alla Crema', 'Sfoglia caramellata, crema diplomatica e frutti di stagione.', 13.00, 'Dolci', 9, 'millefoglie-alla-crema.webp', true, true),
  (20, 'Calice Franciacorta Brut', 'Bollicina metodo classico, fresca e minerale, ideale per antipasti e pesce.', 12.00, 'Vini', 3, 'calice-franciacorta-brut.webp', true, true),
  (21, 'Calice Chianti Classico', 'Rosso toscano equilibrato, note di ciliegia, spezie dolci e finale sapido.', 11.00, 'Vini', 3, 'calice-chianti-classico.jpg', true, true),
  (22, 'Carpaccio di Manzo', 'Fettine sottili di manzo, rucola selvatica, scaglie di Parmigiano e limone.', 17.00, 'Antipasti', 10, 'carpaccio-di-manzo.jpg', false, true),
  (23, 'Burrata e Pomodorini', 'Burrata pugliese, pomodorini confit, basilico fresco e olio extravergine.', 15.00, 'Antipasti', 8, 'burrata-e-pomodorini.jpg', true, true),
  (24, 'Fiori di Zucca Ripieni', 'Fiori di zucca croccanti con ricotta, menta e salsa leggera al pomodoro.', 16.00, 'Antipasti', 14, 'fiori-di-zucca-ripieni.jpg', true, true);

SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

INSERT INTO inventory_items (id, name, category, quantity, total_quantity, unit, min_quantity, notes)
VALUES
  (1, 'Riso Carnaroli', 'Cereali e pasta', 18.00, 24.00, 'kg', 8.00, 'Base per risotto allo zafferano'),
  (2, 'Zafferano di Navelli', 'Spezie', 120.00, 180.00, 'g', 60.00, 'Ingrediente chiave del risotto'),
  (3, 'Pasta fresca ripiena ricotta e limone', 'Pasta fresca', 9.00, 12.00, 'kg', 4.00, 'Ravioli di ricotta e limone'),
  (4, 'Pappardelle fresche', 'Pasta fresca', 12.00, 18.00, 'kg', 6.00, 'Pappardelle al ragu bianco'),
  (5, 'Spaghettoni trafilati al bronzo', 'Cereali e pasta', 16.00, 20.00, 'kg', 6.67, 'Cacio e pepe'),
  (6, 'Pecorino romano DOP', 'Latticini', 7.50, 12.00, 'kg', 4.00, 'Cacio e pepe'),
  (7, 'Parmigiano Reggiano', 'Latticini', 8.00, 12.00, 'kg', 4.00, 'Lasagnetta, parmigiana e antipasti'),
  (8, 'Burrata pugliese', 'Latticini', 18.00, 30.00, 'pz', 10.00, 'Burrata e pomodorini'),
  (9, 'Mascarpone', 'Latticini', 6.00, 9.00, 'kg', 3.00, 'Tiramisu d''Autore'),
  (10, 'Pistacchio in crema', 'Dolci', 4.00, 9.00, 'kg', 3.00, 'Crostata al pistacchio'),
  (11, 'Carne di vitello per ossobuco', 'Carni', 14.00, 20.00, 'kg', 6.67, 'Ossobuco alla Milanese'),
  (12, 'Filetto di manzo', 'Carni', 10.00, 18.00, 'kg', 6.00, 'Filetto al pepe verde'),
  (13, 'Guancia di manzo', 'Carni', 9.00, 15.00, 'kg', 5.00, 'Guancia brasata'),
  (14, 'Branzino fresco', 'Pesce', 12.00, 42.00, 'kg', 14.00, 'Branzino agli agrumi'),
  (15, 'Polpo', 'Pesce', 10.00, 18.00, 'kg', 6.00, 'Polpo croccante'),
  (16, 'Pomodori San Marzano', 'Verdure', 22.00, 30.00, 'kg', 10.00, 'Parmigiana, gnocchi e burrata'),
  (17, 'Melanzane', 'Verdure', 14.00, 24.00, 'kg', 8.00, 'Melanzana alla parmigiana'),
  (18, 'Fiori di zucca', 'Verdure', 45.00, 150.00, 'pz', 50.00, 'Fiori di zucca ripieni'),
  (19, 'Nebbiolo', 'Vini', 18.00, 24.00, 'bottiglie', 8.00, 'Calici al banco'),
  (20, 'Franciacorta Brut', 'Vini', 14.00, 30.00, 'bottiglie', 10.00, 'Calici e aperitivo'),
  (21, 'Chianti Classico', 'Vini', 16.00, 24.00, 'bottiglie', 8.00, 'Calici e secondi');

SELECT setval('inventory_items_id_seq', (SELECT MAX(id) FROM inventory_items));

COMMIT;