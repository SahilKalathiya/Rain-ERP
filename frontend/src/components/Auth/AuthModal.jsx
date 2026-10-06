import React, { useState } from 'react';

/**
 * Modern Auth Component (Login & Register)
 * Designed with clean glassmorphism, dynamic animations, and role switching
 */
export default function AuthModal({ isOpen = true, onLoginSuccess, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: 'saksham.garg@rainerp.com',
    password: 'password123',
    rememberMe: true
  });

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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const user = {
        name: loginForm.email.includes('saksham') ? 'Saksham Garg' : 'User Account',
        role: 'Procurement & Quality Manager',
        email: loginForm.email,
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
        addressLine1: 'Rain Textiles Pvt Ltd, Ring Road',
        addressLine2: 'Industrial Area',
        country: 'India',
        state: 'Gujarat',
        city: 'Surat',
        pincode: '395002'
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }, 600);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match. Please check again.');
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
        addressLine1: '',
        addressLine2: '',
        country: 'India',
        state: 'Gujarat',
        city: 'Surat',
        pincode: '395002'
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }, 700);
  };

  return (
    <div
      className="modal show d-block"
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 1090
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: isRegister ? '540px' : '440px' }}>
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
          {/* Header Banner */}
          <div
            className="p-4 text-white text-center position-relative"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)'
            }}
          >
            {onClose && (
              <button
                type="button"
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                onClick={onClose}
              ></button>
            )}

            <div
              className="d-inline-flex align-items-center justify-content-center bg-white text-primary rounded-circle shadow-sm mb-2"
              style={{ width: '48px', height: '48px' }}
            >
              <i className="ti ti-building-factory-2 fs-24"></i>
            </div>
            <h4 className="fw-bold mb-1 fs-20">Rain ERP Platform</h4>
            <p className="mb-0 text-white-50 fs-13">
              {isRegister ? 'Create your ERP account to get started' : 'Welcome back! Sign in to access your dashboard'}
            </p>
          </div>

          <div className="p-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 fs-13 mb-3 rounded-3">
                <i className="ti ti-alert-circle fs-16"></i>
                <span>{error}</span>
              </div>
            )}

            {!isRegister ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Work Email *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="ti ti-mail fs-15"></i>
                    </span>
                    <input
                      type="email"
                      required
                      className="form-control bg-light border-start-0 fs-13"
                      placeholder="e.g. saksham.garg@rainerp.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fs-12 fw-semibold mb-0 text-secondary">Password *</label>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact system administrator to reset password.'); }} className="fs-11 text-primary text-decoration-none fw-medium">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="ti ti-lock fs-15"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-control bg-light border-start-0 border-end-0 fs-13"
                      placeholder="••••••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} fs-15`}></i>
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
                      Keep me logged in
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold fs-14 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <i className="ti ti-login fs-16"></i>
                      <span>Sign In to ERP</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-3 fs-13 text-secondary">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 fs-13 fw-semibold text-primary text-decoration-none"
                    onClick={() => {
                      setError('');
                      setIsRegister(true);
                    }}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit}>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold mb-1 text-secondary">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sahil"
                      className="form-control bg-light fs-13"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kalathiya"
                      className="form-control bg-light fs-13"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-7">
                    <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="user@rainerp.com"
                      className="form-control bg-light fs-13"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765..."
                      className="form-control bg-light fs-13"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Department / Role *</label>
                  <select
                    className="form-select bg-light fs-13"
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
                    <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Password *</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="form-control bg-light fs-13"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="input-group-text bg-light text-muted"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} fs-14`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold mb-1 text-secondary">Confirm Password *</label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="form-control bg-light fs-13"
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="input-group-text bg-light text-muted"
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
                    I agree to ERP System Access Terms & Privacy Policy
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold fs-14 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <i className="ti ti-user-plus fs-16"></i>
                      <span>Register Account</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-3 fs-13 text-secondary">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 fs-13 fw-semibold text-primary text-decoration-none"
                    onClick={() => {
                      setError('');
                      setIsRegister(false);
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
