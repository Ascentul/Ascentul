import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
client / src / pages / Account.tsx;
1;
import { useState, useEffect } from 'react';
client / src / pages / Account.tsx;
2;
import { useUser, useChangeEmail, useChangePassword } from '@/lib/useUserData';
client / src / pages / Account.tsx;
3;
import { useToast } from '@/hooks/use-toast';
client / src / pages / Account.tsx;
4;
import { useForm } from 'react-hook-form';
client / src / pages / Account.tsx;
5;
import { zodResolver } from '@hookform/resolvers/zod';
client / src / pages / Account.tsx;
6;
import { loadStripe } from '@stripe/stripe-js';
client / src / pages / Account.tsx;
7;
import { client } from /src/pages / Account.tsx;
8;
Elements,
    client / src / pages / Account.tsx;
9;
PaymentElement,
    client / src / pages / Account.tsx;
10;
useStripe,
    client / src / pages / Account.tsx;
11;
useElements,
    client / src / pages / Account.tsx;
12;
AddressElement;
client / src / pages / Account.tsx;
13;
from;
'@stripe/react-stripe-js';
client / src / pages / Account.tsx;
14;
client / src / pages / Account.tsx;
15;
client / src / pages / Account.tsx;
16;
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
client / src / pages / Account.tsx;
17;
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
client / src / pages / Account.tsx;
18;
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
client / src / pages / Account.tsx;
19;
client / src / pages / Account.tsx;
20;
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
client / src / pages / Account.tsx;
21;
import { Button } from '@/components/ui/button';
client / src / pages / Account.tsx;
22;
import { Input } from '@/components/ui/input';
client / src / pages / Account.tsx;
23;
import { Slider } from '@/components/ui/slider';
client / src / pages / Account.tsx;
24;
25;
User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles, CreditCardIcon, RotateCcw,
    client / src / pages / Account.tsx;
26;
Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, Users, Plus, Settings;
client / src / pages / Account.tsx;
27;
from;
'lucide-react';
client / src / pages / Account.tsx;
28;
import EmailChangeForm from '@/components/EmailChangeForm';
client / src / pages / Account.tsx;
29;
import { z } from 'zod';
client / src / pages / Account.tsx;
30;
client / src / pages / Account.tsx;
31;
client / src / pages / Account.tsx;
32;
client / src / pages / Account.tsx;
33;
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
client / src / pages / Account.tsx;
34;
if (!stripePublicKey || !stripePublicKey.startsWith('pk_')) {
    client / src / pages / Account.tsx;
    35;
    console.error('Missing or invalid Stripe public key. Make sure VITE_STRIPE_PUBLIC_KEY is set correctly.');
    client / src / pages / Account.tsx;
    36;
}
client / src / pages / Account.tsx;
37;
const stripePromise = loadStripe(stripePublicKey);
client / src / pages / Account.tsx;
38;
client / src / pages / Account.tsx;
39;
client / src / pages / Account.tsx;
40;
const passwordChangeSchema = z.object({
    client
} / src / pages / Account.tsx, 41, currentPassword, z.string().min(1, "Current password is required"), client / src / pages / Account.tsx, 42, newPassword, z.string(), client / src / pages / Account.tsx, 43, min(8, "Password must be at least 8 characters"), client / src / pages / Account.tsx, 44, regex(/[A-Z]/, "Password must contain at least one uppercase letter"), client / src / pages / Account.tsx, 45, regex(/[a-z]/, "Password must contain at least one lowercase letter"), client / src / pages / Account.tsx, 46, regex(/[0-9]/, "Password must contain at least one number"), client / src / pages / Account.tsx, 47, confirmPassword, z.string().min(1, "Please confirm your new password"), client / src / pages / Account.tsx, 48);
refine((data) => data.newPassword === data.confirmPassword, {
    client
} / src / pages / Account.tsx, 49, message, "Passwords do not match", client / src / pages / Account.tsx, 50, path, ["confirmPassword"], client / src / pages / Account.tsx, 51);
client / src / pages / Account.tsx;
52;
client / src / pages / Account.tsx;
53;
client / src / pages / Account.tsx;
54;
client / src / pages / Account.tsx;
55;
client / src / pages / Account.tsx;
56;
function PasswordChangeForm({ client }) { }
/src/pages / Account.tsx;
57;
onSubmit,
    client / src / pages / Account.tsx;
58;
isPending;
client / src / pages / Account.tsx;
59;
{
    client / src / pages / Account.tsx;
    60;
    onSubmit: (data) => void ;
    client / src / pages / Account.tsx;
    61;
    isPending: boolean;
    client / src / pages / Account.tsx;
    62;
}
{
    client / src / pages / Account.tsx;
    63;
    const form = useForm({
        client
    } / src / pages / Account.tsx, 64, resolver, zodResolver(passwordChangeSchema), client / src / pages / Account.tsx, 65, defaultValues, {
        client
    } / src / pages / Account.tsx, 66, currentPassword, "", client / src / pages / Account.tsx, 67, newPassword, "", client / src / pages / Account.tsx, 68, confirmPassword, "", client / src / pages / Account.tsx, 69);
}
client / src / pages / Account.tsx;
70;
;
client / src / pages / Account.tsx;
71;
client / src / pages / Account.tsx;
72;
return (client / src / pages / Account.tsx);
73;
_jsxs(Form, { ...form, children: ["client/src/pages/Account.tsx:74:      ", _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4 py-2", children: ["client/src/pages/Account.tsx:75:        ", _jsx(FormField, { client: true }), "src/pages/Account.tsx:76:          control=", form.control, "client/src/pages/Account.tsx:77:          name=\"currentPassword\" client/src/pages/Account.tsx:78:          render=", ({ field }) => (client / src / pages / Account.tsx), ":79:            ", _jsxs(FormItem, { children: ["client/src/pages/Account.tsx:80:              ", _jsx(FormLabel, { children: "Current Password" }), "client/src/pages/Account.tsx:81:              ", _jsxs(FormControl, { children: ["client/src/pages/Account.tsx:82:                ", _jsx(Input, { type: "password", placeholder: "Enter your current password", ...field }), "client/src/pages/Account.tsx:83:              "] }), "client/src/pages/Account.tsx:84:              ", _jsx(FormMessage, {}), "client/src/pages/Account.tsx:85:            "] }), "client/src/pages/Account.tsx:86:          )} client/src/pages/Account.tsx:87:        /> client/src/pages/Account.tsx:88: client/src/pages/Account.tsx:89:        ", _jsx(FormField, { client: true }), "src/pages/Account.tsx:90:          control=", form.control, "client/src/pages/Account.tsx:91:          name=\"newPassword\" client/src/pages/Account.tsx:92:          render=", ({ field }) => (client / src / pages / Account.tsx), ":93:            ", _jsxs(FormItem, { children: ["client/src/pages/Account.tsx:94:              ", _jsx(FormLabel, { children: "New Password" }), "client/src/pages/Account.tsx:95:              ", _jsxs(FormControl, { children: ["client/src/pages/Account.tsx:96:                ", _jsx(Input, { type: "password", placeholder: "Enter your new password", ...field }), "client/src/pages/Account.tsx:97:              "] }), "client/src/pages/Account.tsx:98:              ", _jsx(FormDescription, { children: "client/src/pages/Account.tsx:99:                Password must be at least 8 characters and include uppercase, lowercase, and a number. client/src/pages/Account.tsx:100:              " }), "client/src/pages/Account.tsx:101:              ", _jsx(FormMessage, {}), "client/src/pages/Account.tsx:102:            "] }), "client/src/pages/Account.tsx:103:          )} client/src/pages/Account.tsx:104:        /> client/src/pages/Account.tsx:105: client/src/pages/Account.tsx:106:        ", _jsx(FormField, { client: true }), "src/pages/Account.tsx:107:          control=", form.control, "client/src/pages/Account.tsx:108:          name=\"confirmPassword\" client/src/pages/Account.tsx:109:          render=", ({ field }) => (client / src / pages / Account.tsx), ":110:            ", _jsxs(FormItem, { children: ["client/src/pages/Account.tsx:111:              ", _jsx(FormLabel, { children: "Confirm New Password" }), "client/src/pages/Account.tsx:112:              ", _jsxs(FormControl, { children: ["client/src/pages/Account.tsx:113:                ", _jsx(Input, { type: "password", placeholder: "Confirm your new password", ...field }), "client/src/pages/Account.tsx:114:              "] }), "client/src/pages/Account.tsx:115:              ", _jsx(FormMessage, {}), "client/src/pages/Account.tsx:116:            "] }), "client/src/pages/Account.tsx:117:          )} client/src/pages/Account.tsx:118:        /> client/src/pages/Account.tsx:119: client/src/pages/Account.tsx:120:        ", _jsxs(DialogFooter, { className: "mt-6", children: ["client/src/pages/Account.tsx:121:          ", _jsxs(Button, { type: "submit", disabled: isPending, children: ["client/src/pages/Account.tsx:122:            ", isPending ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), " Changing Password..."] }) : "Change Password", "client/src/pages/Account.tsx:123:          "] }), "client/src/pages/Account.tsx:124:        "] }), "client/src/pages/Account.tsx:125:      "] }), "client/src/pages/Account.tsx:126:    "] });
client / src / pages / Account.tsx;
127;
;
client / src / pages / Account.tsx;
128;
client / src / pages / Account.tsx;
129;
client / src / pages / Account.tsx;
130;
client / src / pages / Account.tsx;
131;
function PaymentMethodForm({ client }) { }
/src/pages / Account.tsx;
132;
onSuccess,
    client / src / pages / Account.tsx;
133;
onCancel;
client / src / pages / Account.tsx;
134;
{
    client / src / pages / Account.tsx;
    135;
    onSuccess: () => void ;
    client / src / pages / Account.tsx;
    136;
    onCancel: () => void ;
    client / src / pages / Account.tsx;
    137;
}
{
    client / src / pages / Account.tsx;
    138;
    const stripe = useStripe();
    client / src / pages / Account.tsx;
    139;
    const elements = useElements();
    client / src / pages / Account.tsx;
    140;
    const [isSubmitting, setIsSubmitting] = useState(false);
    client / src / pages / Account.tsx;
    141;
    const [error, setError] = useState(null);
    client / src / pages / Account.tsx;
    142;
    client / src / pages / Account.tsx;
    143;
    const handleSubmit = async (e) => {
        client / src / pages / Account.tsx;
        144;
        e.preventDefault();
        client / src / pages / Account.tsx;
        145;
        client / src / pages / Account.tsx;
        146;
        if (!stripe || !elements) {
            client / src / pages / Account.tsx;
            147;
            return;
            client / src / pages / Account.tsx;
            148;
        }
        client / src / pages / Account.tsx;
        149;
        client / src / pages / Account.tsx;
        150;
        setIsSubmitting(true);
        client / src / pages / Account.tsx;
        151;
        setError(null);
        client / src / pages / Account.tsx;
        152;
        client / src / pages / Account.tsx;
        153;
        try {
            client / src / pages / Account.tsx;
            154;
            client / src / pages / Account.tsx;
            155;
            const { error: submitError } = await elements.submit();
            client / src / pages / Account.tsx;
            156;
            client / src / pages / Account.tsx;
            157;
            if (submitError) {
                client / src / pages / Account.tsx;
                158;
                throw new Error(submitError.message);
                client / src / pages / Account.tsx;
                159;
            }
            client / src / pages / Account.tsx;
            160;
            client / src / pages / Account.tsx;
            161;
            client / src / pages / Account.tsx;
            162;
            const { error: confirmError } = await stripe.confirmSetup({
                client
            } / src / pages / Account.tsx, 163, elements, client / src / pages / Account.tsx, 164, confirmParams, {
                client
            } / src / pages / Account.tsx, 165, return_url, window.location.origin + '/account', client / src / pages / Account.tsx, 166);
        }
        finally { }
        client / src / pages / Account.tsx;
        167;
        redirect: 'if_required',
            client / src / pages / Account.tsx;
        168;
    };
    client / src / pages / Account.tsx;
    169;
    client / src / pages / Account.tsx;
    170;
    if (confirmError) {
        client / src / pages / Account.tsx;
        171;
        throw new Error(confirmError.message);
        client / src / pages / Account.tsx;
        172;
    }
    client / src / pages / Account.tsx;
    173;
    client / src / pages / Account.tsx;
    174;
    client / src / pages / Account.tsx;
    175;
    onSuccess();
    client / src / pages / Account.tsx;
    176;
}
try { }
catch (err) {
    client / src / pages / Account.tsx;
    177;
    console.error('Error updating payment method:', err);
    client / src / pages / Account.tsx;
    178;
    setError(err.message || 'An error occurred while updating your payment method');
    client / src / pages / Account.tsx;
    179;
}
finally {
    client / src / pages / Account.tsx;
    180;
    setIsSubmitting(false);
    client / src / pages / Account.tsx;
    181;
}
client / src / pages / Account.tsx;
182;
;
client / src / pages / Account.tsx;
183;
client / src / pages / Account.tsx;
184;
return (client / src / pages / Account.tsx);
185;
_jsxs("div", { children: ["client/src/pages/Account.tsx:186:      ", _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: ["client/src/pages/Account.tsx:187:        ", _jsxs("div", { className: "space-y-2", children: ["client/src/pages/Account.tsx:188:          ", _jsx("label", { className: "text-sm font-medium", children: "Card Details" }), "client/src/pages/Account.tsx:189:          ", _jsx(PaymentElement, {}), "client/src/pages/Account.tsx:190:        "] }), "client/src/pages/Account.tsx:191: client/src/pages/Account.tsx:192:        ", _jsxs("div", { className: "space-y-2", children: ["client/src/pages/Account.tsx:193:          ", _jsx("label", { className: "text-sm font-medium", children: "Billing Address" }), "client/src/pages/Account.tsx:194:          ", _jsx(AddressElement, { options: { mode: 'billing' } }), "client/src/pages/Account.tsx:195:        "] }), "client/src/pages/Account.tsx:196: client/src/pages/Account.tsx:197:        ", error && (client / src / pages / Account.tsx), ":198:          ", _jsxs("div", { className: "rounded-md bg-destructive/10 p-3 text-sm text-destructive", children: ["client/src/pages/Account.tsx:199:            ", error, "client/src/pages/Account.tsx:200:          "] }), "client/src/pages/Account.tsx:201:        )} client/src/pages/Account.tsx:202: client/src/pages/Account.tsx:203:        ", _jsxs("div", { className: "flex justify-end space-x-2 pt-2", children: ["client/src/pages/Account.tsx:204:          ", _jsx(Button, { client: true }), "src/pages/Account.tsx:205:            type=\"button\" client/src/pages/Account.tsx:206:            variant=\"outline\" client/src/pages/Account.tsx:207:            onClick=", onCancel, "client/src/pages/Account.tsx:208:            disabled=", isSubmitting, "client/src/pages/Account.tsx:209:          > client/src/pages/Account.tsx:210:            Cancel client/src/pages/Account.tsx:211:          "] }), "client/src/pages/Account.tsx:212:          ", _jsx(Button, { client: true }), "src/pages/Account.tsx:213:            type=\"submit\" client/src/pages/Account.tsx:214:            disabled=", !stripe || !elements || isSubmitting, "client/src/pages/Account.tsx:215:          > client/src/pages/Account.tsx:216:            ", isSubmitting ? (client / src / pages / Account.tsx) : 217, ":              ", _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), " Processing..."] }), "client/src/pages/Account.tsx:218:            ) : ( client/src/pages/Account.tsx:219:              'Save Payment Method' client/src/pages/Account.tsx:220:            )} client/src/pages/Account.tsx:221:          "] }), "client/src/pages/Account.tsx:222:        "] });
client / src / pages / Account.tsx;
223;
form >
    client / src / pages / Account.tsx;
