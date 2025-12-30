'use client';

import { useState, useCallback, useEffect, KeyboardEvent, useRef } from 'react';

/**
 * Custom hook for keyboard navigation in tree structures (like file explorers).
 * Implements accessible tree navigation per WAI-ARIA TreeView pattern.
 *
 * Features:
 * - Arrow up/down: Navigate between visible items
 * - Arrow right: Expand folder or move to first child
 * - Arrow left: Collapse folder or move to parent
 * - Home/End: Jump to first/last visible item
 * - Enter/Space: Select/activate item (open file or toggle folder)
 * - Type-ahead: Jump to item by typing name prefix
 *
 * @param options - Configuration options
 * @returns Navigation state and handlers
 */

export interface TreeNode {
  id: string;
  parentId: string | null;
  isExpanded?: boolean;
  isDirectory?: boolean;
}

interface UseTreeNavigationOptions<T extends TreeNode> {
  /** Flat list of visible tree nodes (in display order) */
  visibleNodes: T[];
  /** Function to expand a node */
  onExpand?: (node: T) => void;
  /** Function to collapse a node */
  onCollapse?: (node: T) => void;
  /** Function to select/activate a node */
  onSelect?: (node: T) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Whether navigation wraps around (default: false for trees) */
  loop?: boolean;
  /** Enable type-ahead search (default: true) */
  typeAhead?: boolean;
  /** Function to get searchable text from node */
  getNodeText?: (node: T) => string;
}

interface UseTreeNavigationReturn<T extends TreeNode> {
  /** Current focused node ID */
  focusedNodeId: string | null;
  /** Set focused node programmatically */
  setFocusedNodeId: (id: string | null) => void;
  /** Handle keyboard events - attach to container */
  handleKeyDown: (event: KeyboardEvent) => void;
  /** Check if node is focused */
  isFocused: (id: string) => boolean;
  /** Props to spread on tree container */
  getContainerProps: () => {
    role: 'tree';
    'aria-label': string;
    tabIndex: number;
    onKeyDown: (event: KeyboardEvent) => void;
  };
  /** Props to spread on tree item */
  getItemProps: (node: T) => {
    role: 'treeitem';
    'aria-expanded'?: boolean;
    'aria-selected': boolean;
    'aria-level': number;
    tabIndex: number;
    id: string;
  };
  /** Move focus to next visible item */
  focusNext: () => void;
  /** Move focus to previous visible item */
  focusPrevious: () => void;
  /** Move focus to first item */
  focusFirst: () => void;
  /** Move focus to last item */
  focusLast: () => void;
  /** Reset navigation state */
  reset: () => void;
}

