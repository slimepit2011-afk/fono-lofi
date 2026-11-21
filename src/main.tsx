import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SilentBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[FONO lofi] Silent recovery from UI error:', error, errorInfo);
    try {
      const raw = localStorage.getItem('fono:data') || localStorage.getItem('lullo:data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.playlists || !Array.isArray(parsed.playlists) || parsed.playlists.length === 0) {
          localStorage.removeItem('fono:data');
          localStorage.removeItem('lullo:data');
        }
      }
    } catch {}

    setTimeout(() => {
      this.setState({ hasError: false });
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      return <App />;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SilentBoundary>
      <App />
    </SilentBoundary>
  </React.StrictMode>
);