224;
div >
    client / src / pages / Account.tsx;
225;
;
client / src / pages / Account.tsx;
226;
client / src / pages / Account.tsx;
227;
client / src / pages / Account.tsx;
228;
export default function Account() {
    client / src / pages / Account.tsx;
    229;
    const { user, logout, updateProfile } = useUser();
    client / src / pages / Account.tsx;
    230;
    const { toast } = useToast();
    client / src / pages / Account.tsx;
    231;
    client / src / pages / Account.tsx;
    232;
    client / src / pages / Account.tsx;
    233;
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    client / src / pages / Account.tsx;
    234;
    const [isManagingSubscription, setIsManagingSubscription] = useState(false);
    client / src / pages / Account.tsx;
    235;
    const [isManagingPaymentMethods, setIsManagingPaymentMethods] = useState(false);
    client / src / pages / Account.tsx;
    236;
    const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
    client / src / pages / Account.tsx;
    237;
    const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);
    client / src / pages / Account.tsx;
    238;
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    client / src / pages / Account.tsx;
    239;
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    client / src / pages / Account.tsx;
    240;
    const [billingCycle, setBillingCycle] = useState('monthly');
    client / src / pages / Account.tsx;
    241;
    client / src / pages / Account.tsx;
    242;
    client / src / pages / Account.tsx;
    243;
    const [profileSections, setProfileSections] = useState([
        client / src / pages / Account.tsx, 244, { id: 'work-history', title: 'Work History', icon: 'Building', completed: false },
        client / src / pages / Account.tsx, 245, { id: 'education', title: 'Education', icon: 'GraduationCap', completed: false },
        client / src / pages / Account.tsx, 246, { id: 'achievements', title: 'Achievements', icon: 'Trophy', completed: false },
        client / src / pages / Account.tsx, 247, { id: 'skills', title: 'Skills', icon: 'BookOpen', completed: false },
        client / src / pages / Account.tsx, 248, { id: 'certifications', title: 'Certifications', icon: 'Award', completed: false },
        client / src / pages / Account.tsx, 249, { id: 'languages', title: 'Languages', icon: 'Languages', completed: false },
        client / src / pages / Account.tsx, 250, { id: 'summary', title: 'Career Summary', icon: 'Users', completed: false },
        client / src / pages / Account.tsx, 251, { id: 'location', title: 'Location Preferences', icon: 'MapPin', completed: false },
        client / src / pages / Account.tsx, 252
    ]);
    client / src / pages / Account.tsx;
    253;
    const [completionPercentage, setCompletionPercentage] = useState(0);
    client / src / pages / Account.tsx;
    254;
    client / src / pages / Account.tsx;
    255;
    client / src / pages / Account.tsx;
    256;
    const [isLoading, setIsLoading] = useState(false);
    client / src / pages / Account.tsx;
    257;
    const [setupIntentClientSecret, setSetupIntentClientSecret] = useState(null);
    client / src / pages / Account.tsx;
    258;
    const [paymentMethodInfo, setPaymentMethodInfo] = useState < {
        client
    } / src / pages / Account.tsx;
    259;
    last4: string;
    client / src / pages / Account.tsx;
    260;
    brand: string;
    client / src / pages / Account.tsx;
    261;
    exp_month: number;
    client / src / pages / Account.tsx;
    262;
    exp_year: number;
    client / src / pages / Account.tsx;
    263;
}
 | null > (null);
