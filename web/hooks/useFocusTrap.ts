'use client';

import { useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook for trapping focus within a container element.
 * Implements accessible modal focus management per WAI-ARIA guidelines.
 *
 * Features:
 * - Traps Tab/Shift+Tab navigation within container
 * - Auto-focuses first focusable element on activation
 * - Restores focus to previous element on deactivation
 * - Handles ESC key for closing (optional)
 *
 * @param containerRef - Reference to the container element
 * @param isActive - Whether the focus trap is currently active
 * @param options - Configuration options
 */
interface UseFocusTrapOptions {
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Auto-focus first element when activated (default: true) */
  autoFocus?: boolean;
  /** Restore focus when deactivated (default: true) */
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  options: UseFocusTrapOptions = {}
) {
  const { onEscape, autoFocus = true, restoreFocus = true } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store currently focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
        .filter((el) => {
          // Filter out hidden elements
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
    };

    // Auto-focus first element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Small delay to ensure DOM is ready
        requestAnimationFrame(() => {
          focusableElements[0]?.focus();
        });
      }
    }

    // Handle keydown for tab trapping and escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift+Tab on first element → focus last
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
        return;
      }

      // Tab on last element → focus first
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
        return;
      }

      // If focus is outside container, bring it back
      if (!container.contains(activeElement)) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    // Prevent focus from leaving container via mouse click
    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);

      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        // Small delay to prevent focus issues
        requestAnimationFrame(() => {
          previousActiveElement.current?.focus();
        });
      }
    };
  }, [isActive, containerRef, onEscape, autoFocus, restoreFocus]);
}
