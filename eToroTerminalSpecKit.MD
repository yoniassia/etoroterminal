```md
# eToro Terminal (US) — SpecKit Master Document (Merged)
Version: 1.1.7  
Date: 2026-01-20  
Audience: US pro / active traders  
Scope: Bloomberg-like terminal UX using eToro Public APIs (REST + WebSocket)

> This is a **single merged file** containing the content of:
> - `README.md`
> - `.specify/memory/constitution.md`
> - `.specify/specs/001-etoro-terminal-us/spec.md`
> - `.specify/specs/001-etoro-terminal-us/plan.md`
> - `.specify/specs/001-etoro-terminal-us/wireframes.md`
> - `.specify/specs/001-etoro-terminal-us/tasks.md`
> - `.specify/specs/001-etoro-terminal-us/checklists/requirements.md`
> - **[UPDATED v1.1.7]** `docs/SPECKIT_ADDENDUM_v1.1.0.md` - Verified API contracts & implementation status
> - **[NEW v1.1.7]** `docs/CHANGELOG_v1.1.7.md` - Activity Log & Connection Status Fix

---

## Changelog

### v1.1.7 (2026-01-20) - Activity Log & Connection Status Fix
- ✅ **Activity Log Panel (ACT)**: New panel tracking trade executions with Demo/Real mode badges
- ✅ **Trade Open Logging**: Records symbol, amount, and side (BUY/SELL) for opened positions
- ✅ **Trade Close Logging**: Records realized profit/loss for closed positions
- ✅ **Order Rejected Logging**: Shows rejected orders with error messages
- ✅ **Filter by Mode**: Filter activity by All/Demo/Real
- ✅ **Unread Count Badge**: Shows number of unread activities
- ✅ **Mark All as Read**: Button to clear unread status
- ✅ **Connection Status Panel Fix**: Now shows both REST API status (working) and WebSocket status (optional)
- ✅ **REST API Status Indicator**: Green indicator when API endpoints are responding
- ✅ **WebSocket Optional Note**: Clarifies WebSocket is optional with REST polling fallback
- ✅ **Activity Store**: New `activityStore.ts` for centralized activity tracking

### v1.1.5 (2026-01-20) - Asset Explorer & Quote Autocomplete
- ✅ **Asset Explorer Panel (EXP)**: Browse entire asset universe by exchange, industry, or asset type
- ✅ **Exchange Filtering**: Filter by NYSE, NASDAQ, Hong Kong, and other exchanges
- ✅ **Asset Type Filtering**: Filter by Stocks, ETFs, Crypto, Indices
- ✅ **Search Within Results**: Search within filtered asset results
- ✅ **Add to Watchlist**: Click to view quote or add to watchlist from explorer
- ✅ **Pagination**: Paginated results for large asset sets
- ✅ **Quote Panel Autocomplete**: Symbol autocomplete from cached universe when typing
- ✅ **Keyboard Navigation**: Up/down arrows and Enter to select from autocomplete
- ✅ **Debounced Search**: Debounced autocomplete search for performance
- ✅ **Scrollbar Fix**: Removed duplicate scrollbar issue in WatchlistMonitor panel

### v1.1.4 (2026-01-20) - Workspace Layout Persistence & Draggable Panels
- ✅ **Layout Persistence**: Save current panel configuration as default (localStorage)
- ✅ **Auto-Load Layout**: Saved layout loads automatically on next session
- ✅ **Reset to Factory Defaults**: Option to restore original DEFAULT_PANELS configuration
- ✅ **Draggable Panel Reordering**: Drag and drop panels to reorder within workspace
- ✅ **Drag Visual Feedback**: Visual indicators during panel drag operations
- ✅ **Keyboard Accessible Reorder**: Ctrl+Arrow keys for panel repositioning

### v1.1.3 (2026-01-20) - Watchlist & Symbol Universe Cache
- ✅ **Watchlist API Fix**: Fixed item parsing to use `itemId` (not `instrumentId`) and `itemRank` for ordering
- ✅ **User Items Filtered**: Watchlist now filters out `itemType: "User"` entries, only showing instruments
- ✅ **Symbol Universe Cache**: Created `src/data/symbolUniverse.json` with 10,808 pre-cached instruments
- ✅ **Static Cache Loading**: `symbolResolver` loads from static JSON cache on init (no API call needed)
- ✅ **Quote Subscription on Load**: WatchlistMonitorPanel subscribes to `quotesPollingService` when watchlist loads
- ✅ **User Info Display**: Header shows username extracted from JWT user key after login
- ✅ **Network Binding**: Vite server binds to `0.0.0.0` for LAN access

### v1.1.2 (2026-01-20) - API Integration & Live Quotes Fix
- ✅ **API Key Propagation**: `etoroApi.setKeys()` ensures all services use authenticated user keys after login
- ✅ **Symbol Resolution Fix**: API returns paginated `items` array (not `instruments`); added PascalCase normalization
- ✅ **REST Quotes Polling**: New `quotesPollingService` polls `/api/v1/market-data/search` every 3s as WebSocket fallback
- ✅ **Enriched Data Display**: Portfolio shows instrument names; Watchlists show resolved symbols via `symbolResolver`
- ✅ **AddToWatchlist Fix**: Correct API parameter (`internalSymbolFull`), response parsing, and `order` field handling
- ✅ **RALPH Enhancements**: Detailed API logging, quotes endpoint test, verified AAPL resolution (instrumentId: 1001)

### v1.1.0 (2026-01-20)
- ✅ All 18 panels implemented and tested (16 original + EXP + ACT)
- ✅ API endpoints verified against official eToro documentation
- ✅ WebSocket streaming for quotes implemented
- ✅ Portfolio panel with Demo/Real mode switching
- ✅ Watchlist Monitor with popular instruments fallback
- ✅ RALPH automated test suite added
- ✅ Field name normalization for PascalCase API responses

### v1.0.0 (2026-01-19)
- Initial specification

---

## Table of contents

1. README
2. Constitution
3. Feature Specification (SpecKit: user stories, acceptance, requirements)
4. Implementation Plan (SpecKit: architecture, flows, security, testing, rollout)
5. UX Wireframes (ASCII + behaviors)
6. Tasks (delivery backlog)
7. Requirements Checklist (readiness gates)

---

# 1) README
## `etoro-terminal-speckit/README.md`

# eToro Terminal (US) - SpecKit Pack

This folder contains a SpecKit-style, spec-driven blueprint for building a Bloomberg-like terminal UX
targeted at US pro/active traders, using eToro Public APIs (REST + WebSocket) as the data/execution layer.

## What you get

- `.specify/memory/constitution.md`
  Project-level governance rules that all planning/implementation must follow.

- `.specify/specs/001-etoro-terminal-us/spec.md`
  The "WHAT + WHY": user stories, acceptance criteria, edge cases, functional requirements, entities, success criteria.

- `.specify/specs/001-etoro-terminal-us/plan.md`
  The "HOW": architecture, data flows, UX system, security model, performance budgets, testing strategy, rollout plan.

- `.specify/specs/001-etoro-terminal-us/tasks.md`
  The executable backlog: dependency-ordered tasks grouped by user story and by delivery phases.

- `.specify/specs/001-etoro-terminal-us/wireframes.md`
  ASCII wireframes + UX behaviors (keyboard model, panel linking, layouts, empty/error states).

- `.specify/specs/001-etoro-terminal-us/checklists/requirements.md`
  A requirements checklist to validate completeness before implementing.

## How to use (recommended workflow)

1) Read `spec.md`
   - Confirm scope, user stories, acceptance scenarios, and functional requirements.

2) Read `wireframes.md`
   - Align on the terminal interaction model: command bar, function codes, panels, hotkeys.

3) Read `plan.md`
   - Use it as your build blueprint (architecture + flows + performance/security/testing decisions).

4) Execute `tasks.md`
   - Build in the order provided (it’s dependency-aware and grouped for parallel execution).

## Terminal concept

Core Bloomberg-like patterns implemented:
- Command bar: type `AAPL <Enter>` or `AAPL QT`, `AAPL TRD`, `WL`, `ORD`, etc.
- Multi-panel workspace: dockable panels + link groups (A/B/C) for symbol synchronization.
- Streaming-first: quotes and order events are push-based (WebSocket), not polling.
- Pro-trader UX: keyboard-first, high-density tables, blotter, fast ticket, audit trail.

## Notation

- "Active Instrument Context": current symbol/instrument that panels can follow.
- "Function Codes": short codes that open a panel (QT, WL, TRD, ORD, PF, PI, etc.)
- "API-SPEC PENDING": a required step to ingest the latest eToro OpenAPI/portal reference and lock exact endpoint paths.

## Safety & compliance (product-level)

- The terminal must support Demo vs Real mode gating.
- Real trading requires explicit confirmation and shows an audit trail (request-id + timestamps).
- No financial advice, no performance promises; purely tooling UX.

---

If you want this formatted for Jira import (CSV), convert `tasks.md` into CSV and keep task IDs.

---

# 2) Constitution
## `etoro-terminal-speckit/.specify/memory/constitution.md`

# eToro Terminal (US) Constitution

## Core Principles

### 1) Trader-First Speed and Clarity
- Optimize for pro/active traders: dense information, fast navigation, minimal friction.
- Prefer keyboard-first workflows over mouse-first.
- UI must remain responsive under heavy streaming loads (tables virtualized, 60fps target).

### 2) Safety-First Trading Actions
- Any trading action must be explicit, reviewable, and reversible when supported.
- "Real" mode requires clear confirmation and stronger affordances than "Demo".
- Always show an audit trail: timestamp, request-id, order identifiers, status transitions.

### 3) Streaming-First Data Model
- Prefer WebSocket streaming for live quotes and order updates.
- Polling is a fallback only (used for hydration, reconciliation, or non-streaming domains).
- The system must surface data staleness and connection health.

### 4) Security and Key Hygiene by Default
- API credentials must not be stored in plaintext by default.
- Support in-memory mode + optional encrypted persistence (user-provided passphrase).
- Provide "panic lock" to clear credentials quickly.

### 5) Observable and Debuggable
- Every REST request must be traceable via request-id.
- WebSocket lifecycle events must be logged (connect/disconnect/auth/subscription counts).
- Users must be able to export a support bundle (sanitized) for troubleshooting.

## Product Tenets (Non-Negotiables)
- Keyboard navigation is not optional: all primary workflows must be achievable without a mouse.
- Errors must be actionable: show human-readable message + raw details behind a disclosure.
- Empty states must be helpful: show what to do next and the exact dependency (keys, connection, symbol, etc.).
- No hidden work: any background sync must be visible (status indicators) and cancelable if impactful.

## Governance Rules
- Any new feature must include:
  - A user story + acceptance scenarios
  - Functional requirements (testable MUST statements)
  - At least one defined independent test path
- Performance budgets:
  - Quote-to-render for subscribed symbols: target < 250ms perceived, with clear "stale" indicators otherwise.
  - Watchlist tables must support 200 visible rows using virtualization.
- Security reviews are mandatory before enabling Real trading in production.
- If an API is ambiguous, the spec must mark it as "API-SPEC PENDING" and create tasks to confirm exact contracts.

Version: 1.1.0 | Ratified: 2026-01-19 | Last Amended: 2026-01-19

---

# 3) Feature Specification
## `etoro-terminal-speckit/.specify/specs/001-etoro-terminal-us/spec.md`

Feature Specification: eToro Terminal (US) - Bloomberg-like Pro Trader UX  
Feature Branch: 001-etoro-terminal-us  
Created: 2026-01-19  
Status: Draft

Input:
User description:
"Build a Bloomberg-terminal-like US UX for pro active traders using eToro public APIs. Provide a complete SpecKit spec with UX definition, wireframes, user stories, and a build plan/tasks."

-------------------------------------------------------------------

## User Scenarios & Testing (mandatory)

### User Story 1 - Configure Keys, Choose Mode, Validate Connectivity (Priority: P1)

As a pro trader,  
I want to add my API credentials, select Demo vs Real mode, and validate access,  
so that I can trust the terminal is connected and I understand what actions are enabled.

Why this priority:
Without reliable connectivity and clear permissions, nothing else in the terminal is safe or usable.

Independent Test:
- Enter invalid keys -> expect explicit auth error.
- Enter valid keys -> open Watchlists and see successful response.
- Toggle Demo/Real -> UI reflects gating and warnings.

Acceptance Scenarios:
- Given I have no keys configured, when I open the terminal, then I am prompted to enter keys and cannot place trades.
- Given I enter keys and click "Validate", when the validation call completes, then I see "Connected" with last request-id and timestamps.
- Given I select Real mode, when I attempt to enable trading, then I must confirm via a second step (e.g., "Type ENABLE").
- Given the network is offline, when I validate, then I see an offline error and guidance.

---

### User Story 2 - Command Bar: Resolve Symbols and Open Functions (Priority: P1)

As a pro trader,  
I want a command bar that resolves tickers and launches function panels,  
so that I can navigate like a terminal (fast, keyboard-first).

Why this priority:
A command bar is the defining "terminal" interaction model for pro workflows.

Independent Test:
- Type `AAPL` -> resolves and sets active instrument context.
- Type `AAPL QT` -> opens Quote panel for AAPL.
- Type `WL` -> opens Watchlists.

Acceptance Scenarios:
- Given I type a valid ticker and press Enter, when results exist, then the active instrument is set to the best match.
- Given I type an ambiguous symbol, when multiple matches exist, then I see a ranked list and can select with arrows + Enter.
- Given I type an invalid symbol, when no results exist, then I see a "No matches" state with suggestions.
- Given I type a function code without a symbol (e.g., `WL`), when that function does not need a symbol, then it opens immediately.
- Given I type `AAPL TRD`, when trading is disabled, then I open the ticket but the submit action is disabled with explanation.

---

### User Story 3 - Terminal Workspace: Multi-Panel Layout and Panel Linking (Priority: P1)

As a pro trader,  
I want a multi-panel workspace with linked panels,  
so that I can monitor markets and execute without context switching.

Why this priority:
Pro traders use multi-monitor/multi-window layouts and need synchronized context.

Independent Test:
- Open 4 panels (QT, CH, WL, TRD).
- Link QT + CH to group A and change symbol: both update.
- Pin TRD to a different symbol: it stays fixed.

Acceptance Scenarios:
- Given I open a new panel, when it is linked to "Follow Active Symbol", then it updates when the active instrument changes.
- Given I set a panel to "Pinned", when the active instrument changes, then the pinned panel does not change.
- Given I set two panels to the same link group, when I change the group symbol, then both panels update.
- Given I close and reopen the app, when workspace persistence is enabled, then my layout restores.

---

### User Story 4 - Streaming Quotes: Quote Tile and Status (Priority: P1)

As a pro trader,  
I want streaming bid/ask/last with timestamps and staleness indicators,  
so that I can react instantly and trust what I see.

Why this priority:
Live quote streaming is core terminal behavior.

Independent Test:
- Subscribe to one instrument topic and see updates.
- Disconnect network -> see "Disconnected" + stale state.

Acceptance Scenarios:
- Given the quote feed is connected, when the price updates, then the quote tile updates without manual refresh.
- Given the quote feed is disconnected, when no updates arrive for N seconds, then the quote is marked stale and the connection banner indicates reconnection attempts.
- Given I switch symbols, when the panel is linked, then it unsubscribes old topic and subscribes new topic.

---

### User Story 5 - Watchlists: CRUD + Streaming Monitor Table (Priority: P1)

As a pro trader,  
I want watchlists that load instantly and stream live columns,  
so that I can scan 30-200 symbols quickly.

Why this priority:
Watchlists are the primary scanning surface for active trading.

Independent Test:
- Create watchlist, add instrument IDs, set default, delete.
- Open watchlist table and see streaming quotes populate.

Acceptance Scenarios:
- Given I have watchlists, when I open WL, then I see a list and can open one into a streaming table.
- Given I create a watchlist and add symbols, when I reopen it, then it contains those symbols.
- Given a watchlist has 200 symbols, when I open it, then the UI remains responsive and only visible rows render (virtualization).
- Given I add/remove symbols, when the list changes, then WS subscriptions update accordingly.

---

### User Story 6 - Curated Lists + Recommendations (Priority: P2)

As a pro trader,  
I want curated lists and recommendation feeds,  
so that I can find trade ideas fast and move them to my watchlists.

Why this priority:
Pro traders need idea generation beyond their own static watchlists.

Independent Test:
- Open Curated lists view -> open into a watchlist-like table.
- Open Recommendations -> add a symbol to my watchlist.

Acceptance Scenarios:
- Given curated lists exist, when I open one, then I see its instruments as a streaming table.
- Given recommendations return N instruments, when I open them, then I can add selected symbols to a watchlist.

---

### User Story 7 - Trading Ticket: Market Open (Amount/Units) with Safety Gating (Priority: P1)

As a pro trader,  
I want a fast market order ticket (buy/sell, amount/units, leverage, optional SL/TP),  
so that I can execute quickly while avoiding mistakes.

Why this priority:
Execution is the highest value function; must be fast and safe.

Independent Test:
- Place a demo market order by amount.
- Place by units.
- Validate disabled state when keys are read-only.

Acceptance Scenarios:
- Given trading is enabled and I have an active symbol, when I submit a market order, then I see an immediate local "pending" and later a confirmed status update.
- Given trading is disabled, when I open the ticket, then the submit button is disabled with reason.
- Given I am in Real mode, when I press Submit, then I must confirm (2-step) before the request is sent.
- Given the API returns an error, when the order fails, then I see the error summary and the raw payload behind disclosure.

---

### User Story 8 - Orders Blotter: Real-Time Lifecycle (Priority: P1)

As a pro trader,  
I want a blotter that shows order lifecycle updates in real time,  
so that I can manage execution risk and diagnose rejections.

Why this priority:
A blotter is essential pro tooling; it is the "truth table" for execution.

Independent Test:
- Submit an order -> see blotter row appear.
- Receive WS private updates -> blotter row updates status.

Acceptance Scenarios:
- Given the private feed is authenticated, when an order event occurs, then the blotter updates within seconds without manual refresh.
- Given the private feed is not authenticated, when I open blotter, then it shows instructions to authenticate and a non-live fallback state.
- Given an order is rejected, when the rejection arrives, then the blotter row shows reason and the error code in details.

---

### User Story 9 - Portfolio: Positions + Close Full/Partial (Priority: P1)

As a pro trader,  
I want a live portfolio view with position controls,  
so that I can manage risk and close positions rapidly.

Why this priority:
Execution without portfolio management is incomplete; closing positions must be fast.

Independent Test:
- Load portfolio and close a position fully.
- Partial close by units.

Acceptance Scenarios:
- Given I have positions, when I open PF, then I see a positions table with key fields and actions.
- Given I click "Close Full", when I confirm, then a close order is sent and the blotter shows updates.
- Given I click "Close Partial", when I enter units and confirm, then a partial close is sent.

---

### User Story 10 - Chart Panel: Intraday Visualization from Streaming (Priority: P2)

As a pro trader,  
I want a lightweight chart that updates from streaming prices,  
so that I can interpret price action without leaving the terminal.

Why this priority:
Charts are essential but can be minimal in v1; focus is scanning and execution.

Independent Test:
- Open CH panel and verify it builds bars from WS ticks (1m default).
- Change timeframe -> chart re-aggregates.

Acceptance Scenarios:
- Given a streaming quote feed, when ticks arrive, then the chart updates (tick/line) and bars aggregate (1m).
- Given I switch symbols, when linked, then the chart resets to the new symbol and loads from cached session history if available.
- Given no data yet, when chart loads, then it shows a helpful empty state and waits for streaming.

---

### User Story 11 - Alerts: Price Threshold and Staleness Alerts (Priority: P2)

As a pro trader,  
I want local alerts (price crossing, stale feed, volatility spike),  
so that I can monitor many instruments without staring at every row.

Why this priority:
Alerts amplify trader attention; must be reliable and easy to configure.

Independent Test:
- Set alert "AAPL > X" and simulate price crossing.
- Disconnect WS -> stale alert triggers.

Acceptance Scenarios:
- Given I create an alert, when the condition is met, then I receive an in-terminal notification and it appears in Alerts log.
- Given alerts are paused, when conditions happen, then no notification is emitted and UI indicates paused.
- Given WS disconnects, when staleness threshold is exceeded, then a staleness alert triggers once per instrument per interval.

---

### User Story 12 - Trader Discovery: Search, Profile, Compare (Priority: P2)

As a power user,  
I want to search traders (people) by performance/risk and open profiles,  
so that I can analyze and track top performers.

Why this priority:
eToro’s differentiator vs classic terminals is social/copy ecosystem analytics.

Independent Test:
- Run search with filters -> open profile -> view charts -> view portfolio.

Acceptance Scenarios:
- Given I open PI Search, when I set filters and press Search, then results paginate and sort correctly.
- Given I open a profile, when data loads, then I can view performance series and live portfolio transparency.
- Given I add traders to compare, when I open Compare, then charts and key metrics align on the same time window.

---

### User Story 13 - Feeds: Instrument Feed + Posting (Priority: P3)

As a trader,  
I want to view instrument-specific feed posts and optionally publish posts,  
so that I can follow market conversation inside the terminal.

Why this priority:
Useful but not required for initial pro trading MVP; depends on full Feeds endpoint availability.

Independent Test:
- Load instrument feed -> verify pagination.
- Post a message -> appears in my feed.

Acceptance Scenarios:
- Given feed endpoints are enabled, when I open N (News/Feed), then I see a scrollable feed with filters.
- Given I publish a post, when it succeeds, then it appears in my feed and shows a timestamp.

---

-------------------------------------------------------------------

## Edge Cases

- Symbol resolution returns multiple matches (same ticker across venues/CFDs/crypto pairs): require user selection and remember preference.
- Streaming disconnects/reconnects: prevent UI thrash; show stale indicators and reconnect banner.
- Too many streaming subscriptions: throttle, batch subscribe, and warn user; degrade gracefully.
- REST rate limiting: exponential backoff; show "rate limited" status; continue streaming where possible.
- Partial data availability: load what exists; show "API-SPEC PENDING" capabilities behind feature flags.
- Trading in Real mode: enforce confirmation gate and show irreversible action warning.
- Out-of-order WS events: apply ordering by timestamp/order status progression; keep raw log.
- Inconsistent instrument IDs across environments: always treat instrumentId as canonical, cached, and immutable.
- Portfolio/positions change outside the terminal: provide manual "Refresh" and periodic reconcile.
- User keys revoked mid-session: immediately disable trading and show re-auth CTA.

-------------------------------------------------------------------

## Requirements (mandatory)

### Functional Requirements

FR-001: System MUST provide a command bar that supports symbol resolution and function execution via keyboard-only navigation.  
FR-002: System MUST maintain an "Active Instrument Context" that panels can follow or pin away from.  
FR-003: System MUST support multi-panel layouts with panel add/remove, resize, and persistence.

FR-004: System MUST connect to eToro WebSocket for live instrument quote topics.  
FR-005: System MUST support WebSocket authentication for private topics when available/required.  
FR-006: System MUST allow subscribe/unsubscribe to instrument topics based on visible watchlist rows and open panels.  
FR-007: System MUST display connection health (Connected/Reconnecting/Disconnected) and data staleness per panel.

FR-008: System MUST resolve ticker -> instrumentId using eToro Market Data search capability.  
FR-009: System MUST cache symbol->instrumentId mappings locally and reuse them to reduce latency.

FR-010: System MUST list user watchlists and open a watchlist into a streaming monitor table.  
FR-011: System MUST allow creating, renaming (if supported), deleting, and setting default watchlists.  
FR-012: System MUST allow adding/removing instruments to/from watchlists.  
FR-013: System MUST virtualize large tables (>=200 rows) to preserve responsiveness.

FR-014: System MUST support curated lists browsing and opening curated lists as streaming tables.  
FR-015: System MUST support market recommendations feed and actions to add items to watchlists.

FR-016: System MUST provide a market order ticket supporting buy/sell and open by amount.  
FR-017: System MUST provide a market order ticket supporting open by units.  
FR-018: System MUST support close-position market orders by positionId, including full and partial close.  
FR-019: System MUST gate Real trading with explicit confirmation distinct from Demo.  
FR-020: System MUST show an execution audit trail including request-id, timestamps, and order identifiers.

FR-021: System MUST provide a blotter that shows order events and status transitions.  
FR-022: System MUST update blotter using streaming private events when available.  
FR-023: System MUST allow users to inspect raw order event payloads from the blotter.

FR-024: System MUST provide a portfolio view listing positions and enabling close actions.  
FR-025: System MUST support manual refresh and reconciliation of portfolio state.

FR-026: System MUST provide a chart panel that updates from streaming prices and supports at least one intraday timeframe.  
FR-027: System MUST provide local alert rules for price threshold crossings based on streaming quotes.  
FR-028: System MUST provide alerts for staleness/disconnect events.

FR-029: System MUST provide trader discovery search with filters and sorting.  
FR-030: System MUST provide trader profiles with performance series and live portfolio transparency when supported.

FR-031: System MUST support an in-terminal notification system (toast + notification log).  
FR-032: System MUST provide a settings panel for keys, mode, and streaming configuration.

FR-033: System MUST NOT store API keys in plaintext by default.  
FR-034: System MUST support a "panic lock" action that clears keys and disables private data/trading instantly.

FR-035: System MUST log REST requests with request-id and latency.  
FR-036: System MUST log WS lifecycle events and subscription counts.  
FR-037: System MUST provide a sanitized export bundle for support/debug.

FR-038: System MUST provide feature flags for APIs not fully specified (Feeds, PI Data, advanced market data/history).  
FR-039: System MUST include an "API Surface Audit" process that locks endpoint paths/contracts before implementation.  
FR-040: System MUST have clear empty states for every panel (no symbol, no connection, no permissions, no data).

-------------------------------------------------------------------

## Key Entities (include if feature involves data)

- Instrument: canonical tradable item identified by instrumentId; includes symbol/label metadata.
- Quote: streaming bid/ask/last + timestamp and staleness metadata.
- Watchlist: named collection of instrumentIds (user-managed) plus curated lists (read-only).
- Workspace: saved layout containing panels, sizes, link groups, pinned contexts.
- Panel: a single functional view (QT, CH, WL, TRD, ORD, PF, PI, N, AL).
- Order: a trading instruction (market open/close) with lifecycle status updates.
- OrderEvent: streaming status update payload tied to an order.
- Position: an open holding with positionId; supports close full/partial.
- AlertRule: local condition rules (price threshold, staleness) tied to instruments or watchlists.
- TraderProfile: user entity with performance/risk stats and portfolio transparency.
- FeedPost: social content tied to instrument/user (if enabled).
- AuditLogEntry: local record of actions + request-ids + timestamps.

-------------------------------------------------------------------

## Success Criteria (mandatory)

### Measurable Outcomes

SC-001: User can go from app open -> connected -> first streaming quote visible in <= 10 seconds on typical broadband.  
SC-002: Command bar symbol resolution returns a selectable result list in <= 500ms (excluding network delays).  
SC-003: Watchlist table supports 200 symbols with smooth scrolling (no major UI jank).  
SC-004: Streaming quote updates render with perceived latency <= 250ms under normal conditions.  
SC-005: Trading ticket supports a market open flow in <= 2 user actions after initial setup (symbol already active).  
SC-006: Real trading requires explicit confirmation and displays an audit trail for every order.  
SC-007: Blotter reflects order status transitions without manual refresh when private stream is available.  
SC-008: Portfolio loads and renders positions in <= 2 seconds for typical accounts.  
SC-009: Users can operate primary flows (search, watchlist, ticket, blotter, portfolio) without mouse.  
SC-010: Key leakage risk is minimized: no plaintext persistence by default; panic lock clears keys immediately.  
SC-011: Support bundle export works and excludes secrets by default.  
SC-012: 90%+ of internal testers can complete “Add symbol -> watchlist -> trade demo -> see blotter -> close position” without external guidance.

---

# 4) Implementation Plan
## `etoro-terminal-speckit/.specify/specs/001-etoro-terminal-us/plan.md`

Implementation Plan: eToro Terminal (US) - Bloomberg-like Pro Trader UX  
Feature Branch: 001-etoro-terminal-us  
Created: 2026-01-19  
Status: Draft

NOTE:
This plan intentionally separates:
- "Contract locking" (API Surface Audit) from
- "Implementation"
to prevent building against assumptions when endpoint details differ.

-------------------------------------------------------------------

## Summary

Build a terminal-style, keyboard-first, multi-panel workspace optimized for pro/active traders.

Core capabilities (v1):
- Command bar: symbol resolution + function codes
- Multi-panel workspace with panel linking groups
- Streaming quotes via WebSocket
- Watchlists (CRUD) + streaming monitor tables
- Trading ticket for market open/close + safety gating (Demo vs Real)
- Blotter fed by private order events (when available)
- Portfolio positions + close actions
- Chart from streaming ticks (v1)
- Alerts (local rules)
- Trader discovery + profile analytics
- Feeds (feature-flagged until endpoint contracts are locked)

-------------------------------------------------------------------

## Technical Context

Language/Version:
- TypeScript (recommended) for predictable domain models and typed API clients.

Primary Dependencies (recommended defaults):
- UI: React + a lightweight router (Next.js or Vite+React)
- Table virtualization: TanStack Table + react-virtual (or equivalent)
- Docking layout: react-grid-layout (or equivalent)
- Charts: lightweight-charts (or equivalent)
- State: Zustand or Redux Toolkit (prefer minimal boilerplate)
- Validation: Zod (schema validation for API payloads)

Storage:
- Local (browser/Electron): IndexedDB for workspace persistence and symbol cache.
- Optional: encrypted storage for keys if user opts in.

Testing:
- Unit: Vitest/Jest
- Component: React Testing Library
- E2E: Playwright
- Performance smoke: simple script that opens 200-symbol watchlist and checks FPS/jank thresholds

Target Platform:
- Web (desktop-first)
- Optional: Electron wrapper for desktop distribution (Phase 6)

Project Type:
- Web app (desktop-first)

Performance Goals:
- 60fps UI responsiveness under 200-stream subscription typical workloads
- Virtualized tables for 200+ rows
- Streaming quote render latency target <= 250ms perceived

Constraints:
- No plaintext key persistence by default
- Clear audit trail for trade actions
- Graceful degradation when WS/private feed unavailable

Scale/Scope:
- v1: single user session (local terminal)
- Future: multi-user enterprise mode with BFF + centralized auth

-------------------------------------------------------------------

## Constitution Check (Gates)

GATE A: Trader-First Speed and Clarity
- Use virtualization everywhere for big tables.
- Keep interactions keyboard-first and low-latency.

GATE B: Safety-First Trading
- Demo/Real toggle and explicit confirmations.
- Always show request-id and full order lifecycle.

GATE C: Streaming-First
- WS drives quotes and private order updates.
- REST is used for hydration, search, watchlists, reconcile.

GATE D: Security
- In-memory keys by default; optional encryption.
- Panic lock implemented early.

GATE E: Observability
- REST request log + WS lifecycle log + export bundle.

-------------------------------------------------------------------

## Architecture Overview

### High-level components

1) App Shell
- Top: Command Bar + global status (WS/REST)
- Left rail: navigation (WL, QT, CH, TRD, ORD, PF, PI, AL, Settings)
- Center: Workspace grid (dockable panels)
- Bottom: status bar (mode, connection, last request-id)

2) Panel Runtime
- Panel registry maps function codes -> panel components
- Panel context:
  - active instrument
  - pinned instrument (optional)
  - link group (A/B/C)
  - data bindings (quotes, positions, etc.)

3) Data Layer (Client-side)
- REST Client:
  - Injects required headers (x-api-key, x-user-key, x-request-id)
  - Handles rate limiting and retries (safe defaults)
- WebSocket Client:
  - Connect/reconnect with backoff
  - Authenticate for private topics
  - Subscribe/unsubscribe batching and snapshot
- Domain Stores:
  - instrument cache store
  - quotes store (latest quote per instrument + staleness)
  - watchlist store
  - orders/blotter store
  - portfolio store
  - alerts store
  - workspace store

4) Optional BFF (Future)
- A local or hosted gateway for:
  - key custody
  - caching
  - cross-device workspaces
  - unified audit logging

v1 recommendation: build client-only first with a clear seam for BFF later.

-------------------------------------------------------------------

## Data Flows

### Flow A: Symbol resolution -> active instrument
1) User types in command bar
2) REST: market-data search to map symbol -> instrumentId
3) App sets Active Instrument Context
4) Linked panels subscribe to instrument:<instrumentId>

### Flow B: Streaming watchlist monitor
1) User opens WL and selects a watchlist
2) REST: fetch watchlist items (instrumentIds)
3) WS: subscribe to visible instruments (batch by limits)
4) Quotes store updates; table consumes latest quotes

### Flow C: Market order
1) User opens ticket (TRD) for active instrument
2) User configures buy/sell, amount/units, leverage, optional SL/TP
3) Confirmation step (especially in Real mode)
4) REST: submit market-open (or market-close)
5) Orders store adds "pending" local record
6) WS private events update status -> blotter renders transitions

### Flow D: Portfolio and close
1) User opens PF
2) REST: load portfolio live (positions)
3) User selects a position and closes full/partial
4) REST: submit market-close
5) WS private updates -> blotter and (eventually) portfolio reconcile

### Flow E: Alerts
1) User defines alert rules for instrument or watchlist
2) Quotes stream updates
3) Alert engine evaluates rules and emits notifications
4) Alerts log stores outcomes; user can mute/ack

-------------------------------------------------------------------

## API Surface Audit (Required Step Before Final Build)

Goal: produce a locked, versioned contract for:
- REST endpoints per domain (market data, watchlists, trading, users info, feeds, pi data)
- WS schema for instrument and private topics
- Auth requirements and error codes

Deliverables:
- `contracts/etoro-rest.openapi.json` (or extracted endpoints list if OpenAPI is not available)
- `contracts/etoro-ws.schema.md` (message examples and typed model)
- Updated mapping table in spec/wireframes (remove API-SPEC PENDING where resolved)

Method:
- Pull the latest public API portal definitions (manual or automated)
- Validate using live calls in demo mode (where possible)
- Implement Zod schemas for responses so payload drift is detected early

-------------------------------------------------------------------

## UX System Implementation Notes

### Command Bar
- Parses:
  - SYMBOL (e.g., AAPL)
  - SYMBOL + FUNCTION (e.g., AAPL QT)
  - FUNCTION only (e.g., WL)
- Typeahead:
  - recent symbols
  - watchlist symbols
  - cached symbol->instrument mapping
- Keyboard:
  - Arrow up/down selects
  - Enter confirms
  - Esc closes dropdown

### Function Codes (initial set)
- QT: Quote
- CH: Chart
- WL: Watchlists
- TRD: Trade Ticket
- ORD: Blotter
- PF: Portfolio
- AL: Alerts
- PI: Trader search
- PIP: Trader profile (open with a username)
- N: Feeds/News (feature-flagged)

### Panel Linking
- Each panel has:
  - Link Mode: Follow Active | Link Group A/B/C | Pinned
  - If pinned, stores its own instrumentId

### Visual language
- Dark theme default
- High-contrast table text
- Subtle flash on quote updates (non-distracting)
- "Stale" styling: muted + timestamp label

-------------------------------------------------------------------

## Security Model

- Default: keys stored only in memory for session.
- Optional: "Remember keys" uses encryption with a passphrase (never store passphrase).
- Panic Lock:
  - clears keys from memory and storage
  - disconnects WS private subscriptions
  - disables trading actions immediately
- Logging:
  - Never log secrets
  - Support bundle must be sanitized by default

-------------------------------------------------------------------

## Observability

- REST Log:
  - timestamp, method, path, status, latency, request-id, error summary
- WS Log:
  - connect/disconnect, auth ok/fail, subscribed topics count, reconnect attempts
- User-visible:
  - status bar indicators + "Diagnostics" drawer + export bundle

-------------------------------------------------------------------

## Testing Strategy

1) Unit tests
- parsing command bar input
- quote staleness logic
- alert evaluation engine
- subscription batching logic
- request-id generation and log redaction

2) Integration tests (mocked API)
- watchlists CRUD flows
- order submit -> blotter update (mock WS private)

3) E2E tests (Playwright)
- setup keys (mock)
- open watchlist -> see table populate
- open ticket -> place demo order -> see blotter

4) Performance smoke
- open 200-symbol watchlist
- verify scroll remains responsive
- verify WS reconnect doesn’t freeze UI

-------------------------------------------------------------------

## Delivery Phases

Phase 0: API Contract Locking + Skeleton App  
Phase 1: Command Bar + Workspace + Streaming Quotes (QT)  
Phase 2: Watchlists + Streaming Monitor (WL)  
Phase 3: Trading Ticket + Blotter (TRD/ORD)  
Phase 4: Portfolio + Close Flows (PF)  
Phase 5: Chart + Alerts (CH/AL)  
Phase 6: Trader Discovery (PI)  
Phase 7: Feeds (N) if contracts available  
Phase 8: Polish (perf, accessibility, export bundle, Electron wrapper optional)

-------------------------------------------------------------------

## Risks and Mitigations

Risk: API contracts drift or endpoints differ from assumptions  
- Mitigation: API Surface Audit + schema validation + feature flags

Risk: Too many WS subscriptions causes throttling  
- Mitigation: subscription manager, batching, user warnings, limit policies

Risk: Keys handling security concerns  
- Mitigation: in-memory default, optional encryption, panic lock

Risk: Trading errors confuse users  
- Mitigation: rich error reporting + raw details + request-id correlation

-------------------------------------------------------------------

## Definition of Done (DoD)

- All P1 user stories pass acceptance scenarios
- All FR-001..FR-040 met (or explicitly deferred with documented rationale)
- Performance smoke passes on a typical laptop
- No plaintext key persistence by default
- Diagnostics export works and is sanitized

---

# 5) UX Wireframes
## `etoro-terminal-speckit/.specify/specs/001-etoro-terminal-us/wireframes.md`

# UX Wireframes: eToro Terminal (US) - Pro Trader Terminal

These wireframes are ASCII layouts intended to fully specify:
- placement
- information density
- keyboard behaviors
- empty/error states

-------------------------------------------------------------------
1) Terminal Shell (Default Workspace)
-------------------------------------------------------------------

**DEFAULT OPEN SCREEN REQUIREMENT:**
On successful login, the terminal MUST automatically open 5 default panels that connect to eToro Public APIs:

- Panel A: **Quote (QT)** - Real-time bid/ask/last with streaming updates via WebSocket
- Panel B: **Watchlists (WL)** - Fetches user watchlists from `/api/v1/watchlists`
- Panel C: **Portfolio (PF)** - Fetches portfolio/positions from `/api/v1/trading/info/demo/pnl`
- Panel D: **API Tester (API)** - Test any eToro API endpoint directly (like Swagger UI)
- Panel E: **Help (HELP)** - Documentation and getting started guide

This ensures the trader immediately sees:
1. Live market data via API connections
2. Tools to test and explore all available APIs
3. Documentation on how to use the terminal

All panels follow the "Active Symbol" context by default (linked to Group A).

-------------------------------------------------------------------

+-----------------------------------------------------------------------------------+
| eToro Terminal (Demo)   WS: Connected   REST: OK   Subs: 42   Lat: 120ms   [User] |
|-----------------------------------------------------------------------------------|
| COMMAND: > AAPL QT                                                           [Go] |
| Type: SYMBOL, SYMBOL FUNC, or FUNC.   Examples: "AAPL", "AAPL TRD", "WL"          |
|-----------------------------------------------------------------------------------|
| NAV  |  [PANEL A: QT Quote]           |  [PANEL B: CH Chart]                      |
|------|--------------------------------|------------------------------------------|
| WL   |  AAPL  192.42 / 192.45         |   (line/tick) 1m bars                     |
| QT   |  Last: 192.44  Spread: 0.03    |    ^                                      |
| CH   |  Time: 09:31:04 ET  [LIVE]     |    |     __/\/\__                          |
| TRD  |  Stale: NO                     |    +----------------------------------->  |
| ORD  |--------------------------------|------------------------------------------|
| PF   |  [PANEL C: WL Watchlist]       |  [PANEL D: TRD Ticket]                    |
| AL   |  Symbol   Bid    Ask   Last    |  AAPL  [BUY] [SELL]                       |
| PI   |  AAPL   192.42 192.45 192.44   |  Mode: Amount (USD) [v]                   |
| N    |  TSLA   210.10 210.15 210.12   |  Amount: [  500.00 ]                      |
| SET  |  NVDA   900.01 900.10 900.06   |  Leverage: [  2x ]                        |
|      |  ... (virtualized)             |  SL: [____]  TP: [____]                   |
|      |  [Add] [Remove] [Set Default]  |  [Submit Demo] (disabled if no perms)     |
|-----------------------------------------------------------------------------------|
| Status: Demo | Active: AAPL | Link: Panel A=Group A Panel B=Group A | ReqID: ...   |
+-----------------------------------------------------------------------------------+

Keyboard model:
- "/" focuses command bar from anywhere
- Esc closes dropdown/modals and returns focus to last panel
- Ctrl+1..Ctrl+4 focus panels A..D
- In a table: arrows move; Enter sets active symbol; T opens ticket; C opens chart

Panel link modes (shown in panel header):
- Follow Active
- Group A / Group B / Group C
- Pinned (shows pinned symbol)

-------------------------------------------------------------------
2) Command Bar Typeahead
-------------------------------------------------------------------

COMMAND: > AA
+------------------ Typeahead ------------------+
| Symbols (cached/recent)                       |
| > AAPL   Apple Inc.                           |
|   AAL    American Airlines                    |
|   AAXJ   iShares MSCI Asia ex Japan ETF       |
|------------------------------------------------
| Functions                                     |
|   QT  Quote                                   |
|   CH  Chart                                   |
|   WL  Watchlists                              |
|   TRD Trade Ticket                            |
|   ORD Blotter                                 |
|   PF  Portfolio                               |
|   AL  Alerts                                  |
|   PI  People Search                           |
|   N   Feeds (if enabled)                      |
+----------------------------------------------+

Behaviors:
- Enter selects highlighted item
- Tab autocompletes first match
- When input is "AAPL TRD", typeahead filters functions

-------------------------------------------------------------------
3) Watchlists (WL) - List + Actions
-------------------------------------------------------------------

+------------------------------ WL ------------------------------+
| My Watchlists            | Curated Lists | Recommendations     |
|---------------------------------------------------------------|
| > Default Watchlist      | [Tech Giants] | [Top Movers]         |
|   Earnings Week          | [Energy]      | [Most Traded]        |
|   Crypto Basket          | [Dividends]   | [For You]            |
|---------------------------------------------------------------|
| [Open] [Create] [Rename*] [Delete] [Set Default]              |
| *Rename depends on endpoint availability                       |
+---------------------------------------------------------------+

-------------------------------------------------------------------
4) Watchlist Monitor Table (Streaming)
-------------------------------------------------------------------

+----------------------------------- WL: Earnings Week -----------------------------------+
| Link: Follow Active   View: Table   Subs: 120   Stale: 0                                  |
|------------------------------------------------------------------------------------------|
| Symbol | Bid      | Ask      | Last     | Spread | Time (ET) | Chg* | Alerts | Actions    |
|------------------------------------------------------------------------------------------|
| AAPL   | 192.42   | 192.45   | 192.44   | 0.03   | 09:31:04  | ...  | 2      | [T] [C]    |
| TSLA   | 210.10   | 210.15   | 210.12   | 0.05   | 09:31:03  | ...  | 0      | [T] [C]    |
| ... (virtualized)                                                                      |
|------------------------------------------------------------------------------------------|
| Footer: [Add Symbol] [Remove] [Export]  Note: Chg* computed locally in v1                |
+------------------------------------------------------------------------------------------+

Key actions:
- Enter: set active instrument to row symbol
- T: open ticket for row symbol
- C: open chart for row symbol
- A: add alert for row symbol

-------------------------------------------------------------------
5) Quote Panel (QT)
-------------------------------------------------------------------

+------------------------------- QT: AAPL -------------------------------+
| Link: Group A   Stale: NO   Updated: 09:31:04 ET   Spread: 0.03        |
|------------------------------------------------------------------------|
| BID: 192.42      ASK: 192.45      LAST: 192.44                         |
|------------------------------------------------------------------------|
| Mini Sparkline:  (last 5m)                                             |
|  __/\__/\___/\__                                                       |
|------------------------------------------------------------------------|
| Actions: [TRD] Trade   [CH] Chart   [WL] Add to Watchlist               |
+------------------------------------------------------------------------+

Empty state (no symbol):
- "No active symbol. Type a ticker in the command bar (e.g., AAPL) to begin."

Disconnected state:
- Banner: "WS Disconnected. Reconnecting..."
- Quote values greyed + timestamp shows last update

-------------------------------------------------------------------
6) Trade Ticket (TRD)
-------------------------------------------------------------------

+-------------------------------- TRD: AAPL --------------------------------+
| Mode: Demo | Link: Follow Active | Permissions: Read/Write?                |
|----------------------------------------------------------------------------|
| Side:  ( ) BUY    ( ) SELL                                              |
| Open:  (o) Amount (USD)    ( ) Units                                     |
| Amount: [  500.00 ]           Units: [________]                          |
| Leverage: [  2x  v ]                                                    |
| Risk:  SL Rate: [______]   TP Rate: [______]                             |
|----------------------------------------------------------------------------|
| [Review] -> [Confirm] -> [Submit]                                         |
|----------------------------------------------------------------------------|
| Errors: (collapsed)                                                       |
+----------------------------------------------------------------------------+

Real mode confirmation:
- Step requires explicit confirmation (e.g., type ENABLE or HOLD TO CONFIRM)
- Shows: request-id, symbol, side, amount/units, leverage, SL/TP summary

-------------------------------------------------------------------
7) Orders Blotter (ORD)
-------------------------------------------------------------------

+--------------------------------------- ORD ---------------------------------------+
| Filter: [Today v] [All Status v] [Symbol: ____]  Private Feed: Connected           |
|-----------------------------------------------------------------------------------|
| Time     | OrderID | Symbol | Side | ReqUnits | ExecUnits | Status | Error | Details |
|-----------------------------------------------------------------------------------|
| 09:31:05 | 123..   | AAPL   | BUY  | 10       | 0         | PEND   |       | [>]     |
| 09:31:06 | 123..   | AAPL   | BUY  | 10       | 10        | FILL   |       | [>]     |
|-----------------------------------------------------------------------------------|
| Details drawer shows raw payload + parsed fields + request-id link                  |
+-----------------------------------------------------------------------------------+

Private feed disconnected:
- Show "Private feed not authenticated. Open Settings -> Keys -> Authenticate WS."

-------------------------------------------------------------------
8) Portfolio (PF)
-------------------------------------------------------------------

+-------------------------------------- PF --------------------------------------+
| User: my_username   Mode: Demo   Last refresh: 09:31:10 ET  [Refresh]           |
|--------------------------------------------------------------------------------|
| POSITIONS                                                                        |
| positionId | Symbol | Side | Units | Leverage | Open | SL | TP | PnL | Actions  |
|--------------------------------------------------------------------------------|
| 991..      | AAPL   | BUY  | 10    | 2x       | 190  | -  | -  | +12 | [Close]  |
|--------------------------------------------------------------------------------|
| SOCIAL TRADES (if present)                                                      |
| socialTradeId | Parent | PnL | Positions | ...                                   |
+--------------------------------------------------------------------------------+

Close flow:
- Close Full -> confirm -> submit close order
- Close Partial -> input units -> confirm -> submit

-------------------------------------------------------------------
9) Alerts (AL)
-------------------------------------------------------------------

+------------------------------------ AL ------------------------------------+
| Create Alert: Symbol [____]  Condition [> v]  Price [____]  [Create]         |
|-------------------------------------------------------------------------------|
| Active Alerts                                                                 |
| ID | Symbol | Rule        | Status  | Last Trigger | Actions                 |
|-------------------------------------------------------------------------------|
| 1  | AAPL   | Price > 200 | Active  | --           | [Mute] [Edit] [Delete]  |
|-------------------------------------------------------------------------------|
| Alerts Log                                                                    |
| Time     | Symbol | Message                                                   |
|-------------------------------------------------------------------------------|
| 09:32:10 | AAPL   | Price crossed 200                                         |
+-------------------------------------------------------------------------------+

-------------------------------------------------------------------
10) Trader Search (PI) and Profile (PIP)
-------------------------------------------------------------------

PI Search:
+----------------------------- PI: People Search -----------------------------+
| Period [1Y v]  Risk [1..6]  Gain [min..max]  Copiers [min..max]  [Search]   |
|-------------------------------------------------------------------------------|
| Username | Gain | Risk | Copiers | WinRatio | LastActive | Open Profile [>]  |
+-------------------------------------------------------------------------------+

Profile:
+---------------------------------- PIP: username ----------------------------+
| Summary metrics + performance chart + live portfolio (if supported)          |
| Tabs: [Overview] [Performance] [Portfolio] [Compare]                         |
+-------------------------------------------------------------------------------+

-------------------------------------------------------------------
11) Settings (SET)
-------------------------------------------------------------------

+----------------------------------- SETTINGS -----------------------------------+
| Keys:                                                                            |
|   API Key:  [***************]   User Key: [***************]  [Validate]         |
| Mode:  (o) Demo   ( ) Real                                                  |
| WS: [Connect] [Authenticate Private]                                           |
| Security: [ ] Remember keys (encrypt)    [Panic Lock]                          |
| Diagnostics: [Open Drawer] [Export Bundle]                                     |
+--------------------------------------------------------------------------------+

---

# 6) Tasks
## `etoro-terminal-speckit/.specify/specs/001-etoro-terminal-us/tasks.md`

Task List: eToro Terminal (US) - Bloomberg-like Pro Trader UX  
Feature Branch: 001-etoro-terminal-us  
Created: 2026-01-19  
Status: Draft

Organization:
- Tasks are grouped by user story and phased to allow parallel work.
- Task IDs are stable and should be referenced in PRs and commits.

Legend:
- [P] = can be executed in parallel with other tasks in the same phase
- FE = Frontend, BE = Backend/BFF, QA = Testing/Quality

-------------------------------------------------------------------
PHASE 0 - API Surface Audit + Project Skeleton
-------------------------------------------------------------------

T001 (P) - Repo scaffold + lint + formatting (FE)
- Output: a runnable web app skeleton + CI for lint/typecheck
- Acceptance: `pnpm test`/`pnpm lint` (or equivalent) succeeds

T002 (P) - Define domain model types (FE)
- Output: Instrument, Quote, Watchlist, Order, Position, AlertRule, Workspace types
- Acceptance: types compile; models used by at least one demo component

T003 - API Surface Audit: collect endpoint inventory (FE/BE)
- Output: `docs/api-inventory.md` listing all REST + WS endpoints and required headers/auth
- Acceptance: inventory includes all domains: Market Data, Watchlists, Trading, Users Info, Feeds, PI Data, WebSocket

T004 - Contract schemas for known WS messages (FE)
- Output: Zod schemas for instrument topic and private topic messages
- Acceptance: sample messages validate; invalid payloads fail with clear errors

T005 - Contract schemas for known REST responses (FE)
- Output: Zod schemas for: symbol search result, watchlists list, watchlist items, portfolio live, people search
- Acceptance: mocked fixtures validate; schema errors are actionable

-------------------------------------------------------------------
PHASE 1 - Story 1/2/3: Keys, Mode, Command Bar, Workspace Shell
-------------------------------------------------------------------

T006 - Settings panel: keys input + validate (FE)
- Dependencies: T001
- Acceptance: can enter keys; validate triggers a test REST call; shows status + last request-id

T007 - Secure key storage: in-memory default + optional encrypted persistence (FE)
- Dependencies: T006
- Acceptance: default does not persist keys; "remember" prompts passphrase; reload restores only if enabled

T008 - Panic lock control (FE)
- Dependencies: T006, T007
- Acceptance: one action clears keys, disables private/trading, and visually confirms lock state

T009 - REST client wrapper with required headers + request-id (FE)
- Dependencies: T001
- Acceptance: every call includes request-id; request log records path/status/latency without secrets

T010 - Command Bar parser + typeahead UI (FE)
- Dependencies: T001, T002
- Acceptance: supports SYMBOL, SYMBOL+FUNC, FUNC only; arrow navigation; Enter selects; Esc closes

T011 - Symbol resolver integration (FE)
- Dependencies: T009, T010
- Acceptance: typing AAPL resolves to an instrumentId and sets active instrument context

T012 - Workspace grid + panel runtime (FE)
- Dependencies: T001, T002
- Acceptance: can add/remove panels; resize/move; restore layout after reload (workspace persistence)

T013 (P) - Panel linking: Follow Active / Group A/B/C / Pinned (FE)
- Dependencies: T012
- Acceptance: linked panels change with active symbol; pinned panels do not

-------------------------------------------------------------------
PHASE 2 - Story 4/5: WebSocket Streaming + Quotes + Watchlists
-------------------------------------------------------------------

T014 - WebSocket client: connect/reconnect + lifecycle log (FE)
- Dependencies: T001
- Acceptance: shows Connected/Reconnecting/Disconnected; logs events

T015 - WS subscription manager: batch subscribe/unsubscribe + snapshot option (FE)
- Dependencies: T014
- Acceptance: can subscribe to N instruments; can remove; avoids duplicate subs; recovers after reconnect

T016 - Quotes store: latest quote per instrument + staleness calculation (FE)
- Dependencies: T014
- Acceptance: quote tile displays bid/ask/last; stale indicator triggers after threshold

T017 - Quote panel (QT) implementation (FE)
- Dependencies: T012, T015, T016
- Acceptance: QT follows active symbol or pinned; updates in real time

T018 - Watchlists list panel + open watchlist (FE)
- Dependencies: T009, T012
- Acceptance: WL loads list; user selects one and opens table

T019 - Watchlist monitor table with virtualization + streaming columns (FE)
- Dependencies: T015, T016, T018
- Acceptance: 200-row table scrolls smoothly; visible rows show streaming values

T020 - Watchlist CRUD (create/delete/set default) (FE)
- Dependencies: T009, T018
- Acceptance: create list; delete list; set default reflected in UI

T021 - Watchlist items management (add/remove) (FE)
- Dependencies: T009, T018, T019
- Acceptance: add symbol(s) via command bar or dialog; table updates and WS subs update

T022 (P) - Curated lists browser panel (FE)
- Dependencies: T009, T012
- Acceptance: curated lists load; open curated list in monitor view

T023 (P) - Recommendations panel (FE)
- Dependencies: T009, T012, T015
- Acceptance: loads N items; shows streaming values; supports add-to-watchlist

-------------------------------------------------------------------
PHASE 3 - Story 7/8: Trading Ticket + Private Feed + Blotter
-------------------------------------------------------------------

T024 - Trading mode gating (Demo vs Real) (FE)
- Dependencies: T006
- Acceptance: Demo/Real toggle changes labels, warnings, and confirmation requirements

T025 - Trade ticket UI (TRD) with amount/units/leverage + optional SL/TP (FE)
- Dependencies: T012, T011
- Acceptance: ticket is keyboard-friendly; validates inputs; submit disabled without permissions

T026 - Trading REST adapter: market-open by amount, by units (FE)
- Dependencies: T009, T025
- Acceptance: demo submit works against mock; real submit requires confirmation flow

T027 - Portfolio position close adapter: market-close by positionId (FE)
- Dependencies: T009
- Acceptance: accepts full close and partial close; returns structured result

T028 - WS private auth handshake (FE)
- Dependencies: T014, T006
- Acceptance: authenticate succeeds/fails with clear UI; no secrets logged

T029 - Private topic subscription and event routing (FE)
- Dependencies: T015, T028
- Acceptance: private events update blotter store; events show in diagnostics log

T030 - Blotter panel (ORD): table + details drawer (FE)
- Dependencies: T012, T029
- Acceptance: shows lifecycle; clicking row opens raw payload; filter by status/instrument

T031 - Local "pending order" optimistic record creation (FE)
- Dependencies: T026, T030
- Acceptance: submit order -> immediate blotter row pending until WS update reconciles

-------------------------------------------------------------------
PHASE 4 - Story 9: Portfolio + Close Flows
-------------------------------------------------------------------

T032 - Portfolio panel (PF): positions table + details drawer (FE)
- Dependencies: T009, T012
- Acceptance: loads portfolio; shows positionId, instrumentId, side, leverage, open price, SL/TP, PnL

T033 - Close full flow from portfolio (FE)
- Dependencies: T032, T027, T024
- Acceptance: close full requires confirm; creates blotter row; shows resulting status

T034 - Close partial flow from portfolio (FE)
- Dependencies: T032, T027, T024
- Acceptance: partial close accepts units; validates; reconciles via blotter

T035 - Portfolio reconcile strategy (FE)
- Dependencies: T032
- Acceptance: manual refresh reconciles; optional timed refresh configurable

-------------------------------------------------------------------
PHASE 5 - Story 10/11: Chart + Alerts
-------------------------------------------------------------------

T036 - Chart panel (CH): tick line + 1m bar aggregation (FE)
- Dependencies: T012, T016, T015
- Acceptance: chart updates from streaming; timeframe switch supported (1m/5m/15m)

T037 - Session cache for chart history (FE)
- Dependencies: T036
- Acceptance: chart persists last N minutes in memory; reload shows empty unless explicitly persisted

T038 - Alerts engine (local evaluator) (FE)
- Dependencies: T016
- Acceptance: supports threshold alerts; staleness alerts; de-dup strategy

T039 - Alerts panel (AL): create/edit/delete + alerts log (FE)
- Dependencies: T012, T038
- Acceptance: users can manage alert rules; notifications fire; log retains history

-------------------------------------------------------------------
PHASE 6 - Story 12: Trader Discovery + Profile + Compare
-------------------------------------------------------------------

T040 - Trader search panel (PI): filters + results table (FE)
- Dependencies: T009, T012
- Acceptance: search runs; pagination and sorting work; rows open profile

T041 - Trader profile panel (PIP): performance + portfolio (FE)
- Dependencies: T009, T012
- Acceptance: loads key metrics; shows charts; shows portfolio transparency

T042 - Compare tray: pin up to 5 traders and compare (FE)
- Dependencies: T040, T041
- Acceptance: compare view aligns time windows; shows side-by-side metrics

-------------------------------------------------------------------
PHASE 7 - Story 13: Feeds (Feature Flagged)
-------------------------------------------------------------------

T043 - Feeds panel shell + feature flag (FE)
- Dependencies: T012
- Acceptance: panel exists but gated behind flag; shows "Not enabled" state

T044 - API contract lock for Feeds (FE/BE)
- Dependencies: T003
- Acceptance: exact feed endpoints documented + schema validation added

T045 - Implement feed list + pagination + filters (FE)
- Dependencies: T044
- Acceptance: instrument/user feed loads; scroll pagination; error handling

T046 - Implement post composer (FE)
- Dependencies: T044
- Acceptance: user can publish a post; it appears and errors are shown clearly

-------------------------------------------------------------------
PHASE 8 - Polish, Hardening, Export Bundle, Optional Desktop Wrapper
-------------------------------------------------------------------

T047 - Diagnostics drawer (FE)
- Dependencies: T009, T014
- Acceptance: shows REST log, WS log, subscription counts, last errors

T048 - Export support bundle (sanitized) (FE)
- Dependencies: T047
- Acceptance: exports JSON/zip-like payload without secrets; includes logs + settings + version info

T049 - Accessibility + keyboard audit (FE/QA)
- Dependencies: T010, T012
- Acceptance: primary flows are keyboard-accessible; focus management is consistent

T050 - Performance smoke tests (QA)
- Dependencies: T019, T036
- Acceptance: open 200 symbols; scroll stable; WS reconnect doesn’t freeze UI

T051 - Optional Electron packaging (FE)
- Dependencies: T012 (optional)
- Acceptance: desktop build runs; keys still not plaintext; performance acceptable

-------------------------------------------------------------------
Optional Test Tasks (include if desired)
-------------------------------------------------------------------

T900 - Unit tests for command parser and symbol resolution ranking (QA/FE)  
T901 - Unit tests for subscription manager batching and de-duplication (QA/FE)  
T902 - E2E: demo trade -> blotter -> close position (QA)

---

# 7) Requirements Checklist
## `etoro-terminal-speckit/.specify/specs/001-etoro-terminal-us/checklists/requirements.md`

# Requirements Checklist - 001-etoro-terminal-us

Use this checklist as "unit tests for the spec" before implementing.

## P1 Readiness Checklist

### Setup + Security
- [ ] FR-033 satisfied: keys are not stored in plaintext by default
- [ ] FR-034 satisfied: panic lock clears keys and disables trading/private feeds immediately
- [ ] User Story 1 acceptance scenarios are fully implementable without unresolved questions

### Terminal Interaction Model
- [ ] FR-001 command bar supports SYMBOL, SYMBOL+FUNC, FUNC
- [ ] FR-002 active instrument context implemented
- [ ] FR-003 workspace supports panel add/remove/resize/persist
- [ ] User Story 2 acceptance scenarios covered
- [ ] User Story 3 acceptance scenarios covered

### Streaming (Quotes + Connection Health)
- [ ] FR-004 WS quote subscription supported
- [ ] FR-006 subscribe/unsubscribe based on panels/watchlist visibility
- [ ] FR-007 connection health + staleness surfaced
- [ ] User Story 4 acceptance scenarios covered

### Watchlists
- [ ] FR-010 list watchlists and open as streaming table
- [ ] FR-011 CRUD (create/delete/default; rename if supported)
- [ ] FR-012 add/remove items
- [ ] FR-013 virtualization for 200+ rows
- [ ] User Story 5 acceptance scenarios covered

### Trading + Blotter + Portfolio
- [ ] FR-016/FR-017 market open by amount/units supported
- [ ] FR-018 close by positionId (full + partial)
- [ ] FR-019 Real mode requires explicit confirmation gate
- [ ] FR-020 audit trail includes request-id and timestamps
- [ ] FR-021 blotter exists and shows lifecycle
- [ ] FR-022 blotter updates from private events (when available)
- [ ] FR-024 portfolio lists positions and supports closes
- [ ] User Story 7, 8, 9 acceptance scenarios covered

## P2 Readiness Checklist

### Charts + Alerts
- [ ] FR-026 chart panel exists and updates from streaming
- [ ] FR-027 price threshold alerts supported
- [ ] FR-028 staleness alerts supported
- [ ] User Story 10 and 11 acceptance scenarios covered

### Trader Discovery
- [ ] FR-029 trader search supports filters and sorting
- [ ] FR-030 profile supports performance and portfolio transparency when supported
- [ ] User Story 12 acceptance scenarios covered

### Observability
- [ ] FR-035 REST request log exists with request-id and latency
- [ ] FR-036 WS lifecycle log exists with subscriptions count
- [ ] FR-037 support bundle export is sanitized by default

## P3 Readiness Checklist

### Feeds (if enabled)
- [ ] FR-038 feature flags exist for Feeds
- [ ] User Story 13 is implemented only after contract is locked

## API Contract Checklist (Must be done before coding against endpoints)

- [ ] API Surface Audit complete (plan: Phase 0)
- [ ] Endpoint inventory includes Market Data, Watchlists, Trading, Users Info, Feeds, PI Data, WS
- [ ] Response schemas validated with fixtures or live demo calls
- [ ] Error handling behavior documented for:
  - auth failures
  - rate limiting
  - WS disconnects
  - trading errors
```


