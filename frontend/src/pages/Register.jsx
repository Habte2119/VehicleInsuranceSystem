


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/axios";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password.length < 8) {
      toast.error("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { confirmPassword, ...signupData } = form;
      const response = await api.post("/auth/signup", signupData);

      toast.success(response.data.message || "Account created successfully.");

      navigate("/verify-email", {
        state: { email: form.email.trim() },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please check your details and try again."
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
          <span className="auth-eyebrow">START YOUR JOURNEY</span>
          <h1>Protection starts here.</h1>
          <p>
            Create your account to organize your vehicle information and
            explore insurance coverage built around your needs.
          </p>

          {/* Vehicle Showcase Image Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-6 group">
            <img
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=900"
              alt="Protected Vehicle"
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Instant Digital Policy Binding</span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                Full Protection
              </span>
            </div>
          </div>

          <div className="auth-benefits">
            <span>✓ One place for your insurance needs</span>
            <span>✓ Convenient vehicle management</span>
            <span>✓ Easy access to your policies and claims</span>
          </div>
        </div>

        <p className="auth-footer-note">
          A simpler way to manage vehicle insurance.
        </p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-mobile-logo">
            <span className="auth-logo-icon">V</span>
            VIMS
          </Link>

          <div className="auth-heading">
            <span className="auth-eyebrow">CREATE AN ACCOUNT</span>
            <h2>Get started today</h2>
            <p>Enter your details to create your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-name-grid">
              <div className="auth-field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <label htmlFor="registerEmail">Email address</label>
            <input
              id="registerEmail"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <label htmlFor="registerPassword">Password</label>
            <div className="auth-password-wrap">
              <input
                id="registerPassword"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
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

            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password again"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <Link to="/" className="auth-back-link">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
