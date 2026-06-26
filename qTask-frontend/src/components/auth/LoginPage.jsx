import { useState } from "react";
import {
  FolderKanban,
  LayoutGrid,
  Users,
  BarChart2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { loginUser } from "../../services/api";

const features = [
  {
    icon: LayoutGrid,
    label: "Kanban Boards",
    desc: "Drag-and-drop task flows",
    accent: "#3b82f6",
  },
  {
    icon: Users,
    label: "Team Workspaces",
    desc: "Real-time collaboration",
    accent: "#8b5cf6",
  },
  {
    icon: BarChart2,
    label: "Progress Reports",
    desc: "Velocity & burndown charts",
    accent: "#f59e0b",
  },
];

export default function LoginPage() {
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }
    try {
      setLoading(true);
      const data = await loginUser(form.username, form.password);
      login(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .qt * { box-sizing: border-box; margin: 0; padding: 0; }

        .qt {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: linear-gradient(135deg, #0f172a 60%, #1e3a5f);
          position: relative;
          overflow: hidden;
        }

        .qt::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 55% 45% at 10% 15%, rgba(59,130,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 45% 40% at 92% 85%, rgba(139,92,246,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 40% 35% at 50% 55%, rgba(245,158,11,0.05) 0%, transparent 55%);
          pointer-events: none;
        }

        .qt::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .qt-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }

        /* Brand */
        .qt-brand {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .logo-wrap {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(59,130,246,0.4);
        }
        .logo-text {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-weight: 800;
          font-size: 35px;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .logo-sub {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #475569;
        }
        .headline {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-weight: 800;
          font-size: 36px;
          line-height: 1.1;
          letter-spacing: -1px;
          color: #f8fafc;
        }
        .headline em {
          font-style: normal;
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subhead {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          max-width: 420px;
        }

        /* Body row */
        .qt-body {
          width: 100%;
          display: flex;
          align-items: stretch;
          gap: 0;
        }

        .qt-features {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
          padding-right: 32px;
        }

        .feature-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.25s ease;
          cursor: default;
        }
        .feature-card:hover {
          background: rgba(15, 23, 42, 0.7);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateX(3px);
        }
        .feature-card-glow {
          position: absolute;
          top: -20px; right: -20px;
          width: 70px; height: 70px;
          border-radius: 50%;
          opacity: 0.15;
          filter: blur(20px);
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .feature-card:hover .feature-card-glow {
          opacity: 0.25;
        }
        .feature-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          position: relative; z-index: 1;
        }
        .feature-text { position: relative; z-index: 1; }
        .feature-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 3px;
        }
        .feature-desc {
          font-size: 13px;
          font-weight: 500;
          color: #cbd5e1;
        }

        /* Divider */
        .qt-divider {
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 20%,
            rgba(255, 255, 255, 0.08) 80%,
            transparent 100%
          );
          align-self: stretch;
          flex-shrink: 0;
        }

        /* Form card — now dark glass */
        .form-section-card {
          flex: 1;
          margin-left: 32px;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .form-card-header {
          padding: 18px 24px;
          display: flex;
          align-items: baseline;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
        }
        .form-card-title {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: #f1f5f9;
          letter-spacing: -0.2px;
        }
        .form-card-sub {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748b;
        }
        .form-card-body { padding: 28px 24px 24px; }

        .error-banner {
          font-size: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .error-banner::before {
          content: '⚠';
          font-size: 13px;
          flex-shrink: 0;
        }

        .field-group { margin-bottom: 18px; }
        .field-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 7px;
        }
        .field-input-wrap {
          position: relative;
        }
        .field-input {
          width: 100%;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
        }
        .field-input::placeholder { color: #475569; }
        .field-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .field-input:disabled { opacity: 0.35; }
        .field-input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s;
          display: flex;
        }
        .field-input-icon:hover { color: #94a3b8; }

        .btn-submit {
          width: 100%;
          margin-top: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
          position: relative;
          overflow: hidden;
        }
        .btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.45);
          transform: translateY(-1px);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-footer {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 11px;
          color: #64748b;
        }

        .corner-deco {
          position: absolute;
          bottom: -80px; right: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          border: 1px solid rgba(59, 130, 246, 0.06);
          pointer-events: none;
          z-index: 0;
        }
        .corner-deco::before {
          content: '';
          position: absolute;
          inset: 30px;
          border-radius: 50%;
          border: 1px solid rgba(59, 130, 246, 0.04);
        }

        @media (max-width: 700px) {
          .qt-body { flex-direction: column; gap: 24px; }
          .qt-divider { display: none; }
          .qt-features { padding-right: 0; }
          .form-section-card { margin-left: 0; }
          .headline { font-size: 28px; }
        }
      `}</style>

      <div className="qt">
        <div className="qt-inner">
          {/* Brand */}
          <div className="qt-brand">
            <div className="logo-wrap">
              <div className="logo-icon">
                <FolderKanban size={18} color="#fff" />
              </div>
              <div>
                <div className="logo-text">qTask</div>
                <div className="logo-sub">Project Management</div>
              </div>
            </div>
            <h1 className="headline">
              Ship projects <em>faster,</em> together.
            </h1>
            <p className="subhead">
              Organise tasks, track progress, and keep your whole team in sync.
            </p>
          </div>

          {/* Body */}
          <div className="qt-body">
            {/* Features */}
            <div className="qt-features">
              {features.map(({ icon: Icon, label, desc, accent }) => (
                <div className="feature-card" key={label}>
                  <div
                    className="feature-card-glow"
                    style={{ background: accent }}
                  />
                  <div
                    className="feature-icon-wrap"
                    style={{ background: `${accent}1a` }}
                  >
                    <Icon size={16} color={accent} />
                  </div>
                  <div className="feature-text">
                    <div className="feature-label">{label}</div>
                    <div className="feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="qt-divider" />

            {/* Form */}
            <div className="form-section-card">
              <div className="form-card-header">
                <span className="form-card-title">Welcome back</span>
                <span className="form-card-sub">Sign in to continue</span>
              </div>
              <div className="form-card-body">
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label className="field-label" htmlFor="username">
                      Username
                    </label>
                    <input
                      id="username"
                      className="field-input"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={form.username}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Username"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="password">
                      Password
                    </label>
                    <div className="field-input-wrap">
                      <input
                        id="password"
                        className="field-input"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        className="field-input-icon"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" /> Signing in…
                      </>
                    ) : (
                      <>
                        Sign in <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
                <div className="form-footer">
                  Trouble signing in? Contact your workspace admin.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="corner-deco" />
      </div>
    </>
  );
}
