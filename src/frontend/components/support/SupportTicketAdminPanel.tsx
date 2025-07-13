import React, { useEffect, useState } from 'react';

interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SupportTicketAdminPanel: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/support/all');
        if (!res.ok) {
          throw new Error('Failed to fetch tickets');
        }
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [refresh]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/support/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setRefresh(r => r + 1);
    } catch (err) {
      alert('Failed to update ticket status.');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>Support Tickets</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Email</th>
            <th>Status</th>
            <th>Created</th>
            <th>Message</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id}>
              <td>{ticket.subject}</td>
              <td>{ticket.email}</td>
              <td>{ticket.status}</td>
              <td>{new Date(ticket.created_at).toLocaleString()}</td>
              <td>{ticket.message}</td>
              <td>
                <select
                  value={ticket.status}
                  onChange={e => handleStatusChange(ticket.id, e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupportTicketAdminPanel;
