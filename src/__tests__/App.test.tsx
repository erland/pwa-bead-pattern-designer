import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App', () => {
  it('renders top bar title and navigation', () => {
    // Render App on a route that does NOT use the Zustand store (e.g. /convert)
    render(
      <MemoryRouter initialEntries={['/convert']}>
        <App />
      </MemoryRouter>,
    );

    // App title in the header
    expect(screen.getByText(/Bead Pattern Designer/i)).toBeInTheDocument();

    // Nav links should still be there in the header
    expect(screen.getByRole('link', { name: /Patterns/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Convert Image/i })).toBeInTheDocument();

    // And the /convert page heading should be rendered
    expect(
      screen.getByRole('heading', { level: 1, name: /Image to Pattern/i }),
    ).toBeInTheDocument();
  });
});