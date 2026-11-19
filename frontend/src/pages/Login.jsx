
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useAuthStore from "../store/authStore";
import ThemeToggle from "../components/ThemeToggle";

const SAVED_ACCOUNTS_KEY = "vims_saved_accounts_v2";
const LEGACY_SAVED_ACCOUNTS_KEY = "velosure_saved_accounts_v2";

const encodeCredential = (text) => {
  try {
    return btoa(encodeURIComponent(text));
  } catch {
    return text;
  }
};

const decodeCredential = (encoded) => {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return encoded;
  }
};

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_SAVED_ACCOUNTS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          setSavedAccounts(list);
          // Pick the most recently used account
          const mostRecent = list[0];
          if (mostRecent) {
            const decodedPassword = decodeCredential(mostRecent.password || "");
            setForm({
              email: mostRecent.email,
              password: decodedPassword,
            });
            setSelectedEmail(mostRecent.email);
            setRememberMe(true);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    // If the user manually changes the email, deselect the active card
    if (event.target.name === "email" && event.target.value !== selectedEmail) {
      setSelectedEmail("");
    }
  }

  function handleSelectAccount(account) {
    const decodedPassword = decodeCredential(account.password || "");
    setForm({
      email: account.email,
      password: decodedPassword,
    });
    setSelectedEmail(account.email);
    setRememberMe(true);
    toast.success(`Selected ${account.email}. Email & password filled! Press "Sign in" to continue.`, {
      duration: 3000,
    });
  }

  function handleUseAnotherAccount() {
    setSelectedEmail("");
    setForm({
      email: "",
      password: "",
    });
    toast.info("Cleared. Enter your email and password below.");
  }

  function handleRemoveAccount(event, emailToRemove) {
    event.stopPropagation();
    try {
      const updated = savedAccounts.filter((acc) => acc.email !== emailToRemove);
      setSavedAccounts(updated);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));

      if (selectedEmail === emailToRemove || form.email === emailToRemove) {
        setSelectedEmail("");
        setForm({ email: "", password: "" });
      }
      toast.info(`Removed ${emailToRemove} from this device.`);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const authRes = await login({
        email: form.email.trim(),
        password: form.password,
        rememberMe,
      });

      // Update multi-account storage
      try {
        const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];

        if (rememberMe) {
          const newAccountData = {
            email: form.email.trim(),
            password: encodeCredential(form.password),
            name: authRes?.user?.firstName
              ? `${authRes.user.firstName} ${authRes.user.lastName || ""}`.trim()
              : "",
            role: (authRes?.user?.role || "CUSTOMER").toUpperCase(),
            lastUsed: new Date().toISOString(),
          };

          const filtered = list.filter(
            (acc) => acc.email.toLowerCase() !== form.email.trim().toLowerCase()
          );
          const updated = [newAccountData, ...filtered];
          localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
        } else {
          const updated = list.filter(
            (acc) => acc.email.toLowerCase() !== form.email.trim().toLowerCase()
          );
          localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
        }
      } catch {
        // ignore storage errors
      }

      const role = (authRes?.user?.role || "").toUpperCase();
      toast.success("Welcome back!");
      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">V</span>
          VIMS
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">PROTECTION THAT MOVES WITH YOU</span>
          <h1>Confidence for every journey.</h1>
          <p>
            Manage your vehicles, explore insurance coverage, and keep your
            protection organized in one place.
          </p>

          {/* Vehicle Showcase Image Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-6 group">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=900"
              alt="Protected Vehicle"
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>25,000+ Vehicles Protected</span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                24/7 Roadside
              </span>
            </div>
          </div>

          <div className="auth-benefits">
            <span>✓ Manage your vehicles</span>
            <span>✓ Explore insurance quotes</span>
            <span>✓ Track policies and claims</span>
          </div>
        </div>

        <p className="auth-footer-note">
          Your journey. Your vehicle. Your protection.
        </p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="auth-mobile-logo" style={{ marginBottom: 0 }}>
              <span className="auth-logo-icon">V</span>
              VIMS
            </Link>
            <div className="ml-auto">
              <ThemeToggle size="sm" />
            </div>
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your details or choose a saved account below.</p>
          </div>

          {/* Saved Accounts Multi-Account Picker */}
          {savedAccounts.length > 0 && (
            <div className="auth-accounts-panel">
              <div className="auth-accounts-header">
                <span className="auth-accounts-title">
                  <span>Saved Accounts</span>
                  <span className="auth-accounts-count">{savedAccounts.length}</span>
                </span>
                <button
                  type="button"
                  className="auth-new-account-btn"
                  onClick={handleUseAnotherAccount}
                >
                  + Use another account
                </button>
              </div>

              <p className="auth-accounts-hint">
                Click an account to instantly fill email & password, then press Sign in:
              </p>

              <div className="auth-accounts-list">
                {savedAccounts.map((account) => {
                  const isSelected = selectedEmail === account.email;
                  const initial = (account.name || account.email)[0].toUpperCase();
                  const isAdmin = account.role === "ADMIN";

                  return (
                    <div
                      key={account.email}
                      className={`auth-account-card ${isSelected ? "is-active" : ""}`}
                      onClick={() => handleSelectAccount(account)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectAccount(account);
                        }
                      }}
                    >
                      <div className="auth-account-main">
                        <div
                          className={`auth-account-avatar ${isAdmin ? "admin" : ""}`}
                        >
                          {initial}
                        </div>
                        <div className="auth-account-details">
                          <div className="auth-account-name-row">
                            <span className="auth-account-name">
                              {account.name || account.email}
                            </span>
                            <span
                              className={`auth-account-role-tag ${
                                isAdmin ? "admin" : ""
                              }`}
                            >
                              {isAdmin ? "Admin" : "Customer"}
                            </span>
                          </div>
                          {account.name && (
                            <span className="auth-account-email">
                              {account.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="auth-account-actions">
                        {isSelected && (
                          <span className="auth-account-selected-pill">
                            ✓ Ready
                          </span>
                        )}
                        <button
                          type="button"
                          className="auth-account-remove-btn"
                          title="Remove from this device"
                          onClick={(e) => handleRemoveAccount(e, account.email)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <div className="auth-password-heading">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <div className="auth-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Save account checkbox */}
            <label className="auth-remember-row">
              <input
                type="checkbox"
                className="auth-remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className="auth-remember-label-group">
                <span className="auth-remember-title">
                  Save this account on this device
                </span>
                <span className="auth-remember-desc">
                  Auto-fills email & password and keeps you signed in for 30 days
                </span>
              </div>
            </label>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>

          <Link to="/" className="auth-back-link">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
