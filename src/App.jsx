const templates = [
  {
    name: 'NOVA',
    type: 'Streaming Platform',
    price: '$49',
    description: 'Clean, cinematic and conversion-focused for modern anime brands.',
    tone: 'violet',
  },
  {
    name: 'KAIRO',
    type: 'Premium Platform',
    price: '$59',
    description: 'A bold content-first layout built for large libraries.',
    tone: 'blue',
  },
  {
    name: 'AETHER',
    type: 'Minimal Platform',
    price: '$39',
    description: 'Lightweight, elegant and designed for fast deployment.',
    tone: 'green',
  },
];

const features = [
  ['01', 'Automatic updates', 'Keep anime and episode data fresh with scheduled background jobs.'],
  ['02', 'Self-hosted', 'Your customers deploy the product on their own hosting and infrastructure.'],
  ['03', 'Powerful admin', 'Manage content, sources, branding, users and configuration from one place.'],
  ['04', 'Built to scale', 'A reusable core makes it possible to power multiple templates and sites.'],
  ['05', 'SEO ready', 'Clean routes, metadata and content structures designed for discoverability.'],
  ['06', 'Fully brandable', 'Change the site name, logo, colors and visual identity without rebuilding.'],
];

function App() {
  return (
    <div className="site-shell">
      <header className="navbar">
        <a className="brand" href="#top" aria-label="AnimeFusion home">
          <span className="brand-mark">AF</span>
          <span>AnimeFusion</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#templates">Templates</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#docs">Documentation</a>
        </nav>

        <div className="nav-actions">
          <a className="login-link" href="#login">Sign in</a>
          <a className="button button-dark button-small" href="#templates">Get started <span>→</span></a>
        </div>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Premium anime website platform</div>
            <h1>Launch your anime platform.<br /><em>Without starting over.</em></h1>
            <p className="hero-text">
              Premium, self-hosted anime website templates with a powerful core system,
              automatic updates and everything you need to launch fast.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#templates">Explore templates <span>→</span></a>
              <a className="text-link" href="#how-it-works">See how it works <span>↗</span></a>
            </div>
            <div className="trust-row">
              <span>Built for creators</span><span>·</span><span>Self-hosted</span><span>·</span><span>Ready to deploy</span>
            </div>
          </div>

          <div className="hero-product" aria-label="Product preview">
            <div className="browser-window">
              <div className="browser-bar">
                <div className="browser-dots"><i /><i /><i /></div>
                <div className="browser-url">demo.animefusion.site</div>
                <div className="browser-pill">LIVE</div>
              </div>
              <div className="mock-app">
                <div className="mock-sidebar">
                  <div className="mock-logo">A</div>
                  <div className="mock-nav active" />
                  <div className="mock-nav" /><div className="mock-nav" /><div className="mock-nav" />
                </div>
                <div className="mock-content">
                  <div className="mock-topline"><span>Good evening</span><span className="mock-avatar" /></div>
                  <div className="mock-title">Find your next<br /><strong>favorite story.</strong></div>
                  <div className="mock-search">⌕ &nbsp; Search anime, movies and more</div>
                  <div className="mock-label">TRENDING NOW</div>
                  <div className="mock-cards">
                    <div className="mock-card card-one"><b>01</b></div>
                    <div className="mock-card card-two"><b>02</b></div>
                    <div className="mock-card card-three"><b>03</b></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-stat"><span className="stat-icon">↗</span><div><strong>Ready to deploy</strong><small>Built for speed</small></div></div>
          </div>
        </section>

        <section className="ticker"><div>ONE CORE SYSTEM</div><span>✦</span><div>MULTIPLE TEMPLATES</div><span>✦</span><div>YOUR HOSTING</div><span>✦</span><div>YOUR BRAND</div><span>✦</span></section>

        <section className="intro section-pad">
          <div className="section-kicker">THE PLATFORM</div>
          <div className="intro-grid">
            <h2>Everything behind the scenes.<br /><span>Nothing holding you back.</span></h2>
            <p>AnimeFusion gives you the foundation to launch polished anime websites without rebuilding the same backend every time. Pick a design, configure it, install it on your own server and launch.</p>
          </div>
        </section>

        <section id="features" className="features section-pad">
          <div className="section-heading"><div><div className="section-kicker">WHY ANIMEFUSION</div><h2>Built like a product.<br />Designed like a brand.</h2></div><p>One reusable core. Endless possibilities.</p></div>
          <div className="feature-grid">
            {features.map(([number, title, text]) => <article className="feature-card" key={number}><span className="feature-number">{number}</span><h3>{title}</h3><p>{text}</p><span className="feature-arrow">↗</span></article>)}
          </div>
        </section>

        <section id="templates" className="templates section-pad">
          <div className="section-heading"><div><div className="section-kicker">THE COLLECTION</div><h2>Choose your front end.</h2></div><a className="text-link" href="#all-templates">View all templates <span>→</span></a></div>
          <div className="template-grid">
            {templates.map((template) => <article className="template-card" key={template.name}>
              <div className={`template-preview ${template.tone}`}>
                <div className="preview-top"><span>{template.name}</span><span>☰</span></div>
                <div className="preview-hero"><small>DISCOVER</small><strong>Your next<br />obsession.</strong><span className="preview-button">Explore →</span></div>
                <div className="preview-row"><i /><i /><i /></div>
              </div>
              <div className="template-info"><div><span className="template-type">{template.type}</span><h3>{template.name}</h3><p>{template.description}</p></div><strong className="template-price">{template.price}</strong></div>
              <a className="template-link" href="#preview">Preview template <span>↗</span></a>
            </article>)}
          </div>
        </section>

        <section id="how-it-works" className="process section-pad">
          <div className="process-copy"><div className="section-kicker">HOW IT WORKS</div><h2>From idea to<br /><span>live website.</span></h2><p>Customers use their own hosting. The installation system handles the setup, database configuration and initial configuration.</p><a className="button button-dark" href="#docs">Read the docs <span>→</span></a></div>
          <div className="steps">
            {[['01', 'Choose a template', 'Pick the design that fits your brand.'], ['02', 'Install on your server', 'Upload the package and launch the installer.'], ['03', 'Configure your site', 'Connect your provider and customize your brand.'], ['04', 'Launch', 'Your anime platform is ready for visitors.']].map(([num, title, text]) => <div className="step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}
          </div>
        </section>

        <section id="pricing" className="pricing section-pad">
          <div className="pricing-card"><div><div className="section-kicker">SIMPLE PRICING</div><h2>Own the platform.<br /><span>Host it your way.</span></h2><p>Start with a premium template and deploy it on infrastructure you control.</p></div><div className="price-box"><small>Templates from</small><strong>$39</strong><span>One-time purchase</span><a className="button button-dark" href="#templates">Browse templates <span>→</span></a></div></div>
        </section>

        <section id="docs" className="cta section-pad"><div className="cta-inner"><div className="section-kicker">READY WHEN YOU ARE</div><h2>Build something<br /><em>worth launching.</em></h2><p>Explore the collection and find the foundation for your next anime platform.</p><a className="button button-light" href="#templates">Explore AnimeFusion <span>→</span></a></div></section>
      </main>

      <footer className="footer section-pad"><div className="footer-brand"><a className="brand" href="#top"><span className="brand-mark">AF</span><span>AnimeFusion</span></a><p>Premium, self-hosted anime website templates.</p></div><div className="footer-links"><div><b>Product</b><a href="#templates">Templates</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div><div><b>Resources</b><a href="#docs">Documentation</a><a href="#preview">Demos</a><a href="#faq">FAQ</a></div><div><b>Company</b><a href="#contact">Contact</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a></div></div><div className="footer-bottom"><span>© 2026 AnimeFusion. All rights reserved.</span><span>Built for the next generation of anime platforms.</span></div></footer>
    </div>
  );
}

export default App;
