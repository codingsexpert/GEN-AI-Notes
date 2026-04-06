const Header = () => {
  return (
    <header className="site-header">
      <div className="header-copy">
        <p className="brand-kicker">PDF Optimizer</p>
        <h2>Smart compression with quality-first defaults</h2>
        <p className="header-subcopy">
          Built for fast demos: upload, analyze, compress, compare, and download in one flow.
        </p>
      </div>
      <div className="header-badge-grid">
        <div className="header-badge">
          <span>Modes</span>
          <strong>Manual + Target</strong>
        </div>
        <div className="header-badge">
          <span>Batch Support</span>
          <strong>Up to 10 PDFs</strong>
        </div>
      </div>
    </header>
  );
};

export default Header;