client / src / pages / Account.tsx;
264;
client / src / pages / Account.tsx;
265;
client / src / pages / Account.tsx;
266;
const changeEmailMutation = useChangeEmail();
client / src / pages / Account.tsx;
267;
const changePasswordMutation = useChangePassword();
client / src / pages / Account.tsx;
268;
client / src / pages / Account.tsx;
269;
client / src / pages / Account.tsx;
270;
useEffect(() => {
    client / src / pages / Account.tsx;
    271;
    if (user && user.subscriptionPlan !== 'free') {
        client / src / pages / Account.tsx;
        272;
        fetchPaymentMethodInfo();
        client / src / pages / Account.tsx;
        273;
    }
    client / src / pages / Account.tsx;
    274;
    client / src / pages / Account.tsx;
    275;
    client / src / pages / Account.tsx;
    276;
    const completedSections = profileSections.filter(section => section.completed).length;
    client / src / pages / Account.tsx;
    277;
    const percentage = (completedSections / profileSections.length) * 100;
    client / src / pages / Account.tsx;
    278;
    setCompletionPercentage(percentage);
    client / src / pages / Account.tsx;
    279;
    client / src / pages / Account.tsx;
    280;
    client / src / pages / Account.tsx;
    281;
    client / src / pages / Account.tsx;
    282;
}, [user, profileSections]);
client / src / pages / Account.tsx;
283;
client / src / pages / Account.tsx;
284;
client / src / pages / Account.tsx;
285;
const fetchPaymentMethodInfo = async () => {
    client / src / pages / Account.tsx;
    286;
    try {
        client / src / pages / Account.tsx;
        287;
        const response = await fetch('/api/payments/payment-methods', {
            client
        } / src / pages / Account.tsx, 288, method, 'GET', client / src / pages / Account.tsx, 289, headers, { 'Content-Type': 'application/json' }, client / src / pages / Account.tsx, 290);
    }
    finally { }
    ;
    client / src / pages / Account.tsx;
    291;
    client / src / pages / Account.tsx;
    292;
    if (!response.ok) {
        client / src / pages / Account.tsx;
        293;
        throw new Error('Failed to fetch payment methods');
        client / src / pages / Account.tsx;
        294;
    }
    client / src / pages / Account.tsx;
    295;
    client / src / pages / Account.tsx;
    296;
    const data = await response.json();
    client / src / pages / Account.tsx;
    297;
    if (data?.default_payment_method) {
        client / src / pages / Account.tsx;
        298;
        setPaymentMethodInfo({
            client
        } / src / pages / Account.tsx, 299, last4, data.default_payment_method.card.last4, client / src / pages / Account.tsx, 300, brand, data.default_payment_method.card.brand, client / src / pages / Account.tsx, 301, exp_month, data.default_payment_method.card.exp_month, client / src / pages / Account.tsx, 302, exp_year, data.default_payment_method.card.exp_year, client / src / pages / Account.tsx, 303);
    }
    ;
    client / src / pages / Account.tsx;
    304;
};
client / src / pages / Account.tsx;
305;
try { }
catch (error) {
    client / src / pages / Account.tsx;
    306;
    console.error('Error fetching payment methods:', error);
    client / src / pages / Account.tsx;
    307;
}
client / src / pages / Account.tsx;
308;
;
client / src / pages / Account.tsx;
309;
client / src / pages / Account.tsx;
310;
client / src / pages / Account.tsx;
311;
const getPlanName = (plan) => {
    client / src / pages / Account.tsx;
    312;
    if (!plan)
        return 'Free Plan';
    client / src / pages / Account.tsx;
    313;
    client / src / pages / Account.tsx;
    314;
    switch (plan) {
    }
    client / src / pages / Account.tsx;
    315;
    'free';
    client / src / pages / Account.tsx;
    316;
    return 'Free Plan';
    client / src / pages / Account.tsx;
    317;
    'premium';
    client / src / pages / Account.tsx;
    318;
    return 'Pro Plan';
    client / src / pages / Account.tsx;
    319;
    'pro_monthly';
    client / src / pages / Account.tsx;
    320;
    return 'Pro Plan (Monthly)';
    client / src / pages / Account.tsx;
    321;
    'pro_annual';
    client / src / pages / Account.tsx;
    322;
    return 'Pro Plan (Annual)';
    client / src / pages / Account.tsx;
    323;
    'university';
    client / src / pages / Account.tsx;
    324;
    return 'University License';
    client / src / pages / Account.tsx;
    325;
    client / src / pages / Account.tsx;
    326;
    return plan.replace('_', ' ');
    client / src / pages / Account.tsx;
    327;
};
client / src / pages / Account.tsx;
328;
;
client / src / pages / Account.tsx;
329;
client / src / pages / Account.tsx;
330;
client / src / pages / Account.tsx;
331;
const upgradeSubscription = async (cycle) => {
    client / src / pages / Account.tsx;
    332;
    try {
        client / src / pages / Account.tsx;
        333;
        client / src / pages / Account.tsx;
        334;
        setIsManagingSubscription(false);
        client / src / pages / Account.tsx;
        335;
        setIsUpgradingPlan(false);
        client / src / pages / Account.tsx;
        336;
        client / src / pages / Account.tsx;
        337;
        client / src / pages / Account.tsx;
        338;
        const selectedCycle = cycle || billingCycle;
        client / src / pages / Account.tsx;
        339;
        client / src / pages / Account.tsx;
        340;
        client / src / pages / Account.tsx;
        341;
        const response = await fetch('/api/payments/create-subscription', {
            client
        } / src / pages / Account.tsx, 342, method, 'POST', client / src / pages / Account.tsx, 343, headers, { 'Content-Type': 'application/json' }, client / src / pages / Account.tsx, 344, body, JSON.stringify({
            client
        } / src / pages / Account.tsx, 345, userId, user?.id, client / src / pages / Account.tsx, 346, plan, 'premium', client / src / pages / Account.tsx, 347, interval, selectedCycle, client / src / pages / Account.tsx, 348, email, user?.email, client / src / pages / Account.tsx, 349));
    }
    finally { }
    client / src / pages / Account.tsx;
    350;
};
client / src / pages / Account.tsx;
351;
client / src / pages / Account.tsx;
352;
if (!response.ok) {
    client / src / pages / Account.tsx;
    353;
    throw new Error('Failed to create subscription');
    client / src / pages / Account.tsx;
    354;
}
client / src / pages / Account.tsx;
355;
client / src / pages / Account.tsx;
356;
const { clientSecret } = await response.json();
client / src / pages / Account.tsx;
357;
client / src / pages / Account.tsx;
358;
client / src / pages / Account.tsx;
359;
window.location.href = `/checkout?client_secret=${clientSecret}`;
client / src / pages / Account.tsx;
360;
try { }
catch (error) {
    client / src / pages / Account.tsx;
    361;
    console.error('Error upgrading subscription:', error);
    client / src / pages / Account.tsx;
    362;
    toast({
        client
    } / src / pages / Account.tsx, 363, title, "Error", client / src / pages / Account.tsx, 364, description, error.message || "Failed to upgrade subscription", client / src / pages / Account.tsx, 365, variant, "destructive", client / src / pages / Account.tsx, 366);
}
;
client / src / pages / Account.tsx;
367;
client / src / pages / Account.tsx;
368;
;
client / src / pages / Account.tsx;
369;
client / src / pages / Account.tsx;
370;
const cancelSubscription = async () => {
    client / src / pages / Account.tsx;
    371;
    try {
        client / src / pages / Account.tsx;
        372;
        const response = await fetch('/api/payments/cancel-subscription', {
            client
        } / src / pages / Account.tsx, 373, method, 'POST', client / src / pages / Account.tsx, 374, headers, { 'Content-Type': 'application/json' }, client / src / pages / Account.tsx, 375, body, JSON.stringify({
            client
        } / src / pages / Account.tsx, 376, userId, user?.id, client / src / pages / Account.tsx, 377));
    }
    finally { }
    client / src / pages / Account.tsx;
    378;
};
client / src / pages / Account.tsx;
379;
client / src / pages / Account.tsx;
380;
if (!response.ok) {
    client / src / pages / Account.tsx;
    381;
    throw new Error('Failed to cancel subscription');
    client / src / pages / Account.tsx;
    382;
}
client / src / pages / Account.tsx;
383;
client / src / pages / Account.tsx;
384;
setIsCancellingSubscription(false);
client / src / pages / Account.tsx;
385;
toast({
    client
} / src / pages / Account.tsx, 386, title, "Subscription Cancelled", client / src / pages / Account.tsx, 387, description, "Your subscription has been cancelled successfully.", client / src / pages / Account.tsx, 388, variant, "default", client / src / pages / Account.tsx, 389);
client / src / pages / Account.tsx;
390;
client / src / pages / Account.tsx;
391;
client / src / pages / Account.tsx;
392;
window.location.reload();
client / src / pages / Account.tsx;
393;
try { }
catch (error) {
    client / src / pages / Account.tsx;
    394;
    console.error('Error cancelling subscription:', error);
    client / src / pages / Account.tsx;
    395;
    toast({
        client
    } / src / pages / Account.tsx, 396, title, "Error", client / src / pages / Account.tsx, 397, description, error.message || "Failed to cancel subscription", client / src / pages / Account.tsx, 398, variant, "destructive", client / src / pages / Account.tsx, 399);
}
;
client / src / pages / Account.tsx;
400;
client / src / pages / Account.tsx;
401;
;
client / src / pages / Account.tsx;
402;
client / src / pages / Account.tsx;
403;
client / src / pages / Account.tsx;
404;
const initializePaymentMethodsUpdate = async () => {
    client / src / pages / Account.tsx;
    405;
    try {
        client / src / pages / Account.tsx;
        406;
        setIsLoading(true);
        client / src / pages / Account.tsx;
        407;
        client / src / pages / Account.tsx;
        408;
        client / src / pages / Account.tsx;
        409;
        const response = await fetch('/api/payments/create-setup-intent', {
            client
        } / src / pages / Account.tsx, 410, method, 'POST', client / src / pages / Account.tsx, 411, headers, { 'Content-Type': 'application/json' }, client / src / pages / Account.tsx, 412, body, JSON.stringify({
            client
        } / src / pages / Account.tsx, 413, userId, user?.id, client / src / pages / Account.tsx, 414));
    }
    finally { }
    client / src / pages / Account.tsx;
    415;
};
client / src / pages / Account.tsx;
416;
client / src / pages / Account.tsx;
417;
if (!response.ok) {
    client / src / pages / Account.tsx;
    418;
    throw new Error('Failed to initialize payment method update');
    client / src / pages / Account.tsx;
    419;
}
client / src / pages / Account.tsx;
420;
client / src / pages / Account.tsx;
421;
const { clientSecret } = await response.json();
client / src / pages / Account.tsx;
422;
setSetupIntentClientSecret(clientSecret);
client / src / pages / Account.tsx;
423;
client / src / pages / Account.tsx;
424;
try { }
catch (error) {
    client / src / pages / Account.tsx;
    425;
    console.error('Error initializing payment method update:', error);
    client / src / pages / Account.tsx;
    426;
    toast({
        client
    } / src / pages / Account.tsx, 427, title, "Error", client / src / pages / Account.tsx, 428, description, error.message || "Failed to initialize payment method management", client / src / pages / Account.tsx, 429, variant, "destructive", client / src / pages / Account.tsx, 430);
}
;
client / src / pages / Account.tsx;
431;
try { }
finally {
    client / src / pages / Account.tsx;
    432;
    setIsLoading(false);
    client / src / pages / Account.tsx;
    433;
}
client / src / pages / Account.tsx;
434;
;
client / src / pages / Account.tsx;
435;
client / src / pages / Account.tsx;
436;
const profileForm = useForm({
    client
} / src / pages / Account.tsx, 437, defaultValues, {
    client
} / src / pages / Account.tsx, 438, name, user?.name || '', client / src / pages / Account.tsx, 439, email, user?.email || '', client / src / pages / Account.tsx, 440, username, user?.username || '', client / src / pages / Account.tsx, 441);
client / src / pages / Account.tsx;
442;
;
client / src / pages / Account.tsx;
443;
client / src / pages / Account.tsx;
444;
const handleLogout = async () => {
    client / src / pages / Account.tsx;
    445;
    try {
        client / src / pages / Account.tsx;
        446;
        await fetch('/auth/logout', {
            client
        } / src / pages / Account.tsx, 447, method, 'POST', client / src / pages / Account.tsx, 448, headers, {
            client
        } / src / pages / Account.tsx, 449, 'Content-Type', 'application/json', client / src / pages / Account.tsx, 450);
    }
    finally { }
    client / src / pages / Account.tsx;
    451;
};
client / src / pages / Account.tsx;
452;
window.location.href = '/sign-in';
client / src / pages / Account.tsx;
453;
try { }
catch (error) {
    client / src / pages / Account.tsx;
    454;
    console.error("Logout failed:", error);
    client / src / pages / Account.tsx;
    455;
    toast({
        client
    } / src / pages / Account.tsx, 456, title, "Logout failed", client / src / pages / Account.tsx, 457, description, "There was an error logging out. Please try again.", client / src / pages / Account.tsx, 458, variant, "destructive", client / src / pages / Account.tsx, 459);
}
;
client / src / pages / Account.tsx;
460;
client / src / pages / Account.tsx;
461;
;
client / src / pages / Account.tsx;
462;
client / src / pages / Account.tsx;
463;
const handleEditProfile = () => {
    client / src / pages / Account.tsx;
    464;
    client / src / pages / Account.tsx;
    465;
    profileForm.reset({
        client
    } / src / pages / Account.tsx, 466, name, user?.name || '', client / src / pages / Account.tsx, 467, email, user?.email || '', client / src / pages / Account.tsx, 468, username, user?.username || '', client / src / pages / Account.tsx, 469);
};
client / src / pages / Account.tsx;
470;
setIsEditingProfile(true);
client / src / pages / Account.tsx;
471;
;
client / src / pages / Account.tsx;
472;
client / src / pages / Account.tsx;
473;
const handleProfileSubmit = async (data) => {
    client / src / pages / Account.tsx;
    474;
    try {
        client / src / pages / Account.tsx;
        475;
        await updateProfile(data);
        client / src / pages / Account.tsx;
        476;
        setIsEditingProfile(false);
        client / src / pages / Account.tsx;
        477;
        toast({
            client
        } / src / pages / Account.tsx, 478, title, "Profile updated", client / src / pages / Account.tsx, 479, description, "Your profile has been updated successfully.", client / src / pages / Account.tsx, 480, variant, "default", client / src / pages / Account.tsx, 481);
    }
    finally { }
    ;
    client / src / pages / Account.tsx;
    482;
};
try { }
catch (error) {
    client / src / pages / Account.tsx;
    483;
    toast({
        client
    } / src / pages / Account.tsx, 484, title, "Failed to update profile", client / src / pages / Account.tsx, 485, description, error.message || "An error occurred while updating your profile.", client / src / pages / Account.tsx, 486, variant, "destructive", client / src / pages / Account.tsx, 487);
}
;
client / src / pages / Account.tsx;
488;
client / src / pages / Account.tsx;
489;
;
client / src / pages / Account.tsx;
490;
client / src / pages / Account.tsx;
491;
client / src / pages / Account.tsx;
492;
const formatDate = (date) => {
    client / src / pages / Account.tsx;
    493;
    if (!date)
        return 'N/A';
    client / src / pages / Account.tsx;
    494;
    return new Date(date).toLocaleDateString('en-US', {
        client
    } / src / pages / Account.tsx, 495, year, 'numeric', client / src / pages / Account.tsx, 496, month, 'long', client / src / pages / Account.tsx, 497, day, 'numeric', client / src / pages / Account.tsx, 498);
};
client / src / pages / Account.tsx;
499;
;
client / src / pages / Account.tsx;
500;
client / src / pages / Account.tsx;
501;
client / src / pages / Account.tsx;
502;
const handleEditSection = (sectionId) => {
    client / src / pages / Account.tsx;
    503;
    client / src / pages / Account.tsx;
    504;
    toast({
        client
    } / src / pages / Account.tsx, 505, title, "Edit Section", client / src / pages / Account.tsx, 506, description, `Editing ${sectionId} section`, client / src / pages / Account.tsx, 507);
};
client / src / pages / Account.tsx;
508;
;
client / src / pages / Account.tsx;
509;
client / src / pages / Account.tsx;
510;
if (!user) {
    client / src / pages / Account.tsx;
    511;
    return _jsx("div", { className: "p-8 text-center", children: "Loading user information..." });
    client / src / pages / Account.tsx;
    512;
}
client / src / pages / Account.tsx;
513;
client / src / pages / Account.tsx;
514;
return (client / src / pages / Account.tsx);
515;
_jsxs("div", { className: "container max-w-5xl py-8", children: ["client/src/pages/Account.tsx:516:      ", _jsx("h1", { className: "text-2xl font-bold mb-6", children: "Account Settings" }), "client/src/pages/Account.tsx:517: client/src/pages/Account.tsx:518:      ", _jsxs(Tabs, { defaultValue: "profile", className: "w-full", children: ["client/src/pages/Account.tsx:519:        ", _jsxs(TabsList, { className: "mb-6", children: ["client/src/pages/Account.tsx:520:          ", _jsxs(TabsTrigger, { value: "profile", className: "flex items-center", children: ["client/src/pages/Account.tsx:521:            ", _jsx(User, { className: "mr-2 h-4 w-4" }), "client/src/pages/Account.tsx:522:            Profile client/src/pages/Account.tsx:523:          "] }), "client/src/pages/Account.tsx:524:          ", _jsxs(TabsTrigger, { value: "subscription", className: "flex items-center", children: ["client/src/pages/Account.tsx:525:            ", _jsx(CreditCard, { className: "mr-2 h-4 w-4" }), "client/src/pages/Account.tsx:526:            Subscription client/src/pages/Account.tsx:527:          "] }), "client/src/pages/Account.tsx:528: client/src/pages/Account.tsx:529:          ", _jsxs(TabsTrigger, { value: "security", className: "flex items-center", children: ["client/src/pages/Account.tsx:530:            ", _jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }), "client/src/pages/Account.tsx:531:            Security client/src/pages/Account.tsx:532:          "] }), "client/src/pages/Account.tsx:533:        "] }), "client/src/pages/Account.tsx:534: client/src/pages/Account.tsx:535:        ", _jsxs(TabsContent, { value: "profile", className: "space-y-6", children: ["client/src/pages/Account.tsx:536:          ", _jsxs(Card, { children: ["client/src/pages/Account.tsx:537:            ", _jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: ["client/src/pages/Account.tsx:538:              ", _jsx(CardTitle, { children: "Profile Information" }), "client/src/pages/Account.tsx:539:              ", _jsxs(Button, { variant: "outline", size: "sm", onClick: handleEditProfile, children: ["client/src/pages/Account.tsx:540:                ", _jsx(Edit, { className: "mr-2 h-4 w-4" }), "client/src/pages/Account.tsx:541:                Edit Profile client/src/pages/Account.tsx:542:              "] }), "client/src/pages/Account.tsx:543:            "] }), "client/src/pages/Account.tsx:544:            ", _jsxs(CardContent, { className: "grid grid-cols-2 gap-4", children: ["client/src/pages/Account.tsx:545:              ", _jsxs("div", { children: ["client/src/pages/Account.tsx:546:                ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Name" }), "client/src/pages/Account.tsx:547:                ", _jsx("p", { children: user.name }), "client/src/pages/Account.tsx:548:              "] }), "client/src/pages/Account.tsx:549:              ", _jsxs("div", { children: ["client/src/pages/Account.tsx:550:                ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Email" }), "client/src/pages/Account.tsx:551:                ", _jsx("p", { children: user.email }), "client/src/pages/Account.tsx:552:              "] }), "client/src/pages/Account.tsx:553:              ", _jsxs("div", { children: ["client/src/pages/Account.tsx:554:                ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Username" }), "client/src/pages/Account.tsx:555:                ", _jsx("p", { children: user.username }), "client/src/pages/Account.tsx:556:              "] }), "client/src/pages/Account.tsx:557:              ", _jsxs("div", { children: ["client/src/pages/Account.tsx:558:                ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Account Created" }), "client/src/pages/Account.tsx:559:                ", _jsx("p", { children: "March 15, 2025" }), "client/src/pages/Account.tsx:560:              "] }), "client/src/pages/Account.tsx:561:              ", _jsxs("div", { children: ["client/src/pages/Account.tsx:562:                ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "User Type" }), "client/src/pages/Account.tsx:563:                ", _jsx("p", { className: "capitalize", children: user.userType ? user.userType.replace('_', ' ') : 'Standard' }), "client/src/pages/Account.tsx:564:              "] }), "client/src/pages/Account.tsx:565:            "] }), "client/src/pages/Account.tsx:566:          "] }), "client/src/pages/Account.tsx:567: client/src/pages/Account.tsx:568:          ", "client/src/pages/Account.tsx:569:          ", _jsxs(Dialog, { open: isEditingProfile, onOpenChange: setIsEditingProfile, children: ["client/src/pages/Account.tsx:570:            ", _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: ["client/src/pages/Account.tsx:571:              ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:572:                ", _jsx(DialogTitle, { children: "Edit Profile" }), "client/src/pages/Account.tsx:573:                ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:574:                  Make changes to your profile information here. client/src/pages/Account.tsx:575:                " }), "client/src/pages/Account.tsx:576:              "] }), "client/src/pages/Account.tsx:577:              ", _jsxs(Form, { ...profileForm, children: ["client/src/pages/Account.tsx:578:                ", _jsxs("form", { onSubmit: profileForm.handleSubmit(handleProfileSubmit), className: "space-y-4 py-4", children: ["client/src/pages/Account.tsx:579:                  ", _jsx(FormField, { client: true }), "src/pages/Account.tsx:580:                    control=", profileForm.control, "client/src/pages/Account.tsx:581:                    name=\"name\" client/src/pages/Account.tsx:582:                    render=", ({ field }) => (client / src / pages / Account.tsx), ":583:                      ", _jsxs(FormItem, { children: ["client/src/pages/Account.tsx:584:                        ", _jsx(FormLabel, { children: "Name" }), "client/src/pages/Account.tsx:585:                        ", _jsxs(FormControl, { children: ["client/src/pages/Account.tsx:586:                          ", _jsx(Input, { placeholder: "Your name", ...field }), "client/src/pages/Account.tsx:587:                        "] }), "client/src/pages/Account.tsx:588:                        ", _jsx(FormMessage, {}), "client/src/pages/Account.tsx:589:                      "] }), "client/src/pages/Account.tsx:590:                    )} client/src/pages/Account.tsx:591:                  /> client/src/pages/Account.tsx:592:                  ", _jsx(FormField, { client: true }), "src/pages/Account.tsx:593:                    control=", profileForm.control, "client/src/pages/Account.tsx:594:                    name=\"email\" client/src/pages/Account.tsx:595:                    render=", ({ field }) => (client / src / pages / Account.tsx), ":596:                      ", _jsxs(FormItem, { children: ["client/src/pages/Account.tsx:597:                        ", _jsx(FormLabel, { children: "Email" }), "client/src/pages/Account.tsx:598:                        ", _jsxs(FormControl, { children: ["client/src/pages/Account.tsx:599:                          ", _jsx(Input, { type: "email", placeholder: "Your email", ...field }), "client/src/pages/Account.tsx:600:                        "] }), "client/src/pages/Account.tsx:601:                        ", _jsx(FormMessage, {}), "client/src/pages/Account.tsx:602:                      "] }), "client/src/pages/Account.tsx:603:                    )} client/src/pages/Account.tsx:604:                  /> client/src/pages/Account.tsx:605:                  ", _jsx(FormField, { client: true }), "src/pages/Account.tsx:606:                    control=", profileForm.control, "client/src/pages/Account.tsx:607:                    name=\"username\" client/src/pages/Account.tsx:608:                    render=", ({ field }) => (client / src / pages / Account.tsx), ":609:                      ", _jsxs(FormItem, { children: ["client/src/pages/Account.tsx:610:                        ", _jsx(FormLabel, { children: "Username" }), "client/src/pages/Account.tsx:611:                        ", _jsxs(FormControl, { children: ["client/src/pages/Account.tsx:612:                          ", _jsx(Input, { placeholder: "Your username", ...field }), "client/src/pages/Account.tsx:613:                        "] }), "client/src/pages/Account.tsx:614:                        ", _jsx(FormMessage, {}), "client/src/pages/Account.tsx:615:                      "] }), "client/src/pages/Account.tsx:616:                    )} client/src/pages/Account.tsx:617:                  /> client/src/pages/Account.tsx:618:                  ", _jsxs(DialogFooter, { className: "mt-6", children: ["client/src/pages/Account.tsx:619:                    ", _jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEditingProfile(false), children: "client/src/pages/Account.tsx:620:                      Cancel client/src/pages/Account.tsx:621:                    " }), "client/src/pages/Account.tsx:622:                    ", _jsx(Button, { type: "submit", children: "Save Changes" }), "client/src/pages/Account.tsx:623:                  "] }), "client/src/pages/Account.tsx:624:                "] }), "client/src/pages/Account.tsx:625:              "] }), "client/src/pages/Account.tsx:626:            "] }), "client/src/pages/Account.tsx:627:          "] }), "client/src/pages/Account.tsx:628:          ", _jsxs(Card, { className: "mt-6", children: ["client/src/pages/Account.tsx:629:            ", _jsxs(CardHeader, { children: ["client/src/pages/Account.tsx:631:              ", _jsx(CardDescription, { children: "client/src/pages/Account.tsx:632:                Customize the appearance of your application. client/src/pages/Account.tsx:633:              " }), "client/src/pages/Account.tsx:634:            "] }), "client/src/pages/Account.tsx:635:            ", _jsxs(CardContent, { className: "space-y-6", children: ["client/src/pages/Account.tsx:636:              ", _jsxs("div", { className: "space-y-4", children: ["client/src/pages/Account.tsx:637:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:638:                  ", _jsx("h3", { className: "font-medium mb-2", children: "Color Mode" }), "client/src/pages/Account.tsx:639:                  ", _jsxs("div", { className: "grid grid-cols-3 gap-2", children: ["client/src/pages/Account.tsx:640:                    ", _jsx(Button, { client: true }), "src/pages/Account.tsx:641:                      variant=\"outline\" client/src/pages/Account.tsx:642:                      className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'light' ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:644:                    > client/src/pages/Account.tsx:645:                      ", _jsxs("div", { className: "h-12 w-12 bg-background border rounded-full flex items-center justify-center mb-2", children: ["client/src/pages/Account.tsx:646:                        ", _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-foreground", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 8a2 2 0 1 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0c0 8-12 8-12 0a8 8 0 0 0 16 0c0 12-16 12-16 0" })] }), "client/src/pages/Account.tsx:647:                      "] }), "client/src/pages/Account.tsx:648:                      ", _jsx("span", { children: "Light" }), "client/src/pages/Account.tsx:649:                    "] }), "client/src/pages/Account.tsx:650: client/src/pages/Account.tsx:651:                    ", _jsx(Button, { client: true }), "src/pages/Account.tsx:652:                      variant=\"outline\" client/src/pages/Account.tsx:653:                      className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'dark' ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:655:                    > client/src/pages/Account.tsx:656:                      ", _jsxs("div", { className: "h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-2", children: ["client/src/pages/Account.tsx:657:                        ", _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }) }), "client/src/pages/Account.tsx:658:                      "] }), "client/src/pages/Account.tsx:659:                      ", _jsx("span", { children: "Dark" }), "client/src/pages/Account.tsx:660:                    "] }), "client/src/pages/Account.tsx:661: client/src/pages/Account.tsx:662:                    ", _jsx(Button, { client: true }), "src/pages/Account.tsx:663:                      variant=\"outline\" client/src/pages/Account.tsx:664:                      className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'system' ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:666:                    > client/src/pages/Account.tsx:667:                      ", _jsxs("div", { className: "h-12 w-12 bg-gradient-to-br from-background to-zinc-900 border rounded-full flex items-center justify-center mb-2", children: ["client/src/pages/Account.tsx:668:                        ", _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { width: "18", height: "14", x: "3", y: "3", rx: "2" }), _jsx("path", { d: "M7 20h10" }), _jsx("path", { d: "M9 16v4" }), _jsx("path", { d: "M15 16v4" })] }), "client/src/pages/Account.tsx:669:                      "] }), "client/src/pages/Account.tsx:670:                      ", _jsx("span", { children: "System" }), "client/src/pages/Account.tsx:671:                    "] }), "client/src/pages/Account.tsx:672:                  "] }), "client/src/pages/Account.tsx:673:                "] }), "client/src/pages/Account.tsx:674: client/src/pages/Account.tsx:675:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:676:                  ", _jsx("h3", { className: "font-medium mb-2", children: "Primary Color" }), "client/src/pages/Account.tsx:677:                  ", _jsxs("div", { className: "flex flex-wrap gap-3", children: ["client/src/pages/Account.tsx:678:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:679:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0C29AB] hover:ring-2 hover:ring-offset-2 hover:ring-[#0C29AB]/50\" client/src/pages/Account.tsx:680:                      style=", { backgroundColor: "#0C29AB" }, "client/src/pages/Account.tsx:681:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":682:                        setCustomColor(\"#0C29AB\"); client/src/pages/Account.tsx:685:                      }} client/src/pages/Account.tsx:686:                    /> client/src/pages/Account.tsx:687:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:688:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#7C3AED] hover:ring-2 hover:ring-offset-2 hover:ring-[#7C3AED]/50\" client/src/pages/Account.tsx:689:                      style=", { backgroundColor: "#7C3AED" }, "client/src/pages/Account.tsx:690:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":691:                        setCustomColor(\"#7C3AED\"); client/src/pages/Account.tsx:694:                      }} client/src/pages/Account.tsx:695:                    /> client/src/pages/Account.tsx:696:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:697:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#10B981] hover:ring-2 hover:ring-offset-2 hover:ring-[#10B981]/50\" client/src/pages/Account.tsx:698:                      style=", { backgroundColor: "#10B981" }, "client/src/pages/Account.tsx:699:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":700:                        setCustomColor(\"#10B981\"); client/src/pages/Account.tsx:703:                      }} client/src/pages/Account.tsx:704:                    /> client/src/pages/Account.tsx:705:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:706:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#F97316] hover:ring-2 hover:ring-offset-2 hover:ring-[#F97316]/50\" client/src/pages/Account.tsx:707:                      style=", { backgroundColor: "#F97316" }, "client/src/pages/Account.tsx:708:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":709:                        setCustomColor(\"#F97316\"); client/src/pages/Account.tsx:712:                      }} client/src/pages/Account.tsx:713:                    /> client/src/pages/Account.tsx:714:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:715:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#EF4444] hover:ring-2 hover:ring-offset-2 hover:ring-[#EF4444]/50\" client/src/pages/Account.tsx:716:                      style=", { backgroundColor: "#EF4444" }, "client/src/pages/Account.tsx:717:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":718:                        setCustomColor(\"#EF4444\"); client/src/pages/Account.tsx:721:                      }} client/src/pages/Account.tsx:722:                    /> client/src/pages/Account.tsx:723:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:724:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#6366F1] hover:ring-2 hover:ring-offset-2 hover:ring-[#6366F1]/50\" client/src/pages/Account.tsx:725:                      style=", { backgroundColor: "#6366F1" }, "client/src/pages/Account.tsx:726:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":727:                        setCustomColor(\"#6366F1\"); client/src/pages/Account.tsx:730:                      }} client/src/pages/Account.tsx:731:                    /> client/src/pages/Account.tsx:732:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:733:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#2563EB] hover:ring-2 hover:ring-offset-2 hover:ring-[#2563EB]/50\" client/src/pages/Account.tsx:734:                      style=", { backgroundColor: "#2563EB" }, "client/src/pages/Account.tsx:735:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":736:                        setCustomColor(\"#2563EB\"); client/src/pages/Account.tsx:739:                      }} client/src/pages/Account.tsx:740:                    /> client/src/pages/Account.tsx:741:                    ", _jsx("div", { client: true }), "src/pages/Account.tsx:742:                      className=\"w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0891B2] hover:ring-2 hover:ring-offset-2 hover:ring-[#0891B2]/50\" client/src/pages/Account.tsx:743:                      style=", { backgroundColor: "#0891B2" }, "client/src/pages/Account.tsx:744:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":745:                        setCustomColor(\"#0891B2\"); client/src/pages/Account.tsx:748:                      }} client/src/pages/Account.tsx:749:                    /> client/src/pages/Account.tsx:750:                    ", _jsxs("label", { htmlFor: "custom-color", className: "w-8 h-8 rounded-full border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-muted", children: ["client/src/pages/Account.tsx:751:                      ", _jsx(Palette, { className: "h-4 w-4" }), "client/src/pages/Account.tsx:752:                      ", _jsx("input", { client: true }), "src/pages/Account.tsx:753:                        type=\"color\" client/src/pages/Account.tsx:754:                        id=\"custom-color\" client/src/pages/Account.tsx:755:                        className=\"sr-only\" client/src/pages/Account.tsx:756:                        value=", customColor, "client/src/pages/Account.tsx:757:                        onChange=", (e) => {
                                                    client / src / pages / Account.tsx;
                                                }, ":758:                          const color = e.target.value; client/src/pages/Account.tsx:759:                          setCustomColor(color); client/src/pages/Account.tsx:762:                        }} client/src/pages/Account.tsx:763:                      /> client/src/pages/Account.tsx:764:                    "] }), "client/src/pages/Account.tsx:765:                  "] }), "client/src/pages/Account.tsx:766:                "] }), "client/src/pages/Account.tsx:767: client/src/pages/Account.tsx:768:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:769:                  ", _jsx("h3", { className: "font-medium mb-2", children: "Variant" }), "client/src/pages/Account.tsx:770:                  ", _jsxs("div", { className: "grid grid-cols-3 gap-2", children: ["client/src/pages/Account.tsx:771:                    ", _jsx(Button, { client: true }), "src/pages/Account.tsx:772:                      variant=\"outline\" client/src/pages/Account.tsx:773:                      className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'professional' ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:774:                      onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":777:                      }} client/src/pages/Account.tsx:778:                    > client/src/pages/Account.tsx:779:                      ", _jsxs("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-r from-primary/20 to-primary/10", children: ["client/src/pages/Account.tsx:780:                        ", _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M20 7h-3a2 2 0 0 1-2-2V2" }), _jsx("path", { d: "M7 2v4a2 2 0 0 1-2 2H2" }), _jsx("path", { d: "M20 17h-3a2 2 0 0 0-2 2v3" }), _jsx("path", { d: "M2 17h3a2 2 0 0 1 2 2v3" }), _jsx("rect", { width: "9", height: "9", x: "7.5", y: "7.5", rx: "1" })] }), "client/src/pages/Account.tsx:781:                      "] }), "client/src/pages/Account.tsx:782:                      ", _jsx("span", { children: "Professional" }), "client/src/pages/Account.tsx:783:                    "] }), "client/src/pages/Account.tsx:784: client/src/pages/Account.tsx:785:                    ", _jsx(Button, { client: true }), "src/pages/Account.tsx:786:                      variant=\"outline\" client/src/pages/Account.tsx:787:                      className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'tint' ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:788:                      onClick=", () => {
                                    client / src / pages / Account.tsx;
                                }, ":791:                      }} client/src/pages/Account.tsx:792:                    > client/src/pages/Account.tsx:793:                      ", _jsxs("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-br from-primary/30 to-primary/10", children: ["client/src/pages/Account.tsx:794:                        ", _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" }), _jsx("path", { d: "m19 9-2 2-2-2" }), _jsx("path", { d: "m5 9 2 2 2-2" }), _jsx("path", { d: "m9 19 2-2 2 2" }), _jsx("path", { d: "m9 5 2 2 2-2" })] }), "client/src/pages/Account.tsx:795:                      "] }), "client/src/pages/Account.tsx:796:                      ", _jsx("span", { children: "Tint" }), "client/src/pages/Account.tsx:797:                    "] }), "client/src/pages/Account.tsx:798: client/src/pages/Account.tsx:799:                    ", _jsx(Button, { client: true }), "src/pages/Account.tsx:800:                      variant=\"outline\" client/src/pages/Account.tsx:801:                      className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'vibrant' ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:802:                      onClick=", () => {
                            client / src / pages / Account.tsx;
                        }, ":805:                      }} client/src/pages/Account.tsx:806:                    > client/src/pages/Account.tsx:807:                      ", _jsxs("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-tr from-primary/90 to-primary/30", children: ["client/src/pages/Account.tsx:808:                        ", _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "13.5", cy: "6.5", r: "2.5" }), _jsx("circle", { cx: "19", cy: "17", r: "3" }), _jsx("circle", { cx: "6", cy: "12", r: "4" })] }), "client/src/pages/Account.tsx:809:                      "] }), "client/src/pages/Account.tsx:810:                      ", _jsx("span", { children: "Vibrant" }), "client/src/pages/Account.tsx:811:                    "] }), "client/src/pages/Account.tsx:812:                  "] })] });
