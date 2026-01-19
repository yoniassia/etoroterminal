# eToro Terminal

A terminal-style portfolio viewer for eToro built with React and TypeScript.

## Features

- Terminal-themed UI with green text on dark background
- Simple login interface
- Portfolio value display using eToro public API
- Real-time portfolio data fetching

## Setup

1. Install dependencies:
```bash
npm install
```

2. The API keys are already configured in `.env` file

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Usage

1. Enter any username and password on the login screen (authentication is simplified for demo)
2. Click "FETCH PORTFOLIO VALUE" to retrieve your portfolio total value from eToro API
3. The application uses the API keys configured in the `.env` file

## API Keys

The following eToro API keys are configured:
- `x-user-key`: eyJjaSI6IjYwY2FiYjBiLTU1OTctNDQ4NS04ZjYzLTdlOWUwNTZlMGJiOCIsImVhbiI6IlVucmVnaXN0ZXJlZEFwcGxpY2F0aW9uIiwiZWsiOiJOQnE5YlQtd0U5UWY0V2YwenlMVnFUM1dQSW5aMlc5SUdIbzVkTEd0S0N0Q0hLNlZmQ3k4QW5jVENqazRpOVVKNFdTOTVTbGpBOUdQWWRidVNDcTBWQThNY1dkS0k0QThoc2plbVdRM2x4Z18ifQ__
- `x-public-key`: sdgdskldFPLGfjHn1421dgnlxdGTbngdflg6290bRjslfihsjhSDsdgGHH25hjf

## Technologies

- React 18
- TypeScript
- Vite
- eToro Public API
