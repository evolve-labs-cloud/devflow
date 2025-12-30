import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get file extension from path
 */
export function getExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

/**
 * Get file name from path
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Get parent directory from path
 */
export function getParentDir(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

/**
 * Check if path is within base path (security)
 */
export function isPathWithinBase(basePath: string, targetPath: string): boolean {
  const normalizedBase = basePath.replace(/\/$/, '');
  const normalizedTarget = targetPath.replace(/\/$/, '');
  return normalizedTarget.startsWith(normalizedBase);
}

/**
 * Get language from file extension for Monaco
 */
export function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    py: 'python',
    sh: 'shell',
    bash: 'shell',
  };
  return languageMap[ext] || 'plaintext';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
