-- Pep Restaurant Database Schema

-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password TEXT,
  role VARCHAR(20) DEFAULT 'cliente'
);

-- MENU ITEMS TABLE
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  prep_time INT DEFAULT 0,
  image VARCHAR(255),
  veg BOOLEAN DEFAULT false
);

-- ORDERS TABLE
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  table_number INT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ITEMS TABLE
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guests INT NOT NULL,
  occasion VARCHAR(50),
  special_requests TEXT,
  event_title VARCHAR(100),
  status VARCHAR(20) DEFAULT 'in_attesa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ITEMS STATUS CONSTRAINT
ALTER TABLE order_items
ADD CONSTRAINT order_items_status_check
CHECK (
  status IN (
    'pending',
    'preparing',
    'ready',
    'served',
    'cancelled'
  )
);

-- ORDER STATUS CONSTRAINT
ALTER TABLE orders
ADD CONSTRAINT status_check
CHECK (
  status IN (
    'in_attesa',
    'in_preparazione',
    'pronto',
    'servito',
    'annullato'
  )
);

-- BOOKING STATUS CONSTRAINT
ALTER TABLE bookings
ADD CONSTRAINT booking_status_check
CHECK (
  status IN (
    'in_attesa',
    'confermata',
    'annullata'
  )
);

-- DEFAULT ADMIN USER
INSERT INTO users (name,email,password,role)
VALUES (
  'Admin',
  'admin@test.it',
  '$2b$10$aiGGoRQWbjFKgcCOLMCi6.A62X4z1v4YJPa/5VSOUKv4Sz178ufjW',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- DEFAULT MENU ITEMS
INSERT INTO menu_items (id, name, description, price, category, prep_time, image, veg)
VALUES
  (1, 'Risotto allo Zafferano', 'Carnaroli mantecato con zafferano puro di Navelli e foglia d''oro 23k.', 24.00, 'Primi', 22, 'risotto-allo-zafferano.webp', true),
  (2, 'Ossobuco alla Milanese', 'Stinco di vitello brasato 6 ore, gremolada di limone e prezzemolo.', 32.00, 'Secondi', 30, 'ossobuco-alla-milanese.jpg', false),
  (3, 'Tiramisu d''Autore', 'Mascarpone montato a mano, savoiardi al caffe espresso e cacao Valrhona.', 12.00, 'Dolci', 8, 'tiramisu-d-autore.jpg', true),
  (4, 'Tagliere della Casa', 'Salumi selezionati, formaggi affinati, giardiniera croccante e pane caldo.', 18.00, 'Antipasti', 12, 'tagliere-della-casa.jpg', false),
  (5, 'Branzino agli Agrumi', 'Filetto di branzino scottato, salsa agli agrumi e verdure di stagione.', 29.00, 'Secondi', 24, 'branzino-agli-agrumi.webp', false),
  (6, 'Calice Nebbiolo', 'Rosso elegante, tannino fine, profumi di viola, spezie e piccoli frutti.', 10.00, 'Vini', 3, 'calice-nebbiolo.avif', true),
  (7, 'Spaghettone Cacio e Pepe', 'Pasta trafilata al bronzo, pecorino romano DOP e pepe nero tostato.', 18.00, 'Primi', 16, 'spaghettone-cacio-e-pepe.avif', true),
  (8, 'Ravioli di Ricotta e Limone', 'Pasta fresca ripiena, burro alle erbe, scorza di limone e salvia croccante.', 21.00, 'Primi', 20, 'ravioli-di-ricotta-e-limone.jpg', true),
  (9, 'Pappardelle al Ragu Bianco', 'Pappardelle fatte in casa con ragu bianco di vitello e rosmarino.', 23.00, 'Primi', 24, 'pappardelle-al-ragu-bianco.webp', false),
  (10, 'Gnocchi al Pomodoro Arrosto', 'Gnocchi di patate, crema di pomodoro arrosto, basilico e stracciatella.', 19.00, 'Primi', 18, 'gnocchi-al-pomodoro-arrosto.webp', true),
  (11, 'Lasagnetta Verde', 'Sfoglia agli spinaci, besciamella leggera, verdure di stagione e Parmigiano.', 20.00, 'Primi', 25, 'lasagnetta-verde.jpg', true),
  (12, 'Filetto al Pepe Verde', 'Filetto di manzo scottato, salsa al pepe verde e patate novelle.', 36.00, 'Secondi', 28, 'filetto-al-pepe-verde.webp', false),
  (13, 'Polpo Croccante', 'Polpo alla piastra, crema di patate affumicate e olive taggiasche.', 31.00, 'Secondi', 26, 'polpo-croccante.jpg', false),
  (14, 'Cotoletta alla Milanese', 'Costoletta di vitello dorata nel burro chiarificato con insalata di campo.', 34.00, 'Secondi', 30, 'cotoletta-alla-milanese.webp', false),
  (15, 'Melanzana alla Parmigiana', 'Melanzane fritte leggere, pomodoro San Marzano, basilico e mozzarella.', 22.00, 'Secondi', 24, 'melanzana-alla-parmigiana.webp', true),
  (16, 'Guancia Brasata', 'Guancia di manzo cotta lentamente, fondo al vino rosso e purea morbida.', 33.00, 'Secondi', 32, 'guancia-brasata.webp', false),
  (17, 'Panna Cotta alla Vaniglia', 'Panna cotta morbida con vaniglia Bourbon e coulis di frutti rossi.', 10.00, 'Dolci', 6, 'panna-cotta-alla-vaniglia.jpg', true),
  (18, 'Crostata al Pistacchio', 'Frolla al burro, crema al pistacchio e granella tostata.', 12.00, 'Dolci', 7, 'crostata-al-pistacchio.jpg', true),
  (19, 'Millefoglie alla Crema', 'Sfoglia caramellata, crema diplomatica e frutti di stagione.', 13.00, 'Dolci', 9, 'millefoglie-alla-crema.webp', true),
  (20, 'Calice Franciacorta Brut', 'Bollicina metodo classico, fresca e minerale, ideale per antipasti e pesce.', 12.00, 'Vini', 3, 'calice-franciacorta-brut.webp', true),
  (21, 'Calice Chianti Classico', 'Rosso toscano equilibrato, note di ciliegia, spezie dolci e finale sapido.', 11.00, 'Vini', 3, 'calice-chianti-classico.jpg', true),
  (22, 'Carpaccio di Manzo', 'Fettine sottili di manzo, rucola selvatica, scaglie di Parmigiano e limone.', 17.00, 'Antipasti', 10, 'carpaccio-di-manzo.jpg', false),
  (23, 'Burrata e Pomodorini', 'Burrata pugliese, pomodorini confit, basilico fresco e olio extravergine.', 15.00, 'Antipasti', 8, 'burrata-e-pomodorini.jpg', true),
  (24, 'Fiori di Zucca Ripieni', 'Fiori di zucca croccanti con ricotta, menta e salsa leggera al pomodoro.', 16.00, 'Antipasti', 14, 'fiori-di-zucca-ripieni.jpg', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  prep_time = EXCLUDED.prep_time,
  image = EXCLUDED.image,
  veg = EXCLUDED.veg;

SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));
