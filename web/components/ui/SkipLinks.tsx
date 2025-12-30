'use client';

/**
 * Skip Links component for keyboard accessibility.
 * Provides quick navigation to main content areas for screen reader users.
 * Links are visually hidden but appear on focus.
 */

interface SkipLink {
  href: string;
  label: string;
}

const skipLinks: SkipLink[] = [
  { href: '#main-editor', label: 'Skip to editor' },
  { href: '#main-sidebar', label: 'Skip to sidebar' },
  { href: '#main-chat', label: 'Skip to chat' },
];

export function SkipLinks() {
  return (
    <nav aria-label="Skip navigation" className="sr-only focus-within:not-sr-only">
      <ul className="fixed top-0 left-0 z-[100] flex gap-2 p-2 bg-[#12121a] border-b border-white/10">
        {skipLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="sr-only focus:not-sr-only focus:inline-block px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
