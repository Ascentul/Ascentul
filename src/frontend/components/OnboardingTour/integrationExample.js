import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import OnboardingTourComponent from './index';
// Example Dashboard component with integrated onboarding tour
const Dashboard = ({ user }) => {
    // Any existing dashboard logic...
    useEffect(() => {
        // You can add additional logic here that should run alongside the tour
        // For example, tracking when the dashboard was first visited
        console.log('Dashboard loaded with onboarding tour');
    }, []);
    return (_jsxs("div", { className: "dashboard-container", id: "dashboard", children: [_jsx(OnboardingTourComponent, {}), _jsxs("div", { className: "dashboard-header", children: [_jsxs("h1", { children: ["Welcome, ", user?.name || 'User'] }), _jsx("p", { children: "Here's your career progress dashboard" })] }), _jsxs("div", { className: "dashboard-content", children: [_jsx("section", { id: "resumeBuilder", className: "dashboard-section", children: _jsx("h2", { children: "Resume Builder" }) }), _jsx("section", { id: "goalTracker", className: "dashboard-section", children: _jsx("h2", { children: "Goal Tracker" }) })] }), _jsx("div", { className: "dashboard-settings", children: _jsx("button", { id: "settings", className: "settings-button", children: "Settings" }) })] }));
};
export default Dashboard;
