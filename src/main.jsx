import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell runtime-error-shell">
          <section className="card empty-card runtime-error-card">
            <p className="eyebrow">Runtime Error</p>
            <h3>页面渲染失败</h3>
            <p className="hint">已触发前端兜底，避免整页白屏。请刷新页面，或检查最近改动。</p>
            {this.state.error?.message ? <p className="hint">{this.state.error.message}</p> : null}
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
