import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home screen', () => {
  render(<App />);
  expect(screen.getByText(/liven/i)).toBeInTheDocument();
  expect(screen.getByText(/athlio/i)).toBeInTheDocument();
});
