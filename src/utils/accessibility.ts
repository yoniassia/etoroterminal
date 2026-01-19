/**
 * Accessibility utilities for focus management and keyboard navigation
 */

/**
 * Focus trap - keeps focus within a container (for modals/dialogs)
 */
export class FocusTrap {
  private container: HTMLElement;
  private previouslyFocused: HTMLElement | null = null;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(this.container.querySelectorAll<HTMLElement>(selector));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  activate(): void {
    this.previouslyFocused = document.activeElement as HTMLElement;
    document.addEventListener('keydown', this.boundHandleKeyDown);

    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  deactivate(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }
  }
}

/**
 * Creates a focus trap for a container element
 */
export function createFocusTrap(container: HTMLElement): FocusTrap {
  return new FocusTrap(container);
}

/**
 * React hook for focus trap
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean): void {
  const trapRef = { current: null as FocusTrap | null };

  if (typeof window !== 'undefined') {
    const { useEffect } = require('react');
    useEffect(() => {
      if (!active || !containerRef.current) {
        trapRef.current?.deactivate();
        trapRef.current = null;
        return;
      }

      trapRef.current = new FocusTrap(containerRef.current);
      trapRef.current.activate();

      return () => {
        trapRef.current?.deactivate();
        trapRef.current = null;
      };
    }, [active, containerRef.current]);
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Move focus to the first focusable element within a container
   */
  focusFirst(container: HTMLElement): boolean {
    const focusable = container.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
      return true;
    }
    return false;
  },

  /**
   * Move focus to the last focusable element within a container
   */
  focusLast(container: HTMLElement): boolean {
    const focusables = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length > 0) {
      focusables[focusables.length - 1].focus();
      return true;
    }
    return false;
  },

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);

    requestAnimationFrame(() => {
      announcer.textContent = message;
      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    });
  },
};

/**
 * Keyboard navigation helpers for lists/grids
 */
export const keyboardNav = {
  /**
   * Handle arrow key navigation in a list
   */
  handleListNavigation(
    e: KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onIndexChange: (index: number) => void,
    options: { wrap?: boolean } = {}
  ): boolean {
    const { wrap = true } = options;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < itemCount - 1) {
          onIndexChange(currentIndex + 1);
        } else if (wrap) {
          onIndexChange(0);
        }
        return true;

      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        } else if (wrap) {
          onIndexChange(itemCount - 1);
        }
        return true;

      case 'Home':
        e.preventDefault();
        onIndexChange(0);
        return true;

      case 'End':
        e.preventDefault();
        onIndexChange(itemCount - 1);
        return true;

      default:
        return false;
    }
  },

  /**
   * Handle grid navigation (2D)
   */
  handleGridNavigation(
    e: KeyboardEvent,
    currentRow: number,
    currentCol: number,
    rowCount: number,
    colCount: number,
    onPositionChange: (row: number, col: number) => void
  ): boolean {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentRow < rowCount - 1) {
          onPositionChange(currentRow + 1, currentCol);
        }
        return true;

      case 'ArrowUp':
        e.preventDefault();
        if (currentRow > 0) {
          onPositionChange(currentRow - 1, currentCol);
        }
        return true;

      case 'ArrowRight':
        e.preventDefault();
        if (currentCol < colCount - 1) {
          onPositionChange(currentRow, currentCol + 1);
        }
        return true;

      case 'ArrowLeft':
        e.preventDefault();
        if (currentCol > 0) {
          onPositionChange(currentRow, currentCol - 1);
        }
        return true;

      default:
        return false;
    }
  },
};

/**
 * ARIA attribute helpers
 */
export const ariaHelpers = {
  /**
   * Generate unique ID for accessibility
   */
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get common button aria attributes
   */
  buttonProps(label: string, options: { pressed?: boolean; expanded?: boolean; disabled?: boolean } = {}) {
    const props: Record<string, string | boolean | undefined> = {
      'aria-label': label,
    };
    if (options.pressed !== undefined) props['aria-pressed'] = options.pressed;
    if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
    if (options.disabled) props['aria-disabled'] = true;
    return props;
  },

  /**
   * Get common dialog aria attributes
   */
  dialogProps(labelledBy: string, describedBy?: string) {
    return {
      role: 'dialog' as const,
      'aria-modal': true,
      'aria-labelledby': labelledBy,
      ...(describedBy && { 'aria-describedby': describedBy }),
    };
  },

  /**
   * Get alert dialog aria attributes
   */
  alertDialogProps(labelledBy: string, describedBy?: string) {
    return {
      role: 'alertdialog' as const,
      'aria-modal': true,
      'aria-labelledby': labelledBy,
      ...(describedBy && { 'aria-describedby': describedBy }),
    };
  },
};

/**
 * Global keyboard shortcuts registry
 */
class ShortcutsRegistry {
  private shortcuts: Map<string, { description: string; handler: () => void }> = new Map();
  private enabled: boolean = true;

  private normalizeKey(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    parts.push(e.key.toUpperCase());
    return parts.join('+');
  }

  register(key: string, description: string, handler: () => void): () => void {
    const normalizedKey = key.toUpperCase();
    this.shortcuts.set(normalizedKey, { description, handler });
    return () => this.shortcuts.delete(normalizedKey);
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.enabled) return false;

    const key = this.normalizeKey(e);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      e.preventDefault();
      shortcut.handler();
      return true;
    }
    return false;
  }

  getAll(): Array<{ key: string; description: string }> {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description,
    }));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const shortcutsRegistry = new ShortcutsRegistry();

/**
 * Skip link helper for keyboard users
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'sr-only-focusable';
  link.textContent = text;
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #00ff00;
    padding: 8px;
    z-index: 100;
    text-decoration: none;
  `;

  link.addEventListener('focus', () => {
    link.style.top = '0';
  });

  link.addEventListener('blur', () => {
    link.style.top = '-40px';
  });

  return link;
}
