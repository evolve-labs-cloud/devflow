'use client';

import { cn } from '@/lib/utils';

interface AgentIconProps {
  className?: string;
  size?: number;
}

// Strategist - Chart/Strategy icon with rising bars
export function StrategistIcon({ className, size = 24 }: AgentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="strategist-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      {/* Rising bars */}
      <rect x="3" y="14" width="4" height="7" rx="1" fill="url(#strategist-grad)" />
      <rect x="10" y="10" width="4" height="11" rx="1" fill="url(#strategist-grad)" />
      <rect x="17" y="5" width="4" height="16" rx="1" fill="url(#strategist-grad)" />
      {/* Trend line */}
      <path
        d="M4 12L11 7L19 3"
        stroke="url(#strategist-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow head */}
      <path
        d="M16 3H19V6"
        stroke="url(#strategist-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Architect - Blueprint/Building blocks icon
export function ArchitectIcon({ className, size = 24 }: AgentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="architect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Main structure */}
      <path
        d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
        stroke="url(#architect-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner lines */}
      <path
        d="M12 22V12"
        stroke="url(#architect-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 7L12 12L3 7"
        stroke="url(#architect-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="12" cy="12" r="2" fill="url(#architect-grad)" />
    </svg>
  );
}

// Builder - Hammer/Construction icon
export function BuilderIcon({ className, size = 24 }: AgentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="builder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      {/* Hammer head */}
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="url(#builder-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Accent */}
      <circle cx="10" cy="10" r="1.5" fill="url(#builder-grad)" />
    </svg>
  );
}

// Guardian - Shield with checkmark icon
export function GuardianIcon({ className, size = 24 }: AgentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="guardian-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      {/* Shield outline */}
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="url(#guardian-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Checkmark */}
      <path
        d="M9 12l2 2 4-4"
        stroke="url(#guardian-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Chronicler - Book/Document with pen icon
export function ChroniclerIcon({ className, size = 24 }: AgentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="chronicler-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>
      {/* Book */}
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="url(#chronicler-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="url(#chronicler-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lines on page */}
      <path
        d="M8 7h8M8 11h6M8 15h4"
        stroke="url(#chronicler-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Map agent ID to icon component
export const AgentIconMap: Record<string, React.FC<AgentIconProps>> = {
  strategist: StrategistIcon,
  architect: ArchitectIcon,
  builder: BuilderIcon,
  guardian: GuardianIcon,
  chronicler: ChroniclerIcon,
};

// Generic AgentIcon component
export function AgentIcon({
  agentId,
  className,
  size = 24,
}: AgentIconProps & { agentId: string }) {
  const IconComponent = AgentIconMap[agentId];

  if (!IconComponent) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-gray-500/20 text-gray-400',
          className
        )}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  return <IconComponent className={className} size={size} />;
}
