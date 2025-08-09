import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const SupportForm = ({ userEmail }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(userEmail || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
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
            }
            else {
                const data = await res.json();
                setError(data.error || 'Failed to submit support ticket.');
            }
        }
        catch (err) {
            setError('An error occurred while submitting your ticket.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, style: { maxWidth: 400, margin: '0 auto' }, children: [_jsx("h2", { children: "Contact Support" }), _jsxs("div", { children: [_jsx("label", { children: "Subject" }), _jsx("input", { type: "text", value: subject, onChange: e => setSubject(e.target.value), required: true, minLength: 3 })] }), _jsxs("div", { children: [_jsx("label", { children: "Message" }), _jsx("textarea", { value: message, onChange: e => setMessage(e.target.value), required: true, minLength: 5 })] }), _jsxs("div", { children: [_jsx("label", { children: "Email" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true })] }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Submitting...' : 'Submit Ticket' }), success && _jsx("div", { style: { color: 'green', marginTop: 10 }, children: success }), error && _jsx("div", { style: { color: 'red', marginTop: 10 }, children: error })] }));
};
export default SupportForm;
