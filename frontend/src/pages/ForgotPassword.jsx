import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      alert(err.message || 'Error requesting reset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 20 }}>
      <div style={{ maxWidth: 440, width: '100%', background: 'white', borderRadius: 16, padding: '36px 32px' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', marginBottom: 20, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={44} color="#10b981" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Password Reset Dispatched</h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: 24 }}>
              If {email} is associated with an active user, a recovery link has been generated.
            </p>
            <Link to="/reset-password" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Enter New Password
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Forgot Password?</h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: 20 }}>
              Enter your work email address to receive password reset instructions.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="user@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
