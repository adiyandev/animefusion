const templates = [
  { name: 'Nova', type: 'Premium streaming', price: '$49', accent: 'violet', description: 'A cinematic, modern interface built around discovery and watching.' },
  { name: 'Kairo', type: 'Content focused', price: '$59', accent: 'blue', description: 'A clean catalogue-first experience for large libraries.' },
  { name: 'Aether', type: 'Minimal', price: '$39', accent: 'green', description: 'Quiet, elegant and fast — for brands that prefer restraint.' },
];

const features = [
  ['01', 'Self-hosted by design', 'Run the platform on your own server and keep control of your infrastructure.'],
  ['02', 'Automated catalogue', 'Scheduled jobs keep anime, seasons and episodes organised without constant manual work.'],
  ['03', 'Provider system', 'Connect content providers through a clean, replaceable provider architecture.'],
  ['04', 'Admin workspace', 'Manage content, users, sources, branding and settings from one place.'],
  ['05', 'SEO-ready structure', 'Clean routes, metadata and content architecture built for discoverability.'],
  ['06', 'One core, many looks', 'Change the visual template without throwing away the platform underneath.'],
];

function Logo() {
  return <span className="logo-mark"><span>AF</span></span>;
}

function Button({ children, light = false, small = false }) {
  return <a className={`button ${light ? 'button-light' : 'button-dark'} ${small ? 'button-small' : ''}`} href="#templates">{children}<span>↗</span></a>;
}

function ProductWindow() {
  return (
    <div className="product-window">
      <div className="product-toolbar"><span /><span /><span /><div>animefusion.example</div><b>•••</b></div>
      <div className="product-app">
        <div className="product-nav"><strong><i>AF</i> ANIMORA</strong><span>Home</span><span>Browse</span><span>Movies</span><span>Schedule</span><em>⌕</em><small>●</small></div>
        <div className="product-hero">
          <div><label>FEATURED TONIGHT</label><h3>Stories worth<br /><b>staying for.</b></h3><p>Discover your next favourite series.</p><div><b>Start watching</b><span>Browse library →</span></div></div>
          <aside><i /><strong /></aside>
        </div>
        <div className="product-row-title"><b>Trending now</b><span>View all →</span></div>
        <div className="product-posters"><i /><i /><i /><i /><i /></div>
      </div>
    </div>
  );
}

function TemplateCard({ template }) {
  return (
    <article className="market-card">
      <div className={`market-preview ${template.accent}`}>
        <div className="market-nav"><b>{template.name.toUpperCase()}</b><span>Browse&nbsp;&nbsp; Search&nbsp;&nbsp; ☰</span></div>
        <div className="market-copy"><small>ANIMEFUSION TEMPLATE</small><h3>{template.name}<br /><i>edition.</i></h3><span>Explore library&nbsp; →</span></div>
        <div className="market-art"><i /><i /><i /></div>
      </div>
      <div className="market-meta"><div><small>{template.type}</small><h3>{template.name}</h3><p>{template.description}</p></div><strong>{template.price}</strong></div>
      <div className="market-actions"><a href="#preview">Live preview <span>↗</span></a><a href="#purchase">Get template <span>→</span></a></div>
    </article>
  );
}

