# Pep Restaurant

Sistema gestionale ristorante full-stack sviluppato per il corso di Ingegneria del Software.

## Tecnologie Utilizzate

### Frontend
- React
- Axios
- CSS

### Backend
- Node.js
- Express.js
- JWT Authentication
- Bcrypt

### Database
- PostgreSQL

### Versionamento
- Git
- GitHub

# Architettura Progetto
React Client (Frontend)
        ↓
REST API Node.js + Express
        ↓
PostgreSQL Database


# Setup Completo Progetto

# 1️ Clonare Repository

```bash
git clone URL_REPOSITORY
```

Entrare nella cartella:

```bash
cd PEP-RESTAURANT
```

# 2️ Configurazione Database PostgreSQL

Aprire PostgreSQL ed eseguire:

```sql
CREATE DATABASE pep-restaurant;
```

# 3️ Importare Database Schema

Entrare nella cartella server:

```bash
cd server
```

Importare schema database:

```bash
psql -U postgres -d pep-restaurant -f database/schema.sql
```

# 4️ Configurazione Backend

Entrare nella cartella server:

```bash
cd server
```

Installare dipendenze:

```bash
npm install
```

# 5️ Creare file .env

Nella cartella `server/` creare file:

```text
.env
```

Utilizzare come riferimento:

```text
.env.example
```

## Esempio `.env`

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pep-restaurant
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=5432

JWT_SECRET=pep_secret_2026
```

# 6️ Avviare Backend

```bash
npm run dev
```

Se tutto funziona:

```text
Database collegato ✅
Server avviato su porta 3000
```

# 7️ Configurazione Frontend

Aprire nuovo terminale:

```bash
cd client
```

Installare dipendenze:

```bash
npm install
```

# 8️ Avviare Frontend React

```bash
npm run dev
```

In alternativa puoi usare:

```bash
npm start
```

Frontend disponibile su:

```text
http://localhost:3001
```

# Login Demo Admin

## Admin

Email:

```text
admin@test.it
```

Password:

```text
123456
```

# API Disponibili

| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | /auth/login | Login utente |
| POST | /auth/register | Registrazione |
| GET | /menu | Lista menu |
| POST | /menu | Aggiungi piatto |
| GET | /orders | Lista ordini |
| POST | /orders | Nuovo ordine |


# Sicurezza Implementata

- JWT Authentication
- Password Hashing con Bcrypt
- Role Based Access (base)
- CORS Protection
- Environment Variables (.env)


# Note

Il progetto è stato sviluppato a scopo didattico per il corso universitario di Ingegneria del Software.

# Autori

- Pasquale Spina
- Josef Mignogna