```md
# eToro Terminal (US) — SpecKit Master Document (Merged)

Created: 2026-01-19  
Spec Branch/ID: `001-etoro-terminal-us`  
Audience: US pro / active traders  
Purpose: Single-file merged spec containing README + Constitution + Spec + Plan + Tasks + Wireframes + Requirements Checklist.

---

## Table of Contents

1. README  
2. Constitution  
3. Feature Spec (User Stories, Acceptance, FRs, Entities, Success Criteria)  
4. Implementation Plan (Architecture, Flows, Testing, Rollout)  
5. Task Backlog (Dependency-ordered)  
6. UX Wireframes (ASCII + keyboard model)  
7. Requirements Checklist

---

# 1) README (Merged)

## eToro Terminal (US) - SpecKit Pack

This document contains a SpecKit-style, spec-driven blueprint for building a Bloomberg-like terminal UX
targeted at US pro/active traders, using eToro Public APIs (REST + WebSocket) as the data/execution layer.

### What you get

- **Constitution**
  Project-level governance rules that all planning/implementation must follow.

- **Spec**
  The "WHAT + WHY": user stories, acceptance criteria, edge cases, functional requirements, entities, success criteria.

- **Plan**
  The "HOW": architecture, data flows, UX system, security model, performance budgets, testing strategy, rollout plan.

- **Tasks**
  The executable backlog: dependency-ordered tasks grouped by user story and by delivery phases.

- **Wireframes**
  ASCII wireframes + UX behaviors (keyboard model, panel linking, layouts, empty/error states).

- **Requirements Checklist**
  A requirements checklist to validate completeness before implementing.

### How to use (recommended workflow)

1) Read **Spec**
   - Confirm scope, user stories, acceptance scenarios, and functional requirements.

2) Read **Wireframes**
   - Align on the terminal interaction model: command bar, function codes, panels, hotkeys.

3) Read **Plan**
   - Use it as your build blueprint (architecture + flows + performance/security/testing decisions).

4) Execute **Tasks**
   - Build in the order provided (it’s dependency-aware and grouped for parallel execution).

### Terminal concept

Core Bloomberg-like patterns implemented:
- Command bar: type `AAPL <Enter>` or `AAPL QT`, `AAPL TRD`, `WL`, `ORD`, etc.
- Multi-panel workspace: dockable panels + link groups (A/B/C) for symbol synchronization.
- Streaming-first: quotes and order events are push-based (WebSocket), not polling.
- Pro-trader UX: keyboard-first, high-density tables, blotter, fast ticket, audit trail.

### Notation

- **Active Instrument Context**: current symbol/instrument that panels can follow.
- **Function Codes**: short codes that open a panel (QT, WL, TRD, ORD, PF, PI, etc.)
- **API-SPEC PENDING**: a required step to ingest the latest eToro OpenAPI/portal reference and lock exact endpoint paths.

### Safety & compliance (product-level)

- The terminal must support Demo vs Real mode gating.
- Real trading requires explicit confirmation and shows an audit trail (request-id + timestamps).
- No financial advice, no performance promises; purely tooling UX.

---

# 2) Constitution (Merged)

## eToro Terminal (US) Constitution

### Core Principles

#### 1) Trader-First Speed and Clarity
- Optimize for pro/active traders: dense information, fast navigation, minimal friction.
- Prefer keyboard-first workflows over mouse-first.
- UI must remain responsive under heavy streaming loads (tables virtualized, 60fps target).

#### 2) Safety-First Trading Actions
- Any trading action must be explicit, reviewable, and reversible when supported.
- "Real" mode requires clear confirmation and stronger affordances than "Demo".
- Always show an audit trail: timestamp, request-id, order identifiers, status transitions.

#### 3) Streaming-First Data Model
- Prefer WebSocket streaming for live quotes and order updates.
- Polling is a fallback only (used for hydration, reconciliation, or non-streaming domains).
- The system must surface data staleness and connection health.

#### 4) Security and Key Hygiene by Default
- API credentials must not be stored in plaintext by default.
- Support in-memory mode + optional encrypted persistence (user-provided passphrase).
- Provide "panic lock" to clear credentials quickly.

#### 5) Observable and Debuggable
- Every REST request must be traceable via request-id.
- WebSocket lifecycle events must be logged (connect/disconnect/auth/subscription counts).
- Users must be able to export a support bundle (sanitized) for troubleshooting.

### Product Tenets (Non-Negotiables)
- Keyboard navigation is not optional: all primary workflows must be achievable without a mouse.
- Errors must be actionable: show human-readable message + raw details behind a disclosure.
- Empty states must be helpful: show what to do next and the exact dependency (keys, connection, symbol, etc.).
- No hidden work: any background sync must be visible (status indicators) and cancelable if impactful.

### Governance Rules
- Any new feature must include:
  - A user story + acceptance scenarios
  - Functional requirements (testable MUST statements)
  - At least one defined independent test path
- Performance budgets:
  - Quote-to-render for subscribed symbols: target < 250ms perceived, with clear "stale" indicators otherwise.
  - Watchlist tables must support 200 visible rows using virtualization.
- Security reviews are mandatory before enabling Real trading in production.
- If an API is ambiguous, the spec must mark it as "API-SPEC PENDING" and create tasks to confirm exact contracts.

Version: 1.1.0 | Ratified: 2026-01-19 | Last Amended: 2026-01-19

---

# 3) Feature Spec (Merged)

Feature Specification: eToro Terminal (US) - Bloomberg-like Pro Trader UX  
Feature Branch: 001-etoro-terminal-us  
Created: 2026-01-19  
Status: Draft

Input:
User description:
"Build a Bloomberg-terminal-like US UX for pro active traders using eToro public APIs. Provide a complete SpecKit spec with UX definition, wireframes, user stories, and a build plan/tasks."

---

## User Scenarios & Testing (mandatory)

### User Story 1 - Configure Keys, Choose Mode, Validate Connectivity (Priority: P1)

As a pro trader,  
I want to add my API credentials, select Demo vs Real mode, and validate access,  
so that I can trust the terminal is connected and I understand what actions are enabled.

Why this priority:  
Without reliable connectivity and clear permissions, nothing else in the terminal is safe or usable.

Independent Test:
- Enter invalid keys -> expect explicit auth error.
- Enter valid keys -> open Watchlists and see successful response.
- Toggle Demo/Real -> UI reflects gating and warnings.

Acceptance Scenarios:
- Given I have no keys configured, when I open the terminal, then I am prompted to enter keys and cannot place trades.
- Given I enter keys and click "Validate", when the validation call completes, then I see "Connected" with last request-id and timestamps.
- Given I select Real mode, when I attempt to enable trading, then I must confirm via a second step (e.g., "Type ENABLE").
- Given the network is offline, when I validate, then I see an offline error and guidance.

---

### User Story 2 - Command Bar: Resolve Symbols and Open Functions (Priority: P1)

As a pro trader,  
I want a command bar that resolves tickers and launches function panels,  
so that I can navigate like a terminal (fast, keyboard-first).

Why this priority:  
A command bar is the defining "terminal" interaction model for pro workflows.

Independent Test:
- Type `AAPL` -> resolves and sets active instrument context.
- Type `AAPL QT` -> opens Quote panel for AAPL.
- Type `WL` -> opens Watchlists.

Acceptance Scenarios:
- Given I type a valid ticker and press Enter, when results exist, then the active instrument is set to the best match.
- Given I type an ambiguous symbol, when multiple matches exist, then I see a ranked list and can select with arrows + Enter.
- Given I type an invalid symbol, when no results exist, then I see a "No matches" state with suggestions.
- Given I type a function code without a symbol (e.g., `WL`), when that function does not need a symbol, then it opens immediately.
- Given I type `AAPL TRD`, when trading is disabled, then I open the ticket but the submit action is disabled with explanation.

---

### User Story 3 - Terminal Workspace: Multi-Panel Layout and Panel Linking (Priority: P1)

As a pro trader,  
I want a multi-panel workspace with linked panels,  
so that I can monitor markets and execute without context switching.

Why this priority:  
Pro traders use multi-monitor/multi-window layouts and need synchronized context.

Independent Test:
- Open 4 panels (QT, CH, WL, TRD).
- Link QT + CH to group A and change symbol: both update.
- Pin TRD to a different symbol: it stays fixed.

Acceptance Scenarios:
- Given I open a new panel, when it is linked to "Follow Active Symbol", then it updates when the active instrument changes.
- Given I set a panel to "Pinned", when the active instrument changes, then the pinned panel does not change.
- Given I set two panels to the same link group, when I change the group symbol, then both panels update.
- Given I close and reopen the app, when workspace persistence is enabled, then my layout restores.

---

### User Story 4 - Streaming Quotes: Quote Tile and Status (Priority: P1)

As a pro trader,  
I want streaming bid/ask/last with timestamps and staleness indicators,  
so that I can react instantly and trust what I see.

Why this priority:  
Live quote streaming is core terminal behavior.

Independent Test:
- Subscribe to one instrument topic and see updates.
- Disconnect network -> see "Disconnected" + stale state.

Acceptance Scenarios:
- Given the quote feed is connected, when the price updates, then the quote tile updates without manual refresh.
- Given the quote feed is disconnected, when no updates arrive for N seconds, then the quote is marked stale and the connection banner indicates reconnection attempts.
- Given I switch symbols, when the panel is linked, then it unsubscribes old topic and subscribes new topic.

---

### User Story 5 - Watchlists: CRUD + Streaming Monitor Table (Priority: P1)

As a pro trader,  
I want watchlists that load instantly and stream live columns,  
so that I can scan 30-200 symbols quickly.

Why this priority:  
Watchlists are the primary scanning surface for active trading.

Independent Test:
- Create watchlist, add instrument IDs, set default, delete.
- Open watchlist table and see streaming quotes populate.

Acceptance Scenarios:
- Given I have watchlists, when I open WL, then I see a list and can open one into a streaming table.
- Given I create a watchlist and add symbols, when I reopen it, then it contains those symbols.
- Given a watchlist has 200 symbols, when I open it, then the UI remains responsive and only visible rows render (virtualization).
- Given I add/remove symbols, when the list changes, then WS subscriptions update accordingly.

---

### User Story 6 - Curated Lists + Recommendations (Priority: P2)

As a pro trader,  
I want curated lists and recommendation feeds,  
so that I can find trade ideas fast and move them to my watchlists.

Why this priority:  
Pro traders need idea generation beyond their own static watchlists.

Independent Test:
- Open Curated lists view -> open into a watchlist-like table.
- Open Recommendations -> add a symbol to my watchlist.

Acceptance Scenarios:
- Given curated lists exist, when I open one, then I see its instruments as a streaming table.
- Given recommendations return N instruments, when I open them, then I can add selected symbols to a watchlist.

---

### User Story 7 - Trading Ticket: Market Open (Amount/Units) with Safety Gating (Priority: P1)

As a pro trader,  
I want a fast market order ticket (buy/sell, amount/units, leverage, optional SL/TP),  
so that I can execute quickly while avoiding mistakes.

Why this priority:  
Execution is the highest value function; must be fast and safe.

Independent Test:
- Place a demo market order by amount.
- Place by units.
- Validate disabled state when keys are read-only.

Acceptance Scenarios:
- Given trading is enabled and I have an active symbol, when I submit a market order, then I see an immediate local "pending" and later a confirmed status update.
- Given trading is disabled, when I open the ticket, then the submit button is disabled with reason.
- Given I am in Real mode, when I press Submit, then I must confirm (2-step) before the request is sent.
- Given the API returns an error, when the order fails, then I see the error summary and the raw payload behind disclosure.

---

### User Story 8 - Orders Blotter: Real-Time Lifecycle (Priority: P1)

As a pro trader,  
I want a blotter that shows order lifecycle updates in real time,  
so that I can manage execution risk and diagnose rejections.

Why this priority:  
A blotter is essential pro tooling; it is the "truth table" for execution.

Independent Test:
- Submit an order -> see blotter row appear.
- Receive WS private updates -> blotter row updates status.

Acceptance Scenarios:
- Given the private feed is authenticated, when an order event occurs, then the blotter updates within seconds without manual refresh.
- Given the private feed is not authenticated, when I open blotter, then it shows instructions to authenticate and a non-live fallback state.
- Given an order is rejected, when the rejection arrives, then the blotter row shows reason and the error code in details.

---

### User Story 9 - Portfolio: Positions + Close Full/Partial (Priority: P1)

As a pro trader,  
I want a live portfolio view with position controls,  
so that I can manage risk and close positions rapidly.

Why this priority:  
Execution without portfolio management is incomplete; closing positions must be fast.

Independent Test:
- Load portfolio and close a position fully.
- Partial close by units.

Acceptance Scenarios:
- Given I have positions, when I open PF, then I see a positions table with key fields and actions.
- Given I click "Close Full", when I confirm, then a close order is sent and the blotter shows updates.
- Given I click "Close Partial", when I enter units and confirm, then a partial close is sent.

---

### User Story 10 - Chart Panel: Intraday Visualization from Streaming (Priority: P2)

As a pro trader,  
I want a lightweight chart that updates from streaming prices,  
so that I can interpret price action without leaving the terminal.

Why this priority:  
Charts are essential but can be minimal in v1; focus is scanning and execution.

Independent Test:
- Open CH panel and verify it builds bars from WS ticks (1m default).
- Change timeframe -> chart re-aggregates.

Acceptance Scenarios:
- Given a streaming quote feed, when ticks arrive, then the chart updates (tick/line) and bars aggregate (1m).
- Given I switch symbols, when linked, then the chart resets to the new symbol and loads from cached session history if available.
- Given no data yet, when chart loads, then it shows a helpful empty state and waits for streaming.

---

### User Story 11 - Alerts: Price Threshold and Staleness Alerts (Priority: P2)

As a pro trader,  
I want local alerts (price crossing, stale feed, volatility spike),  
so that I can monitor many instruments without staring at every row.

Why this priority:  
Alerts amplify trader attention; must be reliable and easy to configure.

Independent Test:
- Set alert "AAPL > X" and simulate price crossing.
- Disconnect WS -> stale alert triggers.

Acceptance Scenarios:
- Given I create an alert, when the condition is met, then I receive an in-terminal notification and it appears in Alerts log.
- Given alerts are paused, when conditions happen, then no notification is emitted and UI indicates paused.
- Given WS disconnects, when staleness threshold is exceeded, then a staleness alert triggers once per instrument per interval.

---

### User Story 12 - Trader Discovery: Search, Profile, Compare (Priority: P2)

As a power user,  
I want to search traders (people) by performance/risk and open profiles,  
so that I can analyze and track top performers.

Why this priority:  
eToro’s differentiator vs classic terminals is social/copy ecosystem analytics.

Independent Test:
- Run search with filters -> open profile -> view charts -> view portfolio.

Acceptance Scenarios:
- Given I open PI Search, when I set filters and press Search, then results paginate and sort correctly.
- Given I open a profile, when data loads, then I can view performance series and live portfolio transparency.
- Given I add traders to compare, when I open Compare, then charts and key metrics align on the same time window.

---

### User Story 13 - Feeds: Instrument Feed + Posting (Priority: P3)

As a trader,  
I want to view instrument-specific feed posts and optionally publish posts,  
so that I can follow market conversation inside the terminal.

Why this priority:  
Useful but not required for initial pro trading MVP; depends on full Feeds endpoint availability.

Independent Test:
- Load instrument feed -> verify pagination.
- Post a message -> appears in my feed.

Acceptance Scenarios:
- Given feed endpoints are enabled, when I open N (News/Feed), then I see a scrollable feed with filters.
- Given I publish a post, when it succeeds, then it appears in my feed and shows a timestamp.

---

## Edge Cases

- Symbol resolution returns multiple matches (same ticker across venues/CFDs/crypto pairs): require user selection and remember preference.
- Streaming disconnects/reconnects: prevent UI thrash; show stale indicators and reconnect banner.
- Too many streaming subscriptions: throttle, batch subscribe, and warn user; degrade gracefully.
- REST rate limiting: exponential backoff; show "rate limited" status; continue streaming where possible.
- Partial data availability: load what exists; show "API-SPEC PENDING" capabilities behind feature flags.
- Trading in Real mode: enforce confirmation gate and show irreversible action warning.
- Out-of-order WS events: apply ordering by timestamp/order status progression; keep raw log.
- Inconsistent instrument IDs across environments: always treat instrumentId as canonical, cached, and immutable.
- Portfolio/positions change outside the terminal: provide manual "Refresh" and periodic reconcile.
- User keys revoked mid-session: immediately disable trading and show re-auth CTA.

---

## Requirements (mandatory)

### Functional Requirements

FR-001: System MUST provide a command bar that supports symbol resolution and function execution via keyboard-only navigation.  
FR-002: System MUST maintain an "Active Instrument Context" that panels can follow or pin away from.  
FR-003: System MUST support multi-panel layouts with panel add/remove, resize, and persistence.

FR-004: System MUST connect to eToro WebSocket for live instrument quote topics.  
FR-005: System MUST support WebSocket authentication for private topics when available/required.  
FR-006: System MUST allow subscribe/unsubscribe to instrument topics based on visible watchlist rows and open panels.  
FR-007: System MUST display connection health (Connected/Reconnecting/Disconnected) and data staleness per panel.

FR-008: System MUST resolve ticker -> instrumentId using eToro Market Data search capability.  
FR-009: System MUST cache symbol->instrumentId mappings locally and reuse them to reduce latency.

FR-010: System MUST list user watchlists and open a watchlist into a streaming monitor table.  
FR-011: System MUST allow creating, renaming (if supported), deleting, and setting default watchlists.  
FR-012: System MUST allow adding/removing instruments to/from watchlists.  
FR-013: System MUST virtualize large tables (>=200 rows) to preserve responsiveness.

FR-014: System MUST support curated lists browsing and opening curated lists as streaming tables.  
FR-015: System MUST support market recommendations feed and actions to add items to watchlists.

FR-016: System MUST provide a market order ticket supporting buy/sell and open by amount.  
FR-017: System MUST provide a market order ticket supporting open by units.  
FR-018: System MUST support close-position market orders by positionId, including full and partial close.  
FR-019: System MUST gate Real trading with explicit confirmation distinct from Demo.  
FR-020: System MUST show an execution audit trail including request-id, timestamps, and order identifiers.

FR-021: System MUST provide a blotter that shows order events and status transitions.  
FR-022: System MUST update blotter using streaming private events when available.  
FR-023: System MUST allow users to inspect raw order event payloads from the blotter.

FR-024: System MUST provide a portfolio view listing positions and enabling close actions.  
FR-025: System MUST support manual refresh and reconciliation of portfolio state.

FR-026: System MUST provide a chart panel that updates from streaming prices and supports at least one intraday timeframe.  
FR-027: System MUST provide local alert rules for price threshold crossings based on streaming quotes.  
FR-028: System MUST provide alerts for staleness/disconnect events.

FR-029: System MUST provide trader discovery search with filters and sorting.  
FR-030: System MUST provide trader profiles with performance series and live portfolio transparency when supported.

FR-031: System MUST support an in-terminal notification system (toast + notification log).  
FR-032: System MUST provide a settings panel for keys, mode, and streaming configuration.

FR-033: System MUST NOT store API keys in plaintext by default.  
FR-034: System MUST support a "panic lock" action that clears keys and disables private data/trading instantly.

FR-035: System MUST log REST requests with request-id and latency.  
FR-036: System MUST log WS lifecycle events and subscription counts.  
FR-037: System MUST provide a sanitized export bundle for support/debug.

FR-038: System MUST provide feature flags for APIs not fully specified (Feeds, PI Data, advanced market data/history).  
FR-039: System MUST include an "API Surface Audit" process that locks endpoint paths/contracts before implementation.  
FR-040: System MUST have clear empty states for every panel (no symbol, no connection, no permissions, no data).

---

## Key Entities (include if feature involves data)

- Instrument: canonical tradable item identified by instrumentId; includes symbol/label metadata.
- Quote: streaming bid/ask/last + timestamp and staleness metadata.
- Watchlist: named collection of instrumentIds (user-managed) plus curated lists (read-only).
- Workspace: saved layout containing panels, sizes, link groups, pinned contexts.
- Panel: a single functional view (QT, CH, WL, TRD, ORD, PF, PI, N, AL).
- Order: a trading instruction (market open/close) with lifecycle status updates.
- OrderEvent: streaming status update payload tied to an order.
- Position: an open holding with positionId; supports close full/partial.
- AlertRule: local condition rules (price threshold, staleness) tied to instruments or watchlists.
- TraderProfile: user entity with performance/risk stats and portfolio transparency.
- FeedPost: social content tied to instrument/user (if enabled).
- AuditLogEntry: local record of actions + request-ids + timestamps.

---

## Success Criteria (mandatory)

### Measurable Outcomes

SC-001: User can go from app open -> connected -> first streaming quote visible in <= 10 seconds on typical broadband.  
SC-002: Command bar symbol resolution returns a selectable result list in <= 500ms (excluding network delays).  
SC-003: Watchlist table supports 200 symbols with smooth scrolling (no major UI jank).  
SC-004: Streaming quote updates render with perceived latency <= 250ms under normal conditions.  
SC-005: Trading ticket supports a market open flow in <= 2 user actions after initial setup (symbol already active).  
SC-006: Real trading requires explicit confirmation and displays an audit trail for every order.  
SC-007: Blotter reflects order status transitions without manual refresh when private stream is available.  
SC-008: Portfolio loads and renders positions in <= 2 seconds for typical accounts.  
SC-009: Users can operate primary flows (search, watchlist, ticket, blotter, portfolio) without mouse.  
SC-010: Key leakage risk is minimized: no plaintext persistence by default; panic lock clears keys immediately.  
SC-011: Support bundle export works and excludes secrets by default.  
SC-012: 90%+ of internal testers can complete “Add symbol -> watchlist -> trade demo -> see blotter -> close position” without external guidance.

---

# 4) Implementation Plan (Merged)

Implementation Plan: eToro Terminal (US) - Bloomberg-like Pro Trader UX  
Feature Branch: 001-etoro-terminal-us  
Created: 2026-01-19  
Status: Draft

NOTE:  
This plan intentionally separates:
- "Contract locking" (API Surface Audit) from
- "Implementation"
to prevent building against assumptions when endpoint details differ.

---

## Summary

Build a terminal-style, keyboard-first, multi-panel workspace optimized for pro/active traders.

Core capabilities (v1):
- Command bar: symbol resolution + function codes
- Multi-panel workspace with panel linking groups
- Streaming quotes via WebSocket
- Watchlists (CRUD) + streaming monitor tables
- Trading ticket for market open/close + safety gating (Demo vs Real)
- Blotter fed by private order events (when available)
- Portfolio positions + close actions
- Chart from streaming ticks (v1)
- Alerts (local rules)
- Trader discovery + profile analytics
- Feeds (feature-flagged until endpoint contracts are locked)

---

## Technical Context

Language/Version:
- TypeScript (recommended) for predictable domain models and typed API clients.

Primary Dependencies (recommended defaults):
- UI: React + a lightweight router (Next.js or Vite+React)
- Table virtualization: TanStack Table + react-virtual (or equivalent)
- Docking layout: react-grid-layout (or equivalent)
- Charts: lightweight-charts (or equivalent)
- State: Zustand or Redux Toolkit (prefer minimal boilerplate)
- Validation: Zod (schema validation for API payloads)

Storage:
- Local (browser/Electron): IndexedDB for workspace persistence and symbol cache.
- Optional: encrypted storage for keys if user opts in.

Testing:
- Unit: Vitest/Jest
- Component: React Testing Library
- E2E: Playwright
- Performance smoke: simple script that opens 200-symbol watchlist and checks FPS/jank thresholds

Target Platform:
- Web (desktop-first)
- Optional: Electron wrapper for desktop distribution (Phase 6)

Project Type:
- Web app (desktop-first)

Performance Goals:
- 60fps UI responsiveness under 200-stream subscription typical workloads
- Virtualized tables for 200+ rows
- Streaming quote render latency target <= 250ms perceived

Constraints:
- No plaintext key persistence by default
- Clear audit trail for trade actions
- Graceful degradation when WS/private feed unavailable

Scale/Scope:
- v1: single user session (local terminal)
- Future: multi-user enterprise mode with BFF + centralized auth

---

## Constitution Check (Gates)

GATE A: Trader-First Speed and Clarity
- Use virtualization everywhere for big tables.
- Keep interactions keyboard-first and low-latency.

GATE B: Safety-First Trading
- Demo/Real toggle and explicit confirmations.
- Always show request-id and full order lifecycle.

GATE C: Streaming-First
- WS drives quotes and private order updates.
- REST is used for hydration, search, watchlists, reconcile.

GATE D: Security
- In-memory keys by default; optional encryption.
- Panic lock implemented early.

GATE E: Observability
- REST request log + WS lifecycle log + export bundle.

---

## Architecture Overview

### High-level components

1) App Shell
- Top: Command Bar + global status (WS/REST)
- Left rail: navigation (WL, QT, CH, TRD, ORD, PF, PI, AL, Settings)
- Center: Workspace grid (dockable panels)
- Bottom: status bar (mode, connection, last request-id)

2) Panel Runtime
- Panel registry maps function codes -> panel components
- Panel context:
  - active instrument
  - pinned instrument (optional)
  - link group (A/B/C)
  - data bindings (quotes, positions, etc.)

3) Data Layer (Client-side)
- REST Client:
  - Injects required headers (x-api-key, x-user-key, x-request-id)
  - Handles rate limiting and retries (safe defaults)
- WebSocket Client:
  - Connect/reconnect with backoff
  - Authenticate for private topics
  - Subscribe/unsubscribe batching and snapshot
- Domain Stores:
  - instrument cache store
  - quotes store (latest quote per instrument + staleness)
  - watchlist store
  - orders/blotter store
  - portfolio store
  - alerts store
  - workspace store

4) Optional BFF (Future)
- A local or hosted gateway for:
  - key custody
  - caching
  - cross-device workspaces
  - unified audit logging

v1 recommendation: build client-only first with a clear seam for BFF later.

---

## Data Flows

### Flow A: Symbol resolution -> active instrument
1) User types in command bar
2) REST: market-data search to map symbol -> instrumentId
3) App sets Active Instrument Context
4) Linked panels subscribe to instrument:<instrumentId>

### Flow B: Streaming watchlist monitor
1) User opens WL and selects a watchlist
2) REST: fetch watchlist items (instrumentIds)
3) WS: subscribe to visible instruments (batch by limits)
4) Quotes store updates; table consumes latest quotes

### Flow C: Market order
1) User opens ticket (TRD) for active instrument
2) User configures buy/sell, amount/units, leverage, optional SL/TP
3) Confirmation step (especially in Real mode)
4) REST: submit market-open (or market-close)
5) Orders store adds "pending" local record
6) WS private events update status -> blotter renders transitions

### Flow D: Portfolio and close
1) User opens PF
2) REST: load portfolio live (positions)
3) User selects a position and closes full/partial
4) REST: submit market-close
5) WS private updates -> blotter and (eventually) portfolio reconcile

### Flow E: Alerts
1) User defines alert rules for instrument or watchlist
2) Quotes stream updates
3) Alert engine evaluates rules and emits notifications
4) Alerts log stores outcomes; user can mute/ack

---

## API Surface Audit (Required Step Before Final Build)

Goal: produce a locked, versioned contract for:
- REST endpoints per domain (market data, watchlists, trading, users info, feeds, pi data)
- WS schema for instrument and private topics
- Auth requirements and error codes

Deliverables:
- `contracts/etoro-rest.openapi.json` (or extracted endpoints list if OpenAPI is not available)
- `contracts/etoro-ws.schema.md` (message examples and typed model)
- Updated mapping table in spec/wireframes (remove API-SPEC PENDING where resolved)

Method:
- Pull the latest public API portal definitions (manual or automated)
- Validate using live calls in demo mode (where possible)
- Implement Zod schemas for responses so payload drift is detected early

---

## UX System Implementation Notes

### Command Bar
- Parses:
  - SYMBOL (e.g., AAPL)
  - SYMBOL + FUNCTION (e.g., AAPL QT)
  - FUNCTION only (e.g., WL)
- Typeahead:
  - recent symbols
  - watchlist symbols
  - cached symbol->instrument mapping
- Keyboard:
  - Arrow up/down selects
  - Enter confirms
  - Esc closes dropdown

### Function Codes (initial set)
- QT: Quote
- CH: Chart
- WL: Watchlists
- TRD: Trade Ticket
- ORD: Blotter
- PF: Portfolio
- AL: Alerts
- PI: Trader search
- PIP: Trader profile (open with a username)
- N: Feeds/News (feature-flagged)

### Panel Linking
- Each panel has:
  - Link Mode: Follow Active | Link Group A/B/C | Pinned
  - If pinned, stores its own instrumentId

### Visual language
- Dark theme default
- High-contrast table text
- Subtle flash on quote updates (non-distracting)
- "Stale" styling: muted + timestamp label

---

## Security Model

- Default: keys stored only in memory for session.
- Optional: "Remember keys" uses encryption with a passphrase (never store passphrase).
- Panic Lock:
  - clears keys from memory and storage
  - disconnects WS private subscriptions
  - disables trading actions immediately
- Logging:
  - Never log secrets
  - Support bundle must be sanitized by default

---

## Observability

- REST Log:
  - timestamp, method, path, status, latency, request-id, error summary
- WS Log:
  - connect/disconnect, auth ok/fail, subscribed topics count, reconnect attempts
- User-visible:
  - status bar indicators + "Diagnostics" drawer + export bundle

---

## Testing Strategy

1) Unit tests
- parsing command bar input
- quote staleness logic
- alert evaluation engine
- subscription batching logic
- request-id generation and log redaction

2) Integration tests (mocked API)
- watchlists CRUD flows
- order submit -> blotter update (mock WS private)

3) E2E tests (Playwright)
- setup keys (mock)
- open watchlist -> see table populate
- open ticket -> place demo order -> see blotter

4) Performance smoke
- open 200-symbol watchlist
- verify scroll remains responsive
- verify WS reconnect doesn’t freeze UI

---

## Delivery Phases

Phase 0: API Contract Locking + Skeleton App  
Phase 1: Command Bar + Workspace + Streaming Quotes (QT)  
Phase 2: Watchlists + Streaming Monitor (WL)  
Phase 3: Trading Ticket + Blotter (TRD/ORD)  
Phase 4: Portfolio + Close Flows (PF)  
Phase 5: Chart + Alerts (CH/AL)  
Phase 6: Trader Discovery (PI)  
Phase 7: Feeds (N) if contracts available  
Phase 8: Polish (perf, accessibility, export bundle, Electron wrapper optional)

---

## Risks and Mitigations

Risk: API contracts drift or endpoints differ from assumptions  
- Mitigation: API Surface Audit + schema validation + feature flags

Risk: Too many WS subscriptions causes throttling  
- Mitigation: subscription manager, batching, user warnings, limit policies

Risk: Keys handling security concerns  
- Mitigation: in-memory default, optional encryption, panic lock

Risk: Trading errors confuse users  
- Mitigation: rich error reporting + raw details + request-id correlation

---

## Definition of Done (DoD)

- All P1 user stories pass acceptance scenarios
- All FR-001..FR-040 met (or explicitly deferred with documented rationale)
- Performance smoke passes on a typical laptop
- No plaintext key persistence by default
- Diagnostics export works and is sanitized

---

# 5) Task Backlog (Merged)

Task List: eToro Terminal (US) - Bloomberg-like Pro Trader UX  
Feature Branch: 001-etoro-terminal-us  
Created: 2026-01-19  
Status: Draft

Organization:
- Tasks are grouped by user story and phased to allow parallel work.
- Task IDs are stable and should be referenced in PRs and commits.

Legend:
- [P] = can be executed in parallel with other tasks in the same phase
- FE = Frontend, BE = Backend/BFF, QA = Testing/Quality

---

## PHASE 0 - API Surface Audit + Project Skeleton

T001 (P) - Repo scaffold + lint + formatting (FE)
- Output: a runnable web app skeleton + CI for lint/typecheck
- Acceptance: `pnpm test`/`pnpm lint` (or equivalent) succeeds

T002 (P) - Define domain model types (FE)
- Output: Instrument, Quote, Watchlist, Order, Position, AlertRule, Workspace types
- Acceptance: types compile; models used by at least one demo component

T003 - API Surface Audit: collect endpoint inventory (FE/BE)
- Output: `docs/api-inventory.md` listing all REST + WS endpoints and required headers/auth
- Acceptance: inventory includes all domains: Market Data, Watchlists, Trading, Users Info, Feeds, PI Data, WebSocket

T004 - Contract schemas for known WS messages (FE)
- Output: Zod schemas for instrument topic and private topic messages
- Acceptance: sample messages validate; invalid payloads fail with clear errors

T005 - Contract schemas for known REST responses (FE)
- Output: Zod schemas for: symbol search result, watchlists list, watchlist items, portfolio live, people search
- Acceptance: mocked fixtures validate; schema errors are actionable

---

## PHASE 1 - Story 1/2/3: Keys, Mode, Command Bar, Workspace Shell

T006 - Settings panel: keys input + validate (FE)
- Dependencies: T001
- Acceptance: can enter keys; validate triggers a test REST call; shows status + last request-id

T007 - Secure key storage: in-memory default + optional encrypted persistence (FE)
- Dependencies: T006
- Acceptance: default does not persist keys; "remember" prompts passphrase; reload restores only if enabled

T008 - Panic lock control (FE)
- Dependencies: T006, T007
- Acceptance: one action clears keys, disables private/trading, and visually confirms lock state

T009 - REST client wrapper with required headers + request-id (FE)
- Dependencies: T001
- Acceptance: every call includes request-id; request log records path/status/latency without secrets

T010 - Command Bar parser + typeahead UI (FE)
- Dependencies: T001, T002
- Acceptance: supports SYMBOL, SYMBOL+FUNC, FUNC only; arrow navigation; Enter selects; Esc closes

T011 - Symbol resolver integration (FE)
- Dependencies: T009, T010
- Acceptance: typing AAPL resolves to an instrumentId and sets active instrument context

T012 - Workspace grid + panel runtime (FE)
- Dependencies: T001, T002
- Acceptance: can add/remove panels; resize/move; restore layout after reload (workspace persistence)

T013 (P) - Panel linking: Follow Active / Group A/B/C / Pinned (FE)
- Dependencies: T012
- Acceptance: linked panels change with active symbol; pinned panels do not

---

## PHASE 2 - Story 4/5: WebSocket Streaming + Quotes + Watchlists

T014 - WebSocket client: connect/reconnect + lifecycle log (FE)
- Dependencies: T001
- Acceptance: shows Connected/Reconnecting/Disconnected; logs events

T015 - WS subscription manager: batch subscribe/unsubscribe + snapshot option (FE)
- Dependencies: T014
- Acceptance: can subscribe to N instruments; can remove; avoids duplicate subs; recovers after reconnect

T016 - Quotes store: latest quote per instrument + staleness calculation (FE)
- Dependencies: T014
- Acceptance: quote tile displays bid/ask/last; stale indicator triggers after threshold

T017 - Quote panel (QT) implementation (FE)
- Dependencies: T012, T015, T016
- Acceptance: QT follows active symbol or pinned; updates in real time

T018 - Watchlists list panel + open watchlist (FE)
- Dependencies: T009, T012
- Acceptance: WL loads list; user selects one and opens table

T019 - Watchlist monitor table with virtualization + streaming columns (FE)
- Dependencies: T015, T016, T018
- Acceptance: 200-row table scrolls smoothly; visible rows show streaming values

T020 - Watchlist CRUD (create/delete/set default) (FE)
- Dependencies: T009, T018
- Acceptance: create list; delete list; set default reflected in UI

T021 - Watchlist items management (add/remove) (FE)
- Dependencies: T009, T018, T019
- Acceptance: add symbol(s) via command bar or dialog; table updates and WS subs update

T022 (P) - Curated lists browser panel (FE)
- Dependencies: T009, T012
- Acceptance: curated lists load; open curated list in monitor view

T023 (P) - Recommendations panel (FE)
- Dependencies: T009, T012, T015
- Acceptance: loads N items; shows streaming values; supports add-to-watchlist

---

## PHASE 3 - Story 7/8: Trading Ticket + Private Feed + Blotter

T024 - Trading mode gating (Demo vs Real) (FE)
- Dependencies: T006
- Acceptance: Demo/Real toggle changes labels, warnings, and confirmation requirements

T025 - Trade ticket UI (TRD) with amount/units/leverage + optional SL/TP (FE)
- Dependencies: T012, T011
- Acceptance: ticket is keyboard-friendly; validates inputs; submit disabled without permissions

T026 - Trading REST adapter: market-open by amount, by units (FE)
- Dependencies: T009, T025
- Acceptance: demo submit works against mock; real submit requires confirmation flow

T027 - Portfolio position close adapter: market-close by positionId (FE)
- Dependencies: T009
- Acceptance: accepts full close and partial close; returns structured result

T028 - WS private auth handshake (FE)
- Dependencies: T014, T006
- Acceptance: authenticate succeeds/fails with clear UI; no secrets logged

T029 - Private topic subscription and event routing (FE)
- Dependencies: T015, T028
- Acceptance: private events update blotter store; events show in diagnostics log

T030 - Blotter panel (ORD): table + details drawer (FE)
- Dependencies: T012, T029
- Acceptance: shows lifecycle; clicking row opens raw payload; filter by status/instrument

T031 - Local "pending order" optimistic record creation (FE)
- Dependencies: T026, T030
- Acceptance: submit order -> immediate blotter row pending until WS update reconciles

---

## PHASE 4 - Story 9: Portfolio + Close Flows

T032 - Portfolio panel (PF): positions table + details drawer (FE)
- Dependencies: T009, T012
- Acceptance: loads portfolio; shows positionId, instrumentId, side, leverage, open price, SL/TP, PnL

T033 - Close full flow from portfolio (FE)
- Dependencies: T032, T027, T024
- Acceptance: close full requires confirm; creates blotter row; shows resulting status

T034 - Close partial flow from portfolio (FE)
- Dependencies: T032, T027, T024
- Acceptance: partial close accepts units; validates; reconciles via blotter

T035 - Portfolio reconcile strategy (FE)
- Dependencies: T032
- Acceptance: manual refresh reconciles; optional timed refresh configurable

---

## PHASE 5 - Story 10/11: Chart + Alerts

T036 - Chart panel (CH): tick line + 1m bar aggregation (FE)
- Dependencies: T012, T016, T015
- Acceptance: chart updates from streaming; timeframe switch supported (1m/5m/15m)

T037 - Session cache for chart history (FE)
- Dependencies: T036
- Acceptance: chart persists last N minutes in memory; reload shows empty unless explicitly persisted

T038 - Alerts engine (local evaluator) (FE)
- Dependencies: T016
- Acceptance: supports threshold alerts; staleness alerts; de-dup strategy

T039 - Alerts panel (AL): create/edit/delete + alerts log (FE)
- Dependencies: T012, T038
- Acceptance: users can manage alert rules; notifications fire; log retains history

---

## PHASE 6 - Story 12: Trader Discovery + Profile + Compare

T040 - Trader search panel (PI): filters + results table (FE)
- Dependencies: T009, T012
- Acceptance: search runs; pagination and sorting work; rows open profile

T041 - Trader profile panel (PIP): performance + portfolio (FE)
- Dependencies: T009, T012
- Acceptance: loads key metrics; shows charts; shows portfolio transparency

T042 - Compare tray: pin up to 5 traders and compare (FE)
- Dependencies: T040, T041
- Acceptance: compare view aligns time windows; shows side-by-side metrics

---

## PHASE 7 - Story 13: Feeds (Feature Flagged)

T043 - Feeds panel shell + feature flag (FE)
- Dependencies: T012
- Acceptance: panel exists but gated behind flag; shows "Not enabled" state

T044 - API contract lock for Feeds (FE/BE)
- Dependencies: T003
- Acceptance: exact feed endpoints documented + schema validation added

T045 - Implement feed list + pagination + filters (FE)
- Dependencies: T044
- Acceptance: instrument/user feed loads; scroll pagination; error handling

T046 - Implement post composer (FE)
- Dependencies: T044
- Acceptance: user can publish a post; it appears and errors are shown clearly

---

## PHASE 8 - Polish, Hardening, Export Bundle, Optional Desktop Wrapper

T047 - Diagnostics drawer (FE)
- Dependencies: T009, T014
- Acceptance: shows REST log, WS log, subscription counts, last errors

T048 - Export support bundle (sanitized) (FE)
- Dependencies: T047
- Acceptance: exports JSON/zip-like payload without secrets; includes logs + settings + version info

T049 - Accessibility + keyboard audit (FE/QA)
- Dependencies: T010, T012
- Acceptance: primary flows are keyboard-accessible; focus management is consistent

T050 - Performance smoke tests (QA)
- Dependencies: T019, T036
- Acceptance: open 200 symbols; scroll stable; WS reconnect doesn’t freeze UI

T051 - Optional Electron packaging (FE)
- Dependencies: T012 (optional)
- Acceptance: desktop build runs; keys still not plaintext; performance acceptable

---

## Optional Test Tasks (include if desired)

T900 - Unit tests for command parser and symbol resolution ranking (QA/FE)  
T901 - Unit tests for subscription manager batching and de-duplication (QA/FE)  
T902 - E2E: demo trade -> blotter -> close position (QA)

---

# 6) UX Wireframes (Merged)

# UX Wireframes: eToro Terminal (US) - Pro Trader Terminal

These wireframes are ASCII layouts intended to fully specify:
- placement
- information density
- keyboard behaviors
- empty/error states

---

## 1) Terminal Shell (Default Workspace)

+-----------------------------------------------------------------------------------+
| eToro Terminal (Demo)   WS: Connected   REST: OK   Subs: 42   Lat: 120ms   [User] |
|-----------------------------------------------------------------------------------|
| COMMAND: > AAPL QT                                                           [Go] |
| Type: SYMBOL, SYMBOL FUNC, or FUNC.   Examples: "AAPL", "AAPL TRD", "WL"          |
|-----------------------------------------------------------------------------------|
| NAV  |  [PANEL A: QT Quote]           |  [PANEL B: CH Chart]                      |
|------|--------------------------------|------------------------------------------|
| WL   |  AAPL  192.42 / 192.45         |   (line/tick) 1m bars                     |
| QT   |  Last: 192.44  Spread: 0.03    |    ^                                      |
| CH   |  Time: 09:31:04 ET  [LIVE]     |    |     __/\/\__                          |
| TRD  |  Stale: NO                     |    +----------------------------------->  |
| ORD  |--------------------------------|------------------------------------------|
| PF   |  [PANEL C: WL Watchlist]       |  [PANEL D: TRD Ticket]                    |
| AL   |  Symbol   Bid    Ask   Last    |  AAPL  [BUY] [SELL]                       |
| PI   |  AAPL   192.42 192.45 192.44   |  Mode: Amount (USD) [v]                   |
| N    |  TSLA   210.10 210.15 210.12   |  Amount: [  500.00 ]                      |
| SET  |  NVDA   900.01 900.10 900.06   |  Leverage: [  2x ]                        |
|      |  ... (virtualized)             |  SL: [____]  TP: [____]                   |
|      |  [Add] [Remove] [Set Default]  |  [Submit Demo] (disabled if no perms)     |
|-----------------------------------------------------------------------------------|
| Status: Demo | Active: AAPL | Link: Panel A=Group A Panel B=Group A | ReqID: ...   |
+-----------------------------------------------------------------------------------+

Keyboard model:
- "/" focuses command bar from anywhere
- Esc closes dropdown/modals and returns focus to last panel
- Ctrl+1..Ctrl+4 focus panels A..D
- In a table: arrows move; Enter sets active symbol; T opens ticket; C opens chart

Panel link modes (shown in panel header):
- Follow Active
- Group A / Group B / Group C
- Pinned (shows pinned symbol)

---

## 2) Command Bar Typeahead

COMMAND: > AA
+------------------ Typeahead ------------------+
| Symbols (cached/recent)                       |
| > AAPL   Apple Inc.                           |
|   AAL    American Airlines                    |
|   AAXJ   iShares MSCI Asia ex Japan ETF       |
|------------------------------------------------
| Functions                                     |
|   QT  Quote                                   |
|   CH  Chart                                   |
|   WL  Watchlists                              |
|   TRD Trade Ticket                            |
|   ORD Blotter                                 |
|   PF  Portfolio                               |
|   AL  Alerts                                  |
|   PI  People Search                           |
|   N   Feeds (if enabled)                      |
+----------------------------------------------+

Behaviors:
- Enter selects highlighted item
- Tab autocompletes first match
- When input is "AAPL TRD", typeahead filters functions

---

## 3) Watchlists (WL) - List + Actions

+------------------------------ WL ------------------------------+
| My Watchlists            | Curated Lists | Recommendations     |
|---------------------------------------------------------------|
| > Default Watchlist      | [Tech Giants] | [Top Movers]         |
|   Earnings Week          | [Energy]      | [Most Traded]        |
|   Crypto Basket          | [Dividends]   | [For You]            |
|---------------------------------------------------------------|
| [Open] [Create] [Rename*] [Delete] [Set Default]              |
| *Rename depends on endpoint availability                       |
+---------------------------------------------------------------+

---

## 4) Watchlist Monitor Table (Streaming)

+----------------------------------- WL: Earnings Week -----------------------------------+
| Link: Follow Active   View: Table   Subs: 120   Stale: 0                                  |
|------------------------------------------------------------------------------------------|
| Symbol | Bid      | Ask      | Last     | Spread | Time (ET) | Chg* | Alerts | Actions    |
|------------------------------------------------------------------------------------------|
| AAPL   | 192.42   | 192.45   | 192.44   | 0.03   | 09:31:04  | ...  | 2      | [T] [C]    |
| TSLA   | 210.10   | 210.15   | 210.12   | 0.05   | 09:31:03  | ...  | 0      | [T] [C]    |
| ... (virtualized)                                                                      |
|------------------------------------------------------------------------------------------|
| Footer: [Add Symbol] [Remove] [Export]  Note: Chg* computed locally in v1                |
+------------------------------------------------------------------------------------------+

Key actions:
- Enter: set active instrument to row symbol
- T: open ticket for row symbol
- C: open chart for row symbol
- A: add alert for row symbol

---

## 5) Quote Panel (QT)

+------------------------------- QT: AAPL -------------------------------+
| Link: Group A   Stale: NO   Updated: 09:31:04 ET   Spread: 0.03        |
|------------------------------------------------------------------------|
| BID: 192.42      ASK: 192.45      LAST: 192.44                         |
|------------------------------------------------------------------------|
| Mini Sparkline:  (last 5m)                                             |
|  __/\__/\___/\__                                                       |
|------------------------------------------------------------------------|
| Actions: [TRD] Trade   [CH] Chart   [WL] Add to Watchlist               |
+------------------------------------------------------------------------+

Empty state (no symbol):
- "No active symbol. Type a ticker in the command bar (e.g., AAPL) to begin."

Disconnected state:
- Banner: "WS Disconnected. Reconnecting..."
- Quote values greyed + timestamp shows last update

---

## 6) Trade Ticket (TRD)

+-------------------------------- TRD: AAPL --------------------------------+
| Mode: Demo | Link: Follow Active | Permissions: Read/Write?                |
|----------------------------------------------------------------------------|
| Side:  ( ) BUY    ( ) SELL                                              |
| Open:  (o) Amount (USD)    ( ) Units                                     |
| Amount: [  500.00 ]           Units: [________]                          |
| Leverage: [  2x  v ]                                                    |
| Risk:  SL Rate: [______]   TP Rate: [______]                             |
|----------------------------------------------------------------------------|
| [Review] -> [Confirm] -> [Submit]                                         |
|----------------------------------------------------------------------------|
| Errors: (collapsed)                                                       |
+----------------------------------------------------------------------------+

Real mode confirmation:
- Step requires explicit confirmation (e.g., type ENABLE or HOLD TO CONFIRM)
- Shows: request-id, symbol, side, amount/units, leverage, SL/TP summary

---

## 7) Orders Blotter (ORD)

+--------------------------------------- ORD ---------------------------------------+
| Filter: [Today v] [All Status v] [Symbol: ____]  Private Feed: Connected           |
|-----------------------------------------------------------------------------------|
| Time     | OrderID | Symbol | Side | ReqUnits | ExecUnits | Status | Error | Details |
|-----------------------------------------------------------------------------------|
| 09:31:05 | 123..   | AAPL   | BUY  | 10       | 0         | PEND   |       | [>]     |
| 09:31:06 | 123..   | AAPL   | BUY  | 10       | 10        | FILL   |       | [>]     |
|-----------------------------------------------------------------------------------|
| Details drawer shows raw payload + parsed fields + request-id link                  |
+-----------------------------------------------------------------------------------+

Private feed disconnected:
- Show "Private feed not authenticated. Open Settings -> Keys -> Authenticate WS."

---

## 8) Portfolio (PF)

+-------------------------------------- PF --------------------------------------+
| User: my_username   Mode: Demo   Last refresh: 09:31:10 ET  [Refresh]           |
|--------------------------------------------------------------------------------|
| POSITIONS                                                                        |
| positionId | Symbol | Side | Units | Leverage | Open | SL | TP | PnL | Actions  |
|--------------------------------------------------------------------------------|
| 991..      | AAPL   | BUY  | 10    | 2x       | 190  | -  | -  | +12 | [Close]  |
|--------------------------------------------------------------------------------|
| SOCIAL TRADES (if present)                                                      |
| socialTradeId | Parent | PnL | Positions | ...                                   |
+--------------------------------------------------------------------------------+

Close flow:
- Close Full -> confirm -> submit close order
- Close Partial -> input units -> confirm -> submit

---

## 9) Alerts (AL)

+------------------------------------ AL ------------------------------------+
| Create Alert: Symbol [____]  Condition [> v]  Price [____]  [Create]         |
|-------------------------------------------------------------------------------|
| Active Alerts                                                                 |
| ID | Symbol | Rule        | Status  | Last Trigger | Actions                 |
|-------------------------------------------------------------------------------|
| 1  | AAPL   | Price > 200 | Active  | --           | [Mute] [Edit] [Delete]  |
|-------------------------------------------------------------------------------|
| Alerts Log                                                                    |
| Time     | Symbol | Message                                                   |
|-------------------------------------------------------------------------------|
| 09:32:10 | AAPL   | Price crossed 200                                         |
+-------------------------------------------------------------------------------+

---

## 10) Trader Search (PI) and Profile (PIP)

PI Search:
+----------------------------- PI: People Search -----------------------------+
| Period [1Y v]  Risk [1..6]  Gain [min..max]  Copiers [min..max]  [Search]   |
|-------------------------------------------------------------------------------|
| Username | Gain | Risk | Copiers | WinRatio | LastActive | Open Profile [>]  |
+-------------------------------------------------------------------------------+

Profile:
+---------------------------------- PIP: username ----------------------------+
| Summary metrics + performance chart + live portfolio (if supported)          |
| Tabs: [Overview] [Performance] [Portfolio] [Compare]                         |
+-------------------------------------------------------------------------------+

---

## 11) Settings (SET)

+----------------------------------- SETTINGS -----------------------------------+
| Keys:                                                                            |
|   API Key:  [***************]   User Key: [***************]  [Validate]         |
| Mode:  (o) Demo   ( ) Real                                                  |
| WS: [Connect] [Authenticate Private]                                           |
| Security: [ ] Remember keys (encrypt)    [Panic Lock]                          |
| Diagnostics: [Open Drawer] [Export Bundle]                                     |
+--------------------------------------------------------------------------------+

---

# 7) Requirements Checklist (Merged)

# Requirements Checklist - 001-etoro-terminal-us

Use this checklist as "unit tests for the spec" before implementing.

## P1 Readiness Checklist

### Setup + Security
- [ ] FR-033 satisfied: keys are not stored in plaintext by default
- [ ] FR-034 satisfied: panic lock clears keys and disables trading/private feeds immediately
- [ ] User Story 1 acceptance scenarios are fully implementable without unresolved questions

### Terminal Interaction Model
- [ ] FR-001 command bar supports SYMBOL, SYMBOL+FUNC, FUNC
- [ ] FR-002 active instrument context implemented
- [ ] FR-003 workspace supports panel add/remove/resize/persist
- [ ] User Story 2 acceptance scenarios covered
- [ ] User Story 3 acceptance scenarios covered

### Streaming (Quotes + Connection Health)
- [ ] FR-004 WS quote subscription supported
- [ ] FR-006 subscribe/unsubscribe based on panels/watchlist visibility
- [ ] FR-007 connection health + staleness surfaced
- [ ] User Story 4 acceptance scenarios covered

### Watchlists
- [ ] FR-010 list watchlists and open as streaming table
- [ ] FR-011 CRUD (create/delete/default; rename if supported)
- [ ] FR-012 add/remove items
- [ ] FR-013 virtualization for 200+ rows
- [ ] User Story 5 acceptance scenarios covered

### Trading + Blotter + Portfolio
- [ ] FR-016/FR-017 market open by amount/units supported
- [ ] FR-018 close by positionId (full + partial)
- [ ] FR-019 Real mode requires explicit confirmation gate
- [ ] FR-020 audit trail includes request-id and timestamps
- [ ] FR-021 blotter exists and shows lifecycle
- [ ] FR-022 blotter updates from private events (when available)
- [ ] FR-024 portfolio lists positions and supports closes
- [ ] User Story 7, 8, 9 acceptance scenarios covered

## P2 Readiness Checklist

### Charts + Alerts
- [ ] FR-026 chart panel exists and updates from streaming
- [ ] FR-027 price threshold alerts supported
- [ ] FR-028 staleness alerts supported
- [ ] User Story 10 and 11 acceptance scenarios covered

### Trader Discovery
- [ ] FR-029 trader search supports filters and sorting
- [ ] FR-030 profile supports performance and portfolio transparency when supported
- [ ] User Story 12 acceptance scenarios covered

### Observability
- [ ] FR-035 REST request log exists with request-id and latency
- [ ] FR-036 WS lifecycle log exists with subscriptions count
- [ ] FR-037 support bundle export is sanitized by default

## P3 Readiness Checklist

### Feeds (if enabled)
- [ ] FR-038 feature flags exist for Feeds
- [ ] User Story 13 is implemented only after contract is locked

## API Contract Checklist (Must be done before coding against endpoints)

- [ ] API Surface Audit complete (plan: Phase 0)
- [ ] Endpoint inventory includes Market Data, Watchlists, Trading, Users Info, Feeds, PI Data, WS
- [ ] Response schemas validated with fixtures or live demo calls
- [ ] Error handling behavior documented for:
  - auth failures
  - rate limiting
  - WS disconnects
  - trading errors
```
