const templates = [
  { name: 'NOVA', category: 'Modern streaming', price: '$49', tone: 'violet' },
  { name: 'KAIRO', category: 'Content focused', price: '$59', tone: 'blue' },
  { name: 'AETHER', category: 'Minimal', price: '$39', tone: 'green' },
];

const features = [
  ['01', 'Automatic importing', 'Keep your catalogue fresh with scheduled jobs running in the background.'],
  ['02', 'Your server, your rules', 'Install everything on infrastructure you control.'],
  ['03', 'A real admin panel', 'Content, sources, users, branding and settings in one workspace.'],
  ['04', 'One core, many looks', 'Use the same foundation and swap the visual experience.'],
  ['05', 'Made for search', 'Clean URLs, metadata and content structures for discovery.'],
  ['06', 'Make it yours', 'Logo, colors, site name and visual details are yours to change.'],
];

function Logo() {
  return <span className="logo-mark"><span>AF</span></span>;
}

function Button({ children, light = false, small = false }) {
  return <a className={`button ${light ? 'button-light' : 'button-dark'} ${small ? 'button-small' : ''}`} href="#templates">{children} <span>↗</span></a>;
}

function HeroPreview() {
  return (
    <div className="hero-visual">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="browser-window">
        <div className="browser-bar">
          <div className="browser-dots"><i /><i /><i /></div>
          <div className="browser-url">your-anime-site.com</div>
          <div className="browser-menu">•••</div>
        </div>
        <div className="mock-site">
          <div className="mock-header">
            <div className="mock-brand"><span>A</span> ANIMORA</div>
            <div className="mock-links"><span>Home</span><span>Browse</span><span>Movies</span><span>Schedule</span></div>
            <div className="mock-user">●</div>
          </div>
          <div className="mock-hero">
            <div className="mock-copy">
              <small>WELCOME BACK</small>
              <h3>Stories you'll<br /><strong>remember.</strong></h3>
              <p>Discover something worth watching tonight.</p>
              <div className="mock-actions"><b>Start watching</b><span>Browse library</span></div>
            </div>
            <div className="mock-art"><div className="art-orb" /><div className="art-person" /></div>
          </div>
          <div className="mock-section-title"><span>Trending this week</span><small>View all →</small></div>
          <div className="mock-posters"><div /><div /><div /><div /></div>
        </div>
      </div>
      <div className="floating-card"><span className="floating-icon">✓</span><div><strong>Ready to launch</strong><small>Install · configure · go</small></div></div>
    </div>
  );
}

function TemplateCard({ template }) {
  return (
    <article className="template-card">
      <div className={`template-preview ${template.tone}`}>
        <div className="preview-nav"><strong>{template.name}</strong><span>Menu&nbsp; ☰</span></div>
        <div className="preview-copy"><small>YOUR ANIME PLATFORM</small><h3>Watch.<br /><em>Discover.</em><br />Repeat.</h3><span className="preview-cta">Explore library&nbsp; →</span></div>
        <div className="preview-stack"><i /><i /><i /></div>
      </div>
      <div className="template-info">
        <div><span>{template.category}</span><h3>{template.name}</h3><p>A polished starting point for a fast, memorable anime platform.</p></div>
        <strong>{template.price}</strong>
      </div>
      <a className="template-link" href="#preview">Preview <span>↗</span></a>
    </article>
  );
}

