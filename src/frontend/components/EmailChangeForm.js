import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
// Define the validation schema for the email change form
const emailChangeSchema = z.object({
    email: z.string()
        .email({ message: "Please enter a valid email address." })
        .min(1, { message: "Email is required." }),
    currentPassword: z.string()
        .min(1, { message: "Current password is required." }),
});
const EmailChangeForm = ({ currentEmail, onSubmit }) => {
    // Initialize the form with react-hook-form and zod validation
    const form = useForm({
        resolver: zodResolver(emailChangeSchema),
        defaultValues: {
            email: '',
            currentPassword: '',
        },
    });
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4 py-2", children: [_jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "New Email Address" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: currentEmail, autoComplete: "email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "currentPassword", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Current Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { className: "mt-6", children: _jsx(Button, { type: "submit", children: "Send Verification" }) })] }) }));
};
export default EmailChangeForm;
