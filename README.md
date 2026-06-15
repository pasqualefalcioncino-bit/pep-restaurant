# Pep Restaurant

Progetto ristorante sviluppato per il corso di Ingegneria del Software.

Il progetto permette di gestire menu, prenotazioni, utenti, tavoli, ordini di sala, flusso cucina e inventario tramite interfacce diverse in base al ruolo dell'utente.

## Indice

- [Stack](#stack)
- [Requisiti](#requisiti)
- [Installazione e avvio](#installazione-e-avvio)
- [Credenziali demo](#credenziali-demo)
- [Ruoli e funzionalita](#ruoli-e-funzionalita)
- [Database](#database)
- [API principali](#api-principali)

## Stack

Tecnologie usate:
- Frontend --> React, Vite, CSS, Fetch API
- Backend --> Node.js, Express.js
- Autenticazione --> JWT, Bcrypt
- Database --> PostgreSQL
- Upload immagini --> Multer
- UI icons --> lucide-react

## Requisiti

- Node.js
- npm
- PostgreSQL
- Un database PostgreSQL locale chiamato `pep-restaurant`

## Installazione e avvio

### 1. Clonare il repository

```bash
git clone https://github.com/pasqualefalcioncino-bit/pep-restaurant.git
cd pep-restaurant
```

### 2. Creare il database

Da terminale PostgreSQL o pgAdmin:

```sql
CREATE DATABASE "pep-restaurant";
```

Importare lo schema:

```bash
psql -U postgres -d pep-restaurant -f server/database/schema.sql
```

° In caso non dovesse funzionare il comando, incollare le query dello schema.sql direttamente su pgAdmin °

Il file [server/database/schema.sql](server/database/schema.sql) resetta le tabelle del progetto, crea la struttura completa e inserisce dati demo per admin, tavoli, menu e inventario.

### 3. Installare le dipendenze

Da root del progetto:

```bash
npm install
npm run install:all
```

Il primo comando installa gli strumenti della root, il secondo installa backend e frontend.

### 4. Configurare il backend

Creare il file `server/.env` partendo da [server/.env.example](server/.env.example):

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pep-restaurant
DB_PASSWORD=la_tua_password
DB_PORT=5432
JWT_SECRET=pep_secret_2026
PORT=3000
```

### 5. Configurare il frontend

Il frontend usa `http://localhost:3000` come backend predefinito.

Se serve cambiare URL, creare `client/.env` partendo da [client/.env.example](client/.env.example):

```env
VITE_API_URL=http://localhost:3000
```

### 6. Avviare tutto con un solo comando

Da root del progetto:

```bash
npm run dev
```

Il comando avvia backend e frontend nello stesso terminale:

```text
Backend:  http://localhost:3000
Frontend: http://localhost:3001
```

Se la porta `3001` e' occupata, Vite apre automaticamente la porta successiva e stampa l'URL corretto nel terminale.

Aprire nel browser l'indirizzo:

```text
http://localhost:3001
```

## Credenziali demo

| Ruolo | Email         | Password |
| Admin | admin@test.it | 123456   |

Gli account `cameriere`, `cuoco` e altri `admin` possono essere creati dall'area admin.

## Ruoli e funzionalita

### Cliente

- Registrazione e login.
- Visualizzazione menu pubblico.
- Prenotazione tavolo con assegnazione automatica.
- Visualizzazione, modifica e annullamento delle proprie prenotazioni future.
- Gestione del proprio profilo.

### Cameriere

- Accesso all'area ordini.
- Visualizzazione menu con filtri e ricerca.
- Creazione ordini su tavoli reali.
- Aggiunta di quantita e note per la cucina.
- Visualizzazione ordini recenti.
- Segnalazione ordine servito.
- Gestione rapida tavoli disponibili e assegnazione coperti.

### Cuoco

- Accesso all'area cucina.
- Visualizzazione ordini e singole portate.
- Aggiornamento stato ordine.
- Segnalazione delle portate pronte.
- Gestione disponibilita dei piatti.
- Consultazione inventario.
- Aggiornamento della quantita disponibile degli ingredienti.
- Eliminazione ordini serviti o annullati.

### Admin

- Dashboard con statistiche su prenotazioni, ordini, utenti, tavoli, menu e inventario.
- Gestione prenotazioni e assegnazione tavoli.
- Gestione menu con immagini, prezzo, categoria, tempi, piatto vegetariano e disponibilita.
- Gestione tavoli, posti, sala, stato e note.
- Gestione inventario.
- Creazione dipendenti.
- Visualizzazione ed eliminazione clienti e staff.

## Database

Il database viene creato dal file [server/database/schema.sql](server/database/schema.sql).

Tabelle principali:

`users` --> Utenti registrati, clienti e staff
`restaurant_tables` --> Tavoli fisici del ristorante
`menu_items` --> Piatti del menu
`bookings` --> Prenotazioni clienti
`orders` --> Ordini associati ai tavoli
`order_items` --> Singole portate degli ordini
`inventory_items` --> Ingredienti e scorte

Schema relazionale:

  USERS {
    int id PK
    varchar name
    varchar email
    text password
    varchar phone
    text avatar_url
    varchar role
    timestamptz created_at
  }

  RESTAURANT_TABLES {
    int id PK
    int table_number UK
    int seats
    varchar area
    varchar status
    timestamptz occupied_until
    text notes
  }

  MENU_ITEMS {
    int id PK
    varchar name
    text description
    numeric price
    varchar category
    int prep_time
    varchar image
    boolean veg
    boolean available
  }

  BOOKINGS {
    int id PK
    int user_id FK
    varchar full_name
    varchar email
    varchar phone
    date booking_date
    time booking_time
    int guests
    int table_number FK
    varchar status
  }

  ORDERS {
    int id PK
    int table_number FK
    varchar status
    timestamptz created_at
  }

  ORDER_ITEMS {
    int id PK
    int order_id FK
    int menu_item_id FK
    varchar item_name
    varchar category
    int quantity
    text notes
    varchar status
  }

  INVENTORY_ITEMS {
    int id PK
    varchar name
    varchar category
    numeric quantity
    numeric total_quantity
    varchar unit
    numeric min_quantity
    text notes
  }
```

### Vincoli principali

- `users.role`: `cliente`, `cameriere`, `cuoco`, `admin`.
- `orders.status`: `in_attesa`, `in_preparazione`, `pronto`, `servito`, `annullato`.
- `order_items.status`: `pending`, `preparing`, `ready`, `served`, `cancelled`.
- `bookings.status`: `in_attesa`, `confermata`, `annullata`.
- `restaurant_tables.status`: `libero`, `occupato`, `prenotato`, `in_pulizia`.
- `inventory_items.unit`: `kg`, `g`, `l`, `ml`, `pz`, `bottiglie`, `vasetti`.
- Prezzi, posti, quantita e numero coperti hanno vincoli numerici positivi.

### Immagini menu

Le immagini non sono salvate come file binari nel database.

Nel database viene salvato il nome del file:

```text
menu_items.image = risotto-allo-zafferano.webp
```

I file immagine stanno in:

```text
client/src/assets/images/menu
```

## API PRINCIPALI

### Auth

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| POST | `/auth/register` | Pubblico | Registrazione cliente |
| POST | `/auth/login` | Pubblico | Login e generazione JWT |
| POST | `/auth/employees` | Admin | Creazione dipendente |

### Utenti

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| GET | `/users/me` | Autenticato | Dati utente loggato |
| PUT | `/users/me` | Autenticato | Aggiorna profilo |
| GET | `/users/staff` | Admin | Lista staff |
| GET | `/users/customers` | Admin | Lista clienti |
| POST | `/users` | Admin | Crea utente |
| DELETE | `/users/:id` | Admin | Elimina utente |

### Menu

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| GET | `/menu` | Pubblico | Lista piatti |
| POST | `/menu` | Admin | Crea piatto |
| POST | `/menu/upload-image` | Admin | Carica immagine piatto |
| PATCH | `/menu/:id/availability` | Admin, cuoco | Cambia disponibilita |
| PUT | `/menu/:id` | Admin | Modifica piatto |
| DELETE | `/menu/:id` | Admin | Elimina piatto |

### Prenotazioni

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| POST | `/bookings` | Autenticato | Crea prenotazione |
| GET | `/bookings/my` | Cliente | Prenotazioni del cliente |
| PUT | `/bookings/:id` | Cliente | Modifica prenotazione futura in attesa |
| PATCH | `/bookings/:id/cancel` | Cliente | Annulla prenotazione futura in attesa |
| GET | `/bookings` | Admin | Lista prenotazioni |
| PUT | `/bookings/:id/status` | Admin | Aggiorna stato e tavolo |
| DELETE | `/bookings/:id` | Admin | Elimina prenotazione |

### Ordini

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| POST | `/orders` | Admin, cameriere | Crea ordine |
| GET | `/orders` | Admin, cuoco, cameriere | Lista ordini |
| DELETE | `/orders?status=&date=` | Admin, cuoco | Elimina ordini serviti o annullati |
| PATCH | `/orders/:orderId/items/:itemId/ready` | Admin, cuoco | Segna portata pronta |
| PUT | `/orders/:id` | Admin, cuoco, cameriere | Aggiorna stato ordine secondo ruolo |

### Tavoli

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| GET | `/tables` | Admin, cameriere | Lista tavoli |
| POST | `/tables` | Admin | Crea tavolo |
| PUT | `/tables/:id` | Admin | Modifica tavolo |
| PATCH | `/tables/:id/seat` | Admin, cameriere | Fa accomodare coperti su tavolo libero |
| PATCH | `/tables/:id/status` | Admin, cameriere | Aggiorna stato manuale |
| DELETE | `/tables/:id` | Admin | Elimina tavolo |

### Inventario

| Metodo | Endpoint | Accesso | Descrizione |
| --- | --- | --- | --- |
| GET | `/inventory` | Admin, cuoco | Lista ingredienti |
| POST | `/inventory` | Admin | Crea ingrediente |
| PATCH | `/inventory/:id/quantity` | Admin, cuoco | Aggiorna quantita attuale |
| PUT | `/inventory/:id` | Admin | Modifica ingrediente |
| DELETE | `/inventory/:id` | Admin | Elimina ingrediente |

## Autori

- Pasquale Spina
- Josef Mignogna