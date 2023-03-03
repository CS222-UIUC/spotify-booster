import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

test('renders login button', () => {
  render(<App />);
  const buttonElement = screen.getByText('Login with Spotify');
  expect(buttonElement).toBeInTheDocument();
});
