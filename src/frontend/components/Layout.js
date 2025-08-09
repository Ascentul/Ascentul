import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { useUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
import { ModelNotificationContainer } from '@/components/ModelNotification';
import { useModelNotifications } from '@/hooks/use-model-notifications';
export default function Layout({ children }) {
    const { user, isLoading } = useUser();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    // Initialize model notifications hook
    const { hasNewModels } = useModelNotifications();
    const toggleMobileSidebar = () => {
        setMobileSidebarOpen(!mobileSidebarOpen);
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    return (_jsxs("div", { className: "flex flex-col h-screen bg-gray-50", children: [hasNewModels && _jsx(ModelNotificationContainer, {}), _jsx(MobileHeader, { onMenuToggle: toggleMobileSidebar }), mobileSidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/30 z-20 md:hidden", onClick: toggleMobileSidebar, "aria-hidden": "true" })), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, { isOpen: mobileSidebarOpen, onToggle: toggleMobileSidebar }), _jsx("div", { className: "flex-1 overflow-auto", children: _jsx("main", { className: "p-4 md:p-6 max-w-7xl mx-auto", children: children }) })] })] }));
}
