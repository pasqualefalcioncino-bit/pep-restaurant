# Pep Restaurant

Sistema gestionale per ristorante con architettura client-server, sviluppato per il corso di Ingegneria del Software.

## Tecnologie

| Layer | Tecnologie |
|-------|-----------|
| Frontend | React, Axios, CSS |
| Backend | Node.js, Express.js, JWT, Bcrypt |
| Database | PostgreSQL |

## Requisiti

- Node.js
- PostgreSQL

## Installazione

### 1. Clona il repository

```bash
git clone https://github.com/pasqualefalcioncino-bit/pep-restaurant.git
cd pep-restaurant
```

### 2. Configura il database

Crea il database in PostgreSQL:

```sql
CREATE DATABASE pep-restaurant;
```

Importa lo schema:

```bash
psql -U postgres -d pep-restaurant -f server/database/schema.sql
```

### 3. Configura il backend

```bash
cd server
npm install
```

Crea il file `.env` nella cartella `server/` (vedi `.env.example`):

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pep-restaurant
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=5432
JWT_SECRET=pep_secret_2026
```

Avvia il backend:

```bash
npm run dev
```

### 4. Configura il frontend

```bash
cd client
npm install
npm run dev
```

Frontend disponibile su `http://localhost:3001`

## Credenziali demo

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@test.it | 123456 |

## API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /auth/login | Login |
| POST | /auth/register | Registrazione cliente |
| GET | /menu | Lista menu |
| POST | /menu | Aggiungi piatto (admin) |
| GET | /orders | Lista ordini (admin/cuoco) |
| POST | /orders | Nuovo ordine |
| GET | /bookings | Lista prenotazioni (admin) |
| POST | /bookings | Nuova prenotazione |

## Autori

- Pasquale Spina
- Josef Mignogna