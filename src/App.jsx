import { useState } from 'react';

const templates = [
  { name: 'Nova', label: 'Cinematic', price: '$49', className: 'nova', description: 'A polished, immersive interface for communities that want the watching experience to lead.' },
  { name: 'Kairo', label: 'Content-first', price: '$59', className: 'kairo', description: 'A catalogue-focused layout built for large libraries, discovery and editorial content.' },
  { name: 'Aether', label: 'Minimal', price: '$39', className: 'aether', description: 'A lightweight visual system for people who want the platform to stay quiet and fast.' },
];

const features = [
  ['01', 'Self-hosted core', 'Install AnimeFusion on infrastructure you control. Your site, database, configuration and deployment stay yours.'],
  ['02', 'Automatic importing', 'Scheduled jobs can pull anime metadata, seasons and episodes into your local catalogue instead of making you build it by hand.'],
  ['03', 'Provider architecture', 'Keep streaming sources behind a replaceable provider layer so the core platform does not depend on one provider.'],
  ['04', 'Powerful admin', 'Manage users, content, history, sources, branding, settings and platform data from one administration workspace.'],
  ['05', 'Template system', 'Swap the frontend experience without rebuilding the platform underneath. One core can power multiple storefront designs.'],
  ['06', 'Built for developers', 'Node, React, Vite and PostgreSQL give you a familiar stack you can inspect, extend and self-host.'],
  ['07', 'Cron & automation', 'Background jobs handle recurring imports, maintenance and other repetitive platform work automatically.'],
  ['08', 'SEO-ready foundation', 'Clean content routes, metadata and structured page architecture give each installation a strong foundation for discovery.'],
];

const steps = [
  ['01', 'Buy a template', 'Choose the visual experience you want. The platform core stays the same underneath.'],
  ['02', 'Upload it to your server', 'Use your own hosting, VPS or infrastructure. AnimeFusion is designed to be self-hosted.'],
  ['03', 'Run the installer', 'Open /install, connect PostgreSQL, configure the environment and create your first administrator.'],
  ['04', 'Connect your providers', 'Configure the content and streaming providers available to your installation.'],
  ['05', 'Launch your community', 'The installer is disabled after setup and your AnimeFusion site is ready for customization.'],
];

function Logo() { return <span className="logo-mark"><span>AF</span></span>; }

function Button({ children, href = '#templates', light = false, small = false }) {
  return <a className={`button ${light ? 'button-light' : 'button-dark'} ${small ? 'button-small' : ''}`} href={href}>{children}<span>↗</span></a>;
}

function ProductWindow() {
  return (
    <div className="product-window">
      <div className="product-toolbar"><div className="toolbar-dots"><i /><i /><i /></div><div className="toolbar-url">your-anime-site.example</div><span>•••</span></div>
      <div className="product-app">
        <div className="product-nav"><strong><i>AF</i> ANIMEFUSION</strong><span>Home</span><span>Browse</span><span>Schedule</span><span>Community</span><em>⌕</em><small>●</small></div>
        <div className="product-hero"><div className="hero-panel-copy"><label>YOUR BRAND · YOUR LIBRARY</label><h3>Build a home<br /><b>for your community.</b></h3><p>A self-hosted anime platform powered by one reusable core.</p><div><b>Start exploring</b><span>Browse library →</span></div></div><div className="hero-panel-art"><i /><strong /><span /></div></div>
        <div className="product-row-title"><b>Continue watching</b><span>View library →</span></div>
        <div className="product-posters"><i /><i /><i /><i /><i /></div>
      </div>
    </div>
  );
}

function TemplateCard({ template }) {
  return (
    <article className="market-card">
      <div className={`market-preview ${template.className}`}>
        <div className="market-nav"><b>{template.name.toUpperCase()}</b><span>Home&nbsp;&nbsp; Browse&nbsp;&nbsp; Search</span></div>
        <div className="market-copy"><small>ANIMEFUSION TEMPLATE</small><h3>{template.name}<br /><i>edition.</i></h3><span>Preview interface&nbsp; →</span></div>
        <div className="market-art"><i /><i /><i /></div>
      </div>
      <div className="market-meta"><div><small>{template.label}</small><h3>{template.name}</h3><p>{template.description}</p></div><strong>{template.price}</strong></div>
      <div className="market-actions"><a href="#demo">Live preview <span>↗</span></a><a href="#pricing">Get template <span>→</span></a></div>
    </article>
  );
}

