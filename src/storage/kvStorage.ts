import { getTelegramWebApp } from '../telegram/telegram';
import type { TelegramCloudStorage } from '../telegram/types';

const APP_PREFIX = 'liven:';

function withPrefix(key: string) {
  return `${APP_PREFIX}${key}`;
}

function getCloudStorage(): TelegramCloudStorage | null {
  const tg = getTelegramWebApp();
  return tg?.CloudStorage || null;
}

export async function getItem(key: string): Promise<string | null> {
  const cloud = getCloudStorage();
  const fullKey = withPrefix(key);

  if (cloud && typeof cloud.getItem === 'function') {
    return new Promise((resolve) => {
      cloud.getItem(fullKey, (error, value) => {
        if (error) return resolve(null);
        resolve(typeof value === 'string' ? value : null);
      });
    });
  }

  try {
    const v = localStorage.getItem(fullKey);
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<boolean> {
  const cloud = getCloudStorage();
  const fullKey = withPrefix(key);

  if (cloud && typeof cloud.setItem === 'function') {
    return new Promise((resolve) => {
      cloud.setItem(fullKey, String(value ?? ''), (error) => {
        resolve(!error);
      });
    });
  }

  try {
    localStorage.setItem(fullKey, String(value ?? ''));
    return true;
  } catch {
    return false;
  }
}

export async function removeItem(key: string): Promise<boolean> {
  const cloud = getCloudStorage();
  const fullKey = withPrefix(key);

  if (cloud && typeof cloud.removeItem === 'function') {
    return new Promise((resolve) => {
      cloud.removeItem(fullKey, (error) => {
        resolve(!error);
      });
    });
  }

  try {
    localStorage.removeItem(fullKey);
    return true;
  } catch {
    return false;
  }
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown): Promise<boolean> {
  return setItem(key, JSON.stringify(value));
}
