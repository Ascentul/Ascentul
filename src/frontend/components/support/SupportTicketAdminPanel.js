import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const SupportTicketAdminPanel = () => {
    const [tickets, setTickets] = useState([]);
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
            }
            catch (err) {
                setError(err.message || 'Error fetching tickets');
            }
            finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [refresh]);
    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/support/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok)
                setRefresh(r => r + 1);
        }
        catch (err) {
            alert('Failed to update ticket status.');
        }
    };
    return (_jsxs("div", { style: { maxWidth: 900, margin: '0 auto' }, children: [_jsx("h2", { children: "Support Tickets" }), loading && _jsx("div", { children: "Loading..." }), error && _jsx("div", { style: { color: 'red' }, children: error }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Subject" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Created" }), _jsx("th", { children: "Message" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: tickets.map(ticket => (_jsxs("tr", { children: [_jsx("td", { children: ticket.subject }), _jsx("td", { children: ticket.email }), _jsx("td", { children: ticket.status }), _jsx("td", { children: new Date(ticket.created_at).toLocaleString() }), _jsx("td", { children: ticket.message }), _jsx("td", { children: _jsxs("select", { value: ticket.status, onChange: e => handleStatusChange(ticket.id, e.target.value), children: [_jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "closed", children: "Closed" })] }) })] }, ticket.id))) })] })] }));
};
export default SupportTicketAdminPanel;
