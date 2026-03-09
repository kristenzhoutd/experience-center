import { useState, useEffect } from 'react';

interface DebugLog {
  timestamp: number;
  level: 'log' | 'warn' | 'error';
  message: string;
}

export default function DebugPanel() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Use queueMicrotask to defer state updates until after render
    console.log = (...args: unknown[]) => {
      originalLog(...args);
      queueMicrotask(() => {
        setLogs(prev => [...prev, {
          timestamp: Date.now(),
          level: 'log',
          message: args.map(a => String(a)).join(' ')
        }]);
      });
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      queueMicrotask(() => {
        setLogs(prev => [...prev, {
          timestamp: Date.now(),
          level: 'warn',
          message: args.map(a => String(a)).join(' ')
        }]);
      });
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      queueMicrotask(() => {
        setLogs(prev => [...prev, {
          timestamp: Date.now(),
          level: 'error',
          message: args.map(a => String(a)).join(' ')
        }]);
      });
    };

    // Add startup indicator (also deferred)
    queueMicrotask(() => {
      setLogs([{
        timestamp: Date.now(),
        level: 'log',
        message: '🟢 DebugPanel initialized - Renderer is running!'
      }]);
    });

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 999999,
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        Show Debug Panel
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: isMinimized ? 'auto' : '600px',
        maxHeight: isMinimized ? 'auto' : '400px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '11px',
        borderRadius: '8px',
        zIndex: 999999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: isMinimized ? 'none' : '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontWeight: 'bold', color: '#00ff00' }}>
          🐛 Debug Console ({logs.length} logs)
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setLogs([])}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
            }}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div
          style={{
            padding: '8px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column-reverse',
          }}
        >
          {logs.slice().reverse().map((log, i) => {
            const color = log.level === 'error' ? '#ff4444' :
                         log.level === 'warn' ? '#ffaa00' :
                         '#00ff00';

            return (
              <div
                key={logs.length - i}
                style={{
                  marginBottom: '4px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #222',
                  color,
                }}
              >
                <span style={{ color: '#666', marginRight: '8px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* System info footer */}
      {!isMinimized && (
        <div
          style={{
            padding: '6px 12px',
            borderTop: '1px solid #333',
            fontSize: '10px',
            color: '#666',
            backgroundColor: '#0a0a0a',
            borderRadius: '0 0 8px 8px',
          }}
        >
          <div>Location: {window.location.href}</div>
          <div>User Agent: {navigator.userAgent.substring(0, 60)}...</div>
          <div>API Available: {window.aiSuites ? '✅ Yes' : '❌ No'}</div>
        </div>
      )}
    </div>
  );
}
