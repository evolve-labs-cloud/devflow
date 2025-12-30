'use client';

import { useState, useCallback, useEffect, KeyboardEvent } from 'react';

/**
 * Custom hook for keyboard navigation in lists.
 * Implements accessible list navigation per WAI-ARIA guidelines.
 *
 * Features:
 * - Arrow up/down navigation
 * - Home/End jump to first/last
 * - Enter to select
 * - Escape to cancel
 * - Type-ahead search (optional)
 *
 * @param options - Configuration options
 * @returns Navigation state and handlers
 */
interface UseListNavigationOptions<T> {
  /** Array of items to navigate */
  items: T[];
  /** Called when an item is selected (Enter key) */
  onSelect?: (item: T, index: number) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Navigation orientation: 'vertical' (default) or 'horizontal' */
  orientation?: 'vertical' | 'horizontal';
  /** Whether navigation wraps around (default: true) */
  loop?: boolean;
  /** Initial selected index (default: 0) */
  initialIndex?: number;
  /** Enable type-ahead search (default: false) */
  typeAhead?: boolean;
  /** Function to get searchable text from item for type-ahead */
  getItemText?: (item: T) => string;
}

interface UseListNavigationReturn {
  /** Current selected index */
  selectedIndex: number;
  /** Set selected index programmatically */
  setSelectedIndex: (index: number) => void;
  /** Handle keyboard events - attach to container */
  handleKeyDown: (event: KeyboardEvent) => void;
  /** Check if index is selected */
  isSelected: (index: number) => boolean;
  /** Move to next item */
  moveNext: () => void;
  /** Move to previous item */
  movePrevious: () => void;
  /** Move to first item */
  moveFirst: () => void;
  /** Move to last item */
  moveLast: () => void;
  /** Select current item */
  selectCurrent: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export function useListNavigation<T>({
  items,
  onSelect,
  onEscape,
  orientation = 'vertical',
  loop = true,
  initialIndex = 0,
  typeAhead = false,
  getItemText,
}: UseListNavigationOptions<T>): UseListNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState(
    Math.min(initialIndex, Math.max(0, items.length - 1))
  );
  const [searchString, setSearchString] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Reset index when items change
  useEffect(() => {
    if (items.length === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= items.length) {
      setSelectedIndex(items.length - 1);
    }
  }, [items.length, selectedIndex]);

  const moveNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (items.length === 0) return -1;
      if (current >= items.length - 1) {
        return loop ? 0 : current;
      }
      return current + 1;
    });
  }, [items.length, loop]);

  const movePrevious = useCallback(() => {
    setSelectedIndex((current) => {
      if (items.length === 0) return -1;
      if (current <= 0) {
        return loop ? items.length - 1 : 0;
      }
      return current - 1;
    });
  }, [items.length, loop]);

  const moveFirst = useCallback(() => {
    if (items.length > 0) {
      setSelectedIndex(0);
    }
  }, [items.length]);

  const moveLast = useCallback(() => {
    if (items.length > 0) {
      setSelectedIndex(items.length - 1);
    }
  }, [items.length]);

  const selectCurrent = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length && onSelect) {
      onSelect(items[selectedIndex], selectedIndex);
    }
  }, [selectedIndex, items, onSelect]);

  const reset = useCallback(() => {
    setSelectedIndex(Math.min(initialIndex, Math.max(0, items.length - 1)));
    setSearchString('');
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  }, [initialIndex, items.length, searchTimeout]);

  // Type-ahead search
  const handleTypeAhead = useCallback(
    (char: string) => {
      if (!typeAhead || !getItemText) return false;

      const newSearchString = searchString + char.toLowerCase();
      setSearchString(newSearchString);

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout to reset search
      setSearchTimeout(
        setTimeout(() => {
          setSearchString('');
        }, 500)
      );

      // Find matching item
      const matchIndex = items.findIndex((item) =>
        getItemText(item).toLowerCase().startsWith(newSearchString)
      );

      if (matchIndex !== -1) {
        setSelectedIndex(matchIndex);
        return true;
      }

      return false;
    },
    [typeAhead, getItemText, searchString, searchTimeout, items]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

      switch (event.key) {
        case prevKey:
          event.preventDefault();
          movePrevious();
          break;

        case nextKey:
          event.preventDefault();
          moveNext();
          break;

        case 'Home':
          event.preventDefault();
          moveFirst();
          break;

        case 'End':
          event.preventDefault();
          moveLast();
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          selectCurrent();
          break;

        case 'Escape':
          event.preventDefault();
          if (onEscape) {
            onEscape();
          }
          break;

        default:
          // Type-ahead for printable characters
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            if (handleTypeAhead(event.key)) {
              event.preventDefault();
            }
          }
          break;
      }
    },
    [orientation, movePrevious, moveNext, moveFirst, moveLast, selectCurrent, onEscape, handleTypeAhead]
  );

  const isSelected = useCallback(
    (index: number) => index === selectedIndex,
    [selectedIndex]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    isSelected,
    moveNext,
    movePrevious,
    moveFirst,
    moveLast,
    selectCurrent,
    reset,
  };
}
