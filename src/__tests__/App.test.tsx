import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('App', () => {
  it('renders top bar title and Projects nav + heading', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    // App title in the header
    expect(screen.getByText(/Bead Pattern Designer/i)).toBeInTheDocument();

    // "Projects" in the nav (link)
    expect(screen.getByRole('link', { name: /Projects/i })).toBeInTheDocument();

    // "Projects" as the page heading
    expect(
      screen.getByRole('heading', { level: 1, name: /Projects/i }),
    ).toBeInTheDocument();
  });
});