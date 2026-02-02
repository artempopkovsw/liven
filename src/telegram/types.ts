export type TgCallback<T> = (error: unknown, value?: T) => void;

export interface TelegramCloudStorage {
  getItem(key: string, callback: TgCallback<string | null>): void;
  setItem(key: string, value: string, callback: TgCallback<boolean>): void;
  removeItem(key: string, callback: TgCallback<boolean>): void;
}

export interface TelegramWebApp {
  ready?: () => void;
  expand?: () => void;
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  initDataUnsafe?: unknown;
  CloudStorage?: TelegramCloudStorage;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
