-- =========================================
-- 🍝 Pep Restaurant Database Schema
-- =========================================

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
  name VARCHAR(100),
  price NUMERIC,
  category VARCHAR(50)
);

-- ORDERS TABLE
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  table_number INT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- DEFAULT ADMIN USER
INSERT INTO users (name,email,password,role)
VALUES (
  'Admin',
  'admin@test.it',
  '$2b$10$T0cfGy1th/05DytEcFPm.eICkoBpB4VuFhqCsdhlF.bWMdD.MRxCm',
  'admin'
);