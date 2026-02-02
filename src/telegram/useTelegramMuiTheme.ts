import { useEffect, useMemo } from 'react';
import { createTheme, type Theme } from '@mui/material/styles';
import { getTelegramThemeParams, initTelegramWebApp } from './telegram';

function hexToRgb(hex: string | undefined | null) {
  if (!hex || typeof hex !== 'string') return null;
  const normalized = hex.trim().replace('#', '');
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return null;
  return { r, g, b };
}

function relativeLuminance(rgb: { r: number; g: number; b: number }) {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(rgb.r);
  const G = toLinear(rgb.g);
  const B = toLinear(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function pickMode(bgColor: string) {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return 'light' as const;
  return relativeLuminance(rgb) < 0.25 ? ('dark' as const) : ('light' as const);
}

export function useTelegramMuiTheme(): Theme {
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return useMemo(() => {
    const tp = getTelegramThemeParams();

    const bg = tp.bg_color || '#ffffff';
    const text = tp.text_color || '#111111';
    const hint = tp.hint_color || '#6b7280';
    const primary = tp.button_color || '#2ea6ff';
    const primaryText = tp.button_text_color || '#ffffff';

    const mode = pickMode(bg);

    return createTheme({
      palette: {
        mode,
        background: {
          default: bg,
          paper: bg,
        },
        text: {
          primary: text,
          secondary: hint,
        },
        primary: {
          main: primary,
          contrastText: primaryText,
        },
      },
      shape: {
        borderRadius: 14,
      },
      typography: {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif",
      },
    });
  }, []);
}
