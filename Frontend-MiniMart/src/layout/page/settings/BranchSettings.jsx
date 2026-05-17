import "./branch-settings.css";
import posConfig from "../../../config/posConfig";

const BranchSettings = () => {
  const { branchName, cashierName, defaultLocationId, currencySymbol } =
    posConfig;

  return (
    <div className="page branch-settings-page">
      <header className="branch-settings-header">
        <div>
          <span className="branch-settings-eyebrow">Settings</span>
          <h2>Branch Settings</h2>
          <p className="branch-settings-subtitle">
            Quick view of the branch values used across the POS. Tie this screen
            to your settings table when you are ready to persist changes.
          </p>
        </div>
        <div className="branch-settings-status">
          <span className="status-pill">Active config</span>
          <span className="status-meta">POS configuration snapshot</span>
        </div>
      </header>

      <section className="branch-settings-hero">
        <div className="hero-content">
          <span className="hero-badge">Branch profile</span>
          <h3>{branchName}</h3>
          <p>
            This branch identity shows up on invoices, POS dashboards, and
            register receipts.
          </p>
          <div className="hero-tags">
            <span>Location ID {defaultLocationId}</span>
            <span>Default cashier {cashierName}</span>
            <span>Currency {currencySymbol}</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-row">
            <span>Branch name</span>
            <strong>{branchName}</strong>
          </div>
          <div className="hero-card-row">
            <span>Default cashier</span>
            <strong>{cashierName}</strong>
          </div>
          <div className="hero-card-row">
            <span>Location ID</span>
            <strong>{defaultLocationId}</strong>
          </div>
          <div className="hero-card-row">
            <span>Currency symbol</span>
            <strong>{currencySymbol}</strong>
          </div>
        </div>
      </section>

      <section className="branch-settings-grid">
        <article className="branch-settings-card">
          <div>
            <h4>Configuration details</h4>
            <p className="card-subtitle">
              Core identifiers used across transactions and analytics.
            </p>
          </div>
          <div className="settings-list">
            <div className="settings-item">
              <span className="settings-label">Branch name</span>
              <span className="settings-value">{branchName}</span>
            </div>
            <div className="settings-item">
              <span className="settings-label">Default cashier</span>
              <span className="settings-value">{cashierName}</span>
            </div>
            <div className="settings-item">
              <span className="settings-label">Default location ID</span>
              <span className="settings-value">{defaultLocationId}</span>
            </div>
            <div className="settings-item">
              <span className="settings-label">Currency symbol</span>
              <span className="settings-value">{currencySymbol}</span>
            </div>
          </div>
        </article>

      </section>
    </div>
  );
};

export default BranchSettings;
