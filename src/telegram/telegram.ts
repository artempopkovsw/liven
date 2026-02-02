import type { TelegramWebApp } from './types';

export function getTelegramWebApp(): TelegramWebApp | null {
  return (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) || null;
}

export function initTelegramWebApp(): TelegramWebApp | null {
  const tg = getTelegramWebApp();
  if (!tg) return null;

  try {
    tg.ready?.();
  } catch {
    // ignore
  }

  try {
    tg.expand?.();
  } catch {
    // ignore
  }

  return tg;
}

export function getTelegramThemeParams() {
  const tg = getTelegramWebApp();
  return tg?.themeParams || {};
}

export function getTelegramInitDataUnsafe() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe || null;
}
