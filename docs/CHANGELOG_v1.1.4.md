# Changelog v1.1.4 - Workspace Layout & Draggable Panels

**Date:** 2026-01-20  
**Status:** Implemented

---

## New Features

### 1. Workspace Layout Persistence

Save your current panel configuration as the default layout for future sessions.

**How to use:**
1. Arrange panels as desired (add/remove/reorder)
2. Click `[ 💾 SAVE LAYOUT ]` in the toolbar
3. Layout is saved to localStorage
4. On next login, your saved layout loads automatically

**Reset to defaults:**
- Click `[ ↺ RESET ]` to restore factory default panels
- Confirmation dialog prevents accidental reset

**Technical details:**
- Storage key: `etoro-terminal-layout`
- Stores panel typeIds in order
- Version-tagged for future migrations

### 2. Draggable Panel Reordering

Drag and drop panels to rearrange your workspace.

**How to use:**
1. Click and hold any panel header
2. Drag to new position
3. Drop to reorder

**Visual feedback:**
- Dragged panel becomes semi-transparent (50% opacity)
- Drop target shows green left border indicator
- Smooth cursor change to "grab" on hover

---

## Files Changed

| File | Change |
|------|--------|
| `src/services/workspaceLayoutService.ts` | **NEW** - Layout persistence service |
| `src/contexts/WorkspaceContext.tsx` | Added `movePanel`, `saveAsDefault`, `resetToDefault` |
| `src/components/Workspace/Workspace.tsx` | Added drag-drop handlers, save/reset buttons |
| `scripts/ralph.mjs` | Added workspace layout test (19 total tests) |
| `docs/SPECKIT_ADDENDUM_v1.1.0.md` | Added v1.1.4 specs (FR-041 to FR-045) |
| `eToroTerminalSpecKit.MD` | Updated changelog |

---

## API Reference

### workspaceLayoutService

```typescript
import { workspaceLayoutService } from './services/workspaceLayoutService';

// Save current layout
workspaceLayoutService.saveLayout(['STATUS', 'WL', 'PF', 'QT']);

// Load saved layout (returns null if none)
const panels = workspaceLayoutService.loadLayout();

// Reset to defaults
workspaceLayoutService.resetLayout();

// Check if custom layout exists
const hasCustom = workspaceLayoutService.hasCustomLayout();
```

### WorkspaceContext

```typescript
import { useWorkspaceContext } from './contexts/WorkspaceContext';

const { 
  panels,           // Current panel instances
  addPanel,         // Add panel by typeId
  removePanel,      // Remove by instanceId
  movePanel,        // Reorder: movePanel(fromIndex, toIndex)
  saveAsDefault,    // Save current layout
  resetToDefault,   // Reset to factory defaults
  hasCustomLayout,  // Boolean: custom layout saved?
} = useWorkspaceContext();
```

---

## Testing

### Manual Testing Checklist

- [ ] **WS-001**: Save empty layout, reload → shows empty workspace
- [ ] **WS-002**: Save 3 panels, reload → same 3 panels appear
- [ ] **WS-003**: Reset to default → factory panels load
- [ ] **WS-004**: Clear localStorage manually → default panels on reload
- [ ] **DP-001**: Drag panel left → panel moves left
- [ ] **DP-002**: Drag panel right → panel moves right
- [ ] **DP-003**: Drag to same position → no change
- [ ] **DP-004**: Visual feedback appears during drag

### RALPH Test

```bash
npm run ralph <publicKey> <userKey>
```

Look for:
```
── Workspace Layout Service ──────────────────────────────────────
ℹ️  Workspace Layout Persistence (v1.1.4)
    Default panels: STATUS, WL, WLM, PF, QT, CH, ORD
    Features:
      • Save current layout as default (localStorage)
      • Load saved layout on startup
      • Reset to factory defaults
      • Drag and drop panel reordering
✅ Workspace Layout Service - Configuration validated
```

---

## Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-041 | System MUST persist workspace panel layout to localStorage | ✅ |
| FR-042 | System MUST load saved layout on startup if available | ✅ |
| FR-043 | System MUST provide "Save as Default" action in toolbar | ✅ |
| FR-044 | System MUST provide "Reset to Default" to restore factory layout | ✅ |
| FR-045 | System MUST support drag-and-drop panel reordering | ✅ |

---

## Known Limitations

1. **Panel positions not saved** - Only panel order/types are saved, not absolute positions
2. **Single layout** - Only one saved layout per browser (no named layouts)
3. **No cloud sync** - Layout is browser-local, not synced across devices

---

## Future Enhancements

- Named layout presets ("Trading", "Research", "Compact")
- Export/import layout as JSON
- Cloud sync via user preferences API
- Keyboard shortcuts for layout switching (Ctrl+1, Ctrl+2, etc.)
