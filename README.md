# Pep Restaurant

Sistema gestionale per ristorante con architettura client-server, sviluppato nell'ambito del corso di **Ingegneria del Software**.

---

## Indice

- [Panoramica](#panoramica)
- [Stack tecnologico](#stack-tecnologico)
- [Architettura](#architettura)
- [Requisiti](#requisiti)
- [Installazione](#installazione)
- [Credenziali demo](#credenziali-demo)
- [Ruoli e permessi](#ruoli-e-permessi)
- [API Reference](#api-reference)
- [Struttura del progetto](#struttura-del-progetto)
- [Funzionalità implementate](#funzionalità-implementate)
- [Sviluppi futuri](#sviluppi-futuri)
- [Autori](#autori)

---

## Panoramica

Pep Restaurant è un'applicazione web full-stack per la gestione di un ristorante. Permette a clienti, camerieri, cuochi e amministratori di interagire tramite interfacce dedicate, ciascuna con accesso controllato in base al ruolo.

---

## Stack tecnologico

| Layer      | Tecnologie                          |
|------------|-------------------------------------|
| Frontend   | React, Vite, Axios, CSS             |
| Backend    | Node.js, Express.js, JWT, Bcrypt    |
| Database   | PostgreSQL                          |

---

## Architettura

```
pep-restaurant/
├── client/          # Frontend React (Vite) — porta 3001
│   └── src/
│       ├── api/     # client.js — tutte le chiamate HTTP
│       └── assets/  # immagini menu e risorse statiche
└── server/          # Backend Express — porta 3000
    └── src/
        ├── app.js          # Entry point Express
        ├── config/db.js    # Connessione PostgreSQL
        ├── middleware/
        │   ├── auth.middleware.js   # Verifica JWT
        │   └── role.middleware.js   # Controllo permessi
        └── routes/         # Endpoint API
```

Il frontend comunica con il backend tramite `client/src/api/client.js`, che aggiunge automaticamente il token JWT a ogni richiesta protetta.

---

## Requisiti

- **Node.js** (versione LTS consigliata)
- **PostgreSQL**

---

## Installazione

### 1. Clona il repository

```bash
git clone https://github.com/pasqualefalcioncino-bit/pep-restaurant.git
cd pep-restaurant
```

### 2. Configura il database

Crea il database:

```sql
CREATE DATABASE "pep-restaurant";
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
DB_PASSWORD=la_tua_password
DB_PORT=5432
JWT_SECRET=pep_secret_2026
```

Avvia il backend:

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`.

### 4. Configura il frontend

```bash
cd client
npm install
npm run dev
```

Il frontend sarà disponibile su `http://localhost:3001`.

---

## Credenziali demo

| Ruolo | Email          | Password |
|-------|----------------|----------|
| Admin | admin@test.it  | 123456   |

Gli account per gli altri ruoli (`cuoco`, `cameriere`) possono essere creati dall'admin tramite l'apposita sezione del pannello di gestione.

---

## Ruoli e permessi

| Ruolo      | Accesso                                                       |
|------------|---------------------------------------------------------------|
| `cliente`  | Visualizza menu, effettua prenotazioni, gestisce le proprie prenotazioni |
| `cameriere`| Accede alla pagina Ordini                                     |
| `cuoco`    | Visualizza e aggiorna lo stato degli ordini                   |
| `admin`    | Accesso completo: gestione dipendenti, prenotazioni, ordini e menu |

---

## API Reference

### Autenticazione

| Metodo | Endpoint          | Descrizione                        | Accesso     |
|--------|-------------------|------------------------------------|-------------|
| POST   | `/auth/login`     | Login utente                       | Pubblico    |
| POST   | `/auth/register`  | Registrazione cliente              | Pubblico    |
| POST   | `/auth/employees` | Creazione account dipendente       | Admin       |

### Utenti

| Metodo | Endpoint         | Descrizione                        | Accesso     |
|--------|------------------|------------------------------------|-------------|
| GET    | `/users/me`      | Dati dell'utente autenticato       | Autenticato |
| GET    | `/users/staff`   | Lista staff (non clienti)          | Admin       |
| GET    | `/users/customers` | Lista clienti                    | Admin       |
| DELETE | `/users/:id`     | Elimina un'utenza                  | Admin       |

### Menu

| Metodo | Endpoint | Descrizione              | Accesso     |
|--------|----------|--------------------------|-------------|
| GET    | `/menu`  | Lista piatti del menu    | Pubblico    |
| POST   | `/menu`  | Aggiunge un nuovo piatto | Admin       |

### Ordini

| Metodo | Endpoint       | Descrizione                   | Accesso      |
|--------|----------------|-------------------------------|--------------|
| GET    | `/orders`      | Lista ordini                  | Admin, Cuoco |
| POST   | `/orders`      | Crea un nuovo ordine          | Autenticato  |
| PUT    | `/orders/:id`  | Aggiorna lo stato di un ordine | Admin, Cuoco |

### Prenotazioni

| Metodo | Endpoint                  | Descrizione                        | Accesso     |
|--------|---------------------------|------------------------------------|-------------|
| GET    | `/bookings`               | Lista tutte le prenotazioni        | Admin       |
| GET    | `/bookings/my`            | Prenotazioni del cliente loggato   | Cliente     |
| POST   | `/bookings`               | Crea una nuova prenotazione        | Autenticato |
| PUT    | `/bookings/:id/status`    | Aggiorna stato prenotazione        | Admin       |
| DELETE | `/bookings/:id`           | Elimina una prenotazione           | Admin       |

---

## Funzionalità implementate

-  Menu pubblico con immagini, descrizioni, tempi di preparazione e indicazione vegetariano
-  Registrazione e login clienti con JWT
-  Prenotazioni: creazione lato cliente, gestione e aggiornamento stato lato admin
-  Pannello admin per la gestione dei dipendenti
-  Area cuoco: visualizzazione e aggiornamento stato ordini per numero tavolo
-  Area cameriere: pagina ordini (in costruzione)
-  Navigazione e voci di menu condizionali in base al ruolo

---

## Sviluppi futuri

Il passo tecnico successivo è l'introduzione delle **righe ordine** (`order_items`), per associare piatti specifici a ciascun ordine:

```sql
-- Struttura proposta
CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(id),
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity    INTEGER NOT NULL,
  note        TEXT
);
```

Questo permetterà a cuochi e camerieri di vedere esattamente cosa è stato ordinato per ogni tavolo.

Altre funzionalità pianificate:

- [ ] Pagina ordini completa per il cameriere
- [ ] Gestione del menu con modifica ed eliminazione piatti (admin)
- [ ] Statistiche e dashboard per l'admin
- [ ] Notifiche in tempo reale (WebSocket)

---

## Autori

- **Pasquale Spina**
- **Josef Mignogna**

Progetto sviluppato per il corso di Ingegneria del Software.