client / src / pages / Account.tsx;
813;
div >
    client / src / pages / Account.tsx;
814;
client / src / pages / Account.tsx;
815;
_jsxs("div", { children: ["client/src/pages/Account.tsx:816:                  ", _jsx("h3", { className: "font-medium mb-2", children: "Border Radius" }), "client/src/pages/Account.tsx:817:                  ", _jsxs("div", { className: "space-y-4", children: ["client/src/pages/Account.tsx:818:                    ", _jsxs("div", { className: "grid grid-cols-3 gap-2 mb-4", children: ["client/src/pages/Account.tsx:819:                      ", _jsx(Button, { client: true }), "src/pages/Account.tsx:820:                        variant=\"outline\" client/src/pages/Account.tsx:821:                        className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0 ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:822:                        onClick=", () => {
                            client / src / pages / Account.tsx;
                        }, ":825:                        }} client/src/pages/Account.tsx:826:                      > client/src/pages/Account.tsx:827:                        ", _jsxs("div", { className: "h-12 w-12 border rounded-none flex items-center justify-center mb-2", children: ["client/src/pages/Account.tsx:828:                          ", _jsx("span", { className: "text-xs", children: "0px" }), "client/src/pages/Account.tsx:829:                        "] }), "client/src/pages/Account.tsx:830:                        ", _jsx("span", { children: "None" }), "client/src/pages/Account.tsx:831:                      "] }), "client/src/pages/Account.tsx:832: client/src/pages/Account.tsx:833:                      ", _jsx(Button, { client: true }), "src/pages/Account.tsx:834:                        variant=\"outline\" client/src/pages/Account.tsx:835:                        className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0.5 ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:836:                        onClick=", () => {
                    client / src / pages / Account.tsx;
                }, ":839:                        }} client/src/pages/Account.tsx:840:                      > client/src/pages/Account.tsx:841:                        ", _jsxs("div", { className: "h-12 w-12 border rounded-sm flex items-center justify-center mb-2", children: ["client/src/pages/Account.tsx:842:                          ", _jsx("span", { className: "text-xs", children: "0.5rem" }), "client/src/pages/Account.tsx:843:                        "] }), "client/src/pages/Account.tsx:844:                        ", _jsx("span", { children: "Small" }), "client/src/pages/Account.tsx:845:                      "] }), "client/src/pages/Account.tsx:846: client/src/pages/Account.tsx:847:                      ", _jsx(Button, { client: true }), "src/pages/Account.tsx:848:                        variant=\"outline\" client/src/pages/Account.tsx:849:                        className=", `flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 1 ? 'border-primary' : ''}`, "client/src/pages/Account.tsx:850:                        onClick=", () => {
            client / src / pages / Account.tsx;
        }, ":853:                        }} client/src/pages/Account.tsx:854:                      > client/src/pages/Account.tsx:855:                        ", _jsxs("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2", children: ["client/src/pages/Account.tsx:856:                          ", _jsx("span", { className: "text-xs", children: "1rem" }), "client/src/pages/Account.tsx:857:                        "] }), "client/src/pages/Account.tsx:858:                        ", _jsx("span", { children: "Medium" }), "client/src/pages/Account.tsx:859:                      "] });