const premiumStyles = `
  .site-shell{background:#fff;color:#111;overflow:hidden}.section-pad{padding-left:clamp(24px,6vw,100px);padding-right:clamp(24px,6vw,100px)}
  .navbar{height:68px;padding:0 clamp(24px,5vw,82px);background:rgba(255,255,255,.9);border-bottom:1px solid #e8e8e8;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
  .brand{font-family:Inter,'DM Sans',sans-serif;font-size:16px;letter-spacing:-.04em}.logo-mark{width:30px;height:30px;border-radius:9px;background:#111;box-shadow:none}.logo-mark span{font-size:8px}.nav-links{gap:28px;color:#666;font-size:12px}.nav-actions{gap:18px;font-size:12px}.button{min-height:44px;padding:0 18px;border-radius:10px;font-size:12px;gap:11px}.button-dark{background:#111;box-shadow:0 6px 18px #11111112}.button-small{min-height:38px;padding:0 14px;border-radius:9px}
  .hero{max-width:1500px;min-height:760px;padding-top:92px;padding-bottom:96px;grid-template-columns:minmax(330px,.78fr) minmax(500px,1.22fr);gap:72px}.eyebrow{margin-bottom:22px;color:#777;font-size:9px}.eyebrow-dot{width:6px;height:6px;background:#6d55e8;box-shadow:none}.hero h1{font-family:Inter,'DM Sans',sans-serif;font-size:clamp(52px,6.3vw,88px);font-weight:650;line-height:.94;letter-spacing:-.075em}.hero h1 span{color:#a4a4a8}.hero-text{max-width:500px;margin:25px 0 30px;font-size:14px;line-height:1.75;color:#6e6e73}.hero-actions{gap:22px}.hero-notes{margin-top:32px;gap:16px;font-size:9px}.hero-notes b{color:#6d55e8}.hero-visual{padding:0}.glow{display:none}.browser-window{border-radius:18px;box-shadow:0 35px 90px #11111116,0 1px 4px #1111110b;transform:none}.browser-bar{height:40px}.mock-site{min-height:430px}.floating-card{right:-12px;bottom:22px;border-radius:12px;box-shadow:0 16px 40px #11111118}
  .logo-strip{background:#fff;min-height:55px;color:#a0a0a3;border-color:#ededed;font-size:7px}.intro{padding-top:150px;padding-bottom:150px;max-width:1400px}.section-kicker{font-size:9px;color:#858589}.intro-grid{margin-top:20px;grid-template-columns:1.35fr .65fr;gap:90px}.intro h2,.section-heading h2,.process h2,.pricing h2,.cta h2{font-family:Inter,'DM Sans',sans-serif;font-weight:620;letter-spacing:-.07em}.intro h2{font-size:clamp(42px,5vw,70px)}.intro p{font-size:13px;color:#777;line-height:1.9}
  .features{background:#f7f7f5;padding-top:115px;padding-bottom:130px}.section-heading{margin-bottom:58px}.section-heading h2{font-size:clamp(40px,4.6vw,64px)}.section-heading>p{font-size:11px}.feature-grid{gap:10px}.feature-card{min-height:265px;padding:27px;border-radius:16px;background:#fff;border:1px solid #e6e6e3;box-shadow:none}.feature-card:hover{transform:translateY(-3px);box-shadow:0 18px 45px #11111108}.feature-card h3{margin-top:78px;font-family:Inter,'DM Sans',sans-serif;font-size:18px}.feature-card p{font-size:11px;color:#7b7b80}
  .templates{max-width:1500px;padding-top:150px;padding-bottom:155px}.template-grid{gap:20px}.market-card{min-width:0}.market-preview{height:390px;border-radius:18px;position:relative;overflow:hidden;padding:22px;box-shadow:inset 0 0 0 1px #ffffff22}.market-preview.violet{color:#fff;background:radial-gradient(circle at 78% 20%,#bda8ff 0,#67517f 28%,transparent 48%),linear-gradient(145deg,#17141e,#302735)}.market-preview.blue{color:#fff;background:radial-gradient(circle at 75% 20%,#8dc4d7 0,#466d7c 28%,transparent 48%),linear-gradient(145deg,#111a20,#1d313a)}.market-preview.green{color:#17201a;background:radial-gradient(circle at 78% 20%,#d2ead6 0,#9bb39e 30%,transparent 50%),linear-gradient(145deg,#e8eee8,#b5c5b5)}.market-nav{display:flex;justify-content:space-between;font-size:8px;opacity:.85}.market-nav b{font-size:9px;letter-spacing:.1em}.market-nav span{opacity:.55}.market-copy{position:absolute;left:28px;bottom:30px;z-index:2}.market-copy small{font-size:6px;letter-spacing:.18em;opacity:.55}.market-copy h3{font:600 52px/.84 Inter,'DM Sans',sans-serif;letter-spacing:-.075em;margin:10px 0 20px}.market-copy h3 i{font-style:normal;opacity:.55}.market-copy>span{display:inline-block;border:1px solid #ffffff45;border-radius:8px;padding:9px 12px;font-size:7px}.green .market-copy>span{border-color:#17201a45}.market-art{position:absolute;right:25px;bottom:25px;width:48%;height:65%}.market-art i{position:absolute;display:block;border-radius:10px;box-shadow:0 15px 40px #00000025}.market-art i:nth-child(1){right:0;top:0;width:54%;height:75%;background:#ffffff24;transform:rotate(7deg)}.market-art i:nth-child(2){right:18%;bottom:0;width:54%;height:78%;background:#00000020;transform:rotate(-8deg)}.market-art i:nth-child(3){right:38%;bottom:8%;width:43%;height:60%;background:#ffffff18;transform:rotate(2deg)}.market-meta{display:flex;justify-content:space-between;gap:20px;padding:20px 2px 14px}.market-meta small{font-size:8px;color:#999;letter-spacing:.12em;text-transform:uppercase}.market-meta h3{margin:5px 0 6px;font:600 23px Inter,'DM Sans',sans-serif;letter-spacing:-.045em}.market-meta p{max-width:350px;margin:0;font-size:11px;line-height:1.65;color:#777}.market-meta>strong{font:600 18px Inter,'DM Sans',sans-serif}.market-actions{display:flex;border-top:1px solid #e5e5e5}.market-actions a{flex:1;padding:14px 2px;font-size:10px;font-weight:600}.market-actions a+ a{text-align:right}.market-actions span{margin-left:7px}
  .process{padding-top:130px;padding-bottom:130px;background:#111;color:#fff;grid-template-columns:.72fr 1.28fr;gap:100px}.process h2{font-size:clamp(44px,5vw,70px)}.process-copy>p{font-size:12px}.steps{border-top-color:#2c2c2f}.step{padding:27px 0;border-bottom-color:#2c2c2f}.step h3{font-family:Inter,'DM Sans',sans-serif;font-size:18px}.step p{font-size:11px}.pricing{padding-top:145px;padding-bottom:145px}.pricing-card{max-width:1180px;border-radius:22px;background:#f5f5f3;border-color:#e4e4e1;padding:clamp(36px,6vw,72px)}.pricing-card p{font-size:12px}.price-box{border-radius:16px;background:#fff;border-color:#e7e7e5;box-shadow:0 10px 30px #11111108}.price-box strong{font-family:Inter,'DM Sans',sans-serif}.cta{padding-top:110px;padding-bottom:110px;background:#fff}.cta-inner{max-width:1180px;border-radius:24px;padding:105px 30px;background:#111;border-color:#111;box-shadow:0 25px 70px #11111118}.cta-orb{width:220px;height:220px;background:#6d55e850;filter:blur(45px)}.cta h2{font-size:clamp(44px,5.3vw,72px)}
  .footer{background:#fff;border-top:1px solid #e8e8e8;padding-top:55px;padding-bottom:25px}.footer-top{padding-bottom:55px}.footer-brand p{font-size:11px;color:#8a8a8e}.footer-links{gap:80px}.footer-links b{font-size:10px}.footer-links a{font-size:10px;color:#777}.footer-bottom{padding-top:20px;border-top-color:#ededed;font-size:9px;color:#a0a0a3}
  @media(max-width:1050px){.hero{grid-template-columns:1fr;padding-top:65px}.hero-copy{max-width:760px}.hero-visual{margin-top:15px}.feature-grid,.template-grid{grid-template-columns:1fr 1fr}.intro-grid{grid-template-columns:1fr}.intro p{max-width:600px}.process{grid-template-columns:1fr;gap:55px}.nav-links{display:none}}
  @media(max-width:680px){.navbar{height:62px}.nav-actions .login-link{display:none}.hero{min-height:auto;padding-top:58px;padding-bottom:65px}.hero h1{font-size:clamp(48px,14vw,68px)}.hero-text{font-size:13px}.hero-notes{display:none}.browser-window{border-radius:13px}.mock-site{min-height:330px;padding:10px}.mock-links{display:none}.mock-hero{min-height:190px;padding:25px}.floating-card{display:none}.intro{padding-top:95px;padding-bottom:100px}.feature-grid,.template-grid{grid-template-columns:1fr}.features,.templates{padding-top:90px;padding-bottom:100px}.market-preview{height:360px}.section-heading{display:block}.section-heading>p{margin-top:20px}.pricing-card{display:block}.price-box{margin-top:30px}.cta-inner{padding:75px 20px}.footer-links{gap:30px;flex-wrap:wrap}.footer-bottom{display:block}.footer-bottom span+span{display:none}}
`;

