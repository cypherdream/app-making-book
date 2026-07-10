import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { trackClientError } from '../services/analytics';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('Learning app crashed:', error);
    trackClientError(error.message, error.stack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <AlertTriangle className="mx-auto mb-3 text-amber-400" size={28} />
            <p className="text-sm font-medium mb-1">Something broke in this lesson.</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">Your saved progress is untouched. Reloading should fix it.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-md text-xs font-medium bg-[var(--bg-hover)] hover:bg-white/20"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
