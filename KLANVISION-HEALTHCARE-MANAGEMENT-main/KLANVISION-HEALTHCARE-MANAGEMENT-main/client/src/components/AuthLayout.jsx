export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <a href="/login" className="brand brand-light"><span className="brand-mark">+</span><span>careflow<span className="brand-period">.</span></span></a>
        <div className="aside-message">
          <span className="eyebrow">CARE, CONNECTED</span>
          <h1>Better care starts with a <em>better connection.</em></h1>
          <p>Find trusted doctors, book with confidence, and keep your care all in one place.</p>
        </div>
        <div className="aside-note"><span className="aside-check">✓</span> A calmer way to manage your health</div>
      </section>
      <section className="auth-main">
        <div className="auth-card">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
