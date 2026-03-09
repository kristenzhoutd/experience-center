import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught error:', error);
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary - Component stack trace:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          backgroundColor: '#fee',
          fontFamily: 'monospace',
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '10px' }}>
            ⚠️ Application Error
          </h1>
          <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>
            {this.state.error?.toString()}
          </h2>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Stack Trace
            </summary>
            <pre style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#fff',
              overflow: 'auto',
              fontSize: '12px',
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Component Stack
            </summary>
            <pre style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#fff',
              overflow: 'auto',
              fontSize: '12px',
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
