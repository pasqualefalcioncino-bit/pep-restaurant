# Pep Restaurant

Gestionale full-stack per ristorante sviluppato per il corso di Ingegneria del Software.

Il progetto permette di gestire menu, prenotazioni, utenti, ordini di sala e flusso cucina tramite interfacce diverse in base al ruolo dell'utente.

## Stack

| Layer | Tecnologie |
| --- | --- |
| Frontend | React, Vite, CSS, Fetch API |
| Backend | Node.js, Express.js |
| Auth | JWT, Bcrypt |
| Database | PostgreSQL |

## Architettura

```text
client/ React + Vite
  -> HTTP REST API
server/ Node.js + Express
  -> pg
PostgreSQL
```

Porte usate in sviluppo:

```text
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```

Le chiamate del frontend passano dal file:

```text
client/src/api/client.js
```

Questo file centralizza la base URL del backend e aggiunge automaticamente il token JWT alle richieste protette.

## Funzionalita

### Cliente

- Registrazione e login.
- Visualizzazione menu pubblico.
- Prenotazione tavolo.
- Visualizzazione delle proprie prenotazioni.

### Cameriere

- Accesso all'area ordini.
- Visualizzazione menu.
- Ricerca e filtro dei piatti.
- Creazione ordine per tavolo.
- Aggiunta di piatti, quantita e note per la cucina.
- Visualizzazione degli ordini recenti.

### Cuoco

- Accesso all'area cucina.
- Visualizzazione ordini con righe ordine.
- Aggiornamento stato ordine.
- Filtri e metriche operative della cucina.

### Admin

- Dashboard con statistiche reali.
- Gestione prenotazioni.
- Gestione menu: creazione, modifica ed eliminazione piatti.
- Creazione utenze dipendente.
- Visualizzazione ed eliminazione clienti.
- Visualizzazione ed eliminazione staff.

## Ruoli

I ruoli gestiti sono:

```text
cliente
cameriere
cuoco
admin
```

Il backend protegge le rotte tramite:

```text
server/src/middleware/auth.middleware.js
server/src/middleware/role.middleware.js
```

Il frontend mostra le pagine disponibili in base al ruolo dell'utente loggato.

## Requisiti

- Node.js
- npm
- PostgreSQL

## Setup

### 1. Clonare il repository

```bash
git clone https://github.com/pasqualefalcioncino-bit/pep-restaurant.git
cd pep-restaurant
```

### 2. Creare il database

In PostgreSQL:

```sql
CREATE DATABASE "pep-restaurant";
```

Importare lo schema:

```bash
psql -U postgres -d pep-restaurant -f server/database/schema.sql
```

Lo schema crea le tabelle principali e inserisce l'utente admin demo e i piatti iniziali del menu.

### 3. Configurare il backend

```bash
cd server
npm install
```

Creare il file:

```text
server/.env
```

Esempio:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pep-restaurant
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=5432
JWT_SECRET=pep_secret_2026
```

Avviare il backend:

```bash
npm run dev
```

### 4. Configurare il frontend

In un secondo terminale:

```bash
cd client
npm install
npm run dev
```

Aprire:

```text
http://localhost:3001
```

## Credenziali demo

| Ruolo | Email | Password |
| --- | --- | --- |
| Admin | admin@test.it | 123456 |

Gli account `cameriere`, `cuoco` e altri `admin` possono essere creati dall'area admin.

## API principali

### Auth

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| POST | `/auth/login` | Pubblico | Login utente |
| POST | `/auth/register` | Pubblico | Registrazione cliente |
| POST | `/auth/employees` | Admin | Creazione dipendente |

### Utenti

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| GET | `/users/me` | Autenticato | Dati utente loggato |
| GET | `/users/staff` | Admin | Lista staff |
| GET | `/users/customers` | Admin | Lista clienti |
| DELETE | `/users/:id` | Admin | Eliminazione utente |

### Menu

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| GET | `/menu` | Pubblico | Lista piatti |
| POST | `/menu` | Admin | Creazione piatto |
| PUT | `/menu/:id` | Admin | Modifica piatto |
| DELETE | `/menu/:id` | Admin | Eliminazione piatto |

### Prenotazioni

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| POST | `/bookings` | Autenticato | Nuova prenotazione |
| GET | `/bookings/my` | Cliente | Prenotazioni del cliente |
| GET | `/bookings` | Admin | Tutte le prenotazioni |
| PUT | `/bookings/:id/status` | Admin | Aggiorna stato prenotazione |
| DELETE | `/bookings/:id` | Admin | Elimina prenotazione |

### Ordini

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| POST | `/orders` | Admin, cameriere | Crea ordine |
| GET | `/orders` | Admin, cuoco, cameriere | Lista ordini |
| PUT | `/orders/:id` | Admin, cuoco | Aggiorna stato ordine |

## Database

Tabelle principali:

```text
users
menu_items
bookings
orders
order_items
```

Le immagini dei piatti non sono salvate nel database come file binari. Nel database viene salvato il nome del file, mentre le immagini stanno in:

```text
client/src/assets/images/menu
```

Esempio:

```text
menu_items.image = risotto-allo-zafferano.webp
```

## Flusso operativo ordini

```text
Cameriere crea ordine
  -> POST /orders
  -> tabella orders
  -> tabella order_items
  -> Cuoco vede ordine e piatti in Area Cucina
  -> Cuoco aggiorna stato ordine
```

Stati ordine:

```text
in_attesa
in_preparazione
pronto
servito
annullato
```

Stati prenotazione:

```text
in_attesa
confermata
annullata
```

## Struttura progetto

```text
pep-restaurant/
  client/
    src/
      api/
      assets/
      components/
      data/
      utils/
      views/
  server/
    database/
      schema.sql
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      app.js
  docs/
```

## Script utili

Backend:

```bash
cd server
npm run dev
npm start
```

Frontend:

```bash
cd client
npm run dev
npm run build
```

## Note sviluppo

- Se una tabella e' stata aggiunta dopo la creazione del database locale, bisogna eseguire manualmente la relativa parte di `schema.sql` in PgAdmin o ricreare il database.
- Le pagine admin attualmente piu complete sono Dashboard, Prenotazioni, Menu, Clienti, Staff e Dipendenti.
- Tavoli, Inventario e Cassa sono presenti come sezioni dell'interfaccia admin ma sono ancora da completare lato logica/database.

## Autori

- Pasquale Spina
- Josef Mignogna
