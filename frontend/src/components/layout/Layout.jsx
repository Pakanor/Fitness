import React from 'react';
import '../../styles/tokens.css';

const LayoutStyles = `
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .layout-header {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
  }

  .layout-main {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .layout-container {
    width: 100%;
    max-width: var(--container-wide);
    margin: 0 auto;
    padding: 0 var(--space-4);
  }

  .layout-section {
    padding: var(--space-8) 0;
  }

  .layout-section--compact {
    padding: var(--space-6) 0;
  }

  .layout-section--spacious {
    padding: var(--space-12) 0;
  }

  .bento-grid {
    display: grid;
    gap: var(--space-4);
  }

  .bento-grid--2col {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-grid--asymmetric {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas:
      "main side"
      "main bottom";
  }

  .bento-item--main { grid-area: main; }
  .bento-item--side { grid-area: side; }
  .bento-item--bottom { grid-area: bottom; }

  @media (max-width: 900px) {
    .bento-grid--asymmetric {
      grid-template-columns: 1fr;
      grid-template-areas:
        "main"
        "side"
        "bottom";
    }
  }

  @media (max-width: 700px) {
    .bento-grid--2col,
    .bento-grid--3col {
      grid-template-columns: 1fr;
    }
  }

  .card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    transition: border-color var(--transition-base), background var(--transition-base), box-shadow var(--transition-base);
  }

  .card:hover {
    border-color: var(--color-border-default);
    box-shadow: var(--shadow-md);
  }

  .card--elevated {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-default);
    box-shadow: var(--shadow-lg);
  }

  .card--border-accent {
    border-left: 3px solid var(--color-accent);
  }

  .card--border-warn {
    border-left: 3px solid var(--color-warn);
  }

  .card--border-error {
    border-left: 3px solid var(--color-error);
  }

  .card--border-info {
    border-left: 3px solid var(--color-info);
  }

  .card-padded {
    padding: var(--space-5);
  }

  .card-padded--comfortable {
    padding: var(--space-6);
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .stack--tight { gap: var(--space-2); }
  .stack--loose { gap: var(--space-5); }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .row--tight { gap: var(--space-2); }
  .row--loose { gap: var(--space-5); }
  .row--justify { justify-content: space-between; }
  .row--wrap { flex-wrap: wrap; }

  .cluster {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-display {
    font-family: var(--font-display);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }

  .text-heading {
    font-family: var(--font-display);
    font-weight: 700;
    line-height: 1.2;
  }

  .text-label {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-fg-muted);
  }

  .text-mono {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .text-muted { color: var(--color-fg-muted); }
  .text-secondary { color: var(--color-fg-secondary); }
  .text-accent { color: var(--color-accent); }
  .text-warn { color: var(--color-warn); }
  .text-error { color: var(--color-error); }
  .text-success { color: var(--color-success); }

  .badge {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-pill);
    white-space: nowrap;
  }

  .badge--accent {
    background: var(--color-accent-dim);
    color: var(--color-accent);
  }

  .badge--warn {
    background: var(--color-warn-dim);
    color: var(--color-warn);
  }

  .badge--error {
    background: var(--color-error-dim);
    color: var(--color-error);
  }

  .badge--info {
    background: var(--color-info-dim);
    color: var(--color-info);
  }

  .badge--success {
    background: var(--color-success-dim);
    color: var(--color-success);
  }

  .badge--neutral {
    background: var(--color-bg-input);
    color: var(--color-fg-secondary);
    border: 1px solid var(--color-border-subtle);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 14px;
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
  }

  .btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn--primary {
    background: var(--color-accent);
    color: var(--color-bg-deep);
  }

  .btn--primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
    box-shadow: 0 0 0 3px var(--color-accent-dim);
  }

  .btn--secondary {
    background: var(--color-bg-input);
    color: var(--color-fg-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .btn--secondary:hover:not(:disabled) {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-default);
  }

  .btn--ghost {
    background: transparent;
    color: var(--color-fg-secondary);
  }

  .btn--ghost:hover:not(:disabled) {
    color: var(--color-fg-primary);
    background: var(--color-bg-input);
  }

  .btn--danger {
    background: var(--color-error-dim);
    color: var(--color-error);
    border: 1px solid transparent;
  }

  .btn--danger:hover:not(:disabled) {
    background: var(--color-error);
    color: var(--color-bg-deep);
  }

  .btn--icon {
    padding: var(--space-2);
    border-radius: var(--radius-sm);
  }

  .btn--sm {
    font-size: 12px;
    padding: var(--space-2) var(--space-3);
  }

  .btn--lg {
    font-size: 16px;
    padding: var(--space-4) var(--space-6);
  }

  .input {
    width: 100%;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: 14px;
    line-height: 1.5;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  }

  .input::placeholder {
    color: var(--color-fg-disabled);
  }

  .input:hover:not(:disabled):not(:read-only) {
    border-color: var(--color-border-default);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-accent-dim);
    background: var(--color-bg-card);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input-error {
    border-color: var(--color-error);
  }

  .input-error:focus {
    box-shadow: 0 0 0 3px var(--color-error-dim);
  }

  .label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-fg-secondary);
    margin-bottom: var(--space-2);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .form-hint {
    font-size: 12px;
    color: var(--color-fg-muted);
  }

  .form-error {
    font-size: 12px;
    color: var(--color-error);
  }

  .divider {
    height: 1px;
    background: var(--color-border-subtle);
    border: none;
    margin: var(--space-4) 0;
  }

  .divider--spaced {
    margin: var(--space-6) 0;
  }
`;

export default function Layout({ children, className = '' }) {
  return (
    <>
      <style>{LayoutStyles}</style>
      <div className={`layout ${className}`}>
        <main className="layout-main" role="main">
          <div className="layout-container">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}