function App() {
  return (
    <div className="site-shell">
      <style>{premiumStyles}</style>
      <header className="navbar">
        <a className="brand" href="#top"><Logo /><span>AnimeFusion</span></a>
        <nav className="nav-links"><a href="#templates">Templates</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#docs">Documentation</a><a href="#preview">Demo</a></nav>
        <div className="nav-actions"><a className="login-link" href="#signin">Sign in</a><Button small>Get started</Button></div>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> The self-hosted anime platform</div>
            <h1>Build your anime site.<br /><span>Own the experience.</span></h1>
            <p className="hero-text">A polished platform core and premium templates for people who want to launch on their own infrastructure — without starting from an empty repository.</p>
            <div className="hero-actions"><Button>Explore templates</Button><a className="quiet-link" href="#how-it-works">See how it works <span>→</span></a></div>
            <div className="hero-notes"><span><b>✓</b> One-time purchase</span><span><b>✓</b> Self-hosted</span><span><b>✓</b> Your infrastructure</span></div>
          </div>
          <div className="hero-visual" id="preview"><ProductWindow /><div className="floating-card"><span className="floating-icon">✓</span><div><strong>Ready to launch</strong><small>Install · configure · go</small></div></div></div>
        </section>

        <div className="logo-strip"><span>SELF-HOSTED</span><i /><span>YOUR BRAND</span><i /><span>POSTGRESQL</span><i /><span>AUTOMATED IMPORTS</span><i /><span>READY TO DEPLOY</span></div>

        <section className="intro section-pad">
          <div className="section-kicker">THE PLATFORM</div>
          <div className="intro-grid"><h2>Start with a beautiful front end.<br /><span>Keep the serious stuff underneath.</span></h2><p>AnimeFusion separates the visual experience from the platform core. Choose a template, deploy it on your own server and customise the parts that make your site yours.</p></div>
        </section>

        <section id="features" className="features section-pad">
          <div className="section-heading"><div><div className="section-kicker">THE FOUNDATION</div><h2>Everything important.<br /><span>Already connected.</span></h2></div><p>A practical foundation for launching and maintaining a modern anime platform.</p></div>
          <div className="feature-grid">{features.map(([number, title, text]) => <article className="feature-card" key={number}><div className="feature-top"><span>{number}</span><span>↗</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section id="templates" className="templates section-pad">
          <div className="section-heading"><div><div className="section-kicker">TEMPLATE MARKETPLACE</div><h2>Choose your interface.<br /><span>Keep your platform.</span></h2></div><a className="quiet-link" href="#all-templates">View collection <span>→</span></a></div>
          <div className="template-grid">{templates.map(template => <TemplateCard key={template.name} template={template} />)}</div>
        </section>

        <section id="how-it-works" className="process section-pad">
          <div className="process-copy"><div className="section-kicker">DEPLOYMENT</div><h2>From download<br /><span>to launch.</span></h2><p>Everything is built around self-hosting. Connect your database, configure the platform, customise the brand and take it live.</p><Button light>Read documentation</Button></div>
          <div className="steps">{[['01','Choose a template','Start with the visual style that fits your brand.'],['02','Deploy to your server','Upload the package and open the installer.'],['03','Configure your platform','Connect PostgreSQL, providers, branding and settings.'],['04','Launch','Finish setup, disable the installer and go live.']].map(([num,title,text]) => <div className="step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></div>)}</div>
        </section>

        <section id="pricing" className="pricing section-pad">
          <div className="pricing-card"><div><div className="section-kicker">SIMPLE PRICING</div><h2>Buy the software.<br /><span>Run it your way.</span></h2><p>No platform subscription for your deployed site. Choose a template, put it on infrastructure you control and keep the experience yours.</p></div><div className="price-box"><small>Templates from</small><strong>$39</strong><span>one-time purchase</span><Button>Browse templates</Button></div></div>
        </section>

        <section id="docs" className="cta section-pad"><div className="cta-inner"><div className="cta-orb" /><div className="section-kicker">ANIMEFUSION</div><h2>Your platform starts<br /><em>with a better foundation.</em></h2><p>Pick a template. Deploy it. Make it yours.</p><Button light>Explore AnimeFusion</Button></div></section>
      </main>

      <footer className="footer section-pad"><div className="footer-top"><div className="footer-brand"><a className="brand" href="#top"><Logo /><span>AnimeFusion</span></a><p>A premium starting point for your next anime platform.</p></div><div className="footer-links"><div><b>Product</b><a href="#templates">Templates</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div><div><b>Resources</b><a href="#docs">Documentation</a><a href="#preview">Demos</a><a href="#how-it-works">Installation</a></div><div><b>Company</b><a href="#contact">Contact</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a></div></div></div><div className="footer-bottom"><span>© 2026 AnimeFusion</span><span>Built for anime site owners.</span></div></footer>
    </div>
  );
}

export default App;
