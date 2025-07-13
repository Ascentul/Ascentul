import React, { useState } from 'react';

interface SupportFormProps {
  userEmail?: string;
}

const SupportForm: React.FC<SupportFormProps> = ({ userEmail }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message, email }),
      });
      if (res.ok) {
        setSuccess('Your support ticket has been submitted! We will get back to you soon.');
        setSubject('');
        setMessage('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit support ticket.');
      }
    } catch (err) {
      setError('An error occurred while submitting your ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Contact Support</h2>
      <div>
        <label>Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          minLength={3}
        />
      </div>
      <div>
        <label>Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          minLength={5}
        />
      </div>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Ticket'}
      </button>
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </form>
  );
};

export default SupportForm;
