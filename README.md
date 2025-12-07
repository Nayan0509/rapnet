# Rapaport Diamond Search Application

A Node.js application with a web UI for searching diamonds using the Rapaport API. Features automatic token management with 8-hour refresh handling.

## Features

- 🔐 Automatic token refresh (tokens valid for 8 hours)
- 💎 Diamond search with multiple filters
- 🎨 Modern, responsive UI
- ⚡ Real-time search results
- 🔄 Auto-refresh token 5 minutes before expiry

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure credentials in `.env` file (already created with your credentials)

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## API Endpoints

- `POST /api/diamonds/search` - Search for diamonds
- `GET /api/health` - Check server and token status

## Search Parameters

- Search Type (White/Fancy)
- Size range (carats)
- Color range (D-K)
- Clarity range (IF-SI3)
- Price range
- Page size

## Token Management

The application automatically:
- Fetches a new token on first request
- Caches the token for reuse
- Refreshes the token 5 minutes before expiry
- Handles token expiration gracefully

## Tech Stack

- Backend: Node.js + Express
- Frontend: Vanilla JavaScript
- HTTP Client: Axios
- Environment: dotenv
