# eToro Terminal

A terminal-style portfolio viewer for eToro built with React and TypeScript.

## Features

- Terminal-themed UI with green text on dark background
- Login interface with API key inputs
- Portfolio value display using eToro public API
- Real-time portfolio data fetching
- Comprehensive error handling and logging

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your eToro API keys:
```env
VITE_ETORO_USER_KEY=your_user_key_here
VITE_ETORO_PUBLIC_KEY=your_public_api_key_here
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Usage

1. The login form will be prefilled with API keys from your `.env` file
2. Click "LOGIN" to access the portfolio dashboard
3. Click "FETCH PORTFOLIO VALUE" to retrieve your portfolio total value from eToro API
4. Open browser console (F12) to see detailed API request/response logs

## API Configuration

The application uses the eToro Public API with the following authentication headers:
- `x-api-key`: Your Public API Key
- `x-user-key`: Your User Key
- `x-request-id`: Auto-generated UUID for each request

### API Endpoints Used
- Real account: `/api/v1/portfolio/real`
- Demo account: `/api/v1/portfolio/demo` (fallback)

## Technologies

- React 18
- TypeScript
- Vite
- eToro Public API

## Development

The dev server includes Hot Module Replacement (HMR) for fast development iterations.

For debugging API issues, check the browser console for detailed request/response logs.