client / src / pages / Account.tsx;
860;
div >
    client / src / pages / Account.tsx;
861;
client / src / pages / Account.tsx;
862;
_jsx(Slider, { client: true });
src / pages / Account.tsx;
863;
defaultValue = { [user?.theme?.radius || 0.5]:  };
client / src / pages / Account.tsx;
864;
min = { 0:  };
client / src / pages / Account.tsx;
865;
max = { 1.5:  };
client / src / pages / Account.tsx;
866;
step = { 0.1:  };
client / src / pages / Account.tsx;
867;
onValueChange = {}(value);
{
    client / src / pages / Account.tsx;
    870;
}
client / src / pages / Account.tsx;
871;
/>;
client / src / pages / Account.tsx;
872;
div >
    client / src / pages / Account.tsx;
873;
div >
    client / src / pages / Account.tsx;
874;
div >
    client / src / pages / Account.tsx;
875;
CardContent >
    client / src / pages / Account.tsx;
876;
_jsxs(CardFooter, { className: "border-t pt-6", children: ["client/src/pages/Account.tsx:877:              ", _jsx(Button, { client: true }), "src/pages/Account.tsx:878:                onClick=", () => {
            client / src / pages / Account.tsx;
        }, ":881:                }} client/src/pages/Account.tsx:882:                variant=\"outline\" client/src/pages/Account.tsx:883:                className=\"mr-2\" client/src/pages/Account.tsx:884:              > client/src/pages/Account.tsx:885:                ", _jsx(RotateCcw, { className: "h-4 w-4 mr-2" }), "client/src/pages/Account.tsx:886:                Reset to Defaults client/src/pages/Account.tsx:887:              "] });
client / src / pages / Account.tsx;
890;
_jsxs(_Fragment, { children: ["client/src/pages/Account.tsx:891:                    ", _jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "client/src/pages/Account.tsx:892:                    Updating... client/src/pages/Account.tsx:893:                  "] });
client / src / pages / Account.tsx;
894;
(client / src / pages / Account.tsx);
895;
'Apply Changes';
client / src / pages / Account.tsx;
896;
client / src / pages / Account.tsx;
897;
Button >
    client / src / pages / Account.tsx;
898;
CardFooter >
    client / src / pages / Account.tsx;
899;
Card >
    client / src / pages / Account.tsx;
900;
TabsContent >
    client / src / pages / Account.tsx;
901;
client / src / pages / Account.tsx;
902;
_jsxs(TabsContent, { value: "subscription", className: "space-y-6", children: ["client/src/pages/Account.tsx:903:          ", _jsxs(Card, { children: ["client/src/pages/Account.tsx:904:            ", _jsxs(CardHeader, { children: ["client/src/pages/Account.tsx:905:              ", _jsx(CardTitle, { children: "Subscription Details" }), "client/src/pages/Account.tsx:906:              ", user.subscriptionPlan === 'free' && (client / src / pages / Account.tsx), ":907:                ", _jsxs("div", { className: "flex justify-end", children: ["client/src/pages/Account.tsx:908:                  ", _jsx(Button, { client: true }), "src/pages/Account.tsx:909:                    variant=\"default\" client/src/pages/Account.tsx:910:                    size=\"sm\" client/src/pages/Account.tsx:911:                    onClick=", () => setIsUpgradingPlan(true), "client/src/pages/Account.tsx:912:                    className=\"mt-2\" client/src/pages/Account.tsx:913:                  > client/src/pages/Account.tsx:914:                    ", _jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "client/src/pages/Account.tsx:915:                    Upgrade Plan client/src/pages/Account.tsx:916:                  "] }), "client/src/pages/Account.tsx:917:                "] }), "client/src/pages/Account.tsx:918:              )} client/src/pages/Account.tsx:919:            "] }), "client/src/pages/Account.tsx:920:            ", _jsxs(CardContent, { className: "space-y-4", children: ["client/src/pages/Account.tsx:921:              ", _jsxs("div", { className: "grid grid-cols-2 gap-4", children: ["client/src/pages/Account.tsx:922:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:923:                  ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Current Plan" }), "client/src/pages/Account.tsx:924:                  ", _jsx("p", { className: "font-medium", children: getPlanName(user.subscriptionPlan) }), "client/src/pages/Account.tsx:925:                "] }), "client/src/pages/Account.tsx:926:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:927:                  ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Status" }), "client/src/pages/Account.tsx:928:                  ", _jsxs("p", { className: "capitalize", children: ["client/src/pages/Account.tsx:929:                    ", user.subscriptionStatus ?
                                            client / src / pages / Account.tsx : 930, ":                      (user.subscriptionStatus === 'active' ? client/src/pages/Account.tsx:931:                        ", _jsxs("span", { className: "flex items-center text-green-600 font-medium", children: ["client/src/pages/Account.tsx:932:                          ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-1" }), " Active client/src/pages/Account.tsx:933:                        "] }), " : client/src/pages/Account.tsx:934:                        user.subscriptionStatus.replace('_', ' ')) : client/src/pages/Account.tsx:935:                      ", _jsx("span", { className: "text-gray-500", children: "Free" }), "} client/src/pages/Account.tsx:936:                  "] }), "client/src/pages/Account.tsx:937:                "] }), "client/src/pages/Account.tsx:938: client/src/pages/Account.tsx:939:                ", "client/src/pages/Account.tsx:940:                ", user.subscriptionPlan !== 'free' && (client / src / pages / Account.tsx), ":941:                  ", _jsxs(_Fragment, { children: ["client/src/pages/Account.tsx:942:                    ", _jsxs("div", { children: ["client/src/pages/Account.tsx:943:                      ", _jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Billing Cycle" }), "client/src/pages/Account.tsx:944:                      ", _jsx("p", { className: "capitalize", children: user.subscriptionCycle || 'Monthly' }), "client/src/pages/Account.tsx:945:                    "] }), "client/src/pages/Account.tsx:946:                    ", user.subscriptionExpiresAt && (client / src / pages / Account.tsx), ":947:                      ", _jsxs("div", { children: ["client/src/pages/Account.tsx:948:                        ", _jsxs("h3", { className: "font-medium text-sm text-muted-foreground", children: ["client/src/pages/Account.tsx:949:                          ", user.subscriptionStatus === 'active' ? 'Next Billing Date' : 'Expires On', "client/src/pages/Account.tsx:950:                        "] }), "client/src/pages/Account.tsx:951:                        ", _jsx("p", { children: formatDate(user.subscriptionExpiresAt) }), "client/src/pages/Account.tsx:952:                      "] }), "client/src/pages/Account.tsx:953:                    )} client/src/pages/Account.tsx:954:                  "] }), "client/src/pages/Account.tsx:955:                )} client/src/pages/Account.tsx:956:              "] }), "client/src/pages/Account.tsx:957: client/src/pages/Account.tsx:958:              ", "client/src/pages/Account.tsx:959:              ", user.subscriptionPlan === 'free' && (client / src / pages / Account.tsx), ":960:                ", _jsxs("div", { className: "mt-6 p-4 bg-muted/50 rounded-md", children: ["client/src/pages/Account.tsx:961:                  ", _jsx("h3", { className: "font-medium mb-2", children: "Free Plan Features" }), "client/src/pages/Account.tsx:962:                  ", _jsxs("ul", { className: "space-y-1 text-sm", children: ["client/src/pages/Account.tsx:963:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:964:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Basic resume builder client/src/pages/Account.tsx:965:                    "] }), "client/src/pages/Account.tsx:966:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:967:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Limited interview practice client/src/pages/Account.tsx:968:                    "] }), "client/src/pages/Account.tsx:969:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:970:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Work history tracking client/src/pages/Account.tsx:971:                    "] }), "client/src/pages/Account.tsx:972:                  "] }), "client/src/pages/Account.tsx:973:                  ", _jsx(Button, { client: true }), "src/pages/Account.tsx:974:                    variant=\"default\" client/src/pages/Account.tsx:975:                    size=\"sm\" client/src/pages/Account.tsx:976:                    className=\"mt-4\" client/src/pages/Account.tsx:977:                    onClick=", () => upgradeSubscription(), "> client/src/pages/Account.tsx:978:                    Upgrade to Pro client/src/pages/Account.tsx:979:                  "] }), "client/src/pages/Account.tsx:980:                "] }), "client/src/pages/Account.tsx:981:              )} client/src/pages/Account.tsx:982: client/src/pages/Account.tsx:983:              ", "client/src/pages/Account.tsx:984:              ", user.subscriptionPlan === 'premium' && (client / src / pages / Account.tsx), ":985:                ", _jsxs("div", { className: "mt-6 p-4 bg-muted/50 rounded-md", children: ["client/src/pages/Account.tsx:986:                  ", _jsxs("div", { className: "flex items-center justify-between mb-2", children: ["client/src/pages/Account.tsx:987:                    ", _jsx("h3", { className: "font-medium", children: "Your Pro Features" }), "client/src/pages/Account.tsx:988:                    ", _jsxs("div", { className: "flex space-x-2", children: ["client/src/pages/Account.tsx:989:                      ", _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsManagingSubscription(true), children: "client/src/pages/Account.tsx:990:                        Manage Subscription client/src/pages/Account.tsx:991:                      " }), "client/src/pages/Account.tsx:992:                    "] }), "client/src/pages/Account.tsx:993:                  "] }), "client/src/pages/Account.tsx:994:                  ", _jsxs("ul", { className: "space-y-1 text-sm", children: ["client/src/pages/Account.tsx:995:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:996:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Advanced resume builder client/src/pages/Account.tsx:997:                    "] }), "client/src/pages/Account.tsx:998:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:999:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Unlimited interview practice client/src/pages/Account.tsx:1000:                    "] }), "client/src/pages/Account.tsx:1001:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:1002:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " AI career coach client/src/pages/Account.tsx:1003:                    "] }), "client/src/pages/Account.tsx:1004:                    ", _jsxs("li", { className: "flex items-center", children: ["client/src/pages/Account.tsx:1005:                      ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Cover letter generator client/src/pages/Account.tsx:1006:                    "] }), "client/src/pages/Account.tsx:1007:                  "] }), "client/src/pages/Account.tsx:1008:                "] }), "client/src/pages/Account.tsx:1009:              )} client/src/pages/Account.tsx:1010:            "] });