function App() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="site-shell" id="top">
      <style>{`
        .site-shell{background:#fff;color:#111;overflow:hidden}.section-pad{padding-left:clamp(24px,6vw,100px);padding-right:clamp(24px,6vw,100px)}
        .navbar{height:72px;padding:0 clamp(24px,5vw,82px);background:rgba(255,255,255,.92);border-bottom:1px solid #e9e9e7;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
        .brand{font-family:'DM Sans',sans-serif;font-size:17px;letter-spacing:-.045em}.logo-mark{width:31px;height:31px;border-radius:9px;background:#111;box-shadow:none}.logo-mark span{font-size:8px}.nav-links{gap:30px;color:#777;font-size:12px}.nav-actions{gap:18px;font-size:12px}.button{min-height:44px;padding:0 18px;border-radius:10px;font-size:12px;gap:11px}.button-dark{background:#111;box-shadow:0 8px 22px #11111112}.button-light{background:#fff;color:#111;border:1px solid #ddd}.button-small{min-height:38px;padding:0 14px;border-radius:9px}
        .hero{max-width:1500px;min-height:720px;padding-top:92px;padding-bottom:95px;grid-template-columns:minmax(330px,.78fr) minmax(500px,1.22fr);gap:72px}.eyebrow{margin-bottom:22px;color:#777;font-size:9px}.eyebrow-dot{width:6px;height:6px;background:#111;box-shadow:none}.hero h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(52px,6.2vw,86px);font-weight:600;line-height:.94;letter-spacing:-.075em}.hero h1 span{color:#9a9a9d}.hero-text{max-width:500px;margin:25px 0 30px;font-size:14px;line-height:1.78;color:#707075}.hero-actions{gap:22px}.hero-notes{margin-top:32px;gap:16px;font-size:9px}.hero-notes b{color:#111}.hero-visual{padding:0}.browser-window{border-radius:18px;box-shadow:0 35px 90px #11111116,0 1px 4px #1111110b;transform:none}.mock-site{min-height:430px}.floating-card{right:-12px;bottom:22px;border-radius:12px;box-shadow:0 16px 40px #11111118}.floating-icon{background:#111;color:#fff}
        .logo-strip{background:#fff;min-height:58px;color:#999;border-color:#ededed;font-size:7px}.intro{padding-top:145px;padding-bottom:145px;max-width:1500px}.section-kicker{font-size:9px;color:#888}.intro-grid{margin-top:20px;grid-template-columns:1.3fr .7fr;gap:90px}.intro h2,.section-heading h2,.process h2,.pricing h2,.cta h2{font-family:'Space Grotesk',sans-serif;font-weight:600;letter-spacing:-.07em}.intro h2{font-size:clamp(42px,5vw,70px)}.intro p{font-size:13px;color:#777;line-height:1.9}
        .features{background:#f6f6f4;padding-top:115px;padding-bottom:130px}.section-heading{margin-bottom:58px}.section-heading h2{font-size:clamp(40px,4.6vw,64px)}.section-heading>p{font-size:11px}.feature-grid{gap:10px}.feature-card{min-height:255px;padding:27px;border-radius:16px;background:#fff;border:1px solid #e5e5e2;box-shadow:none}.feature-card:hover{transform:translateY(-3px);box-shadow:0 18px 45px #11111108}.feature-card h3{margin-top:76px;font-family:'Space Grotesk',sans-serif;font-size:18px}.feature-card p{font-size:11px;color:#7b7b80}
        .templates{max-width:1500px;padding-top:150px;padding-bottom:155px}.template-grid{gap:20px}.market-card{min-width:0}.market-preview{height:390px;border-radius:18px;position:relative;overflow:hidden;padding:22px;box-shadow:inset 0 0 0 1px #ffffff22}.market-preview.nova{color:#fff;background:radial-gradient(circle at 78% 20%,#bdbdbd 0,#656565 28%,transparent 48%),linear-gradient(145deg,#121212,#303030)}.market-preview.kairo{color:#fff;background:radial-gradient(circle at 75% 20%,#d0d0d0 0,#707070 28%,transparent 48%),linear-gradient(145deg,#0d0d0d,#292929)}.market-preview.aether{color:#111;background:radial-gradient(circle at 78% 20%,#fff 0,#cfcfcf 30%,transparent 50%),linear-gradient(145deg,#f0f0ee,#bdbdbd)}.market-nav{display:flex;justify-content:space-between;font-size:8px;opacity:.85}.market-nav b{font-size:9px;letter-spacing:.1em}.market-nav span{opacity:.55}.market-copy{position:absolute;left:28px;bottom:30px;z-index:2}.market-copy small{font-size:6px;letter-spacing:.18em;opacity:.55}.market-copy h3{font:600 52px/.84 'Space Grotesk',sans-serif;letter-spacing:-.075em;margin:10px 0 20px}.market-copy h3 i{font-style:normal;opacity:.55}.market-copy>span{display:inline-block;border:1px solid #ffffff45;border-radius:8px;padding:9px 12px;font-size:7px}.aether .market-copy>span{border-color:#1114}.market-art{position:absolute;right:25px;bottom:25px;width:48%;height:65%}.market-art i{position:absolute;display:block;border-radius:10px;box-shadow:0 15px 40px #00000025}.market-art i:nth-child(1){right:0;top:0;width:54%;height:75%;background:#ffffff24;transform:rotate(7deg)}.market-art i:nth-child(2){right:18%;bottom:0;width:54%;height:78%;background:#00000020;transform:rotate(-8deg)}.market-art i:nth-child(3){right:38%;bottom:8%;width:43%;height:60%;background:#ffffff18;transform:rotate(2deg)}.market-meta{display:flex;justify-content:space-between;gap:20px;padding:20px 2px 14px}.market-meta small{font-size:8px;color:#999;letter-spacing:.12em;text-transform:uppercase}.market-meta h3{margin:5px 0 6px;font:600 23px 'Space Grotesk',sans-serif;letter-spacing:-.045em}.market-meta p{max-width:350px;margin:0;font-size:11px;line-height:1.65;color:#777}.market-meta>strong{font:600 18px 'Space Grotesk',sans-serif}.market-actions{display:flex;border-top:1px solid #e5e5e5}.market-actions a{flex:1;padding:14px 2px;font-size:10px;font-weight:600}.market-actions a+a{text-align:right}.market-actions span{margin-left:7px}
        .process{padding-top:130px;padding-bottom:130px;background:#111;color:#fff;grid-template-columns:.72fr 1.28fr;gap:100px}.process h2{font-size:clamp(44px,5vw,70px)}.process-copy>p{font-size:12px}.steps{border-top-color:#2b2b2b}.step{padding:27px 0;border-bottom-color:#2b2b2b}.step h3{font-family:'Space Grotesk',sans-serif;font-size:18px}.step p{font-size:11px;color:#888}.process .section-kicker{color:#777}.pricing{padding-top:145px;padding-bottom:145px}.pricing-card{max-width:1180px;border-radius:22px;background:#f4f4f2;border-color:#e3e3df;padding:clamp(36px,6vw,72px)}.pricing-card p{font-size:12px}.price-box{border-radius:16px;background:#fff;border-color:#e5e5e2;box-shadow:0 10px 30px #11111108}.price-box strong{font-family:'Space Grotesk',sans-serif}.cta{padding-top:110px;padding-bottom:110px;background:#fff}.cta-inner{max-width:1180px;border-radius:24px;padding:105px 30px;background:#111;border-color:#111;box-shadow:0 25px 70px #11111118}.cta-orb{width:220px;height:220px;background:#fff2;filter:blur(45px)}.cta h2{font-size:clamp(44px,5.3vw,72px)}
        .faq{padding-top:120px;padding-bottom:125px;border-top:1px solid #e9e9e7}.faq-grid{display:grid;grid-template-columns:.75fr 1.25fr;gap:90px}.faq-grid h2{font:600 clamp(40px,4.5vw,62px)/1 'Space Grotesk';letter-spacing:-.065em;margin:18px 0}.faq-intro{max-width:380px;color:#777;font-size:13px;line-height:1.8}.faq-list{display:flex;flex-direction:column;gap:10px}.faq-item{border:1px solid #e4e4e1;border-radius:14px;background:#fff;overflow:hidden}.faq-button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:20px;border:0;background:none;padding:21px 22px;text-align:left;font:600 13px 'DM Sans',sans-serif;color:#111;cursor:pointer}.faq-button span:last-child{font-size:18px;color:#888}.faq-answer{padding:0 22px 20px;color:#777;font-size:12px;line-height:1.75}.faq-answer p{margin:0}
        .footer{background:#fff;border-top:1px solid #e8e8e8;padding-top:55px;padding-bottom:25px}.footer-top{padding-bottom:55px}.footer-brand p{font-size:11px;color:#8a8a8e}.footer-links{gap:70px}.footer-links b{font-size:10px}.footer-links a{font-size:10px;color:#777}.footer-bottom{padding-top:20px;border-top-color:#ededed;font-size:9px;color:#a0a0a3}
        @media(max-width:1050px){.hero{grid-template-columns:1fr;padding-top:65px}.hero-copy{max-width:760px}.hero-visual{margin-top:15px}.feature-grid,.template-grid{grid-template-columns:1fr 1fr}.intro-grid{grid-template-columns:1fr}.intro p{max-width:600px}.process{grid-template-columns:1fr;gap:55px}.faq-grid{grid-template-columns:1fr;gap:50px}.nav-links{display:none}}
        @media(max-width:680px){.navbar{height:62px}.nav-actions .login-link{display:none}.hero{min-height:auto;padding-top:58px;padding-bottom:65px}.hero h1{font-size:clamp(48px,14vw,68px)}.hero-text{font-size:13px}.hero-notes{display:none}.browser-window{border-radius:13px}.mock-site{min-height:330px;padding:10px}.mock-links{display:none}.floating-card{display:none}.intro{padding-top:95px;padding-bottom:100px}.feature-grid,.template-grid{grid-template-columns:1fr}.features,.templates{padding-top:90px;padding-bottom:100px}.market-preview{height:360px}.section-heading{display:block}.section-heading>p{margin-top:20px}.pricing-card{display:block}.price-box{margin-top:30px}.cta-inner{padding:75px 20px}.footer-links{gap:30px;flex-wrap:wrap}.footer-bottom{display:block}.footer-bottom span+span{display:none}}
      `}</style>

      <header className="navbar">
        <a className="brand" href="#top"><Logo /><span>AnimeFusion</span></a>
        <nav className="nav-links"><a href="#templates">Templates</a><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#docs">Docs</a></nav>
        <div className="nav-actions"><a className="login-link" href="#docs">Documentation</a><Button small href="#pricing">Get started</Button></div>
      </header>

      <main>
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> The self-hosted anime platform</div>
            <h1>Build your anime site.<br /><span>Own the experience.</span></h1>
            <p className="hero-text">AnimeFusion gives you a reusable platform core, automatic catalogue workflows and premium templates — so you can launch on your own infrastructure instead of starting from an empty repository.</p>
            <div className="hero-actions"><Button href="#templates">Explore templates</Button><a className="quiet-link" href="#how-it-works">See how it works <span>→</span></a></div>
            <div className="hero-notes"><span><b>✓</b> Self-hosted</span><span><b>✓</b> One core, many templates</span><span><b>✓</b> PostgreSQL</span></div>
          </div>
          <div className="hero-visual" id="demo"><ProductWindow /><div className="floating-card"><span className="floating-icon">✓</span><div><strong>Ready to deploy</strong><small>Install · configure · launch</small></div></div></div>
        </section>

        <div className="logo-strip"><span>SELF-HOSTED</span><i /><span>REACT + VITE</span><i /><span>NODE + EXPRESS</span><i /><span>POSTGRESQL</span><i /><span>YOUR BRAND</span><i /><span>YOUR INFRASTRUCTURE</span></div>

        <section className="intro section-pad">
          <div className="section-kicker">01 — The platform</div>
          <div className="intro-grid"><h2>One platform core.<br /><span>Different ways to make it yours.</span></h2><p>AnimeFusion is built around a simple idea: the hard platform work should be reusable. Install the core once, configure your providers and database, then choose the interface that fits your community.</p></div>
        </section>

        <section className="features section-pad" id="features">
          <div className="section-heading"><div><div className="section-kicker">02 — What ships with it</div><h2>Everything important.<br /><span>Nothing bolted on.</span></h2></div><p>The foundation is designed around the actual workflow of running a self-hosted anime website.</p></div>
          <div className="feature-grid">{features.map(([number, title, description]) => <article className="feature-card" key={number}><div className="feature-top"><span>{number}</span><span>ANIMEFUSION CORE</span></div><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>

        <section className="templates section-pad" id="templates">
          <div className="section-heading"><div><div className="section-kicker">03 — Template marketplace</div><h2>Choose the interface.<br /><span>Keep the platform.</span></h2></div><p>Templates change the presentation, not the foundation underneath your installation.</p></div>
          <div className="template-grid">{templates.map(template => <TemplateCard key={template.name} template={template} />)}</div>
        </section>

        <section className="process section-pad" id="how-it-works">
          <div className="process-copy"><div className="section-kicker">04 — Deployment</div><h2>From download<br /><span>to your live site.</span></h2><p>No hosted control panel. No locked infrastructure. Upload the package, run the installer, connect your database and providers, then take over from there.</p><Button href="#docs" light>Read the docs</Button></div>
          <div className="steps">{steps.map(([number, title, description]) => <div className="step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><b>↗</b></div>)}</div>
        </section>

        <section className="pricing section-pad" id="pricing">
          <div className="pricing-card"><div><div className="section-kicker">05 — Start your installation</div><h2>Buy the core.<br /><span>Pick your look.</span></h2><p>AnimeFusion is planned as a self-hosted software marketplace: a reusable platform core with visual templates you can install on your own infrastructure.</p></div><div className="price-box"><small>Template licences</small><strong>from $39</strong><span>one-time starting price</span><Button href="#templates">View templates</Button></div></div>
        </section>

        <section className="faq section-pad" id="docs">
          <div className="faq-grid"><div><div className="section-kicker">06 — Documentation</div><h2>Questions before<br />you deploy.</h2><p className="faq-intro">A few answers about how the self-hosted platform is intended to work.</p></div><div className="faq-list">
            {[
              ['Where does AnimeFusion run?', 'On infrastructure you control. The customer installation is self-hosted rather than a single centralized AnimeFusion hosting service.'],
              ['What happens at /install?', 'The installer is intended to guide the first deployment: database configuration, migrations, administrator creation and initial platform setup. After setup, the installer is disabled or removed.'],
              ['Can I change templates later?', 'Yes. The architecture is intentionally separated into a reusable platform core and visual templates, so the presentation can change without rebuilding the foundation.'],
              ['What database does it use?', 'The current platform direction uses PostgreSQL for the installation database and its core application data.'],
              ['Can I add or replace providers?', 'Yes. Providers are designed as a replaceable layer so a site owner can configure the providers available to their installation without hardcoding a single source into the core.'],
            ].map(([question, answer], index) => <div className="faq-item" key={question}><button className="faq-button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><span>{openFaq === index ? '−' : '+'}</span></button>{openFaq === index && <div className="faq-answer"><p>{answer}</p></div>}</div>)}
          </div></div>
        </section>

        <section className="cta section-pad"><div className="cta-inner"><div className="cta-orb" /><div className="section-kicker">YOUR SERVER. YOUR BRAND. YOUR PLATFORM.</div><h2>Stop starting from zero.<br /><em>Start with AnimeFusion.</em></h2><p>Build the community experience you want, then keep control of the software underneath it.</p><div className="hero-actions"><Button href="#templates" light>Explore templates</Button><a className="quiet-link" href="#docs" style={{ color: '#fff' }}>Read documentation <span>→</span></a></div></div></section>
      </main>

      <footer className="footer"><div className="footer-top section-pad"><div className="footer-brand"><a className="brand" href="#top"><Logo /><span>AnimeFusion</span></a><p>A self-hosted platform core and template marketplace for anime communities.</p></div><div className="footer-links"><div><b>Product</b><a href="#templates">Templates</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div><div><b>Resources</b><a href="#docs">Documentation</a><a href="#how-it-works">How it works</a><a href="#demo">Demo</a></div><div><b>Platform</b><a href="#features">Core</a><a href="#templates">Marketplace</a><a href="#top">About AnimeFusion</a></div></div></div><div className="footer-bottom section-pad"><span>© 2026 AnimeFusion. All rights reserved.</span><span>Self-hosted · Built for developers and anime communities.</span></div></footer>
    </div>
  );
}

export default App;
