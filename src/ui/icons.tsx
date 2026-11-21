import React from 'react';
import { icons as baseIcons } from './raw_icons';

export const icons: Record<string, string> = {
  ...baseIcons,
  youtube: `<path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`,
  spotify: `<path fill="#1ED760" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.684.47-1.042.252-2.855-1.744-6.448-2.139-10.68-1.173-.41.094-.82-.164-.913-.574-.094-.41.164-.82.574-.913 4.636-1.06 8.608-.61 11.809 1.365.358.218.47.684.252 1.043zm1.468-3.262c-.274.446-.86.589-1.306.315-3.268-2.008-8.25-2.592-12.115-1.417-.499.151-1.026-.134-1.178-.633-.151-.499.134-1.026.633-1.178 4.417-1.34 9.913-.687 13.651 1.607.446.274.589.86.315 1.306zm.126-3.41c-3.918-2.327-10.375-2.541-14.128-1.402-.6.183-1.237-.16-1.419-.76-.183-.6.16-1.237.76-1.419 4.312-1.309 11.439-1.056 15.943 1.618.539.32.716 1.018.396 1.557-.32.539-1.018.716-1.552.396z"/>`,
  google: `<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>`,
  apple: `<path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.14.67-2.81 1.45-.59.68-1.11 1.78-.97 2.84 1.11.09 2.18-.56 2.82-1.34z"/>`,
  video: `<rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="10,8 16,12 10,16" fill="currentColor"/>`,
  external: `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  creditCard: `<rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"/><line x1="6" y1="15" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>`,
  visa: `<path fill="#1A1F71" d="M9.5 15.5L11.5 6h2.2l-2 9.5H9.5zm7.3-9.3c-.5-.2-1.2-.4-2.1-.4-2.3 0-3.9 1.2-3.9 3 0 1.3 1.2 2 2.1 2.4.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-.9 0-1.5-.1-2.2-.5l-.3-.2-.3 1.9c.5.2 1.5.4 2.5.4 2.4 0 4-1.2 4-3.1 0-1-.6-1.8-2-2.5-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.8 1.3-.8.7 0 1.3.2 1.7.4l.2.1.5-1.7zm5.2 0h-1.7c-.5 0-1 .2-1.2.7l-3.5 8.6h2.4l.5-1.3h2.9l.3 1.3h2.1L22 6.2zm-2.7 5.7l1.2-3.2.7 3.2h-1.9zM7.2 6.2L5 12.8 4.8 11.6C4.4 10.3 3.3 8.9 2 8.2l1.9 7.3h2.4l3.6-9.3H7.2z"/><path fill="#F7B600" d="M3.7 6.2H0l.1.3c2.9.7 4.8 2.5 5.6 4.6L4.8 6.9c-.2-.5-.6-.7-1.1-.7z"/>`,
  mastercard: `<circle cx="9" cy="12" r="6" fill="#EB001B"/><circle cx="15" cy="12" r="6" fill="#F79E1B"/><path fill="#FF5F00" d="M12 7.76a5.98 5.98 0 0 0-2 4.24c0 1.63.74 3.09 1.9 4.1a6 6 0 0 0 2.2-4.1 6 6 0 0 0-2.1-4.24z"/>`,
  gpay: `<path fill="#4285F4" d="M11.9 10.2v3.6h5.8c-.3 1.5-1.5 3.3-3.8 4.2-2.1.8-4.7.4-6.4-1.3-2.1-2.1-2.1-5.6 0-7.7 2-2 5.2-2.1 7.3-.2l2.7-2.7C14.7 3.6 10.6 3.6 7.6 6.3 4.2 9.5 4.1 14.8 7.3 18c3.4 3.4 8.7 3.4 12.1 0 2.4-2.3 3.1-5.8 2.7-8.9h-10.2z"/><path fill="#34A853" d="M20.5 12.5h-8.6v-2.3h8.6v2.3z"/>`,
  lock: `<rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2"/>`,
  user: `<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" stroke-width="2"/>`,
  receipt: `<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2zM8 8h8M8 12h8M8 16h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  shieldCheck: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  checkCircle: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12l3 3 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  volumeX: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  touchId: `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 2a10 10 0 0 0-7.07 2.93M19.07 4.93A10 10 0 0 0 12 2m-4.95 5.05A7 7 0 0 0 5 12c0 2.22.8 4.25 2.12 5.82m9.76 0A7 7 0 0 0 19 12a7 7 0 0 0-2.05-4.95M12 7a5 5 0 0 0-3.54 1.46M15.54 8.46A5 5 0 0 0 12 7m-2.12 4.88A3 3 0 0 0 9 12c0 1.25.75 2.32 1.83 2.78m2.34 0A3 3 0 0 0 15 12a3 3 0 0 0-.88-2.12M12 11a1 1 0 0 0-1 1c0 .55.45 1 1 1s1-.45 1-1a1 1 0 0 0-1-1"/>`,
  stripe: `<path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.652.71 15.018 0 12.181 0 5.892 0 1.547 3.327 1.547 8.799c0 5.758 5.772 7.781 9.53 9.176 2.502.923 3.332 1.644 3.332 2.627 0 .979-.902 1.492-2.392 1.492-2.364 0-5.385-1.144-7.404-2.229l-.95 5.629c2.25 1.137 5.72 1.879 8.674 1.879 6.643 0 11.238-3.084 11.238-8.847.001-6.104-5.908-8.03-9.599-9.576z"/>`,
  trash: `<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  sparkles: `<path d="M12 3l1.912 5.885L19.8 10.8 13.912 12.715 12 18.6l-1.912-5.885L4.2 10.8l5.888-1.915L12 3z" fill="currentColor"/>`
};

export interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
  className?: string;
  title?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size, className = '', title }) => {
  const html = icons[name] || icons.info || '';
  const sizeClass = typeof size === 'string' && ['xs', 'sm', 'md', 'lg', 'xl'].includes(size) ? `ico--${size}` : '';
  const inlineSize = typeof size === 'number' ? { width: size, height: size } : {};

  return (
    <svg
      className={`ico ${sizeClass} ${className}`.trim()}
      viewBox="0 0 24 24"
      style={inlineSize}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Icon;