client / src / pages / Account.tsx;
1011;
client / src / pages / Account.tsx;
1012;
{ /* Add Card Footer with Unsubscribe Button for paid plans */ }
client / src / pages / Account.tsx;
1013;
{
    user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active' && (client / src / pages / Account.tsx);
    1014;
    _jsxs(CardFooter, { className: "border-t pt-6 flex flex-col items-stretch", children: ["client/src/pages/Account.tsx:1015:                ", _jsxs("div", { className: "flex items-center justify-between mb-4", children: ["client/src/pages/Account.tsx:1016:                  ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1017:                    ", _jsx("h3", { className: "font-medium", children: "Subscription Management" }), "client/src/pages/Account.tsx:1018:                    ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Need to make changes to your billing?" }), "client/src/pages/Account.tsx:1019:                  "] }), "client/src/pages/Account.tsx:1020:                  ", _jsx(Button, { variant: "default", size: "sm", onClick: () => setIsManagingPaymentMethods(true), children: "client/src/pages/Account.tsx:1021:                    Manage Payment Methods client/src/pages/Account.tsx:1022:                  " }), "client/src/pages/Account.tsx:1023:                "] }), "client/src/pages/Account.tsx:1024: client/src/pages/Account.tsx:1025:              "] });
    client / src / pages / Account.tsx;
    1026;
}
client / src / pages / Account.tsx;
1027;
Card >
    client / src / pages / Account.tsx;
1028;
client / src / pages / Account.tsx;
1029;
{ /* Subscription Management Dialog */ }
client / src / pages / Account.tsx;
1030;
_jsxs(Dialog, { open: isManagingSubscription, onOpenChange: setIsManagingSubscription, children: ["client/src/pages/Account.tsx:1031:            ", _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: ["client/src/pages/Account.tsx:1032:              ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:1033:                ", _jsx(DialogTitle, { children: "Subscription Management" }), "client/src/pages/Account.tsx:1034:                ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:1035:                  Manage your subscription settings and payment methods. client/src/pages/Account.tsx:1036:                " }), "client/src/pages/Account.tsx:1037:              "] }), "client/src/pages/Account.tsx:1038:              ", _jsxs("div", { className: "py-4 space-y-6", children: ["client/src/pages/Account.tsx:1039:                ", "client/src/pages/Account.tsx:1040:                ", _jsxs("div", { className: "rounded-md border p-4", children: ["client/src/pages/Account.tsx:1041:                  ", _jsx("h3", { className: "font-medium mb-2 text-lg", children: "Current Subscription" }), "client/src/pages/Account.tsx:1042:                  ", _jsxs("div", { className: "grid grid-cols-2 gap-y-3 text-sm", children: ["client/src/pages/Account.tsx:1043:                    ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1044:                      ", _jsx("p", { className: "text-muted-foreground", children: "Plan" }), "client/src/pages/Account.tsx:1045:                      ", _jsx("p", { className: "font-medium", children: getPlanName(user.subscriptionPlan) }), "client/src/pages/Account.tsx:1046:                    "] }), "client/src/pages/Account.tsx:1047:                    ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1048:                      ", _jsx("p", { className: "text-muted-foreground", children: "Status" }), "client/src/pages/Account.tsx:1049:                      ", _jsxs("p", { className: "font-medium flex items-center", children: ["client/src/pages/Account.tsx:1050:                        ", user.subscriptionStatus === 'active' && (client / src / pages / Account.tsx), ":1051:                          ", _jsx(CheckCircle2, { className: "h-4 w-4 mr-1 text-green-500" }), "client/src/pages/Account.tsx:1052:                        )} client/src/pages/Account.tsx:1053:                        ", user.subscriptionStatus ? user.subscriptionStatus.replace('_', ' ') : 'Free', "client/src/pages/Account.tsx:1054:                      "] }), "client/src/pages/Account.tsx:1055:                    "] }), "client/src/pages/Account.tsx:1056:                    ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1057:                      ", _jsx("p", { className: "text-muted-foreground", children: "Billing Cycle" }), "client/src/pages/Account.tsx:1058:                      ", _jsxs("p", { className: "font-medium", children: ["client/src/pages/Account.tsx:1059:                        ", user.subscriptionCycle === 'monthly' && 'Monthly', "client/src/pages/Account.tsx:1060:                        ", user.subscriptionCycle === 'quarterly' && 'Quarterly', "client/src/pages/Account.tsx:1061:                        ", user.subscriptionCycle === 'annual' && 'Annual', "client/src/pages/Account.tsx:1062:                        ", !user.subscriptionCycle && 'N/A', "client/src/pages/Account.tsx:1063:                      "] }), "client/src/pages/Account.tsx:1064:                    "] }), "client/src/pages/Account.tsx:1065:                    ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1066:                      ", _jsx("p", { className: "text-muted-foreground", children: "Next Billing Date" }), "client/src/pages/Account.tsx:1067:                      ", _jsx("p", { className: "font-medium", children: formatDate(user.subscriptionExpiresAt) }), "client/src/pages/Account.tsx:1068:                    "] }), "client/src/pages/Account.tsx:1069:                  "] }), "client/src/pages/Account.tsx:1070:                "] }), "client/src/pages/Account.tsx:1071: client/src/pages/Account.tsx:1072:                ", "client/src/pages/Account.tsx:1073:                ", _jsxs("div", { className: "space-y-3", children: ["client/src/pages/Account.tsx:1074:                  ", _jsx("h3", { className: "font-medium text-lg", children: "Plan Actions" }), "client/src/pages/Account.tsx:1075:                  ", _jsxs("div", { className: "flex flex-col gap-3", children: ["client/src/pages/Account.tsx:1076:                    ", user.subscriptionPlan === 'free' ? (client / src / pages / Account.tsx) : 1077, ":                      ", _jsx(Button, { client: true }), "src/pages/Account.tsx:1078:                        variant=\"default\" client/src/pages/Account.tsx:1079:                        onClick=", () => {
                                            client / src / pages / Account.tsx;
                                        }, ":1080:                          setIsManagingSubscription(false); client/src/pages/Account.tsx:1081:                          setIsUpgradingPlan(true); client/src/pages/Account.tsx:1082:                        }} client/src/pages/Account.tsx:1083:                      > client/src/pages/Account.tsx:1084:                        Upgrade to Pro client/src/pages/Account.tsx:1085:                      "] }), "client/src/pages/Account.tsx:1086:                    ) : ( client/src/pages/Account.tsx:1087:                      ", _jsx(Button, { client: true }), "src/pages/Account.tsx:1088:                        variant=\"destructive\" client/src/pages/Account.tsx:1089:                        onClick=", () => {
                                    client / src / pages / Account.tsx;
                                }, ":1090:                          setIsManagingSubscription(false); client/src/pages/Account.tsx:1091:                          setIsCancellingSubscription(true); client/src/pages/Account.tsx:1092:                        }} client/src/pages/Account.tsx:1093:                      > client/src/pages/Account.tsx:1094:                        Cancel Subscription client/src/pages/Account.tsx:1095:                      "] }), "client/src/pages/Account.tsx:1096:                    )} client/src/pages/Account.tsx:1097:                  "] }), "client/src/pages/Account.tsx:1098:                "] }), "client/src/pages/Account.tsx:1099:              "] });
client / src / pages / Account.tsx;
1100;
DialogContent >
    client / src / pages / Account.tsx;
1101;
Dialog >
    client / src / pages / Account.tsx;
1102;
client / src / pages / Account.tsx;
1103;
{ /* Cancel Subscription Confirmation Dialog */ }
client / src / pages / Account.tsx;
1104;
_jsxs(Dialog, { open: isCancellingSubscription, onOpenChange: setIsCancellingSubscription, children: ["client/src/pages/Account.tsx:1105:            ", _jsxs(DialogContent, { className: "sm:max-w-[400px]", children: ["client/src/pages/Account.tsx:1106:              ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:1107:                ", _jsx(DialogTitle, { children: "Cancel Subscription" }), "client/src/pages/Account.tsx:1108:                ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:1109:                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period. client/src/pages/Account.tsx:1110:                " }), "client/src/pages/Account.tsx:1111:              "] }), "client/src/pages/Account.tsx:1112:              ", _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: ["client/src/pages/Account.tsx:1113:                ", _jsx(Button, { variant: "outline", onClick: () => setIsCancellingSubscription(false), children: "client/src/pages/Account.tsx:1114:                  Keep Subscription client/src/pages/Account.tsx:1115:                " }), "client/src/pages/Account.tsx:1116:                ", _jsx(Button, { variant: "destructive", onClick: cancelSubscription, children: "client/src/pages/Account.tsx:1117:                  Yes, Cancel client/src/pages/Account.tsx:1118:                " }), "client/src/pages/Account.tsx:1119:              "] }), "client/src/pages/Account.tsx:1120:            "] }), "client/src/pages/Account.tsx:1121:          "] });
client / src / pages / Account.tsx;
1122;
TabsContent >
    client / src / pages / Account.tsx;
