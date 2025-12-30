'use client';

import { useEffect, useCallback } from 'react';
import {
  X,
  Settings,
  Type,
  Terminal,
  MessageSquare,
  Keyboard,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore, type TabSize, type ChatModel } from '@/lib/stores/settingsStore';
import { SettingItem, SettingSection } from './SettingItem';
import { AGENTS } from '@/lib/constants/agents';

type SettingsTab = 'general' | 'editor' | 'terminal' | 'chat' | 'keyboard';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { id: 'editor', label: 'Editor', icon: <Type className="w-4 h-4" /> },
  { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
  { id: 'chat', label: 'Chat/AI', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard className="w-4 h-4" /> },
];

export function SettingsPanel() {
  const {
    isSettingsOpen,
    closeSettings,
    activeSettingsTab,
    setActiveSettingsTab,
    resetToDefaults,
  } = useSettingsStore();

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSettings();
    }
  }, [closeSettings]);

  useEffect(() => {
    if (isSettingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSettingsOpen, handleKeyDown]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeSettings}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="w-48 border-r border-white/10 p-2 flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeSettingsTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSettingsTab === 'general' && <GeneralSettings />}
            {activeSettingsTab === 'editor' && <EditorSettings />}
            {activeSettingsTab === 'terminal' && <TerminalSettings />}
            {activeSettingsTab === 'chat' && <ChatSettings />}
            {activeSettingsTab === 'keyboard' && <KeyboardSettings />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#12121a]">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <span className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { autoSave, autoSaveDelay, setSetting } = useSettingsStore();

  return (
    <div>
      <SettingSection title="Auto Save">
        <SettingItem
          type="toggle"
          label="Enable Auto Save"
          description="Automatically save files after changes"
          value={autoSave}
          onChange={(value) => setSetting('autoSave', value)}
        />
        <SettingItem
          type="slider"
          label="Auto Save Delay"
          description="Delay in milliseconds before auto saving"
          value={autoSaveDelay}
          onChange={(value) => setSetting('autoSaveDelay', value)}
          min={500}
          max={5000}
          step={100}
          unit="ms"
        />
      </SettingSection>
    </div>
  );
}

function EditorSettings() {
  const {
    editorFontSize,
    editorTabSize,
    editorWordWrap,
    editorMinimap,
    editorLineNumbers,
    setSetting,
  } = useSettingsStore();

  return (
    <div>
      <SettingSection title="Font">
        <SettingItem
          type="slider"
          label="Font Size"
          description="Editor font size in pixels"
          value={editorFontSize}
          onChange={(value) => setSetting('editorFontSize', value)}
          min={10}
          max={24}
          unit="px"
        />
      </SettingSection>

      <SettingSection title="Indentation">
        <SettingItem
          type="select"
          label="Tab Size"
          description="Number of spaces for indentation"
          value={editorTabSize}
          onChange={(value) => setSetting('editorTabSize', value as TabSize)}
          options={[
            { label: '2 spaces', value: 2 },
            { label: '4 spaces', value: 4 },
            { label: '8 spaces', value: 8 },
          ]}
        />
      </SettingSection>

      <SettingSection title="Display">
        <SettingItem
          type="toggle"
          label="Word Wrap"
          description="Wrap long lines to fit the editor width"
          value={editorWordWrap}
          onChange={(value) => setSetting('editorWordWrap', value)}
        />
        <SettingItem
          type="toggle"
          label="Minimap"
          description="Show code minimap on the right side"
          value={editorMinimap}
          onChange={(value) => setSetting('editorMinimap', value)}
        />
        <SettingItem
          type="toggle"
          label="Line Numbers"
          description="Show line numbers in the gutter"
          value={editorLineNumbers}
          onChange={(value) => setSetting('editorLineNumbers', value)}
        />
      </SettingSection>
    </div>
  );
}

function TerminalSettings() {
  const { terminalFontSize, setSetting } = useSettingsStore();

  return (
    <div>
      <SettingSection title="Font">
        <SettingItem
          type="slider"
          label="Font Size"
          description="Terminal font size in pixels"
          value={terminalFontSize}
          onChange={(value) => setSetting('terminalFontSize', value)}
          min={10}
          max={20}
          unit="px"
        />
      </SettingSection>
    </div>
  );
}

function ChatSettings() {
  const { chatDefaultModel, chatDefaultAgent, setSetting } = useSettingsStore();

  const agentOptions = [
    { label: 'None (General)', value: '' },
    ...AGENTS.map((agent) => ({
      label: `${agent.icon} ${agent.displayName}`,
      value: agent.id,
    })),
  ];

  return (
    <div>
      <SettingSection title="AI Model">
        <SettingItem
          type="select"
          label="Default Model"
          description="Claude model to use for chat"
          value={chatDefaultModel}
          onChange={(value) => setSetting('chatDefaultModel', value as ChatModel)}
          options={[
            { label: 'Sonnet (Recommended)', value: 'sonnet' },
            { label: 'Opus (Most capable)', value: 'opus' },
            { label: 'Auto (Let Claude decide)', value: 'auto' },
          ]}
        />
      </SettingSection>

      <SettingSection title="Agents">
        <SettingItem
          type="select"
          label="Default Agent"
          description="Agent to use when starting a new conversation"
          value={chatDefaultAgent || ''}
          onChange={(value) => setSetting('chatDefaultAgent', (value as string) || null)}
          options={agentOptions}
        />
      </SettingSection>
    </div>
  );
}

function KeyboardSettings() {
  const shortcuts = [
    { key: 'Cmd + ,', action: 'Open Settings' },
    { key: 'Cmd + S', action: 'Save File' },
    { key: 'Cmd + P', action: 'Quick Open' },
    { key: 'Cmd + Shift + F', action: 'Global Search' },
    { key: 'Cmd + Shift + P', action: 'Command Palette' },
    { key: 'Cmd + B', action: 'Toggle Sidebar' },
    { key: 'Cmd + J', action: 'Toggle Terminal' },
    { key: 'Cmd + /', action: 'Toggle Comment' },
    { key: 'Cmd + Z', action: 'Undo' },
    { key: 'Cmd + Shift + Z', action: 'Redo' },
    { key: 'Escape', action: 'Close Panel/Modal' },
  ];

  return (
    <div>
      <SettingSection title="Keyboard Shortcuts">
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <span className="text-sm text-gray-400">{shortcut.action}</span>
              <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </SettingSection>

      <p className="text-xs text-gray-500 mt-4">
        * On Windows/Linux, replace Cmd with Ctrl
      </p>
    </div>
  );
}
