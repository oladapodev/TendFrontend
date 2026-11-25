import Icon, { Logo } from '../components/Icon.jsx'
import './landing.css'

const problems = [
  { icon: 'hospital', title: 'Find a hospital', q: 'Which place might actually help?' },
  { icon: 'phone', title: 'Make the calls', q: 'Who has actually answered?' },
  { icon: 'users', title: 'Update your people', q: 'Does anyone know where you are?' },
]

const agents = [
  { icon: 'search', title: 'Find suitable care', text: 'Search nearby hospital records. Staff must confirm they can help.' },
  { icon: 'hospital', title: 'Call the hospital', text: 'Share your location and the details you allowed. Record what staff say.' },
  { icon: 'message', title: 'Call + text your people', text: 'Tell the family and friends you chose, with the same incident update.' },
  { icon: 'users', title: 'Alert nearby helpers', text: 'Reach enrolled people nearby who agreed to receive alerts.' },
]

const features = [
  { icon: 'users', tone: 'green', name: 'TendCircle', title: 'Emergency contacts', text: 'Add the people to call: name, number and relationship. You decide what each one receives.' },
  { icon: 'drop', tone: 'red', name: 'Medical ID', title: 'Emergency information', text: 'Blood group, genotype, allergies and known infections, ready for responders.' },
  { icon: 'map', tone: 'blue', name: 'TendFind', title: 'Help Locator', text: 'See hospitals and health centres around you. Call them or get directions in one tap.' },
  { icon: 'apple', tone: 'amber', name: 'TendDiet', title: 'Diet guidance', text: 'Tell us what your meals contain. AI suggests fruit, foods and how often to eat.' },
  { icon: 'activity', tone: 'purple', name: 'Fit Health', title: 'Physical health', text: 'Steps, calories, water and sleep in one simple view, with small goals you choose.' },
  { icon: 'chat', tone: 'green', name: 'TendTalk', title: 'Talk to the agent', text: 'Ask health questions, prepare for a visit and get plain-English answers.' },
]

const roadmap = [
  { tag: '01 · First demo', title: 'One press → one incident', items: ['Profile + sharing choices', 'A checked Abeokuta map', 'Hospital and contact test calls', 'A clear call-and-text timeline'] },
  { tag: '02 · Companion next', title: 'Prepare before help is needed', items: ['Report explanation + review', 'Care reminders and activity goals', 'Hospital locator', 'Travel Safe check-in plan'] },
  { tag: '03 · Validate later', title: 'Make it safe for real use', items: ['Enrolled nearby-helper network', 'Facility response agreements', 'Clinical + privacy review', 'Wearable and automatic triggers'] },
]

