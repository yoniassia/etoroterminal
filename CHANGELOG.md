# eToro Terminal Changelog

All notable changes to the eToro Terminal will be documented in this file.

---

## [1.3.3] - 2026-01-31

### Added
- **Login Page Feedback** - Request access or submit feedback directly from login screen
  - 🔑 Request API Access
  - 💬 General Feedback
  - 🐛 Report a Bug
  - 📝 Other inquiries
- **Daily Feedback Review** - Automated daily review at 9:00 AM (Israel time)
- Collapsible feedback form on login page
- Local fallback storage when server unavailable

---

## [1.3.2] - 2026-01-31

### Added
- **Feedback Panel (FB)** - Submit and track user feedback
  - Bug reports, feature requests, improvements, praise
  - Category selection (Quote Panel, Strategy Builder, etc.)
  - Star rating system
  - Post to X/Twitter option
  - Feedback history view
  - Analytics dashboard with trends and action items
- **Feedback API** - Vercel serverless endpoint at `/api/feedback`
- **New Commands:** `FB` and `FEEDBACK` to open Feedback panel

### Technical
- `feedback.types.ts` - TypeScript types for feedback system
- `feedbackService.ts` - Feedback storage, submission, and analysis
- `FeedbackPanel.tsx` + CSS - UI component
- `api/feedback.ts` - Serverless API endpoint

---

## [1.3.1] - 2026-01-31

### Added
- **Panel Resizing** - Drag edges and corners to resize any panel
  - Horizontal resize (left/right edges)
  - Vertical resize (top/bottom edges)
  - Diagonal resize (all 4 corners)
  - Visual resize handle in bottom-right corner
  - Size indicator in panel header (width × height)
- **Panel Size Persistence** - Panel sizes saved to localStorage

### Changed
- Panels now have fixed sizes instead of flex layout
- Improved panel wrapper for better resize handling

---

## [1.3.0] - 2026-01-31

### Added
- **Strategy Builder Panel (SB)** - AI-powered quantitative trading strategy creation
- **10 Pre-built Strategy Templates:**
  - SMA Crossover (momentum)
  - RSI Momentum (momentum)
  - MACD Crossover (momentum)
  - EMA Ribbon (momentum)
  - Bollinger Band Bounce (mean-reversion)
  - RSI Mean Reversion (mean-reversion)
  - Donchian Channel Breakout (Turtle Trading)
  - Volume Breakout (breakout)
  - ATR Channel Breakout (breakout)
- **AI Chat Interface** - Natural language strategy generation with OpenAI GPT-4
- **Strategy Management** - Create, activate, pause, and delete strategies
- **Proposed Actions Queue** - Approve/reject AI-generated trade proposals
- **New Commands:** `SB` and `STRAT` to open Strategy Builder

### Technical
- `strategy.types.ts` - Complete TypeScript type definitions
- `strategyStore.ts` - State management with localStorage persistence
- `aiService.ts` - OpenAI integration with streaming support
- `strategyTemplates.ts` - Pre-built quantitative strategies
- Environment variable support for OpenAI API key

---

## [1.2.1] - 2026-01-31

### Fixed
- **Blotter filter dropdown** - Improved accessibility and click targets for status filter
- **Trade Ticket rejection UX** - Added prominent ORDER REJECTED banner with dismiss button
- **Trade Ticket success UX** - Added ORDER SUBMITTED confirmation banner

### Changed
- Better visual feedback for order states (rejected/success/loading)
- Filter dropdown now has proper hover and focus states

---

## [1.2.0] - 2026-01-30

### Added
- Version display on login screen with changelog link
- CHANGELOG.md for version history tracking

### Changed
- Improved deployment pipeline

---

## [1.1.7] - 2026-01-30

### Added
- Bloomberg-style terminal interface with 18 panels
- Real-time quote tiles
- Watchlist management
- Portfolio overview
- Trading functionality
- Charts integration
- Alert system
- Command bar

### Features
- 10,800+ instruments cached
- React + TypeScript + Electron + Vite stack
- Real-time data updates

---

## [1.0.0] - Initial Release

### Added
- Basic eToro API integration
- Authentication system
- Core terminal layout

---

*For detailed documentation, see [README.md](README.md)*
