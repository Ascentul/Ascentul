import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';
import SupportForm from './support/SupportForm';
import { useUser } from '@/lib/useUserData';
const SidebarSupportDialog = () => {
    const { user } = useUser();
    return (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs("button", { className: "flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 rounded transition", children: [_jsx(HelpCircle, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: "Support" })] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Contact Support" }), _jsx(DialogDescription, { children: "Submit a support ticket and our team will get back to you via email." })] }), _jsx(SupportForm, { userEmail: user?.email }), _jsx(DialogFooter, { children: _jsx(DialogClose, { asChild: true, children: _jsx("button", { className: "mt-4 px-4 py-2 bg-gray-200 rounded", children: "Close" }) }) })] })] }));
};
export default SidebarSupportDialog;