const stack = ['React', 'Python', 'FastAPI', 'Qdrant', 'Vapi', 'Twilio', 'WhatsApp', 'Nobus Cloud']

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="Example TendSOS incident screen">
      <div className="hv-card hv-sos">
        <div className="hv-sos-head">
          <span className="chip chip-red"><span className="dot dot-red" /> Incident live</span>
          <span className="demo-tag">Example</span>
        </div>
        <div className="hv-ring">
          <div className="hv-ring-inner">
            <span>SOS</span>
          </div>
        </div>
        <p className="hv-caption">Hospital · Family · Helpers</p>
      </div>

      <div className="hv-card hv-status">
        <p className="hv-title">TendSOS · Incident updates</p>
        {[
          { who: 'FMC Abeokuta', role: 'Hospital', s: 'Calling now', c: 'amber', i: 'hospital' },
          { who: 'Sister', role: 'TendCircle', s: 'Answered · aware', c: 'green', i: 'user' },
          { who: 'Chosen friend', role: 'TendCircle', s: 'Text sent', c: 'blue', i: 'message' },
          { who: 'Nearby helper', role: 'Opted in', s: 'Demo alert only', c: 'grey', i: 'users' },
        ].map((r) => (
          <div className="hv-row" key={r.who}>
            <span className={`hv-av tone-${r.c}`}><Icon name={r.i} size={16} /></span>
            <span className="hv-who">
              <strong>{r.who}</strong>
              <small>{r.role}</small>
            </span>
            <span className={`chip chip-${r.c}`}>{r.s}</span>
          </div>
        ))}
      </div>

      <div className="hv-card hv-mini">
        <Icon name="pin" size={18} />
        <div>
          <strong>Nearest care · 1.8 km</strong>
          <small>Route on real roads</small>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="landing">
      <header className="l-nav">
        <div className="l-wrap l-nav-inner">
          <a href="#/" aria-label="TendAI home"><Logo size={34} /></a>
          <nav className="l-links">
            <a href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }) }}>How it works</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a>
            <a href="#roadmap" onClick={(e) => { e.preventDefault(); document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' }) }}>Roadmap</a>
          </nav>
          <a className="btn btn-primary btn-sm" href="#/app">Open web app <Icon name="arrowRight" size={16} /></a>
        </div>
      </header>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-wrap l-hero-grid">
          <div className="l-hero-copy">
            <span className="eyebrow"><Icon name="shield" size={16} /> The emergency response system</span>
            <h1>
              One press.<br />
              <span className="accent">Start the call</span> for help.
            </h1>
            <p className="lead">
              TendSOS connects the hospital, your people and the information they need.
              TendAI is the companion that helps you stay ready.
            </p>
            <div className="l-cta">
              <a className="btn btn-primary" href="#/app">Try the web app <Icon name="arrowRight" size={18} /></a>
              <a className="btn btn-ghost" href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }) }}>See how it works</a>
            </div>
            <ul className="l-proof">
              <li><strong>100,000+</strong><span>care locations in our data</span></li>
              <li><strong>1 press</strong><span>starts a team of agents</span></li>
              <li><strong>Abeokuta</strong><span>first pilot city</span></li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* PROBLEM */}
      <section className="l-section">
        <div className="l-wrap">
          <div className="l-head">
            <span className="kicker">The problem</span>
            <h2>Getting help should not mean doing everything alone.</h2>
            <p>In an emergency, one person often has to find care, make calls and update family, all at once. The gap is coordination, not just another answer.</p>
          </div>
          <div className="l-problems">
            {problems.map((p, i) => (
              <article className="l-problem" key={p.title}>
                <span className="l-num">0{i + 1}</span>
                <span className="l-ico"><Icon name={p.icon} size={22} /></span>
                <h3>{p.title}</h3>
                <p>{p.q}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-section l-dark" id="how">
        <div className="l-wrap">
          <div className="l-head l-head-light">
            <span className="kicker">How TendSOS works</span>
            <h2>One button starts a team of agents.</h2>
            <p>The jobs run together, with clear rules for sharing and retries. A direct emergency-call option always stays available.</p>
          </div>
          <div className="l-flow">
            <div className="l-flow-start">
              <div className="l-sos-btn">SOS</div>
              <strong>You press once</strong>
              <small>A short countdown lets you cancel</small>
            </div>
            <div className="l-flow-agents">
              {agents.map((a) => (
                <article className="l-agent" key={a.title}>
                  <span className="l-agent-ico"><Icon name={a.icon} size={20} /></span>
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="l-steps">
            {[
              ['Locate', 'Use your shared location.'],
              ['Match', 'Find nearby care from our directory.'],
              ['Route', 'Follow real roads to the hospital.'],
            ].map(([t, d], i) => (
              <div className="l-step" key={t}>
                <span>{i + 1}</span>
                <div><strong>{t}</strong><small>{d}</small></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HONEST UPDATES */}
      <section className="l-section">
        <div className="l-wrap l-split">
          <div className="l-head l-head-left">
            <span className="kicker">Clear updates</span>
            <h2>Know who answered.</h2>
            <p>Every contact attempt has a clear, honest status. Calling is not the same as answered. Text sent is not the same as help confirmed. Failures are shown, and the next step is always clear.</p>
            <ul className="l-checks">
              <li><Icon name="check" size={18} /> Live status per hospital, contact and helper</li>
              <li><Icon name="check" size={18} /> Your medical ID ready to share with responders</li>
              <li><Icon name="check" size={18} /> “Call 112 directly” always one tap away</li>
            </ul>
          </div>
          <div className="l-status-demo">
            {[
              ['Calling now', 'amber', 'Hospital line is ringing'],
              ['Answered · aware', 'green', 'A person confirmed they know'],
              ['Text sent', 'blue', 'Delivered, not yet read'],
              ['No answer · retrying', 'red', 'We try again, then move on'],
              ['Demo alert only', 'grey', 'Clearly labelled simulation'],
            ].map(([s, c, d]) => (
              <div className="l-status-row" key={s}>
                <span className={`chip chip-${c}`}>{s}</span>
                <small>{d}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-section l-tint" id="features">
        <div className="l-wrap">
          <div className="l-head">
            <span className="kicker">The TendAI companion</span>
            <h2>Everyday care, ready when you need it.</h2>
            <p>Small tools with clear jobs, all in one companion. Every feature uses the same profile, your consent choices and clear limits.</p>
          </div>
          <div className="l-features">
            {features.map((f) => (
              <article className="l-feature" key={f.name}>
                <span className={`l-feature-ico tone-${f.tone}`}><Icon name={f.icon} size={22} /></span>
                <span className="l-feature-name">{f.name}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
          <p className="l-note"><Icon name="info" size={16} /> AI can explain and organise. Qualified professionals make clinical decisions.</p>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="l-section" id="roadmap">
        <div className="l-wrap">
          <div className="l-head">
            <span className="kicker">A practical first build</span>
            <h2>Start with a demo we can test.</h2>
            <p>We show the important workflow honestly and build the harder parts in stages.</p>
          </div>
          <div className="l-roadmap">
            {roadmap.map((r, i) => (
              <article className={`l-phase ${i === 0 ? 'is-now' : ''}`} key={r.tag}>
                <span className="l-phase-tag">{r.tag}</span>
                <h3>{r.title}</h3>
                <ul>
                  {r.items.map((it) => (
                    <li key={it}><Icon name="check" size={16} /> {it}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="l-stack">
            <span>Built with</span>
            {stack.map((s) => <b key={s}>{s}</b>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta-band">
        <div className="l-wrap l-cta-inner">
          <div>
            <h2>Help starts with a clear first step.</h2>
            <p>TendSOS starts the response. TendAI helps you stay ready.</p>
          </div>
          <div className="l-cta">
            <a className="btn btn-white" href="#/app">Open the web app <Icon name="arrowRight" size={18} /></a>
          </div>
        </div>
      </section>

      <footer className="l-foot">
        <div className="l-wrap l-foot-inner">
          <Logo size={28} />
          <p>
            Proposed system for the TendAI hackathon. Calls, texts and helper alerts need working integrations and consent.
            We are not claiming partnerships, deployment or measured outcomes. In an emergency, call <strong>112</strong>.
          </p>
        </div>
      </footer>
    </div>
  )
}