export function useTreeNavigation<T extends TreeNode>({
  visibleNodes,
  onExpand,
  onCollapse,
  onSelect,
  onEscape,
  loop = false,
  typeAhead = true,
  getNodeText = (node) => node.id,
}: UseTreeNavigationOptions<T>): UseTreeNavigationReturn<T> {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(
    visibleNodes.length > 0 ? visibleNodes[0].id : null
  );
  const [searchString, setSearchString] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current focused index
  const getFocusedIndex = useCallback(() => {
    if (!focusedNodeId) return -1;
    return visibleNodes.findIndex((node) => node.id === focusedNodeId);
  }, [focusedNodeId, visibleNodes]);

  // Reset focus when nodes change and current focus is invalid
  useEffect(() => {
    if (visibleNodes.length === 0) {
      setFocusedNodeId(null);
      return;
    }

    const focusedIndex = getFocusedIndex();
    if (focusedIndex === -1 && focusedNodeId) {
      // Current focused node no longer visible, try to find nearest
      setFocusedNodeId(visibleNodes[0].id);
    }
  }, [visibleNodes, focusedNodeId, getFocusedIndex]);

  const focusNext = useCallback(() => {
    const currentIndex = getFocusedIndex();
    if (visibleNodes.length === 0) return;

    if (currentIndex === -1) {
      setFocusedNodeId(visibleNodes[0].id);
    } else if (currentIndex < visibleNodes.length - 1) {
      setFocusedNodeId(visibleNodes[currentIndex + 1].id);
    } else if (loop) {
      setFocusedNodeId(visibleNodes[0].id);
    }
  }, [visibleNodes, getFocusedIndex, loop]);

  const focusPrevious = useCallback(() => {
    const currentIndex = getFocusedIndex();
    if (visibleNodes.length === 0) return;

    if (currentIndex === -1) {
      setFocusedNodeId(visibleNodes[visibleNodes.length - 1].id);
    } else if (currentIndex > 0) {
      setFocusedNodeId(visibleNodes[currentIndex - 1].id);
    } else if (loop) {
      setFocusedNodeId(visibleNodes[visibleNodes.length - 1].id);
    }
  }, [visibleNodes, getFocusedIndex, loop]);

  const focusFirst = useCallback(() => {
    if (visibleNodes.length > 0) {
      setFocusedNodeId(visibleNodes[0].id);
    }
  }, [visibleNodes]);

  const focusLast = useCallback(() => {
    if (visibleNodes.length > 0) {
      setFocusedNodeId(visibleNodes[visibleNodes.length - 1].id);
    }
  }, [visibleNodes]);

  const reset = useCallback(() => {
    setFocusedNodeId(visibleNodes.length > 0 ? visibleNodes[0].id : null);
    setSearchString('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [visibleNodes]);

  // Get the current focused node
  const getFocusedNode = useCallback(() => {
    const index = getFocusedIndex();
    return index >= 0 ? visibleNodes[index] : null;
  }, [getFocusedIndex, visibleNodes]);

  // Handle expanding a node
  const handleExpand = useCallback(() => {
    const node = getFocusedNode();
    if (!node) return;

    if (node.isDirectory) {
      if (node.isExpanded) {
        // Already expanded, move to first child
        focusNext();
      } else if (onExpand) {
        // Expand the folder
        onExpand(node);
      }
    }
  }, [getFocusedNode, focusNext, onExpand]);

  // Handle collapsing a node
  const handleCollapse = useCallback(() => {
    const node = getFocusedNode();
    if (!node) return;

    if (node.isDirectory && node.isExpanded && onCollapse) {
      // Collapse the folder
      onCollapse(node);
    } else if (node.parentId) {
      // Move to parent
      setFocusedNodeId(node.parentId);
    }
  }, [getFocusedNode, onCollapse]);

  // Handle selecting a node
  const handleSelect = useCallback(() => {
    const node = getFocusedNode();
    if (node && onSelect) {
      onSelect(node);
    }
  }, [getFocusedNode, onSelect]);

  // Type-ahead search
  const handleTypeAhead = useCallback(
    (char: string) => {
      if (!typeAhead) return false;

      const newSearchString = searchString + char.toLowerCase();
      setSearchString(newSearchString);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout to reset search
      searchTimeoutRef.current = setTimeout(() => {
        setSearchString('');
      }, 500);

      // Find matching item starting from current position
      const currentIndex = getFocusedIndex();
      const startIndex = currentIndex >= 0 ? currentIndex : 0;

      // Search from current position to end
      for (let i = startIndex; i < visibleNodes.length; i++) {
        const text = getNodeText(visibleNodes[i]).toLowerCase();
        if (text.startsWith(newSearchString)) {
          setFocusedNodeId(visibleNodes[i].id);
          return true;
        }
      }

      // Wrap around and search from beginning
      for (let i = 0; i < startIndex; i++) {
        const text = getNodeText(visibleNodes[i]).toLowerCase();
        if (text.startsWith(newSearchString)) {
          setFocusedNodeId(visibleNodes[i].id);
          return true;
        }
      }

      return false;
    },
    [typeAhead, searchString, getFocusedIndex, visibleNodes, getNodeText]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusNext();
          break;

        case 'ArrowUp':
          event.preventDefault();
          focusPrevious();
          break;

        case 'ArrowRight':
          event.preventDefault();
          handleExpand();
          break;

        case 'ArrowLeft':
          event.preventDefault();
          handleCollapse();
          break;

        case 'Home':
          event.preventDefault();
          focusFirst();
          break;

        case 'End':
          event.preventDefault();
          focusLast();
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          handleSelect();
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
    [focusNext, focusPrevious, handleExpand, handleCollapse, focusFirst, focusLast, handleSelect, onEscape, handleTypeAhead]
  );

  const isFocused = useCallback(
    (id: string) => id === focusedNodeId,
    [focusedNodeId]
  );

  // Calculate depth for aria-level
  const getNodeDepth = useCallback((node: T): number => {
    let depth = 1;
    let current = node;
    while (current.parentId) {
      depth++;
      const parent = visibleNodes.find((n) => n.id === current.parentId);
      if (!parent) break;
      current = parent;
    }
    return depth;
  }, [visibleNodes]);

  const getContainerProps = useCallback(() => ({
    role: 'tree' as const,
    'aria-label': 'File Explorer',
    tabIndex: 0,
    onKeyDown: handleKeyDown,
  }), [handleKeyDown]);

  const getItemProps = useCallback((node: T) => ({
    role: 'treeitem' as const,
    'aria-expanded': node.isDirectory ? node.isExpanded : undefined,
    'aria-selected': isFocused(node.id),
    'aria-level': getNodeDepth(node),
    tabIndex: isFocused(node.id) ? 0 : -1,
    id: `tree-item-${node.id}`,
  }), [isFocused, getNodeDepth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    focusedNodeId,
    setFocusedNodeId,
    handleKeyDown,
    isFocused,
    getContainerProps,
    getItemProps,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    reset,
  };
}
