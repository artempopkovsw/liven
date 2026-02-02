import './App.css';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './apps/home/Home';
import { GymHelperApp } from './apps/gym/GymHelperApp';
import { useTelegramMuiTheme } from './telegram/useTelegramMuiTheme';

export default function App() {
  const theme = useTelegramMuiTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gym" element={<GymHelperApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