function App() {
  return (
    <div className="site-shell">
      <header className="navbar">
        <a className="brand" href="#top"><Logo /><span>AnimeFusion</span></a>
        <nav className="nav-links"><a href="#templates">Templates</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#docs">Docs</a></nav>
        <div className="nav-actions"><a className="login-link" href="#signin">Sign in</a><Button small>Get started</Button></div>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Made for anime site owners</div>
            <h1>Your next anime site<br /><span>starts here.</span></h1>
            <p className="hero-text">Beautiful, self-hosted website templates with the serious backend underneath. Pick a look, put it on your server and make it yours.</p>
            <div className="hero-actions"><Button>Browse templates</Button><a className="quiet-link" href="#how-it-works">How it works <span>→</span></a></div>
            <div className="hero-notes"><span><b>✓</b> One-time purchase</span><span><b>✓</b> Self-hosted</span><span><b>✓</b> No monthly platform fee</span></div>
          </div>
          <HeroPreview />
        </section>

        <div className="logo-strip"><span>BUILT FOR CREATORS</span><i /><span>SELF-HOSTED</span><i /><span>YOUR BRAND</span><i /><span>YOUR INFRASTRUCTURE</span><i /><span>READY TO DEPLOY</span></div>

        <section className="intro section-pad">
          <div className="section-kicker">THE IDEA</div>
          <div className="intro-grid"><h2>Stop rebuilding the same thing.<br /><span>Start with something good.</span></h2><p>You shouldn't have to spend weeks getting the boring parts right before you can work on the part people actually see. AnimeFusion gives you a polished foundation, then gets out of your way.</p></div>
        </section>

        <section id="features" className="features section-pad">
          <div className="section-heading"><div><div className="section-kicker">WHAT YOU GET</div><h2>The useful stuff is<br /><span>already there.</span></h2></div><p>Built for people who want to launch, not babysit a codebase.</p></div>
          <div className="feature-grid">{features.map(([number, title, text]) => <article className="feature-card" key={number}><div className="feature-top"><span>{number}</span><span>↗</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section id="templates" className="templates section-pad">
          <div className="section-heading"><div><div className="section-kicker">TEMPLATES</div><h2>Pick a look.<br /><span>Make it yours.</span></h2></div><a className="quiet-link" href="#all-templates">See the collection <span>→</span></a></div>
          <div className="template-grid">{templates.map(template => <TemplateCard key={template.name} template={template} />)}</div>
        </section>

        <section id="how-it-works" className="process section-pad">
          <div className="process-copy"><div className="section-kicker">NO MYSTERY</div><h2>Install it.<br /><span>Make it yours.</span></h2><p>Everything is designed around self-hosting. Connect your database, configure the site and launch.</p><Button light>Read the docs</Button></div>
          <div className="steps">{[['01', 'Choose your template', 'Start with the visual style that fits the brand.'], ['02', 'Put it on your server', 'Upload the package and open the installer.'], ['03', 'Connect and customize', 'Add database details, providers, logo, colors and settings.'], ['04', 'Go live', 'Finish setup and start building your audience.']].map(([num, title, text]) => <div className="step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></div>)}</div>
        </section>

        <section id="pricing" className="pricing section-pad">
          <div className="pricing-card">
            <div><div className="section-kicker">ONE-TIME PURCHASE</div><h2>Own the site.<br /><span>Choose the setup.</span></h2><p>No platform subscription for your deployed site. Buy a template and run it on your own infrastructure.</p></div>
            <div className="price-box"><small>Starting at</small><strong>$39</strong><span>per template</span><Button>View templates</Button></div>
          </div>
        </section>

        <section id="docs" className="cta section-pad">
          <div className="cta-inner"><div className="cta-orb" /><div className="section-kicker">READY?</div><h2>Make your anime site<br /><em>feel like yours.</em></h2><p>Start with a strong foundation. Take it wherever you want.</p><Button light>Explore AnimeFusion</Button></div>
        </section>
      </main>

      <footer className="footer section-pad">
        <div className="footer-top"><div className="footer-brand"><a className="brand" href="#top"><Logo /><span>AnimeFusion</span></a><p>A better starting point for your next anime platform.</p></div><div className="footer-links"><div><b>Product</b><a href="#templates">Templates</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div><div><b>Learn</b><a href="#docs">Documentation</a><a href="#preview">Demos</a><a href="#faq">FAQ</a></div><div><b>Company</b><a href="#contact">Contact</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a></div></div></div>
        <div className="footer-bottom"><span>© 2026 AnimeFusion</span><span>Built with care for anime site owners.</span></div>
      </footer>
    </div>
  );
}

export default App;