1123;
client / src / pages / Account.tsx;
1124;
_jsxs(TabsContent, { value: "security", className: "space-y-6", children: ["client/src/pages/Account.tsx:1125:          ", _jsxs(Card, { children: ["client/src/pages/Account.tsx:1126:            ", _jsxs(CardHeader, { children: ["client/src/pages/Account.tsx:1127:              ", _jsx(CardTitle, { children: "Email Verification" }), "client/src/pages/Account.tsx:1128:              ", _jsx(CardDescription, { children: "client/src/pages/Account.tsx:1129:                Verify and manage your email address to secure your account. client/src/pages/Account.tsx:1130:              " }), "client/src/pages/Account.tsx:1131:            "] }), "client/src/pages/Account.tsx:1132:            ", _jsxs(CardContent, { className: "space-y-6", children: ["client/src/pages/Account.tsx:1133:              ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1134:                ", _jsx("h3", { className: "font-medium", children: "Current Email" }), "client/src/pages/Account.tsx:1135:                ", _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: ["client/src/pages/Account.tsx:1136:                  ", _jsx("p", { children: user.email }), "client/src/pages/Account.tsx:1137:                  ", user.emailVerified ? (client / src / pages / Account.tsx) : 1138, ":                    ", _jsxs("span", { className: "inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700", children: ["client/src/pages/Account.tsx:1139:                      ", _jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }), "client/src/pages/Account.tsx:1140:                      Verified client/src/pages/Account.tsx:1141:                    "] }), "client/src/pages/Account.tsx:1142:                  ) : ( client/src/pages/Account.tsx:1143:                    ", _jsx("span", { className: "inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700", children: "client/src/pages/Account.tsx:1144:                      Not Verified client/src/pages/Account.tsx:1145:                    " }), "client/src/pages/Account.tsx:1146:                  )} client/src/pages/Account.tsx:1147:                "] }), "client/src/pages/Account.tsx:1148: client/src/pages/Account.tsx:1149:                ", user.pendingEmail && (client / src / pages / Account.tsx), ":1150:                  ", _jsxs("div", { className: "mt-2", children: ["client/src/pages/Account.tsx:1151:                    ", _jsxs("p", { className: "text-sm text-muted-foreground", children: ["client/src/pages/Account.tsx:1152:                      Verification email sent to ", _jsx("span", { className: "font-medium", children: user.pendingEmail }), ". client/src/pages/Account.tsx:1153:                      Please check your inbox to complete the change. client/src/pages/Account.tsx:1154:                    "] }), "client/src/pages/Account.tsx:1155:                    ", _jsxs("div", { className: "mt-3", children: ["client/src/pages/Account.tsx:1156:                      ", _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsChangingEmail(true), children: ["client/src/pages/Account.tsx:1157:                        ", _jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-1" }), "client/src/pages/Account.tsx:1158:                        Try Again client/src/pages/Account.tsx:1159:                      "] }), "client/src/pages/Account.tsx:1160:                    "] }), "client/src/pages/Account.tsx:1161:                  "] }), "client/src/pages/Account.tsx:1162:                )} client/src/pages/Account.tsx:1163:              "] }), "client/src/pages/Account.tsx:1164: client/src/pages/Account.tsx:1165:              ", _jsxs("div", { className: "flex flex-wrap space-x-2", children: ["client/src/pages/Account.tsx:1166:                ", !user.pendingEmail && (client / src / pages / Account.tsx), ":1167:                  ", _jsx(Button, { variant: "outline", onClick: () => setIsChangingEmail(true), children: "client/src/pages/Account.tsx:1168:                    Change Email client/src/pages/Account.tsx:1169:                  " }), "client/src/pages/Account.tsx:1170:                )} client/src/pages/Account.tsx:1171: client/src/pages/Account.tsx:1172:                ", !user.emailVerified && !user.pendingEmail && (client / src / pages / Account.tsx), ":1173:                  ", _jsx(Button, { variant: "default", children: "client/src/pages/Account.tsx:1174:                    Resend Verification client/src/pages/Account.tsx:1175:                  " }), "client/src/pages/Account.tsx:1176:                )} client/src/pages/Account.tsx:1177:              "] }), "client/src/pages/Account.tsx:1178:            "] }), "client/src/pages/Account.tsx:1179:          "] }), "client/src/pages/Account.tsx:1180: client/src/pages/Account.tsx:1181:          ", _jsxs(Card, { children: ["client/src/pages/Account.tsx:1182:            ", _jsxs(CardHeader, { children: ["client/src/pages/Account.tsx:1183:              ", _jsx(CardTitle, { children: "Password" }), "client/src/pages/Account.tsx:1184:              ", _jsx(CardDescription, { children: "client/src/pages/Account.tsx:1185:                Update your password to keep your account secure. client/src/pages/Account.tsx:1186:              " }), "client/src/pages/Account.tsx:1187:            "] }), "client/src/pages/Account.tsx:1188:            ", _jsxs(CardContent, { children: ["client/src/pages/Account.tsx:1189:              ", _jsxs("div", { className: "space-y-4", children: ["client/src/pages/Account.tsx:1190:                ", _jsxs("div", { className: "flex items-center justify-between", children: ["client/src/pages/Account.tsx:1191:                  ", _jsx("span", { className: "text-sm text-muted-foreground", children: "Current Password" }), "client/src/pages/Account.tsx:1192:                  ", _jsxs("div", { className: "flex items-center", children: ["client/src/pages/Account.tsx:1193:                    ", _jsxs("span", { className: "mr-3 tracking-widest text-muted-foreground", children: ["client/src/pages/Account.tsx:1194:                      ", user.passwordLength ? '•'.repeat(user.passwordLength) : '••••••••', "client/src/pages/Account.tsx:1195:                    "] }), "client/src/pages/Account.tsx:1196:                    ", _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsChangingPassword(true), children: "client/src/pages/Account.tsx:1197:                      Change Password client/src/pages/Account.tsx:1198:                    " }), "client/src/pages/Account.tsx:1199:                  "] }), "client/src/pages/Account.tsx:1200:                "] }), "client/src/pages/Account.tsx:1201:                ", _jsxs("div", { className: "text-xs text-muted-foreground", children: ["client/src/pages/Account.tsx:1202:                  ", _jsxs("p", { children: ["Password last changed: ", user.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : 'Not available'] }), "client/src/pages/Account.tsx:1203:                "] }), "client/src/pages/Account.tsx:1204:              "] }), "client/src/pages/Account.tsx:1205:            "] }), "client/src/pages/Account.tsx:1206:          "] }), "client/src/pages/Account.tsx:1207: client/src/pages/Account.tsx:1208:          ", _jsxs(Card, { children: ["client/src/pages/Account.tsx:1209:            ", _jsxs(CardHeader, { children: ["client/src/pages/Account.tsx:1210:              ", _jsx(CardTitle, { children: "Sign Out" }), "client/src/pages/Account.tsx:1211:              ", _jsx(CardDescription, { children: "client/src/pages/Account.tsx:1212:                Sign out of your account on this device. client/src/pages/Account.tsx:1213:              " }), "client/src/pages/Account.tsx:1214:            "] }), "client/src/pages/Account.tsx:1215:            ", _jsxs(CardContent, { children: ["client/src/pages/Account.tsx:1216:              ", _jsx(Button, { variant: "outline", onClick: handleLogout, children: "client/src/pages/Account.tsx:1217:                Sign Out client/src/pages/Account.tsx:1218:              " }), "client/src/pages/Account.tsx:1219:            "] }), "client/src/pages/Account.tsx:1220:          "] }), "client/src/pages/Account.tsx:1221:        "] });
client / src / pages / Account.tsx;
1222;
Tabs >
    client / src / pages / Account.tsx;
1223;
client / src / pages / Account.tsx;
1224;
{ /* Password Change Dialog */ }
client / src / pages / Account.tsx;
1225;
_jsxs(Dialog, { open: isChangingPassword, onOpenChange: setIsChangingPassword, children: ["client/src/pages/Account.tsx:1226:      ", _jsxs(DialogContent, { className: "sm:max-w-[450px]", children: ["client/src/pages/Account.tsx:1227:        ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:1228:          ", _jsx(DialogTitle, { children: "Change Password" }), "client/src/pages/Account.tsx:1229:          ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:1230:            Enter your current password and choose a new secure password. client/src/pages/Account.tsx:1231:          " }), "client/src/pages/Account.tsx:1232:        "] }), "client/src/pages/Account.tsx:1233: client/src/pages/Account.tsx:1234:        ", _jsx(PasswordChangeForm, { client: true }), "src/pages/Account.tsx:1235:          isPending=", changePasswordMutation.isPending, "client/src/pages/Account.tsx:1236:          onSubmit=", (data) => {
                    client / src / pages / Account.tsx;
                }, ":1237:            changePasswordMutation.mutate( client/src/pages/Account.tsx:1238:              ", client / src / pages / Account.tsx, ":1239:                currentPassword: data.currentPassword, client/src/pages/Account.tsx:1240:                newPassword: data.newPassword client/src/pages/Account.tsx:1241:              }, client/src/pages/Account.tsx:1242:              ", client / src / pages / Account.tsx, ":1243:                onSuccess: () => ", client / src / pages / Account.tsx, ":1244:                  toast(", client / src / pages / Account.tsx, ":1245:                    title: \"Password Changed\", client/src/pages/Account.tsx:1246:                    description: \"Your password has been updated successfully.\", client/src/pages/Account.tsx:1247:                    variant: \"default\", client/src/pages/Account.tsx:1248:                  }); client/src/pages/Account.tsx:1249:                  setIsChangingPassword(false); client/src/pages/Account.tsx:1250:                }, client/src/pages/Account.tsx:1251:                onError: (error: any) => ", client / src / pages / Account.tsx, ":1252:                  toast(", client / src / pages / Account.tsx, ":1253:                    title: \"Failed to change password\", client/src/pages/Account.tsx:1254:                    description: error.message || \"An error occurred. Please check your current password and try again.\", client/src/pages/Account.tsx:1255:                    variant: \"destructive\", client/src/pages/Account.tsx:1256:                  }); client/src/pages/Account.tsx:1257:                } client/src/pages/Account.tsx:1258:              } client/src/pages/Account.tsx:1259:            ); client/src/pages/Account.tsx:1260:          }} client/src/pages/Account.tsx:1261:        /> client/src/pages/Account.tsx:1262:      "] }), "client/src/pages/Account.tsx:1263:    "] });
client / src / pages / Account.tsx;
1264;
client / src / pages / Account.tsx;
1265;
{ /* Email Change Dialog */ }
client / src / pages / Account.tsx;
1266;
_jsxs(Dialog, { open: isChangingEmail, onOpenChange: setIsChangingEmail, children: ["client/src/pages/Account.tsx:1267:      ", _jsxs(DialogContent, { className: "sm:max-w-[450px]", children: ["client/src/pages/Account.tsx:1268:        ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:1269:          ", _jsx(DialogTitle, { children: "Change Email Address" }), "client/src/pages/Account.tsx:1270:          ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:1271:            Enter your new email address and current password to verify your identity. client/src/pages/Account.tsx:1272:            You will need to verify your new email before the change takes effect. client/src/pages/Account.tsx:1273:          " }), "client/src/pages/Account.tsx:1274:        "] }), "client/src/pages/Account.tsx:1275: client/src/pages/Account.tsx:1276:        ", changeEmailMutation.isPending ? (client / src / pages / Account.tsx) : 1277, ":          ", _jsxs("div", { className: "py-8 flex items-center justify-center flex-col", children: ["client/src/pages/Account.tsx:1278:            ", _jsx("div", { className: "h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" }), "client/src/pages/Account.tsx:1279:            ", _jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "Processing your request..." }), "client/src/pages/Account.tsx:1280:          "] }), "client/src/pages/Account.tsx:1281:        ) : ( client/src/pages/Account.tsx:1282:          ", _jsx(EmailChangeForm, { client: true }), "src/pages/Account.tsx:1283:            currentEmail=", user.email, "client/src/pages/Account.tsx:1284:            onSubmit=", (data) => {
                    client / src / pages / Account.tsx;
                }, ":1285:              changeEmailMutation.mutate(data, ", client / src / pages / Account.tsx, ":1286:                onSuccess: () => ", client / src / pages / Account.tsx, ":1287:                  toast(", client / src / pages / Account.tsx, ":1288:                    title: \"Verification email sent\", client/src/pages/Account.tsx:1289:                    description: \"Please check your inbox to complete the email change.\", client/src/pages/Account.tsx:1290:                    variant: \"default\", client/src/pages/Account.tsx:1291:                  }); client/src/pages/Account.tsx:1292:                  setIsChangingEmail(false); client/src/pages/Account.tsx:1293:                }, client/src/pages/Account.tsx:1294:                onError: (error: any) => ", client / src / pages / Account.tsx, ":1295:                  toast(", client / src / pages / Account.tsx, ":1296:                    title: \"Failed to send verification\", client/src/pages/Account.tsx:1297:                    description: error.message || \"An error occurred while processing your request.\", client/src/pages/Account.tsx:1298:                    variant: \"destructive\", client/src/pages/Account.tsx:1299:                  }); client/src/pages/Account.tsx:1300:                } client/src/pages/Account.tsx:1301:              }); client/src/pages/Account.tsx:1302:            }} client/src/pages/Account.tsx:1303:          /> client/src/pages/Account.tsx:1304:        )} client/src/pages/Account.tsx:1305:      "] }), "client/src/pages/Account.tsx:1306:    "] });
