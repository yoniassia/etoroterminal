# Keyboard Shortcuts

eToroTerminal is designed with keyboard-first navigation in mind. This document lists all available keyboard shortcuts.

## Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus command bar |
| `Escape` | Close current dialog/modal |
| `?` | Show keyboard shortcuts help |

## Command Bar

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate autocomplete suggestions |
| `Enter` | Select suggestion / Execute command |
| `Tab` | Select current suggestion |
| `Escape` | Close autocomplete dropdown |

## Trade Ticket

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Execute Buy order |
| `Ctrl+S` | Execute Sell order |
| `Escape` | Cancel / Close trade ticket |
| `Enter` | Submit current field |

## Dialogs / Modals

| Shortcut | Action |
|----------|--------|
| `Escape` | Close dialog |
| `Enter` | Confirm action (on confirmation dialogs) |
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |

## Add to Watchlist Dialog

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate search results |
| `Enter` | Add selected instrument |
| `Escape` | Cancel and close dialog |

## Watchlists Panel

| Shortcut | Action |
|----------|--------|
| `Enter` | Select watchlist / Confirm action |
| `Escape` | Cancel create/delete dialogs |

## Alerts Panel

| Shortcut | Action |
|----------|--------|
| `Enter` | Create alert (when form is focused) |
| `Escape` | Cancel alert creation |

## Portfolio Panel

| Shortcut | Action |
|----------|--------|
| `Click` | Select position |
| `Escape` | Close position drawer |

## Blotter Panel

| Shortcut | Action |
|----------|--------|
| `Click` | Select order for details |
| `×` (button) | Close order details drawer |

## Chart Panel

| Shortcut | Action |
|----------|--------|
| `1` / `5` / `15` | Switch timeframe (1m/5m/15m) when focused |

## Accessibility Features

### Focus Management

- All interactive elements are keyboard accessible
- Tab order follows logical reading order
- Focus is trapped within modals/dialogs
- Focus returns to trigger element when dialog closes

### Screen Reader Support

- All buttons have descriptive aria-labels
- Form inputs are properly labeled
- Status messages are announced via aria-live regions
- Tables have proper headers and structure

### Visual Indicators

- Focus indicators are visible on all interactive elements
- High contrast colors (green/red) for buy/sell and P&L
- Status indicators for stale data, loading states

## Tips for Keyboard Navigation

1. **Start with the Command Bar**: Press `/` to focus the command bar and type commands like `AAPL QT` for quotes or `WL` for watchlist.

2. **Use Tab to Navigate**: Press `Tab` to move through interactive elements in logical order.

3. **Escape to Cancel**: Press `Escape` at any time to close dialogs or cancel operations.

4. **Confirmation Dialogs**: In real trading mode, confirmation dialogs can be navigated and confirmed entirely with keyboard.

## Customizing Shortcuts

Currently, keyboard shortcuts are not customizable. This feature may be added in future versions.

## Known Limitations

- Chart interactions (zoom, pan) currently require mouse
- Some third-party components may have limited keyboard support
- Complex table sorting requires mouse clicks

## Reporting Accessibility Issues

If you encounter accessibility barriers, please report them through the project's issue tracker with the `accessibility` label.
