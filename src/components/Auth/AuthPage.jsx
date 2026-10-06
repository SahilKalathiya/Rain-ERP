import React, { useState } from 'react';

/**
 * Clean, Minimal & Modern Auth Page (Login, Register, Forgot Password)
 * Simple clean white card, subtle soft shadows, centered layout with no clutter.
 */
export default function AuthPage({ onLoginSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: 'saksham.garg@rainerp.com',
    password: 'password123',
    rememberMe: true
  });

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Procurement & Quality Manager',
    password: '',
    confirmPassword: '',
    agreeTerms: true
  });

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick 1-Click Role Login
  const handleQuickLogin = (roleType) => {
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      let demoUser;
      if (roleType === 'admin') {
        demoUser = {
          name: 'Sahil Kalathiya',
          role: 'General Manager (Admin)',
          email: 'sahil@rainerp.com',
          phone: '+91 99000 88776',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
          city: 'Surat',
          state: 'Gujarat',
          country: 'India'
        };
      } else if (roleType === 'qc') {
        demoUser = {
          name: 'Priya Sharma',
          role: 'Quality Control Inspector',
          email: 'priya.qc@rainerp.com',
          phone: '+91 98250 11223',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
          city: 'Surat',
          state: 'Gujarat',
          country: 'India'
        };
      } else {
        demoUser = {
          name: 'Saksham Garg',
          role: 'Procurement & Quality Manager',
          email: 'saksham.garg@rainerp.com',
          phone: '+91 98765 43210',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
          city: 'Surat',
          state: 'Gujarat',
          country: 'India'
        };
      }

      if (onLoginSuccess) onLoginSuccess(demoUser);
    }, 400);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const user = {
        name: loginForm.email.includes('sahil')
          ? 'Sahil Kalathiya'
          : loginForm.email.includes('saksham')
          ? 'Saksham Garg'
          : 'ERP User',
        role: loginForm.email.includes('sahil') ? 'General Manager (Admin)' : 'Procurement & Quality Manager',
        email: loginForm.email,
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
        city: 'Surat',
        state: 'Gujarat',
        country: 'India'
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }, 500);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        name: `${registerForm.firstName} ${registerForm.lastName}`.trim() || 'New User',
        role: registerForm.role || 'ERP User',
        email: registerForm.email,
        phone: registerForm.phone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
        city: 'Surat',
        state: 'Gujarat',
        country: 'India'
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }, 600);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3 p-md-4"
      style={{
        minHeight: '100vh',
        background: '#f1f5f9'
      }}
    >
      <div
        className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white w-100"
        style={{
          maxWidth: mode === 'register' ? '560px' : '440px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Brand Logo & Title */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 shadow-sm mb-2"
            style={{ width: '48px', height: '48px' }}
          >
            <i className="ti ti-building-factory-2 fs-24"></i>
          </div>
          <h4 className="fw-bold text-dark mb-1 fs-20">Rain ERP</h4>
          <p className="text-muted fs-13 mb-0">
            {mode === 'login'
              ? 'Sign in to access your ERP dashboard'
              : mode === 'register'
              ? 'Create your account to get started'
              : 'Enter email to reset your password'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 fs-13 mb-3 rounded-3">
            <i className="ti ti-alert-circle fs-16"></i>
            <span>{error}</span>
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">Email Address *</label>
              <input
                type="email"
                required
                className="form-control bg-light fs-13 py-2"
                placeholder="name@rainerp.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fs-12 fw-semibold text-secondary mb-0">Password *</label>
                <button
                  type="button"
                  className="btn btn-link p-0 fs-11 text-primary text-decoration-none fw-semibold"
                  onClick={() => {
                    setError('');
                    setForgotSent(false);
                    setMode('forgot');
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-control bg-light fs-13 py-2 border-end-0"
                  placeholder="••••••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                <button
                  type="button"
                  className="input-group-text bg-light text-muted border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} fs-14`}></i>
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                />
                <label className="form-check-label fs-12 text-secondary cursor-pointer" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold fs-14 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <i className="ti ti-login fs-16"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Quick Demo Logins */}
            <div className="p-2.5 rounded-3 bg-light border text-center mb-3">
              <span className="fs-11 text-muted text-uppercase fw-semibold d-block mb-1.5">⚡ Quick 1-Click Login</span>
              <div className="d-flex justify-content-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-white bg-white border text-primary fs-11 px-2.5 py-1 fw-semibold"
                  onClick={() => handleQuickLogin('manager')}
                >
                  Manager
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-white bg-white border text-primary fs-11 px-2.5 py-1 fw-semibold"
                  onClick={() => handleQuickLogin('admin')}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-white bg-white border text-primary fs-11 px-2.5 py-1 fw-semibold"
                  onClick={() => handleQuickLogin('qc')}
                >
                  QC Inspector
                </button>
              </div>
            </div>

            <div className="text-center fs-13 text-secondary">
              Don't have an account?{' '}
              <button
                type="button"
                className="btn btn-link p-0 fs-13 fw-semibold text-primary text-decoration-none"
                onClick={() => {
                  setError('');
                  setMode('register');
                }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* ================= REGISTER FORM ================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahil"
                  className="form-control bg-light fs-13 py-2"
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalathiya"
                  className="form-control bg-light fs-13 py-2"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-7">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sahil@rainerp.com"
                  className="form-control bg-light fs-13 py-2"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </div>
              <div className="col-5">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765..."
                  className="form-control bg-light fs-13 py-2"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">Role / Department *</label>
              <select
                className="form-select bg-light fs-13 py-2"
                value={registerForm.role}
                onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
              >
                <option value="Procurement & Quality Manager">Procurement & Quality Manager</option>
                <option value="Store Keeper / Inward Officer">Store Keeper / Inward Officer</option>
                <option value="Quality Control Inspector">Quality Control Inspector</option>
                <option value="General Manager (Admin)">General Manager (Admin)</option>
              </select>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Password *</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control bg-light fs-13 py-2 border-end-0"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light text-muted border-start-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} fs-14`}></i>
                  </button>
                </div>
              </div>
              <div className="col-6">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1">Confirm Password *</label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="form-control bg-light fs-13 py-2 border-end-0"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light text-muted border-start-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`ti ${showConfirmPassword ? 'ti-eye-off' : 'ti-eye'} fs-14`}></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeTerms"
                required
                checked={registerForm.agreeTerms}
                onChange={(e) => setRegisterForm({ ...registerForm, agreeTerms: e.target.checked })}
              />
              <label className="form-check-label fs-12 text-secondary cursor-pointer" htmlFor="agreeTerms">
                I agree to the Terms & Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold fs-14 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <i className="ti ti-user-plus fs-16"></i>
                  <span>Register Account</span>
                </>
              )}
            </button>

            <div className="text-center fs-13 text-secondary">
              Already have an account?{' '}
              <button
                type="button"
                className="btn btn-link p-0 fs-13 fw-semibold text-primary text-decoration-none"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ================= FORGOT PASSWORD ================= */}
        {mode === 'forgot' && (
          <div>
            {forgotSent ? (
              <div className="text-center py-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle mb-3"
                  style={{ width: '56px', height: '56px' }}
                >
                  <i className="ti ti-mail-check fs-28"></i>
                </div>
                <h5 className="fw-bold text-dark fs-16 mb-1">Reset Link Sent</h5>
                <p className="text-muted fs-13 mb-4">
                  We've sent a password reset link to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 rounded-3 fs-13 fw-semibold w-100"
                  onClick={() => setMode('login')}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    setForgotSent(true);
                  }, 500);
                }}
              >
                <div className="mb-4">
                  <label className="form-label fs-12 fw-semibold text-secondary mb-1">Registered Email *</label>
                  <input
                    type="email"
                    required
                    className="form-control bg-light fs-13 py-2"
                    placeholder="name@rainerp.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold fs-14 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send fs-16"></i>
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className="text-center fs-13 text-secondary">
                  Remember password?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 fs-13 fw-semibold text-primary text-decoration-none"
                    onClick={() => setMode('login')}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
