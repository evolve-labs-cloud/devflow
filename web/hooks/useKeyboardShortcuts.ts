'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useFileStore } from '@/lib/stores/fileStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';

export function useKeyboardShortcuts() {
  const { openModal, activeModal, closeModal, toggleSidebar, toggleTerminal, togglePreview } = useUIStore();
  const {
    activeFile,
    saveFile,
    closeFile,
    navigateBack,
    navigateForward,
    canGoBack,
    canGoForward,
    reopenClosedTab,
  } = useFileStore();
  const { openSettings, isSettingsOpen, closeSettings } = useSettingsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow Escape to close modals/settings even in inputs
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          e.preventDefault();
          closeSettings();
          return;
        }
        if (activeModal) {
          e.preventDefault();
          closeModal();
          return;
        }
      }

      // If in input and not using mod key, skip
      if (isInput && !modKey) return;

      // Cmd/Ctrl + P - Quick Open
      if (modKey && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        openModal('quickOpen');
        return;
      }

      // Cmd/Ctrl + Shift + F - Global Search
      if (modKey && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        openModal('globalSearch');
        return;
      }

      // Cmd/Ctrl + Shift + P - Command Palette
      if (modKey && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        openModal('commandPalette');
        return;
      }

      // Cmd/Ctrl + B - Toggle Sidebar
      if (modKey && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd/Ctrl + ` - Toggle Terminal
      if (modKey && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
        return;
      }

      // Cmd/Ctrl + Shift + V - Toggle Preview
      if (modKey && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        togglePreview();
        return;
      }

      // Cmd/Ctrl + S - Save File
      if (modKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (activeFile) {
          saveFile(activeFile);
        }
        return;
      }

      // Cmd/Ctrl + , - Open Settings
      if (modKey && e.key === ',') {
        e.preventDefault();
        openSettings();
        return;
      }

      // Cmd/Ctrl + Tab - Recent Files
      if (modKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        openModal('recentFiles');
        return;
      }

      // Cmd/Ctrl + W - Close Tab
      if (modKey && e.key === 'w' && !e.shiftKey) {
        e.preventDefault();
        if (activeFile) {
          closeFile(activeFile);
        }
        return;
      }

      // Cmd/Ctrl + Shift + T - Reopen Closed Tab
      if (modKey && e.shiftKey && e.key === 't') {
        e.preventDefault();
        reopenClosedTab();
        return;
      }

      // Alt + Left - Navigate Back
      if (e.altKey && e.key === 'ArrowLeft' && !modKey) {
        e.preventDefault();
        if (canGoBack()) {
          navigateBack();
        }
        return;
      }

      // Alt + Right - Navigate Forward
      if (e.altKey && e.key === 'ArrowRight' && !modKey) {
        e.preventDefault();
        if (canGoForward()) {
          navigateForward();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openModal,
    activeModal,
    closeModal,
    toggleSidebar,
    toggleTerminal,
    togglePreview,
    activeFile,
    saveFile,
    closeFile,
    navigateBack,
    navigateForward,
    canGoBack,
    canGoForward,
    reopenClosedTab,
    openSettings,
    isSettingsOpen,
    closeSettings,
  ]);
}