client / src / pages / Account.tsx;
1307;
client / src / pages / Account.tsx;
1308;
{ /* Upgrade Plan Dialog for Free Users */ }
client / src / pages / Account.tsx;
1309;
_jsxs(Dialog, { open: isUpgradingPlan, onOpenChange: setIsUpgradingPlan, children: ["client/src/pages/Account.tsx:1310:      ", _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: ["client/src/pages/Account.tsx:1311:        ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:1312:          ", _jsx(DialogTitle, { children: "Upgrade to Pro" }), "client/src/pages/Account.tsx:1313:          ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:1314:            Unlock all premium features to accelerate your career growth. client/src/pages/Account.tsx:1315:          " }), "client/src/pages/Account.tsx:1316:        "] }), "client/src/pages/Account.tsx:1317:        ", _jsxs("div", { className: "py-6", children: ["client/src/pages/Account.tsx:1318:          ", _jsxs("div", { className: "rounded-xl bg-primary/5 p-5 border border-primary/20 mb-6", children: ["client/src/pages/Account.tsx:1319:            ", _jsxs("h3", { className: "font-semibold text-lg mb-3 flex items-center", children: ["client/src/pages/Account.tsx:1320:              ", _jsx(Sparkles, { className: "h-5 w-5 mr-2 text-primary" }), "client/src/pages/Account.tsx:1321:              Pro Plan Benefits client/src/pages/Account.tsx:1322:            "] }), "client/src/pages/Account.tsx:1323:            ", _jsxs("ul", { className: "space-y-3", children: ["client/src/pages/Account.tsx:1324:              ", _jsxs("li", { className: "flex items-start", children: ["client/src/pages/Account.tsx:1325:                ", _jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), "client/src/pages/Account.tsx:1326:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1327:                  ", _jsx("span", { className: "font-medium", children: "Advanced Resume Builder" }), "client/src/pages/Account.tsx:1328:                  ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Create unlimited professional resumes with AI enhancement" }), "client/src/pages/Account.tsx:1329:                "] }), "client/src/pages/Account.tsx:1330:              "] }), "client/src/pages/Account.tsx:1331:              ", _jsxs("li", { className: "flex items-start", children: ["client/src/pages/Account.tsx:1332:                ", _jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), "client/src/pages/Account.tsx:1333:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1334:                  ", _jsx("span", { className: "font-medium", children: "Unlimited Interview Practice" }), "client/src/pages/Account.tsx:1335:                  ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Practice with unlimited AI-generated questions and feedback" }), "client/src/pages/Account.tsx:1336:                "] }), "client/src/pages/Account.tsx:1337:              "] }), "client/src/pages/Account.tsx:1338:              ", _jsxs("li", { className: "flex items-start", children: ["client/src/pages/Account.tsx:1339:                ", _jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), "client/src/pages/Account.tsx:1340:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1341:                  ", _jsx("span", { className: "font-medium", children: "AI Career Coach" }), "client/src/pages/Account.tsx:1342:                  ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Get personalized career advice whenever you need it" }), "client/src/pages/Account.tsx:1343:                "] }), "client/src/pages/Account.tsx:1344:              "] }), "client/src/pages/Account.tsx:1345:              ", _jsxs("li", { className: "flex items-start", children: ["client/src/pages/Account.tsx:1346:                ", _jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), "client/src/pages/Account.tsx:1347:                ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1348:                  ", _jsx("span", { className: "font-medium", children: "Cover Letter Generator" }), "client/src/pages/Account.tsx:1349:                  ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Create tailored cover letters for every application" }), "client/src/pages/Account.tsx:1350:                "] }), "client/src/pages/Account.tsx:1351:              "] }), "client/src/pages/Account.tsx:1352:            "] }), "client/src/pages/Account.tsx:1353:          "] }), "client/src/pages/Account.tsx:1354: client/src/pages/Account.tsx:1355:          ", "client/src/pages/Account.tsx:1356:          ", _jsxs("div", { className: "mb-6", children: ["client/src/pages/Account.tsx:1357:            ", _jsxs(Tabs, { defaultValue: "monthly", className: "w-full", onValueChange: (value) => setBillingCycle(value), children: ["client/src/pages/Account.tsx:1358:              ", _jsxs(TabsList, { className: "grid w-full grid-cols-3", children: ["client/src/pages/Account.tsx:1359:                ", _jsx(TabsTrigger, { value: "monthly", children: "Monthly" }), "client/src/pages/Account.tsx:1360:                ", _jsx(TabsTrigger, { value: "quarterly", children: "Quarterly" }), "client/src/pages/Account.tsx:1361:                ", _jsx(TabsTrigger, { value: "annual", children: "Annual" }), "client/src/pages/Account.tsx:1362:              "] }), "client/src/pages/Account.tsx:1363:              ", _jsxs(TabsContent, { value: "monthly", className: "pt-4", children: ["client/src/pages/Account.tsx:1364:                ", _jsxs("div", { className: "flex justify-between items-center", children: ["client/src/pages/Account.tsx:1365:                  ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1366:                    ", _jsxs("p", { className: "text-lg font-semibold", children: ["$15.00 ", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/ month" })] }), "client/src/pages/Account.tsx:1367:                    ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Cancel anytime" }), "client/src/pages/Account.tsx:1368:                  "] }), "client/src/pages/Account.tsx:1369:                  ", _jsxs("div", { className: "space-x-2", children: ["client/src/pages/Account.tsx:1370:                    ", _jsx(Button, { variant: "outline", onClick: () => setIsUpgradingPlan(false), children: "Cancel" }), "client/src/pages/Account.tsx:1371:                    ", _jsx(Button, { onClick: () => upgradeSubscription('monthly'), children: "Upgrade Now" }), "client/src/pages/Account.tsx:1372:                  "] }), "client/src/pages/Account.tsx:1373:                "] }), "client/src/pages/Account.tsx:1374:              "] }), "client/src/pages/Account.tsx:1375:              ", _jsxs(TabsContent, { value: "quarterly", className: "pt-4", children: ["client/src/pages/Account.tsx:1376:                ", _jsxs("div", { className: "flex justify-between items-center", children: ["client/src/pages/Account.tsx:1377:                  ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1378:                    ", _jsxs("div", { className: "flex items-center", children: ["client/src/pages/Account.tsx:1379:                      ", _jsxs("p", { className: "text-lg font-semibold", children: ["$30.00 ", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/ 3 months" })] }), "client/src/pages/Account.tsx:1380:                      ", _jsx("span", { className: "ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5", children: "Save $15" }), "client/src/pages/Account.tsx:1381:                    "] }), "client/src/pages/Account.tsx:1382:                    ", _jsx("p", { className: "text-sm text-muted-foreground", children: "$10.00 per month, billed quarterly" }), "client/src/pages/Account.tsx:1383:                  "] }), "client/src/pages/Account.tsx:1384:                  ", _jsxs("div", { className: "space-x-2", children: ["client/src/pages/Account.tsx:1385:                    ", _jsx(Button, { variant: "outline", onClick: () => setIsUpgradingPlan(false), children: "Cancel" }), "client/src/pages/Account.tsx:1386:                    ", _jsx(Button, { onClick: () => upgradeSubscription('quarterly'), children: "Upgrade Now" }), "client/src/pages/Account.tsx:1387:                  "] }), "client/src/pages/Account.tsx:1388:                "] }), "client/src/pages/Account.tsx:1389:              "] }), "client/src/pages/Account.tsx:1390:              ", _jsxs(TabsContent, { value: "annual", className: "pt-4", children: ["client/src/pages/Account.tsx:1391:                ", _jsxs("div", { className: "flex justify-between items-center", children: ["client/src/pages/Account.tsx:1392:                  ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1393:                    ", _jsxs("div", { className: "flex items-center", children: ["client/src/pages/Account.tsx:1394:                      ", _jsxs("p", { className: "text-lg font-semibold", children: ["$72.00 ", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/ year" })] }), "client/src/pages/Account.tsx:1395:                      ", _jsx("span", { className: "ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5", children: "Save $108" }), "client/src/pages/Account.tsx:1396:                    "] }), "client/src/pages/Account.tsx:1397:                    ", _jsx("p", { className: "text-sm text-muted-foreground", children: "$6.00 per month, billed annually" }), "client/src/pages/Account.tsx:1398:                  "] }), "client/src/pages/Account.tsx:1399:                  ", _jsxs("div", { className: "space-x-2", children: ["client/src/pages/Account.tsx:1400:                    ", _jsx(Button, { variant: "outline", onClick: () => setIsUpgradingPlan(false), children: "Cancel" }), "client/src/pages/Account.tsx:1401:                    ", _jsx(Button, { onClick: () => upgradeSubscription('annual'), children: "Upgrade Now" }), "client/src/pages/Account.tsx:1402:                  "] }), "client/src/pages/Account.tsx:1403:                "] }), "client/src/pages/Account.tsx:1404:              "] }), "client/src/pages/Account.tsx:1405:            "] }), "client/src/pages/Account.tsx:1406:          "] }), "client/src/pages/Account.tsx:1407:        "] }), "client/src/pages/Account.tsx:1408:      "] }), "client/src/pages/Account.tsx:1409:    "] });
client / src / pages / Account.tsx;
1410;
client / src / pages / Account.tsx;
1411;
{ /* Payment Methods Management Dialog */ }
client / src / pages / Account.tsx;
1412;
_jsxs(Dialog, { open: isManagingPaymentMethods, onOpenChange: setIsManagingPaymentMethods, children: ["client/src/pages/Account.tsx:1413:      ", _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: ["client/src/pages/Account.tsx:1414:        ", _jsxs(DialogHeader, { children: ["client/src/pages/Account.tsx:1415:          ", _jsx(DialogTitle, { children: "Payment Methods" }), "client/src/pages/Account.tsx:1416:          ", _jsx(DialogDescription, { children: "client/src/pages/Account.tsx:1417:            Manage your payment methods for subscription billing. client/src/pages/Account.tsx:1418:          " }), "client/src/pages/Account.tsx:1419:        "] }), "client/src/pages/Account.tsx:1420: client/src/pages/Account.tsx:1421:        ", !setupIntentClientSecret ? (client / src / pages / Account.tsx) : 1422, ":          ", _jsxs("div", { className: "py-6 space-y-4", children: ["client/src/pages/Account.tsx:1423:            ", "client/src/pages/Account.tsx:1424:            ", paymentMethodInfo ? (client / src / pages / Account.tsx) : 1425, ":              ", _jsxs("div", { className: "rounded-md border p-4", children: ["client/src/pages/Account.tsx:1426:                ", _jsx("h3", { className: "font-medium mb-3", children: "Current Payment Method" }), "client/src/pages/Account.tsx:1427:                ", _jsxs("div", { className: "flex items-center", children: ["client/src/pages/Account.tsx:1428:                  ", _jsxs("div", { className: "p-3 bg-muted rounded-md mr-4", children: ["client/src/pages/Account.tsx:1429:                    ", _jsx(CreditCardIcon, { className: "h-6 w-6" }), "client/src/pages/Account.tsx:1430:                  "] }), "client/src/pages/Account.tsx:1431:                  ", _jsxs("div", { children: ["client/src/pages/Account.tsx:1432:                    ", _jsxs("p", { className: "font-medium capitalize", children: [paymentMethodInfo.brand, " \u2022\u2022\u2022\u2022 ", paymentMethodInfo.last4] }), "client/src/pages/Account.tsx:1433:                    ", _jsxs("p", { className: "text-sm text-muted-foreground", children: ["client/src/pages/Account.tsx:1434:                      Expires ", paymentMethodInfo.exp_month, "/", paymentMethodInfo.exp_year, "client/src/pages/Account.tsx:1435:                    "] }), "client/src/pages/Account.tsx:1436:                  "] }), "client/src/pages/Account.tsx:1437:                "] }), "client/src/pages/Account.tsx:1438:              "] }), "client/src/pages/Account.tsx:1439:            ) : ( client/src/pages/Account.tsx:1440:              ", _jsxs("div", { className: "rounded-md border p-4 text-center py-8", children: ["client/src/pages/Account.tsx:1441:                ", _jsx("p", { className: "text-muted-foreground mb-2", children: "No payment methods found" }), "client/src/pages/Account.tsx:1442:                ", _jsx("p", { className: "text-sm text-muted-foreground", children: "Add a payment method to manage your subscription" }), "client/src/pages/Account.tsx:1443:              "] }), "client/src/pages/Account.tsx:1444:            )} client/src/pages/Account.tsx:1445: client/src/pages/Account.tsx:1446:            ", _jsxs("div", { className: "flex justify-end", children: ["client/src/pages/Account.tsx:1447:              ", _jsx(Button, { client: true }), "src/pages/Account.tsx:1448:                onClick=", initializePaymentMethodsUpdate, "client/src/pages/Account.tsx:1449:                disabled=", isLoading, "client/src/pages/Account.tsx:1450:              > client/src/pages/Account.tsx:1451:                ", isLoading ? (client / src / pages / Account.tsx) : 1452, ":                  ", _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), " Loading..."] }), "client/src/pages/Account.tsx:1453:                ) : ( client/src/pages/Account.tsx:1454:                  ", _jsx(_Fragment, { children: paymentMethodInfo ? 'Update Payment Method' : 'Add Payment Method' }), "client/src/pages/Account.tsx:1455:                )} client/src/pages/Account.tsx:1456:              "] }), "client/src/pages/Account.tsx:1457:            "] }), "client/src/pages/Account.tsx:1458:          "] }), "client/src/pages/Account.tsx:1459:        ) : ( client/src/pages/Account.tsx:1460:          ", _jsxs("div", { className: "py-6", children: ["client/src/pages/Account.tsx:1461:            ", _jsxs(Elements, { stripe: stripePromise, options: { clientSecret: setupIntentClientSecret }, children: ["client/src/pages/Account.tsx:1462:              ", _jsx(PaymentMethodForm, { client: true }), "src/pages/Account.tsx:1463:                onSuccess=", () => {
                            client / src / pages / Account.tsx;
                        }, ":1464:                  setIsManagingPaymentMethods(false); client/src/pages/Account.tsx:1465:                  setSetupIntentClientSecret(null); client/src/pages/Account.tsx:1466:                  fetchPaymentMethodInfo(); client/src/pages/Account.tsx:1467:                  toast(", client / src / pages / Account.tsx, ":1468:                    title: \"Payment method updated\", client/src/pages/Account.tsx:1469:                    description: \"Your payment method has been updated successfully.\", client/src/pages/Account.tsx:1470:                    variant: \"default\", client/src/pages/Account.tsx:1471:                  }); client/src/pages/Account.tsx:1472:                }} client/src/pages/Account.tsx:1473:                onCancel=", () => {
                            client / src / pages / Account.tsx;
                        }, ":1474:                  setSetupIntentClientSecret(null); client/src/pages/Account.tsx:1475:                }} client/src/pages/Account.tsx:1476:              /> client/src/pages/Account.tsx:1477:            "] }), "client/src/pages/Account.tsx:1478:          "] }), "client/src/pages/Account.tsx:1479:        )} client/src/pages/Account.tsx:1480:      "] });
client / src / pages / Account.tsx;
1481;
Dialog >
    client / src / pages / Account.tsx;
1482;
div >
    client / src / pages / Account.tsx;
1483;
;
client / src / pages / Account.tsx;
1484;
