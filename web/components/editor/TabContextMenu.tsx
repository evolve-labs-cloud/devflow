'use client';

import { useEffect, useRef } from 'react';
import {
  X,
  XCircle,
  Pin,
  PinOff,
  Copy,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/lib/stores/fileStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useListNavigation } from '@/hooks/useListNavigation';

interface TabContextMenuProps {
  path: string;
  position: { x: number; y: number };
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

/**
 * Context menu for editor tabs.
 * Provides actions like close, pin, copy path, etc.
 */
export function TabContextMenu({ path, position, onClose }: TabContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    closeFile,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
    togglePinned,
    isPinned,
    copyPath,
    openFiles,
  } = useFileStore();

  const pinned = isPinned(path);
  const tabIndex = openFiles.findIndex((f) => f.path === path);
  const hasTabsToRight = tabIndex < openFiles.length - 1;
  const hasOtherTabs = openFiles.length > 1;

  const menuItems: MenuItem[] = [
    {
      id: 'close',
      label: 'Close',
      icon: X,
      action: () => {
        closeFile(path);
        onClose();
      },
    },
    {
      id: 'close-others',
      label: 'Close Others',
      icon: XCircle,
      action: () => {
        closeOtherTabs(path);
        onClose();
      },
      disabled: !hasOtherTabs,
    },
    {
      id: 'close-right',
      label: 'Close to the Right',
      icon: ChevronRight,
      action: () => {
        closeTabsToRight(path);
        onClose();
      },
      disabled: !hasTabsToRight,
    },
    {
      id: 'close-all',
      label: 'Close All',
      icon: Trash2,
      action: () => {
        closeAllTabs();
        onClose();
      },
      danger: true,
      divider: true,
    },
    {
      id: 'pin',
      label: pinned ? 'Unpin Tab' : 'Pin Tab',
      icon: pinned ? PinOff : Pin,
      action: () => {
        togglePinned(path);
        onClose();
      },
      divider: true,
    },
    {
      id: 'copy-path',
      label: 'Copy Path',
      icon: Copy,
      action: () => {
        copyPath(path);
        onClose();
      },
    },
  ];

  // Focus trap for accessibility
  useFocusTrap(menuRef, true, {
    onEscape: onClose,
  });

  // Keyboard navigation
  const { selectedIndex, handleKeyDown, isSelected } = useListNavigation({
    items: menuItems.filter((item) => !item.disabled),
    onSelect: (item) => item.action(),
    onEscape: onClose,
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Use capture to get the event before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 300),
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[180px] py-1',
        'bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl',
        'animate-in fade-in-0 zoom-in-95 duration-100'
      )}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      role="menu"
      aria-label="Tab actions"
      onKeyDown={handleKeyDown}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const enabledIndex = menuItems
          .filter((i) => !i.disabled)
          .findIndex((i) => i.id === item.id);

        return (
          <div key={item.id}>
            {item.divider && index > 0 && (
              <div className="my-1 border-t border-white/10" role="separator" />
            )}
            <button
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                'transition-colors',
                item.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white',
                isSelected(enabledIndex) && !item.disabled && 'bg-white/5 text-white'
              )}
              onClick={item.action}
              disabled={item.disabled}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
              aria-disabled={item.disabled}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  item.disabled ? 'text-gray-600' : item.danger ? 'text-red-400' : 'text-gray-500'
                )}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
