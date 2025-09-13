client/src/pages/Account.tsx:1:import React, { useState, useEffect } from 'react';
client/src/pages/Account.tsx:2:import { useUser, useChangeEmail, useChangePassword } from '@/lib/useUserData';
client/src/pages/Account.tsx:3:import { useToast } from '@/hooks/use-toast';
client/src/pages/Account.tsx:4:import { useForm } from 'react-hook-form';
client/src/pages/Account.tsx:5:import { zodResolver } from '@hookform/resolvers/zod';
client/src/pages/Account.tsx:6:import { loadStripe } from '@stripe/stripe-js';
client/src/pages/Account.tsx:7:import { 
client/src/pages/Account.tsx:8:  Elements, 
client/src/pages/Account.tsx:9:  PaymentElement,
client/src/pages/Account.tsx:10:  useStripe, 
client/src/pages/Account.tsx:11:  useElements,
client/src/pages/Account.tsx:12:  AddressElement
client/src/pages/Account.tsx:13:} from '@stripe/react-stripe-js';
client/src/pages/Account.tsx:14:
client/src/pages/Account.tsx:15:// Import UI components
client/src/pages/Account.tsx:16:import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
client/src/pages/Account.tsx:17:import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
client/src/pages/Account.tsx:18:import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
client/src/pages/Account.tsx:19:import { Progress } from '@/components/ui/progress';
client/src/pages/Account.tsx:20:import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
client/src/pages/Account.tsx:21:import { Button } from '@/components/ui/button';
client/src/pages/Account.tsx:22:import { Input } from '@/components/ui/input';
client/src/pages/Account.tsx:23:import { Slider } from '@/components/ui/slider';
client/src/pages/Account.tsx:24:import {
client/src/pages/Account.tsx:25:  User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles, CreditCardIcon, RotateCcw,
client/src/pages/Account.tsx:26:  Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, Users, Plus, Settings
client/src/pages/Account.tsx:27:} from 'lucide-react';
client/src/pages/Account.tsx:28:import EmailChangeForm, { EmailChangeFormValues } from '@/components/EmailChangeForm';
client/src/pages/Account.tsx:29:import { z } from 'zod';
client/src/pages/Account.tsx:30:
client/src/pages/Account.tsx:31:// Load Stripe outside of component to avoid recreating on renders
client/src/pages/Account.tsx:32:// Make sure we're using the public key (starts with pk_)
client/src/pages/Account.tsx:33:const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
client/src/pages/Account.tsx:34:if (!stripePublicKey || !stripePublicKey.startsWith('pk_')) {
client/src/pages/Account.tsx:35:  console.error('Missing or invalid Stripe public key. Make sure VITE_STRIPE_PUBLIC_KEY is set correctly.');
client/src/pages/Account.tsx:36:}
client/src/pages/Account.tsx:37:const stripePromise = loadStripe(stripePublicKey);
client/src/pages/Account.tsx:38:
client/src/pages/Account.tsx:39:// Password Change Form schema and type
client/src/pages/Account.tsx:40:const passwordChangeSchema = z.object({
client/src/pages/Account.tsx:41:  currentPassword: z.string().min(1, "Current password is required"),
client/src/pages/Account.tsx:42:  newPassword: z.string()
client/src/pages/Account.tsx:43:    .min(8, "Password must be at least 8 characters")
client/src/pages/Account.tsx:44:    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
client/src/pages/Account.tsx:45:    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
client/src/pages/Account.tsx:46:    .regex(/[0-9]/, "Password must contain at least one number"),
client/src/pages/Account.tsx:47:  confirmPassword: z.string().min(1, "Please confirm your new password"),
client/src/pages/Account.tsx:48:}).refine((data) => data.newPassword === data.confirmPassword, {
client/src/pages/Account.tsx:49:  message: "Passwords do not match",
client/src/pages/Account.tsx:50:  path: ["confirmPassword"],
client/src/pages/Account.tsx:51:});
client/src/pages/Account.tsx:52:
client/src/pages/Account.tsx:53:type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
client/src/pages/Account.tsx:54:
client/src/pages/Account.tsx:55:// Password Change Form component
client/src/pages/Account.tsx:56:function PasswordChangeForm({ 
client/src/pages/Account.tsx:57:  onSubmit, 
client/src/pages/Account.tsx:58:  isPending 
client/src/pages/Account.tsx:59:}: { 
client/src/pages/Account.tsx:60:  onSubmit: (data: PasswordChangeFormValues) => void;
client/src/pages/Account.tsx:61:  isPending: boolean;
client/src/pages/Account.tsx:62:}) {
client/src/pages/Account.tsx:63:  const form = useForm<PasswordChangeFormValues>({
client/src/pages/Account.tsx:64:    resolver: zodResolver(passwordChangeSchema),
client/src/pages/Account.tsx:65:    defaultValues: {
client/src/pages/Account.tsx:66:      currentPassword: "",
client/src/pages/Account.tsx:67:      newPassword: "",
client/src/pages/Account.tsx:68:      confirmPassword: "",
client/src/pages/Account.tsx:69:    },
client/src/pages/Account.tsx:70:  });
client/src/pages/Account.tsx:71:
client/src/pages/Account.tsx:72:  return (
client/src/pages/Account.tsx:73:    <Form {...form}>
client/src/pages/Account.tsx:74:      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
client/src/pages/Account.tsx:75:        <FormField
client/src/pages/Account.tsx:76:          control={form.control}
client/src/pages/Account.tsx:77:          name="currentPassword"
client/src/pages/Account.tsx:78:          render={({ field }) => (
client/src/pages/Account.tsx:79:            <FormItem>
client/src/pages/Account.tsx:80:              <FormLabel>Current Password</FormLabel>
client/src/pages/Account.tsx:81:              <FormControl>
client/src/pages/Account.tsx:82:                <Input type="password" placeholder="Enter your current password" {...field} />
client/src/pages/Account.tsx:83:              </FormControl>
client/src/pages/Account.tsx:84:              <FormMessage />
client/src/pages/Account.tsx:85:            </FormItem>
client/src/pages/Account.tsx:86:          )}
client/src/pages/Account.tsx:87:        />
client/src/pages/Account.tsx:88:
client/src/pages/Account.tsx:89:        <FormField
client/src/pages/Account.tsx:90:          control={form.control}
client/src/pages/Account.tsx:91:          name="newPassword"
client/src/pages/Account.tsx:92:          render={({ field }) => (
client/src/pages/Account.tsx:93:            <FormItem>
client/src/pages/Account.tsx:94:              <FormLabel>New Password</FormLabel>
client/src/pages/Account.tsx:95:              <FormControl>
client/src/pages/Account.tsx:96:                <Input type="password" placeholder="Enter your new password" {...field} />
client/src/pages/Account.tsx:97:              </FormControl>
client/src/pages/Account.tsx:98:              <FormDescription>
client/src/pages/Account.tsx:99:                Password must be at least 8 characters and include uppercase, lowercase, and a number.
client/src/pages/Account.tsx:100:              </FormDescription>
client/src/pages/Account.tsx:101:              <FormMessage />
client/src/pages/Account.tsx:102:            </FormItem>
client/src/pages/Account.tsx:103:          )}
client/src/pages/Account.tsx:104:        />
client/src/pages/Account.tsx:105:
client/src/pages/Account.tsx:106:        <FormField
client/src/pages/Account.tsx:107:          control={form.control}
client/src/pages/Account.tsx:108:          name="confirmPassword"
client/src/pages/Account.tsx:109:          render={({ field }) => (
client/src/pages/Account.tsx:110:            <FormItem>
client/src/pages/Account.tsx:111:              <FormLabel>Confirm New Password</FormLabel>
client/src/pages/Account.tsx:112:              <FormControl>
client/src/pages/Account.tsx:113:                <Input type="password" placeholder="Confirm your new password" {...field} />
client/src/pages/Account.tsx:114:              </FormControl>
client/src/pages/Account.tsx:115:              <FormMessage />
client/src/pages/Account.tsx:116:            </FormItem>
client/src/pages/Account.tsx:117:          )}
client/src/pages/Account.tsx:118:        />
client/src/pages/Account.tsx:119:
client/src/pages/Account.tsx:120:        <DialogFooter className="mt-6">
client/src/pages/Account.tsx:121:          <Button type="submit" disabled={isPending}>
client/src/pages/Account.tsx:122:            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Changing Password...</> : "Change Password"}
client/src/pages/Account.tsx:123:          </Button>
client/src/pages/Account.tsx:124:        </DialogFooter>
client/src/pages/Account.tsx:125:      </form>
client/src/pages/Account.tsx:126:    </Form>
client/src/pages/Account.tsx:127:  );
client/src/pages/Account.tsx:128:}
client/src/pages/Account.tsx:129:
client/src/pages/Account.tsx:130:// Payment Method Form Component
client/src/pages/Account.tsx:131:function PaymentMethodForm({ 
client/src/pages/Account.tsx:132:  onSuccess, 
client/src/pages/Account.tsx:133:  onCancel 
client/src/pages/Account.tsx:134:}: { 
client/src/pages/Account.tsx:135:  onSuccess: () => void; 
client/src/pages/Account.tsx:136:  onCancel: () => void;
client/src/pages/Account.tsx:137:}) {
client/src/pages/Account.tsx:138:  const stripe = useStripe();
client/src/pages/Account.tsx:139:  const elements = useElements();
client/src/pages/Account.tsx:140:  const [isSubmitting, setIsSubmitting] = useState(false);
client/src/pages/Account.tsx:141:  const [error, setError] = useState<string | null>(null);
client/src/pages/Account.tsx:142:
client/src/pages/Account.tsx:143:  const handleSubmit = async (e: React.FormEvent) => {
client/src/pages/Account.tsx:144:    e.preventDefault();
client/src/pages/Account.tsx:145:
client/src/pages/Account.tsx:146:    if (!stripe || !elements) {
client/src/pages/Account.tsx:147:      return;
client/src/pages/Account.tsx:148:    }
client/src/pages/Account.tsx:149:
client/src/pages/Account.tsx:150:    setIsSubmitting(true);
client/src/pages/Account.tsx:151:    setError(null);
client/src/pages/Account.tsx:152:
client/src/pages/Account.tsx:153:    try {
client/src/pages/Account.tsx:154:      // Use the card Element to tokenize payment details
client/src/pages/Account.tsx:155:      const { error: submitError } = await elements.submit();
client/src/pages/Account.tsx:156:
client/src/pages/Account.tsx:157:      if (submitError) {
client/src/pages/Account.tsx:158:        throw new Error(submitError.message);
client/src/pages/Account.tsx:159:      }
client/src/pages/Account.tsx:160:
client/src/pages/Account.tsx:161:      // Confirm the SetupIntent
client/src/pages/Account.tsx:162:      const { error: confirmError } = await stripe.confirmSetup({
client/src/pages/Account.tsx:163:        elements,
client/src/pages/Account.tsx:164:        confirmParams: {
client/src/pages/Account.tsx:165:          return_url: window.location.origin + '/account',
client/src/pages/Account.tsx:166:        },
client/src/pages/Account.tsx:167:        redirect: 'if_required',
client/src/pages/Account.tsx:168:      });
client/src/pages/Account.tsx:169:
client/src/pages/Account.tsx:170:      if (confirmError) {
client/src/pages/Account.tsx:171:        throw new Error(confirmError.message);
client/src/pages/Account.tsx:172:      }
client/src/pages/Account.tsx:173:
client/src/pages/Account.tsx:174:      // If we got here, then setup was successful
client/src/pages/Account.tsx:175:      onSuccess();
client/src/pages/Account.tsx:176:    } catch (err: any) {
client/src/pages/Account.tsx:177:      console.error('Error updating payment method:', err);
client/src/pages/Account.tsx:178:      setError(err.message || 'An error occurred while updating your payment method');
client/src/pages/Account.tsx:179:    } finally {
client/src/pages/Account.tsx:180:      setIsSubmitting(false);
client/src/pages/Account.tsx:181:    }
client/src/pages/Account.tsx:182:  };
client/src/pages/Account.tsx:183:
client/src/pages/Account.tsx:184:  return (
client/src/pages/Account.tsx:185:    <div>
client/src/pages/Account.tsx:186:      <form onSubmit={handleSubmit} className="space-y-4">
client/src/pages/Account.tsx:187:        <div className="space-y-2">
client/src/pages/Account.tsx:188:          <label className="text-sm font-medium">Card Details</label>
client/src/pages/Account.tsx:189:          <PaymentElement />
client/src/pages/Account.tsx:190:        </div>
client/src/pages/Account.tsx:191:
client/src/pages/Account.tsx:192:        <div className="space-y-2">
client/src/pages/Account.tsx:193:          <label className="text-sm font-medium">Billing Address</label>
client/src/pages/Account.tsx:194:          <AddressElement options={{ mode: 'billing' }} />
client/src/pages/Account.tsx:195:        </div>
client/src/pages/Account.tsx:196:
client/src/pages/Account.tsx:197:        {error && (
client/src/pages/Account.tsx:198:          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
client/src/pages/Account.tsx:199:            {error}
client/src/pages/Account.tsx:200:          </div>
client/src/pages/Account.tsx:201:        )}
client/src/pages/Account.tsx:202:
client/src/pages/Account.tsx:203:        <div className="flex justify-end space-x-2 pt-2">
client/src/pages/Account.tsx:204:          <Button 
client/src/pages/Account.tsx:205:            type="button" 
client/src/pages/Account.tsx:206:            variant="outline" 
client/src/pages/Account.tsx:207:            onClick={onCancel}
client/src/pages/Account.tsx:208:            disabled={isSubmitting}
client/src/pages/Account.tsx:209:          >
client/src/pages/Account.tsx:210:            Cancel
client/src/pages/Account.tsx:211:          </Button>
client/src/pages/Account.tsx:212:          <Button 
client/src/pages/Account.tsx:213:            type="submit" 
client/src/pages/Account.tsx:214:            disabled={!stripe || !elements || isSubmitting}
client/src/pages/Account.tsx:215:          >
client/src/pages/Account.tsx:216:            {isSubmitting ? (
client/src/pages/Account.tsx:217:              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
client/src/pages/Account.tsx:218:            ) : (
client/src/pages/Account.tsx:219:              'Save Payment Method'
client/src/pages/Account.tsx:220:            )}
client/src/pages/Account.tsx:221:          </Button>
client/src/pages/Account.tsx:222:        </div>
client/src/pages/Account.tsx:223:      </form>
client/src/pages/Account.tsx:224:    </div>
client/src/pages/Account.tsx:225:  );
client/src/pages/Account.tsx:226:}
client/src/pages/Account.tsx:227:
client/src/pages/Account.tsx:228:export default function Account() {
client/src/pages/Account.tsx:229:  const { user, logout, updateProfile } = useUser();
client/src/pages/Account.tsx:230:  const { toast } = useToast();
client/src/pages/Account.tsx:231:
client/src/pages/Account.tsx:232:  // State for dialogs
client/src/pages/Account.tsx:233:  const [isEditingProfile, setIsEditingProfile] = useState(false);
client/src/pages/Account.tsx:234:  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
client/src/pages/Account.tsx:235:  const [isManagingPaymentMethods, setIsManagingPaymentMethods] = useState(false);
client/src/pages/Account.tsx:236:  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
client/src/pages/Account.tsx:237:  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);
client/src/pages/Account.tsx:238:  const [isChangingEmail, setIsChangingEmail] = useState(false);
client/src/pages/Account.tsx:239:  const [isChangingPassword, setIsChangingPassword] = useState(false);
client/src/pages/Account.tsx:240:  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
client/src/pages/Account.tsx:241:
client/src/pages/Account.tsx:242:  // State for Career Profile sections completion tracking
client/src/pages/Account.tsx:243:  const [profileSections, setProfileSections] = useState([
client/src/pages/Account.tsx:244:    { id: 'work-history', title: 'Work History', icon: 'Building', completed: false },
client/src/pages/Account.tsx:245:    { id: 'education', title: 'Education', icon: 'GraduationCap', completed: false },
client/src/pages/Account.tsx:246:    { id: 'achievements', title: 'Achievements', icon: 'Trophy', completed: false },
client/src/pages/Account.tsx:247:    { id: 'skills', title: 'Skills', icon: 'BookOpen', completed: false },
client/src/pages/Account.tsx:248:    { id: 'certifications', title: 'Certifications', icon: 'Award', completed: false },
client/src/pages/Account.tsx:249:    { id: 'languages', title: 'Languages', icon: 'Languages', completed: false },
client/src/pages/Account.tsx:250:    { id: 'summary', title: 'Career Summary', icon: 'Users', completed: false },
client/src/pages/Account.tsx:251:    { id: 'location', title: 'Location Preferences', icon: 'MapPin', completed: false },
client/src/pages/Account.tsx:252:  ]);
client/src/pages/Account.tsx:253:  const [completionPercentage, setCompletionPercentage] = useState(0);
client/src/pages/Account.tsx:254:
client/src/pages/Account.tsx:255:  // State for Stripe payment elements
client/src/pages/Account.tsx:256:  const [isLoading, setIsLoading] = useState(false);
client/src/pages/Account.tsx:257:  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
client/src/pages/Account.tsx:258:  const [paymentMethodInfo, setPaymentMethodInfo] = useState<{
client/src/pages/Account.tsx:259:    last4: string;
client/src/pages/Account.tsx:260:    brand: string;
client/src/pages/Account.tsx:261:    exp_month: number;
client/src/pages/Account.tsx:262:    exp_year: number;
client/src/pages/Account.tsx:263:  } | null>(null);
client/src/pages/Account.tsx:264:
client/src/pages/Account.tsx:265:  // Email and password change mutations using hooks from useUserData
client/src/pages/Account.tsx:266:  const changeEmailMutation = useChangeEmail();
client/src/pages/Account.tsx:267:  const changePasswordMutation = useChangePassword();
client/src/pages/Account.tsx:268:
client/src/pages/Account.tsx:269:  // Fetch current payment method and calculate profile completion
client/src/pages/Account.tsx:270:  useEffect(() => {
client/src/pages/Account.tsx:271:    if (user && user.subscriptionPlan !== 'free') {
client/src/pages/Account.tsx:272:      fetchPaymentMethodInfo();
client/src/pages/Account.tsx:273:    }
client/src/pages/Account.tsx:274:    
client/src/pages/Account.tsx:275:    // Calculate profile completion percentage
client/src/pages/Account.tsx:276:    const completedSections = profileSections.filter(section => section.completed).length;
client/src/pages/Account.tsx:277:    const percentage = (completedSections / profileSections.length) * 100;
client/src/pages/Account.tsx:278:    setCompletionPercentage(percentage);
client/src/pages/Account.tsx:279:    
client/src/pages/Account.tsx:280:    // In a real implementation, fetch the profile sections data from the server
client/src/pages/Account.tsx:281:    // and update the completion status based on that
client/src/pages/Account.tsx:282:  }, [user, profileSections]);
client/src/pages/Account.tsx:283:
client/src/pages/Account.tsx:284:  // Function to fetch the user's current payment method info
client/src/pages/Account.tsx:285:  const fetchPaymentMethodInfo = async () => {
client/src/pages/Account.tsx:286:    try {
client/src/pages/Account.tsx:287:      const response = await fetch('/api/payments/payment-methods', {
client/src/pages/Account.tsx:288:        method: 'GET',
client/src/pages/Account.tsx:289:        headers: { 'Content-Type': 'application/json' },
client/src/pages/Account.tsx:290:      });
client/src/pages/Account.tsx:291:
client/src/pages/Account.tsx:292:      if (!response.ok) {
client/src/pages/Account.tsx:293:        throw new Error('Failed to fetch payment methods');
client/src/pages/Account.tsx:294:      }
client/src/pages/Account.tsx:295:
client/src/pages/Account.tsx:296:      const data = await response.json();
client/src/pages/Account.tsx:297:      if (data?.default_payment_method) {
client/src/pages/Account.tsx:298:        setPaymentMethodInfo({
client/src/pages/Account.tsx:299:          last4: data.default_payment_method.card.last4,
client/src/pages/Account.tsx:300:          brand: data.default_payment_method.card.brand,
client/src/pages/Account.tsx:301:          exp_month: data.default_payment_method.card.exp_month,
client/src/pages/Account.tsx:302:          exp_year: data.default_payment_method.card.exp_year
client/src/pages/Account.tsx:303:        });
client/src/pages/Account.tsx:304:      }
client/src/pages/Account.tsx:305:    } catch (error: any) {
client/src/pages/Account.tsx:306:      console.error('Error fetching payment methods:', error);
client/src/pages/Account.tsx:307:    }
client/src/pages/Account.tsx:308:  };
client/src/pages/Account.tsx:309:
client/src/pages/Account.tsx:310:  // Helper function to get pretty plan name
client/src/pages/Account.tsx:311:  const getPlanName = (plan: string | undefined): string => {
client/src/pages/Account.tsx:312:    if (!plan) return 'Free Plan';
client/src/pages/Account.tsx:313:
client/src/pages/Account.tsx:314:    switch (plan) {
client/src/pages/Account.tsx:315:      case 'free':
client/src/pages/Account.tsx:316:        return 'Free Plan';
client/src/pages/Account.tsx:317:      case 'premium':
client/src/pages/Account.tsx:318:        return 'Pro Plan';
client/src/pages/Account.tsx:319:      case 'pro_monthly':
client/src/pages/Account.tsx:320:        return 'Pro Plan (Monthly)';
client/src/pages/Account.tsx:321:      case 'pro_annual':
client/src/pages/Account.tsx:322:        return 'Pro Plan (Annual)';
client/src/pages/Account.tsx:323:      case 'university':
client/src/pages/Account.tsx:324:        return 'University License';
client/src/pages/Account.tsx:325:      default:
client/src/pages/Account.tsx:326:        return plan.replace('_', ' ');
client/src/pages/Account.tsx:327:    }
client/src/pages/Account.tsx:328:  };
client/src/pages/Account.tsx:329:
client/src/pages/Account.tsx:330:  // Subscription management functions
client/src/pages/Account.tsx:331:  const upgradeSubscription = async (cycle?: 'monthly' | 'quarterly' | 'annual') => {
client/src/pages/Account.tsx:332:    try {
client/src/pages/Account.tsx:333:      // Close dialog if open
client/src/pages/Account.tsx:334:      setIsManagingSubscription(false);
client/src/pages/Account.tsx:335:      setIsUpgradingPlan(false);
client/src/pages/Account.tsx:336:
client/src/pages/Account.tsx:337:      // Use selected billing cycle or default to monthly
client/src/pages/Account.tsx:338:      const selectedCycle = cycle || billingCycle;
client/src/pages/Account.tsx:339:
client/src/pages/Account.tsx:340:      // Create subscription with the selected interval
client/src/pages/Account.tsx:341:      const response = await fetch('/api/payments/create-subscription', {
client/src/pages/Account.tsx:342:        method: 'POST',
client/src/pages/Account.tsx:343:        headers: { 'Content-Type': 'application/json' },
client/src/pages/Account.tsx:344:        body: JSON.stringify({ 
client/src/pages/Account.tsx:345:          userId: user?.id,
client/src/pages/Account.tsx:346:          plan: 'premium',
client/src/pages/Account.tsx:347:          interval: selectedCycle,
client/src/pages/Account.tsx:348:          email: user?.email
client/src/pages/Account.tsx:349:        })
client/src/pages/Account.tsx:350:      });
client/src/pages/Account.tsx:351:
client/src/pages/Account.tsx:352:      if (!response.ok) {
client/src/pages/Account.tsx:353:        throw new Error('Failed to create subscription');
client/src/pages/Account.tsx:354:      }
client/src/pages/Account.tsx:355:
client/src/pages/Account.tsx:356:      const { clientSecret } = await response.json();
client/src/pages/Account.tsx:357:
client/src/pages/Account.tsx:358:      // Redirect to checkout page with client secret
client/src/pages/Account.tsx:359:      window.location.href = `/checkout?client_secret=${clientSecret}`;
client/src/pages/Account.tsx:360:    } catch (error: any) {
client/src/pages/Account.tsx:361:      console.error('Error upgrading subscription:', error);
client/src/pages/Account.tsx:362:      toast({
client/src/pages/Account.tsx:363:        title: "Error",
client/src/pages/Account.tsx:364:        description: error.message || "Failed to upgrade subscription",
client/src/pages/Account.tsx:365:        variant: "destructive"
client/src/pages/Account.tsx:366:      });
client/src/pages/Account.tsx:367:    }
client/src/pages/Account.tsx:368:  };
client/src/pages/Account.tsx:369:
client/src/pages/Account.tsx:370:  const cancelSubscription = async () => {
client/src/pages/Account.tsx:371:    try {
client/src/pages/Account.tsx:372:      const response = await fetch('/api/payments/cancel-subscription', {
client/src/pages/Account.tsx:373:        method: 'POST',
client/src/pages/Account.tsx:374:        headers: { 'Content-Type': 'application/json' },
client/src/pages/Account.tsx:375:        body: JSON.stringify({ 
client/src/pages/Account.tsx:376:          userId: user?.id 
client/src/pages/Account.tsx:377:        })
client/src/pages/Account.tsx:378:      });
client/src/pages/Account.tsx:379:
client/src/pages/Account.tsx:380:      if (!response.ok) {
client/src/pages/Account.tsx:381:        throw new Error('Failed to cancel subscription');
client/src/pages/Account.tsx:382:      }
client/src/pages/Account.tsx:383:
client/src/pages/Account.tsx:384:      setIsCancellingSubscription(false);
client/src/pages/Account.tsx:385:      toast({
client/src/pages/Account.tsx:386:        title: "Subscription Cancelled",
client/src/pages/Account.tsx:387:        description: "Your subscription has been cancelled successfully.",
client/src/pages/Account.tsx:388:        variant: "default"
client/src/pages/Account.tsx:389:      });
client/src/pages/Account.tsx:390:
client/src/pages/Account.tsx:391:      // Reload the page to reflect changes
client/src/pages/Account.tsx:392:      window.location.reload();
client/src/pages/Account.tsx:393:    } catch (error: any) {
client/src/pages/Account.tsx:394:      console.error('Error cancelling subscription:', error);
client/src/pages/Account.tsx:395:      toast({
client/src/pages/Account.tsx:396:        title: "Error",
client/src/pages/Account.tsx:397:        description: error.message || "Failed to cancel subscription",
client/src/pages/Account.tsx:398:        variant: "destructive"
client/src/pages/Account.tsx:399:      });
client/src/pages/Account.tsx:400:    }
client/src/pages/Account.tsx:401:  };
client/src/pages/Account.tsx:402:
client/src/pages/Account.tsx:403:  // Function to initialize the Stripe setup intent for managing payment methods
client/src/pages/Account.tsx:404:  const initializePaymentMethodsUpdate = async () => {
client/src/pages/Account.tsx:405:    try {
client/src/pages/Account.tsx:406:      setIsLoading(true);
client/src/pages/Account.tsx:407:
client/src/pages/Account.tsx:408:      // Get a setup intent from the server
client/src/pages/Account.tsx:409:      const response = await fetch('/api/payments/create-setup-intent', {
client/src/pages/Account.tsx:410:        method: 'POST',
client/src/pages/Account.tsx:411:        headers: { 'Content-Type': 'application/json' },
client/src/pages/Account.tsx:412:        body: JSON.stringify({ 
client/src/pages/Account.tsx:413:          userId: user?.id 
client/src/pages/Account.tsx:414:        })
client/src/pages/Account.tsx:415:      });
client/src/pages/Account.tsx:416:
client/src/pages/Account.tsx:417:      if (!response.ok) {
client/src/pages/Account.tsx:418:        throw new Error('Failed to initialize payment method update');
client/src/pages/Account.tsx:419:      }
client/src/pages/Account.tsx:420:
client/src/pages/Account.tsx:421:      const { clientSecret } = await response.json();
client/src/pages/Account.tsx:422:      setSetupIntentClientSecret(clientSecret);
client/src/pages/Account.tsx:423:
client/src/pages/Account.tsx:424:    } catch (error: any) {
client/src/pages/Account.tsx:425:      console.error('Error initializing payment method update:', error);
client/src/pages/Account.tsx:426:      toast({
client/src/pages/Account.tsx:427:        title: "Error",
client/src/pages/Account.tsx:428:        description: error.message || "Failed to initialize payment method management",
client/src/pages/Account.tsx:429:        variant: "destructive"
client/src/pages/Account.tsx:430:      });
client/src/pages/Account.tsx:431:    } finally {
client/src/pages/Account.tsx:432:      setIsLoading(false);
client/src/pages/Account.tsx:433:    }
client/src/pages/Account.tsx:434:  };
client/src/pages/Account.tsx:435:
client/src/pages/Account.tsx:436:  const profileForm = useForm({
client/src/pages/Account.tsx:437:    defaultValues: {
client/src/pages/Account.tsx:438:      name: user?.name || '',
client/src/pages/Account.tsx:439:      email: user?.email || '',
client/src/pages/Account.tsx:440:      username: user?.username || '',
client/src/pages/Account.tsx:441:    },
client/src/pages/Account.tsx:442:  });
client/src/pages/Account.tsx:443:
client/src/pages/Account.tsx:444:  const handleLogout = async () => {
client/src/pages/Account.tsx:445:    try {
client/src/pages/Account.tsx:446:      await fetch('/auth/logout', {
client/src/pages/Account.tsx:447:        method: 'POST',
client/src/pages/Account.tsx:448:        headers: {
client/src/pages/Account.tsx:449:          'Content-Type': 'application/json',
client/src/pages/Account.tsx:450:        },
client/src/pages/Account.tsx:451:      });
client/src/pages/Account.tsx:452:      window.location.href = '/sign-in';
client/src/pages/Account.tsx:453:    } catch (error) {
client/src/pages/Account.tsx:454:      console.error("Logout failed:", error);
client/src/pages/Account.tsx:455:      toast({
client/src/pages/Account.tsx:456:        title: "Logout failed",
client/src/pages/Account.tsx:457:        description: "There was an error logging out. Please try again.",
client/src/pages/Account.tsx:458:        variant: "destructive",
client/src/pages/Account.tsx:459:      });
client/src/pages/Account.tsx:460:    }
client/src/pages/Account.tsx:461:  };
client/src/pages/Account.tsx:462:
client/src/pages/Account.tsx:463:  const handleEditProfile = () => {
client/src/pages/Account.tsx:464:    // Reset form with current user values
client/src/pages/Account.tsx:465:    profileForm.reset({
client/src/pages/Account.tsx:466:      name: user?.name || '',
client/src/pages/Account.tsx:467:      email: user?.email || '',
client/src/pages/Account.tsx:468:      username: user?.username || '',
client/src/pages/Account.tsx:469:    });
client/src/pages/Account.tsx:470:    setIsEditingProfile(true);
client/src/pages/Account.tsx:471:  };
client/src/pages/Account.tsx:472:
client/src/pages/Account.tsx:473:  const handleProfileSubmit = async (data: any) => {
client/src/pages/Account.tsx:474:    try {
client/src/pages/Account.tsx:475:      await updateProfile(data);
client/src/pages/Account.tsx:476:      setIsEditingProfile(false);
client/src/pages/Account.tsx:477:      toast({
client/src/pages/Account.tsx:478:        title: "Profile updated",
client/src/pages/Account.tsx:479:        description: "Your profile has been updated successfully.",
client/src/pages/Account.tsx:480:        variant: "default",
client/src/pages/Account.tsx:481:      });
client/src/pages/Account.tsx:482:    } catch (error: any) {
client/src/pages/Account.tsx:483:      toast({
client/src/pages/Account.tsx:484:        title: "Failed to update profile",
client/src/pages/Account.tsx:485:        description: error.message || "An error occurred while updating your profile.",
client/src/pages/Account.tsx:486:        variant: "destructive",
client/src/pages/Account.tsx:487:      });
client/src/pages/Account.tsx:488:    }
client/src/pages/Account.tsx:489:  };
client/src/pages/Account.tsx:490:
client/src/pages/Account.tsx:491:  // Format dates helper function
client/src/pages/Account.tsx:492:  const formatDate = (date: Date | undefined | null) => {
client/src/pages/Account.tsx:493:    if (!date) return 'N/A';
client/src/pages/Account.tsx:494:    return new Date(date).toLocaleDateString('en-US', {
client/src/pages/Account.tsx:495:      year: 'numeric',
client/src/pages/Account.tsx:496:      month: 'long',
client/src/pages/Account.tsx:497:      day: 'numeric'
client/src/pages/Account.tsx:498:    });
client/src/pages/Account.tsx:499:  };
client/src/pages/Account.tsx:500:
client/src/pages/Account.tsx:501:  // Function to handle edit for a career profile section
client/src/pages/Account.tsx:502:  const handleEditSection = (sectionId: string) => {
client/src/pages/Account.tsx:503:    // You would implement section-specific edit logic here
client/src/pages/Account.tsx:504:    toast({
client/src/pages/Account.tsx:505:      title: "Edit Section",
client/src/pages/Account.tsx:506:      description: `Editing ${sectionId} section`,
client/src/pages/Account.tsx:507:    });
client/src/pages/Account.tsx:508:  };
client/src/pages/Account.tsx:509:
client/src/pages/Account.tsx:510:  if (!user) {
client/src/pages/Account.tsx:511:    return <div className="p-8 text-center">Loading user information...</div>;
client/src/pages/Account.tsx:512:  }
client/src/pages/Account.tsx:513:
client/src/pages/Account.tsx:514:  return (
client/src/pages/Account.tsx:515:    <div className="container max-w-5xl py-8">
client/src/pages/Account.tsx:516:      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
client/src/pages/Account.tsx:517:
client/src/pages/Account.tsx:518:      <Tabs defaultValue="profile" className="w-full">
client/src/pages/Account.tsx:519:        <TabsList className="mb-6">
client/src/pages/Account.tsx:520:          <TabsTrigger value="profile" className="flex items-center">
client/src/pages/Account.tsx:521:            <User className="mr-2 h-4 w-4" />
client/src/pages/Account.tsx:522:            Profile
client/src/pages/Account.tsx:523:          </TabsTrigger>
client/src/pages/Account.tsx:524:          <TabsTrigger value="subscription" className="flex items-center">
client/src/pages/Account.tsx:525:            <CreditCard className="mr-2 h-4 w-4" />
client/src/pages/Account.tsx:526:            Subscription
client/src/pages/Account.tsx:527:          </TabsTrigger>
client/src/pages/Account.tsx:528:
client/src/pages/Account.tsx:529:          <TabsTrigger value="security" className="flex items-center">
client/src/pages/Account.tsx:530:            <ShieldCheck className="mr-2 h-4 w-4" />
client/src/pages/Account.tsx:531:            Security
client/src/pages/Account.tsx:532:          </TabsTrigger>
client/src/pages/Account.tsx:533:        </TabsList>
client/src/pages/Account.tsx:534:
client/src/pages/Account.tsx:535:        <TabsContent value="profile" className="space-y-6">
client/src/pages/Account.tsx:536:          <Card>
client/src/pages/Account.tsx:537:            <CardHeader className="flex flex-row items-center justify-between">
client/src/pages/Account.tsx:538:              <CardTitle>Profile Information</CardTitle>
client/src/pages/Account.tsx:539:              <Button variant="outline" size="sm" onClick={handleEditProfile}>
client/src/pages/Account.tsx:540:                <Edit className="mr-2 h-4 w-4" />
client/src/pages/Account.tsx:541:                Edit Profile
client/src/pages/Account.tsx:542:              </Button>
client/src/pages/Account.tsx:543:            </CardHeader>
client/src/pages/Account.tsx:544:            <CardContent className="grid grid-cols-2 gap-4">
client/src/pages/Account.tsx:545:              <div>
client/src/pages/Account.tsx:546:                <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
client/src/pages/Account.tsx:547:                <p>{user.name}</p>
client/src/pages/Account.tsx:548:              </div>
client/src/pages/Account.tsx:549:              <div>
client/src/pages/Account.tsx:550:                <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
client/src/pages/Account.tsx:551:                <p>{user.email}</p>
client/src/pages/Account.tsx:552:              </div>
client/src/pages/Account.tsx:553:              <div>
client/src/pages/Account.tsx:554:                <h3 className="font-medium text-sm text-muted-foreground">Username</h3>
client/src/pages/Account.tsx:555:                <p>{user.username}</p>
client/src/pages/Account.tsx:556:              </div>
client/src/pages/Account.tsx:557:              <div>
client/src/pages/Account.tsx:558:                <h3 className="font-medium text-sm text-muted-foreground">Account Created</h3>
client/src/pages/Account.tsx:559:                <p>March 15, 2025</p>
client/src/pages/Account.tsx:560:              </div>
client/src/pages/Account.tsx:561:              <div>
client/src/pages/Account.tsx:562:                <h3 className="font-medium text-sm text-muted-foreground">User Type</h3>
client/src/pages/Account.tsx:563:                <p className="capitalize">{user.userType ? user.userType.replace('_', ' ') : 'Standard'}</p>
client/src/pages/Account.tsx:564:              </div>
client/src/pages/Account.tsx:565:            </CardContent>
client/src/pages/Account.tsx:566:          </Card>
client/src/pages/Account.tsx:567:
client/src/pages/Account.tsx:568:          {/* Profile Edit Dialog */}
client/src/pages/Account.tsx:569:          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
client/src/pages/Account.tsx:570:            <DialogContent className="sm:max-w-[425px]">
client/src/pages/Account.tsx:571:              <DialogHeader>
client/src/pages/Account.tsx:572:                <DialogTitle>Edit Profile</DialogTitle>
client/src/pages/Account.tsx:573:                <DialogDescription>
client/src/pages/Account.tsx:574:                  Make changes to your profile information here.
client/src/pages/Account.tsx:575:                </DialogDescription>
client/src/pages/Account.tsx:576:              </DialogHeader>
client/src/pages/Account.tsx:577:              <Form {...profileForm}>
client/src/pages/Account.tsx:578:                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4 py-4">
client/src/pages/Account.tsx:579:                  <FormField
client/src/pages/Account.tsx:580:                    control={profileForm.control}
client/src/pages/Account.tsx:581:                    name="name"
client/src/pages/Account.tsx:582:                    render={({ field }) => (
client/src/pages/Account.tsx:583:                      <FormItem>
client/src/pages/Account.tsx:584:                        <FormLabel>Name</FormLabel>
client/src/pages/Account.tsx:585:                        <FormControl>
client/src/pages/Account.tsx:586:                          <Input placeholder="Your name" {...field} />
client/src/pages/Account.tsx:587:                        </FormControl>
client/src/pages/Account.tsx:588:                        <FormMessage />
client/src/pages/Account.tsx:589:                      </FormItem>
client/src/pages/Account.tsx:590:                    )}
client/src/pages/Account.tsx:591:                  />
client/src/pages/Account.tsx:592:                  <FormField
client/src/pages/Account.tsx:593:                    control={profileForm.control}
client/src/pages/Account.tsx:594:                    name="email"
client/src/pages/Account.tsx:595:                    render={({ field }) => (
client/src/pages/Account.tsx:596:                      <FormItem>
client/src/pages/Account.tsx:597:                        <FormLabel>Email</FormLabel>
client/src/pages/Account.tsx:598:                        <FormControl>
client/src/pages/Account.tsx:599:                          <Input type="email" placeholder="Your email" {...field} />
client/src/pages/Account.tsx:600:                        </FormControl>
client/src/pages/Account.tsx:601:                        <FormMessage />
client/src/pages/Account.tsx:602:                      </FormItem>
client/src/pages/Account.tsx:603:                    )}
client/src/pages/Account.tsx:604:                  />
client/src/pages/Account.tsx:605:                  <FormField
client/src/pages/Account.tsx:606:                    control={profileForm.control}
client/src/pages/Account.tsx:607:                    name="username"
client/src/pages/Account.tsx:608:                    render={({ field }) => (
client/src/pages/Account.tsx:609:                      <FormItem>
client/src/pages/Account.tsx:610:                        <FormLabel>Username</FormLabel>
client/src/pages/Account.tsx:611:                        <FormControl>
client/src/pages/Account.tsx:612:                          <Input placeholder="Your username" {...field} />
client/src/pages/Account.tsx:613:                        </FormControl>
client/src/pages/Account.tsx:614:                        <FormMessage />
client/src/pages/Account.tsx:615:                      </FormItem>
client/src/pages/Account.tsx:616:                    )}
client/src/pages/Account.tsx:617:                  />
client/src/pages/Account.tsx:618:                  <DialogFooter className="mt-6">
client/src/pages/Account.tsx:619:                    <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
client/src/pages/Account.tsx:620:                      Cancel
client/src/pages/Account.tsx:621:                    </Button>
client/src/pages/Account.tsx:622:                    <Button type="submit">Save Changes</Button>
client/src/pages/Account.tsx:623:                  </DialogFooter>
client/src/pages/Account.tsx:624:                </form>
client/src/pages/Account.tsx:625:              </Form>
client/src/pages/Account.tsx:626:            </DialogContent>
client/src/pages/Account.tsx:627:          </Dialog>
client/src/pages/Account.tsx:628:          <Card className="mt-6">
client/src/pages/Account.tsx:629:            <CardHeader>
client/src/pages/Account.tsx:631:              <CardDescription>
client/src/pages/Account.tsx:632:                Customize the appearance of your application.
client/src/pages/Account.tsx:633:              </CardDescription>
client/src/pages/Account.tsx:634:            </CardHeader>
client/src/pages/Account.tsx:635:            <CardContent className="space-y-6">
client/src/pages/Account.tsx:636:              <div className="space-y-4">
client/src/pages/Account.tsx:637:                <div>
client/src/pages/Account.tsx:638:                  <h3 className="font-medium mb-2">Color Mode</h3>
client/src/pages/Account.tsx:639:                  <div className="grid grid-cols-3 gap-2">
client/src/pages/Account.tsx:640:                    <Button 
client/src/pages/Account.tsx:641:                      variant="outline" 
client/src/pages/Account.tsx:642:                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'light' ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:644:                    >
client/src/pages/Account.tsx:645:                      <div className="h-12 w-12 bg-background border rounded-full flex items-center justify-center mb-2">
client/src/pages/Account.tsx:646:                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><circle cx="12" cy="12" r="4"></circle><path d="M12 8a2 2 0 1 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0c0 8-12 8-12 0a8 8 0 0 0 16 0c0 12-16 12-16 0"></path></svg>
client/src/pages/Account.tsx:647:                      </div>
client/src/pages/Account.tsx:648:                      <span>Light</span>
client/src/pages/Account.tsx:649:                    </Button>
client/src/pages/Account.tsx:650:
client/src/pages/Account.tsx:651:                    <Button 
client/src/pages/Account.tsx:652:                      variant="outline" 
client/src/pages/Account.tsx:653:                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'dark' ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:655:                    >
client/src/pages/Account.tsx:656:                      <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-2">
client/src/pages/Account.tsx:657:                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
client/src/pages/Account.tsx:658:                      </div>
client/src/pages/Account.tsx:659:                      <span>Dark</span>
client/src/pages/Account.tsx:660:                    </Button>
client/src/pages/Account.tsx:661:
client/src/pages/Account.tsx:662:                    <Button 
client/src/pages/Account.tsx:663:                      variant="outline" 
client/src/pages/Account.tsx:664:                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'system' ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:666:                    >
client/src/pages/Account.tsx:667:                      <div className="h-12 w-12 bg-gradient-to-br from-background to-zinc-900 border rounded-full flex items-center justify-center mb-2">
client/src/pages/Account.tsx:668:                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="3" rx="2"></rect><path d="M7 20h10"></path><path d="M9 16v4"></path><path d="M15 16v4"></path></svg>
client/src/pages/Account.tsx:669:                      </div>
client/src/pages/Account.tsx:670:                      <span>System</span>
client/src/pages/Account.tsx:671:                    </Button>
client/src/pages/Account.tsx:672:                  </div>
client/src/pages/Account.tsx:673:                </div>
client/src/pages/Account.tsx:674:
client/src/pages/Account.tsx:675:                <div>
client/src/pages/Account.tsx:676:                  <h3 className="font-medium mb-2">Primary Color</h3>
client/src/pages/Account.tsx:677:                  <div className="flex flex-wrap gap-3">
client/src/pages/Account.tsx:678:                    <div
client/src/pages/Account.tsx:679:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0C29AB] hover:ring-2 hover:ring-offset-2 hover:ring-[#0C29AB]/50"
client/src/pages/Account.tsx:680:                      style={{ backgroundColor: "#0C29AB" }}
client/src/pages/Account.tsx:681:                      onClick={() => {
client/src/pages/Account.tsx:682:                        setCustomColor("#0C29AB");
client/src/pages/Account.tsx:685:                      }}
client/src/pages/Account.tsx:686:                    />
client/src/pages/Account.tsx:687:                    <div
client/src/pages/Account.tsx:688:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#7C3AED] hover:ring-2 hover:ring-offset-2 hover:ring-[#7C3AED]/50"
client/src/pages/Account.tsx:689:                      style={{ backgroundColor: "#7C3AED" }}
client/src/pages/Account.tsx:690:                      onClick={() => {
client/src/pages/Account.tsx:691:                        setCustomColor("#7C3AED");
client/src/pages/Account.tsx:694:                      }}
client/src/pages/Account.tsx:695:                    />
client/src/pages/Account.tsx:696:                    <div
client/src/pages/Account.tsx:697:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#10B981] hover:ring-2 hover:ring-offset-2 hover:ring-[#10B981]/50"
client/src/pages/Account.tsx:698:                      style={{ backgroundColor: "#10B981" }}
client/src/pages/Account.tsx:699:                      onClick={() => {
client/src/pages/Account.tsx:700:                        setCustomColor("#10B981");
client/src/pages/Account.tsx:703:                      }}
client/src/pages/Account.tsx:704:                    />
client/src/pages/Account.tsx:705:                    <div
client/src/pages/Account.tsx:706:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#F97316] hover:ring-2 hover:ring-offset-2 hover:ring-[#F97316]/50"
client/src/pages/Account.tsx:707:                      style={{ backgroundColor: "#F97316" }}
client/src/pages/Account.tsx:708:                      onClick={() => {
client/src/pages/Account.tsx:709:                        setCustomColor("#F97316");
client/src/pages/Account.tsx:712:                      }}
client/src/pages/Account.tsx:713:                    />
client/src/pages/Account.tsx:714:                    <div
client/src/pages/Account.tsx:715:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#EF4444] hover:ring-2 hover:ring-offset-2 hover:ring-[#EF4444]/50"
client/src/pages/Account.tsx:716:                      style={{ backgroundColor: "#EF4444" }}
client/src/pages/Account.tsx:717:                      onClick={() => {
client/src/pages/Account.tsx:718:                        setCustomColor("#EF4444");
client/src/pages/Account.tsx:721:                      }}
client/src/pages/Account.tsx:722:                    />
client/src/pages/Account.tsx:723:                    <div
client/src/pages/Account.tsx:724:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#6366F1] hover:ring-2 hover:ring-offset-2 hover:ring-[#6366F1]/50"
client/src/pages/Account.tsx:725:                      style={{ backgroundColor: "#6366F1" }}
client/src/pages/Account.tsx:726:                      onClick={() => {
client/src/pages/Account.tsx:727:                        setCustomColor("#6366F1");
client/src/pages/Account.tsx:730:                      }}
client/src/pages/Account.tsx:731:                    />
client/src/pages/Account.tsx:732:                    <div
client/src/pages/Account.tsx:733:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#2563EB] hover:ring-2 hover:ring-offset-2 hover:ring-[#2563EB]/50"
client/src/pages/Account.tsx:734:                      style={{ backgroundColor: "#2563EB" }}
client/src/pages/Account.tsx:735:                      onClick={() => {
client/src/pages/Account.tsx:736:                        setCustomColor("#2563EB");
client/src/pages/Account.tsx:739:                      }}
client/src/pages/Account.tsx:740:                    />
client/src/pages/Account.tsx:741:                    <div
client/src/pages/Account.tsx:742:                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0891B2] hover:ring-2 hover:ring-offset-2 hover:ring-[#0891B2]/50"
client/src/pages/Account.tsx:743:                      style={{ backgroundColor: "#0891B2" }}
client/src/pages/Account.tsx:744:                      onClick={() => {
client/src/pages/Account.tsx:745:                        setCustomColor("#0891B2");
client/src/pages/Account.tsx:748:                      }}
client/src/pages/Account.tsx:749:                    />
client/src/pages/Account.tsx:750:                    <label htmlFor="custom-color" className="w-8 h-8 rounded-full border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-muted">
client/src/pages/Account.tsx:751:                      <Palette className="h-4 w-4" />
client/src/pages/Account.tsx:752:                      <input
client/src/pages/Account.tsx:753:                        type="color"
client/src/pages/Account.tsx:754:                        id="custom-color"
client/src/pages/Account.tsx:755:                        className="sr-only"
client/src/pages/Account.tsx:756:                        value={customColor}
client/src/pages/Account.tsx:757:                        onChange={(e) => {
client/src/pages/Account.tsx:758:                          const color = e.target.value;
client/src/pages/Account.tsx:759:                          setCustomColor(color);
client/src/pages/Account.tsx:762:                        }}
client/src/pages/Account.tsx:763:                      />
client/src/pages/Account.tsx:764:                    </label>
client/src/pages/Account.tsx:765:                  </div>
client/src/pages/Account.tsx:766:                </div>
client/src/pages/Account.tsx:767:
client/src/pages/Account.tsx:768:                <div>
client/src/pages/Account.tsx:769:                  <h3 className="font-medium mb-2">Variant</h3>
client/src/pages/Account.tsx:770:                  <div className="grid grid-cols-3 gap-2">
client/src/pages/Account.tsx:771:                    <Button 
client/src/pages/Account.tsx:772:                      variant="outline" 
client/src/pages/Account.tsx:773:                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'professional' ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:774:                      onClick={() => {
client/src/pages/Account.tsx:777:                      }}
client/src/pages/Account.tsx:778:                    >
client/src/pages/Account.tsx:779:                      <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-r from-primary/20 to-primary/10">
client/src/pages/Account.tsx:780:                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"></path><path d="M7 2v4a2 2 0 0 1-2 2H2"></path><path d="M20 17h-3a2 2 0 0 0-2 2v3"></path><path d="M2 17h3a2 2 0 0 1 2 2v3"></path><rect width="9" height="9" x="7.5" y="7.5" rx="1"></rect></svg>
client/src/pages/Account.tsx:781:                      </div>
client/src/pages/Account.tsx:782:                      <span>Professional</span>
client/src/pages/Account.tsx:783:                    </Button>
client/src/pages/Account.tsx:784:
client/src/pages/Account.tsx:785:                    <Button 
client/src/pages/Account.tsx:786:                      variant="outline" 
client/src/pages/Account.tsx:787:                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'tint' ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:788:                      onClick={() => {
client/src/pages/Account.tsx:791:                      }}
client/src/pages/Account.tsx:792:                    >
client/src/pages/Account.tsx:793:                      <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-br from-primary/30 to-primary/10">
client/src/pages/Account.tsx:794:                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="m19 9-2 2-2-2"></path><path d="m5 9 2 2 2-2"></path><path d="m9 19 2-2 2 2"></path><path d="m9 5 2 2 2-2"></path></svg>
client/src/pages/Account.tsx:795:                      </div>
client/src/pages/Account.tsx:796:                      <span>Tint</span>
client/src/pages/Account.tsx:797:                    </Button>
client/src/pages/Account.tsx:798:
client/src/pages/Account.tsx:799:                    <Button 
client/src/pages/Account.tsx:800:                      variant="outline" 
client/src/pages/Account.tsx:801:                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'vibrant' ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:802:                      onClick={() => {
client/src/pages/Account.tsx:805:                      }}
client/src/pages/Account.tsx:806:                    >
client/src/pages/Account.tsx:807:                      <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-tr from-primary/90 to-primary/30">
client/src/pages/Account.tsx:808:                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"></circle><circle cx="19" cy="17" r="3"></circle><circle cx="6" cy="12" r="4"></circle></svg>
client/src/pages/Account.tsx:809:                      </div>
client/src/pages/Account.tsx:810:                      <span>Vibrant</span>
client/src/pages/Account.tsx:811:                    </Button>
client/src/pages/Account.tsx:812:                  </div>
client/src/pages/Account.tsx:813:                </div>
client/src/pages/Account.tsx:814:
client/src/pages/Account.tsx:815:                <div>
client/src/pages/Account.tsx:816:                  <h3 className="font-medium mb-2">Border Radius</h3>
client/src/pages/Account.tsx:817:                  <div className="space-y-4">
client/src/pages/Account.tsx:818:                    <div className="grid grid-cols-3 gap-2 mb-4">
client/src/pages/Account.tsx:819:                      <Button 
client/src/pages/Account.tsx:820:                        variant="outline" 
client/src/pages/Account.tsx:821:                        className={`flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0 ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:822:                        onClick={() => {
client/src/pages/Account.tsx:825:                        }}
client/src/pages/Account.tsx:826:                      >
client/src/pages/Account.tsx:827:                        <div className="h-12 w-12 border rounded-none flex items-center justify-center mb-2">
client/src/pages/Account.tsx:828:                          <span className="text-xs">0px</span>
client/src/pages/Account.tsx:829:                        </div>
client/src/pages/Account.tsx:830:                        <span>None</span>
client/src/pages/Account.tsx:831:                      </Button>
client/src/pages/Account.tsx:832:
client/src/pages/Account.tsx:833:                      <Button 
client/src/pages/Account.tsx:834:                        variant="outline" 
client/src/pages/Account.tsx:835:                        className={`flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0.5 ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:836:                        onClick={() => {
client/src/pages/Account.tsx:839:                        }}
client/src/pages/Account.tsx:840:                      >
client/src/pages/Account.tsx:841:                        <div className="h-12 w-12 border rounded-sm flex items-center justify-center mb-2">
client/src/pages/Account.tsx:842:                          <span className="text-xs">0.5rem</span>
client/src/pages/Account.tsx:843:                        </div>
client/src/pages/Account.tsx:844:                        <span>Small</span>
client/src/pages/Account.tsx:845:                      </Button>
client/src/pages/Account.tsx:846:
client/src/pages/Account.tsx:847:                      <Button 
client/src/pages/Account.tsx:848:                        variant="outline" 
client/src/pages/Account.tsx:849:                        className={`flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 1 ? 'border-primary' : ''}`}
client/src/pages/Account.tsx:850:                        onClick={() => {
client/src/pages/Account.tsx:853:                        }}
client/src/pages/Account.tsx:854:                      >
client/src/pages/Account.tsx:855:                        <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2">
client/src/pages/Account.tsx:856:                          <span className="text-xs">1rem</span>
client/src/pages/Account.tsx:857:                        </div>
client/src/pages/Account.tsx:858:                        <span>Medium</span>
client/src/pages/Account.tsx:859:                      </Button>
client/src/pages/Account.tsx:860:                    </div>
client/src/pages/Account.tsx:861:
client/src/pages/Account.tsx:862:                    <Slider
client/src/pages/Account.tsx:863:                      defaultValue={[user?.theme?.radius || 0.5]}
client/src/pages/Account.tsx:864:                      min={0}
client/src/pages/Account.tsx:865:                      max={1.5}
client/src/pages/Account.tsx:866:                      step={0.1}
client/src/pages/Account.tsx:867:                      onValueChange={(value) => {
client/src/pages/Account.tsx:870:                      }}
client/src/pages/Account.tsx:871:                    />
client/src/pages/Account.tsx:872:                  </div>
client/src/pages/Account.tsx:873:                </div>
client/src/pages/Account.tsx:874:              </div>
client/src/pages/Account.tsx:875:            </CardContent>
client/src/pages/Account.tsx:876:            <CardFooter className="border-t pt-6">
client/src/pages/Account.tsx:877:              <Button 
client/src/pages/Account.tsx:878:                onClick={() => {
client/src/pages/Account.tsx:881:                }} 
client/src/pages/Account.tsx:882:                variant="outline" 
client/src/pages/Account.tsx:883:                className="mr-2"
client/src/pages/Account.tsx:884:              >
client/src/pages/Account.tsx:885:                <RotateCcw className="h-4 w-4 mr-2" />
client/src/pages/Account.tsx:886:                Reset to Defaults
client/src/pages/Account.tsx:887:              </Button>
client/src/pages/Account.tsx:890:                  <>
client/src/pages/Account.tsx:891:                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
client/src/pages/Account.tsx:892:                    Updating...
client/src/pages/Account.tsx:893:                  </>
client/src/pages/Account.tsx:894:                ) : (
client/src/pages/Account.tsx:895:                  'Apply Changes'
client/src/pages/Account.tsx:896:                )}
client/src/pages/Account.tsx:897:              </Button>
client/src/pages/Account.tsx:898:            </CardFooter>
client/src/pages/Account.tsx:899:          </Card>
client/src/pages/Account.tsx:900:        </TabsContent>
client/src/pages/Account.tsx:901:
client/src/pages/Account.tsx:902:        <TabsContent value="subscription" className="space-y-6">
client/src/pages/Account.tsx:903:          <Card>
client/src/pages/Account.tsx:904:            <CardHeader>
client/src/pages/Account.tsx:905:              <CardTitle>Subscription Details</CardTitle>
client/src/pages/Account.tsx:906:              {user.subscriptionPlan === 'free' && (
client/src/pages/Account.tsx:907:                <div className="flex justify-end">
client/src/pages/Account.tsx:908:                  <Button 
client/src/pages/Account.tsx:909:                    variant="default" 
client/src/pages/Account.tsx:910:                    size="sm" 
client/src/pages/Account.tsx:911:                    onClick={() => setIsUpgradingPlan(true)}
client/src/pages/Account.tsx:912:                    className="mt-2"
client/src/pages/Account.tsx:913:                  >
client/src/pages/Account.tsx:914:                    <Sparkles className="mr-2 h-4 w-4" />
client/src/pages/Account.tsx:915:                    Upgrade Plan
client/src/pages/Account.tsx:916:                  </Button>
client/src/pages/Account.tsx:917:                </div>
client/src/pages/Account.tsx:918:              )}
client/src/pages/Account.tsx:919:            </CardHeader>
client/src/pages/Account.tsx:920:            <CardContent className="space-y-4">
client/src/pages/Account.tsx:921:              <div className="grid grid-cols-2 gap-4">
client/src/pages/Account.tsx:922:                <div>
client/src/pages/Account.tsx:923:                  <h3 className="font-medium text-sm text-muted-foreground">Current Plan</h3>
client/src/pages/Account.tsx:924:                  <p className="font-medium">{getPlanName(user.subscriptionPlan)}</p>
client/src/pages/Account.tsx:925:                </div>
client/src/pages/Account.tsx:926:                <div>
client/src/pages/Account.tsx:927:                  <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
client/src/pages/Account.tsx:928:                  <p className="capitalize">
client/src/pages/Account.tsx:929:                    {user.subscriptionStatus ? 
client/src/pages/Account.tsx:930:                      (user.subscriptionStatus === 'active' ? 
client/src/pages/Account.tsx:931:                        <span className="flex items-center text-green-600 font-medium">
client/src/pages/Account.tsx:932:                          <CheckCircle2 className="h-4 w-4 mr-1" /> Active
client/src/pages/Account.tsx:933:                        </span> : 
client/src/pages/Account.tsx:934:                        user.subscriptionStatus.replace('_', ' ')) : 
client/src/pages/Account.tsx:935:                      <span className="text-gray-500">Free</span>}
client/src/pages/Account.tsx:936:                  </p>
client/src/pages/Account.tsx:937:                </div>
client/src/pages/Account.tsx:938:
client/src/pages/Account.tsx:939:                {/* Additional subscription details */}
client/src/pages/Account.tsx:940:                {user.subscriptionPlan !== 'free' && (
client/src/pages/Account.tsx:941:                  <>
client/src/pages/Account.tsx:942:                    <div>
client/src/pages/Account.tsx:943:                      <h3 className="font-medium text-sm text-muted-foreground">Billing Cycle</h3>
client/src/pages/Account.tsx:944:                      <p className="capitalize">{user.subscriptionCycle || 'Monthly'}</p>
client/src/pages/Account.tsx:945:                    </div>
client/src/pages/Account.tsx:946:                    {user.subscriptionExpiresAt && (
client/src/pages/Account.tsx:947:                      <div>
client/src/pages/Account.tsx:948:                        <h3 className="font-medium text-sm text-muted-foreground">
client/src/pages/Account.tsx:949:                          {user.subscriptionStatus === 'active' ? 'Next Billing Date' : 'Expires On'}
client/src/pages/Account.tsx:950:                        </h3>
client/src/pages/Account.tsx:951:                        <p>{formatDate(user.subscriptionExpiresAt)}</p>
client/src/pages/Account.tsx:952:                      </div>
client/src/pages/Account.tsx:953:                    )}
client/src/pages/Account.tsx:954:                  </>
client/src/pages/Account.tsx:955:                )}
client/src/pages/Account.tsx:956:              </div>
client/src/pages/Account.tsx:957:
client/src/pages/Account.tsx:958:              {/* Free plan features description */}
client/src/pages/Account.tsx:959:              {user.subscriptionPlan === 'free' && (
client/src/pages/Account.tsx:960:                <div className="mt-6 p-4 bg-muted/50 rounded-md">
client/src/pages/Account.tsx:961:                  <h3 className="font-medium mb-2">Free Plan Features</h3>
client/src/pages/Account.tsx:962:                  <ul className="space-y-1 text-sm">
client/src/pages/Account.tsx:963:                    <li className="flex items-center">
client/src/pages/Account.tsx:964:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Basic resume builder
client/src/pages/Account.tsx:965:                    </li>
client/src/pages/Account.tsx:966:                    <li className="flex items-center">
client/src/pages/Account.tsx:967:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Limited interview practice
client/src/pages/Account.tsx:968:                    </li>
client/src/pages/Account.tsx:969:                    <li className="flex items-center">
client/src/pages/Account.tsx:970:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Work history tracking
client/src/pages/Account.tsx:971:                    </li>
client/src/pages/Account.tsx:972:                  </ul>
client/src/pages/Account.tsx:973:                  <Button 
client/src/pages/Account.tsx:974:                    variant="default" 
client/src/pages/Account.tsx:975:                    size="sm" 
client/src/pages/Account.tsx:976:                    className="mt-4" 
client/src/pages/Account.tsx:977:                    onClick={() => upgradeSubscription()}>
client/src/pages/Account.tsx:978:                    Upgrade to Pro
client/src/pages/Account.tsx:979:                  </Button>
client/src/pages/Account.tsx:980:                </div>
client/src/pages/Account.tsx:981:              )}
client/src/pages/Account.tsx:982:
client/src/pages/Account.tsx:983:              {/* Premium features description */}
client/src/pages/Account.tsx:984:              {user.subscriptionPlan === 'premium' && (
client/src/pages/Account.tsx:985:                <div className="mt-6 p-4 bg-muted/50 rounded-md">
client/src/pages/Account.tsx:986:                  <div className="flex items-center justify-between mb-2">
client/src/pages/Account.tsx:987:                    <h3 className="font-medium">Your Pro Features</h3>
client/src/pages/Account.tsx:988:                    <div className="flex space-x-2">
client/src/pages/Account.tsx:989:                      <Button variant="outline" size="sm" onClick={() => setIsManagingSubscription(true)}>
client/src/pages/Account.tsx:990:                        Manage Subscription
client/src/pages/Account.tsx:991:                      </Button>
client/src/pages/Account.tsx:992:                    </div>
client/src/pages/Account.tsx:993:                  </div>
client/src/pages/Account.tsx:994:                  <ul className="space-y-1 text-sm">
client/src/pages/Account.tsx:995:                    <li className="flex items-center">
client/src/pages/Account.tsx:996:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Advanced resume builder
client/src/pages/Account.tsx:997:                    </li>
client/src/pages/Account.tsx:998:                    <li className="flex items-center">
client/src/pages/Account.tsx:999:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Unlimited interview practice
client/src/pages/Account.tsx:1000:                    </li>
client/src/pages/Account.tsx:1001:                    <li className="flex items-center">
client/src/pages/Account.tsx:1002:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> AI career coach
client/src/pages/Account.tsx:1003:                    </li>
client/src/pages/Account.tsx:1004:                    <li className="flex items-center">
client/src/pages/Account.tsx:1005:                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Cover letter generator
client/src/pages/Account.tsx:1006:                    </li>
client/src/pages/Account.tsx:1007:                  </ul>
client/src/pages/Account.tsx:1008:                </div>
client/src/pages/Account.tsx:1009:              )}
client/src/pages/Account.tsx:1010:            </CardContent>
client/src/pages/Account.tsx:1011:
client/src/pages/Account.tsx:1012:            {/* Add Card Footer with Unsubscribe Button for paid plans */}
client/src/pages/Account.tsx:1013:            {user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active' && (
client/src/pages/Account.tsx:1014:              <CardFooter className="border-t pt-6 flex flex-col items-stretch">
client/src/pages/Account.tsx:1015:                <div className="flex items-center justify-between mb-4">
client/src/pages/Account.tsx:1016:                  <div>
client/src/pages/Account.tsx:1017:                    <h3 className="font-medium">Subscription Management</h3>
client/src/pages/Account.tsx:1018:                    <p className="text-sm text-muted-foreground">Need to make changes to your billing?</p>
client/src/pages/Account.tsx:1019:                  </div>
client/src/pages/Account.tsx:1020:                  <Button variant="default" size="sm" onClick={() => setIsManagingPaymentMethods(true)}>
client/src/pages/Account.tsx:1021:                    Manage Payment Methods
client/src/pages/Account.tsx:1022:                  </Button>
client/src/pages/Account.tsx:1023:                </div>
client/src/pages/Account.tsx:1024:
client/src/pages/Account.tsx:1025:              </CardFooter>
client/src/pages/Account.tsx:1026:            )}
client/src/pages/Account.tsx:1027:          </Card>
client/src/pages/Account.tsx:1028:
client/src/pages/Account.tsx:1029:          {/* Subscription Management Dialog */}
client/src/pages/Account.tsx:1030:          <Dialog open={isManagingSubscription} onOpenChange={setIsManagingSubscription}>
client/src/pages/Account.tsx:1031:            <DialogContent className="sm:max-w-[500px]">
client/src/pages/Account.tsx:1032:              <DialogHeader>
client/src/pages/Account.tsx:1033:                <DialogTitle>Subscription Management</DialogTitle>
client/src/pages/Account.tsx:1034:                <DialogDescription>
client/src/pages/Account.tsx:1035:                  Manage your subscription settings and payment methods.
client/src/pages/Account.tsx:1036:                </DialogDescription>
client/src/pages/Account.tsx:1037:              </DialogHeader>
client/src/pages/Account.tsx:1038:              <div className="py-4 space-y-6">
client/src/pages/Account.tsx:1039:                {/* Subscription Details */}
client/src/pages/Account.tsx:1040:                <div className="rounded-md border p-4">
client/src/pages/Account.tsx:1041:                  <h3 className="font-medium mb-2 text-lg">Current Subscription</h3>
client/src/pages/Account.tsx:1042:                  <div className="grid grid-cols-2 gap-y-3 text-sm">
client/src/pages/Account.tsx:1043:                    <div>
client/src/pages/Account.tsx:1044:                      <p className="text-muted-foreground">Plan</p>
client/src/pages/Account.tsx:1045:                      <p className="font-medium">{getPlanName(user.subscriptionPlan)}</p>
client/src/pages/Account.tsx:1046:                    </div>
client/src/pages/Account.tsx:1047:                    <div>
client/src/pages/Account.tsx:1048:                      <p className="text-muted-foreground">Status</p>
client/src/pages/Account.tsx:1049:                      <p className="font-medium flex items-center">
client/src/pages/Account.tsx:1050:                        {user.subscriptionStatus === 'active' && (
client/src/pages/Account.tsx:1051:                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
client/src/pages/Account.tsx:1052:                        )}
client/src/pages/Account.tsx:1053:                        {user.subscriptionStatus ? user.subscriptionStatus.replace('_', ' ') : 'Free'}
client/src/pages/Account.tsx:1054:                      </p>
client/src/pages/Account.tsx:1055:                    </div>
client/src/pages/Account.tsx:1056:                    <div>
client/src/pages/Account.tsx:1057:                      <p className="text-muted-foreground">Billing Cycle</p>
client/src/pages/Account.tsx:1058:                      <p className="font-medium">
client/src/pages/Account.tsx:1059:                        {user.subscriptionCycle === 'monthly' && 'Monthly'}
client/src/pages/Account.tsx:1060:                        {user.subscriptionCycle === 'quarterly' && 'Quarterly'}
client/src/pages/Account.tsx:1061:                        {user.subscriptionCycle === 'annual' && 'Annual'}
client/src/pages/Account.tsx:1062:                        {!user.subscriptionCycle && 'N/A'}
client/src/pages/Account.tsx:1063:                      </p>
client/src/pages/Account.tsx:1064:                    </div>
client/src/pages/Account.tsx:1065:                    <div>
client/src/pages/Account.tsx:1066:                      <p className="text-muted-foreground">Next Billing Date</p>
client/src/pages/Account.tsx:1067:                      <p className="font-medium">{formatDate(user.subscriptionExpiresAt)}</p>
client/src/pages/Account.tsx:1068:                    </div>
client/src/pages/Account.tsx:1069:                  </div>
client/src/pages/Account.tsx:1070:                </div>
client/src/pages/Account.tsx:1071:
client/src/pages/Account.tsx:1072:                {/* Plan Actions */}
client/src/pages/Account.tsx:1073:                <div className="space-y-3">
client/src/pages/Account.tsx:1074:                  <h3 className="font-medium text-lg">Plan Actions</h3>
client/src/pages/Account.tsx:1075:                  <div className="flex flex-col gap-3">
client/src/pages/Account.tsx:1076:                    {user.subscriptionPlan === 'free' ? (
client/src/pages/Account.tsx:1077:                      <Button 
client/src/pages/Account.tsx:1078:                        variant="default" 
client/src/pages/Account.tsx:1079:                        onClick={() => {
client/src/pages/Account.tsx:1080:                          setIsManagingSubscription(false);
client/src/pages/Account.tsx:1081:                          setIsUpgradingPlan(true);
client/src/pages/Account.tsx:1082:                        }}
client/src/pages/Account.tsx:1083:                      >
client/src/pages/Account.tsx:1084:                        Upgrade to Pro
client/src/pages/Account.tsx:1085:                      </Button>
client/src/pages/Account.tsx:1086:                    ) : (
client/src/pages/Account.tsx:1087:                      <Button 
client/src/pages/Account.tsx:1088:                        variant="destructive" 
client/src/pages/Account.tsx:1089:                        onClick={() => {
client/src/pages/Account.tsx:1090:                          setIsManagingSubscription(false);
client/src/pages/Account.tsx:1091:                          setIsCancellingSubscription(true);
client/src/pages/Account.tsx:1092:                        }}
client/src/pages/Account.tsx:1093:                      >
client/src/pages/Account.tsx:1094:                        Cancel Subscription
client/src/pages/Account.tsx:1095:                      </Button>
client/src/pages/Account.tsx:1096:                    )}
client/src/pages/Account.tsx:1097:                  </div>
client/src/pages/Account.tsx:1098:                </div>
client/src/pages/Account.tsx:1099:              </div>
client/src/pages/Account.tsx:1100:            </DialogContent>
client/src/pages/Account.tsx:1101:          </Dialog>
client/src/pages/Account.tsx:1102:
client/src/pages/Account.tsx:1103:          {/* Cancel Subscription Confirmation Dialog */}
client/src/pages/Account.tsx:1104:          <Dialog open={isCancellingSubscription} onOpenChange={setIsCancellingSubscription}>
client/src/pages/Account.tsx:1105:            <DialogContent className="sm:max-w-[400px]">
client/src/pages/Account.tsx:1106:              <DialogHeader>
client/src/pages/Account.tsx:1107:                <DialogTitle>Cancel Subscription</DialogTitle>
client/src/pages/Account.tsx:1108:                <DialogDescription>
client/src/pages/Account.tsx:1109:                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
client/src/pages/Account.tsx:1110:                </DialogDescription>
client/src/pages/Account.tsx:1111:              </DialogHeader>
client/src/pages/Account.tsx:1112:              <div className="flex justify-end space-x-2 pt-4">
client/src/pages/Account.tsx:1113:                <Button variant="outline" onClick={() => setIsCancellingSubscription(false)}>
client/src/pages/Account.tsx:1114:                  Keep Subscription
client/src/pages/Account.tsx:1115:                </Button>
client/src/pages/Account.tsx:1116:                <Button variant="destructive" onClick={cancelSubscription}>
client/src/pages/Account.tsx:1117:                  Yes, Cancel
client/src/pages/Account.tsx:1118:                </Button>
client/src/pages/Account.tsx:1119:              </div>
client/src/pages/Account.tsx:1120:            </DialogContent>
client/src/pages/Account.tsx:1121:          </Dialog>
client/src/pages/Account.tsx:1122:        </TabsContent>
client/src/pages/Account.tsx:1123:
client/src/pages/Account.tsx:1124:        <TabsContent value="security" className="space-y-6">
client/src/pages/Account.tsx:1125:          <Card>
client/src/pages/Account.tsx:1126:            <CardHeader>
client/src/pages/Account.tsx:1127:              <CardTitle>Email Verification</CardTitle>
client/src/pages/Account.tsx:1128:              <CardDescription>
client/src/pages/Account.tsx:1129:                Verify and manage your email address to secure your account.
client/src/pages/Account.tsx:1130:              </CardDescription>
client/src/pages/Account.tsx:1131:            </CardHeader>
client/src/pages/Account.tsx:1132:            <CardContent className="space-y-6">
client/src/pages/Account.tsx:1133:              <div>
client/src/pages/Account.tsx:1134:                <h3 className="font-medium">Current Email</h3>
client/src/pages/Account.tsx:1135:                <div className="flex items-center space-x-2 mt-1">
client/src/pages/Account.tsx:1136:                  <p>{user.email}</p>
client/src/pages/Account.tsx:1137:                  {user.emailVerified ? (
client/src/pages/Account.tsx:1138:                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
client/src/pages/Account.tsx:1139:                      <CheckCircle2 className="mr-1 h-3 w-3" />
client/src/pages/Account.tsx:1140:                      Verified
client/src/pages/Account.tsx:1141:                    </span>
client/src/pages/Account.tsx:1142:                  ) : (
client/src/pages/Account.tsx:1143:                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
client/src/pages/Account.tsx:1144:                      Not Verified
client/src/pages/Account.tsx:1145:                    </span>
client/src/pages/Account.tsx:1146:                  )}
client/src/pages/Account.tsx:1147:                </div>
client/src/pages/Account.tsx:1148:
client/src/pages/Account.tsx:1149:                {user.pendingEmail && (
client/src/pages/Account.tsx:1150:                  <div className="mt-2">
client/src/pages/Account.tsx:1151:                    <p className="text-sm text-muted-foreground">
client/src/pages/Account.tsx:1152:                      Verification email sent to <span className="font-medium">{user.pendingEmail}</span>.
client/src/pages/Account.tsx:1153:                      Please check your inbox to complete the change.
client/src/pages/Account.tsx:1154:                    </p>
client/src/pages/Account.tsx:1155:                    <div className="mt-3">
client/src/pages/Account.tsx:1156:                      <Button variant="outline" size="sm" onClick={() => setIsChangingEmail(true)}>
client/src/pages/Account.tsx:1157:                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
client/src/pages/Account.tsx:1158:                        Try Again
client/src/pages/Account.tsx:1159:                      </Button>
client/src/pages/Account.tsx:1160:                    </div>
client/src/pages/Account.tsx:1161:                  </div>
client/src/pages/Account.tsx:1162:                )}
client/src/pages/Account.tsx:1163:              </div>
client/src/pages/Account.tsx:1164:
client/src/pages/Account.tsx:1165:              <div className="flex flex-wrap space-x-2">
client/src/pages/Account.tsx:1166:                {!user.pendingEmail && (
client/src/pages/Account.tsx:1167:                  <Button variant="outline" onClick={() => setIsChangingEmail(true)}>
client/src/pages/Account.tsx:1168:                    Change Email
client/src/pages/Account.tsx:1169:                  </Button>
client/src/pages/Account.tsx:1170:                )}
client/src/pages/Account.tsx:1171:
client/src/pages/Account.tsx:1172:                {!user.emailVerified && !user.pendingEmail && (
client/src/pages/Account.tsx:1173:                  <Button variant="default">
client/src/pages/Account.tsx:1174:                    Resend Verification
client/src/pages/Account.tsx:1175:                  </Button>
client/src/pages/Account.tsx:1176:                )}
client/src/pages/Account.tsx:1177:              </div>
client/src/pages/Account.tsx:1178:            </CardContent>
client/src/pages/Account.tsx:1179:          </Card>
client/src/pages/Account.tsx:1180:
client/src/pages/Account.tsx:1181:          <Card>
client/src/pages/Account.tsx:1182:            <CardHeader>
client/src/pages/Account.tsx:1183:              <CardTitle>Password</CardTitle>
client/src/pages/Account.tsx:1184:              <CardDescription>
client/src/pages/Account.tsx:1185:                Update your password to keep your account secure.
client/src/pages/Account.tsx:1186:              </CardDescription>
client/src/pages/Account.tsx:1187:            </CardHeader>
client/src/pages/Account.tsx:1188:            <CardContent>
client/src/pages/Account.tsx:1189:              <div className="space-y-4">
client/src/pages/Account.tsx:1190:                <div className="flex items-center justify-between">
client/src/pages/Account.tsx:1191:                  <span className="text-sm text-muted-foreground">Current Password</span>
client/src/pages/Account.tsx:1192:                  <div className="flex items-center">
client/src/pages/Account.tsx:1193:                    <span className="mr-3 tracking-widest text-muted-foreground">
client/src/pages/Account.tsx:1194:                      {user.passwordLength ? '•'.repeat(user.passwordLength) : '••••••••'}
client/src/pages/Account.tsx:1195:                    </span>
client/src/pages/Account.tsx:1196:                    <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
client/src/pages/Account.tsx:1197:                      Change Password
client/src/pages/Account.tsx:1198:                    </Button>
client/src/pages/Account.tsx:1199:                  </div>
client/src/pages/Account.tsx:1200:                </div>
client/src/pages/Account.tsx:1201:                <div className="text-xs text-muted-foreground">
client/src/pages/Account.tsx:1202:                  <p>Password last changed: {user.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : 'Not available'}</p>
client/src/pages/Account.tsx:1203:                </div>
client/src/pages/Account.tsx:1204:              </div>
client/src/pages/Account.tsx:1205:            </CardContent>
client/src/pages/Account.tsx:1206:          </Card>
client/src/pages/Account.tsx:1207:
client/src/pages/Account.tsx:1208:          <Card>
client/src/pages/Account.tsx:1209:            <CardHeader>
client/src/pages/Account.tsx:1210:              <CardTitle>Sign Out</CardTitle>
client/src/pages/Account.tsx:1211:              <CardDescription>
client/src/pages/Account.tsx:1212:                Sign out of your account on this device.
client/src/pages/Account.tsx:1213:              </CardDescription>
client/src/pages/Account.tsx:1214:            </CardHeader>
client/src/pages/Account.tsx:1215:            <CardContent>
client/src/pages/Account.tsx:1216:              <Button variant="outline" onClick={handleLogout}>
client/src/pages/Account.tsx:1217:                Sign Out
client/src/pages/Account.tsx:1218:              </Button>
client/src/pages/Account.tsx:1219:            </CardContent>
client/src/pages/Account.tsx:1220:          </Card>
client/src/pages/Account.tsx:1221:        </TabsContent>
client/src/pages/Account.tsx:1222:      </Tabs>
client/src/pages/Account.tsx:1223:
client/src/pages/Account.tsx:1224:    {/* Password Change Dialog */}
client/src/pages/Account.tsx:1225:    <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
client/src/pages/Account.tsx:1226:      <DialogContent className="sm:max-w-[450px]">
client/src/pages/Account.tsx:1227:        <DialogHeader>
client/src/pages/Account.tsx:1228:          <DialogTitle>Change Password</DialogTitle>
client/src/pages/Account.tsx:1229:          <DialogDescription>
client/src/pages/Account.tsx:1230:            Enter your current password and choose a new secure password.
client/src/pages/Account.tsx:1231:          </DialogDescription>
client/src/pages/Account.tsx:1232:        </DialogHeader>
client/src/pages/Account.tsx:1233:
client/src/pages/Account.tsx:1234:        <PasswordChangeForm 
client/src/pages/Account.tsx:1235:          isPending={changePasswordMutation.isPending}
client/src/pages/Account.tsx:1236:          onSubmit={(data) => {
client/src/pages/Account.tsx:1237:            changePasswordMutation.mutate(
client/src/pages/Account.tsx:1238:              { 
client/src/pages/Account.tsx:1239:                currentPassword: data.currentPassword,
client/src/pages/Account.tsx:1240:                newPassword: data.newPassword
client/src/pages/Account.tsx:1241:              },
client/src/pages/Account.tsx:1242:              {
client/src/pages/Account.tsx:1243:                onSuccess: () => {
client/src/pages/Account.tsx:1244:                  toast({
client/src/pages/Account.tsx:1245:                    title: "Password Changed",
client/src/pages/Account.tsx:1246:                    description: "Your password has been updated successfully.",
client/src/pages/Account.tsx:1247:                    variant: "default",
client/src/pages/Account.tsx:1248:                  });
client/src/pages/Account.tsx:1249:                  setIsChangingPassword(false);
client/src/pages/Account.tsx:1250:                },
client/src/pages/Account.tsx:1251:                onError: (error: any) => {
client/src/pages/Account.tsx:1252:                  toast({
client/src/pages/Account.tsx:1253:                    title: "Failed to change password",
client/src/pages/Account.tsx:1254:                    description: error.message || "An error occurred. Please check your current password and try again.",
client/src/pages/Account.tsx:1255:                    variant: "destructive",
client/src/pages/Account.tsx:1256:                  });
client/src/pages/Account.tsx:1257:                }
client/src/pages/Account.tsx:1258:              }
client/src/pages/Account.tsx:1259:            );
client/src/pages/Account.tsx:1260:          }}
client/src/pages/Account.tsx:1261:        />
client/src/pages/Account.tsx:1262:      </DialogContent>
client/src/pages/Account.tsx:1263:    </Dialog>
client/src/pages/Account.tsx:1264:
client/src/pages/Account.tsx:1265:    {/* Email Change Dialog */}
client/src/pages/Account.tsx:1266:    <Dialog open={isChangingEmail} onOpenChange={setIsChangingEmail}>
client/src/pages/Account.tsx:1267:      <DialogContent className="sm:max-w-[450px]">
client/src/pages/Account.tsx:1268:        <DialogHeader>
client/src/pages/Account.tsx:1269:          <DialogTitle>Change Email Address</DialogTitle>
client/src/pages/Account.tsx:1270:          <DialogDescription>
client/src/pages/Account.tsx:1271:            Enter your new email address and current password to verify your identity.
client/src/pages/Account.tsx:1272:            You will need to verify your new email before the change takes effect.
client/src/pages/Account.tsx:1273:          </DialogDescription>
client/src/pages/Account.tsx:1274:        </DialogHeader>
client/src/pages/Account.tsx:1275:
client/src/pages/Account.tsx:1276:        {changeEmailMutation.isPending ? (
client/src/pages/Account.tsx:1277:          <div className="py-8 flex items-center justify-center flex-col">
client/src/pages/Account.tsx:1278:            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
client/src/pages/Account.tsx:1279:            <p className="mt-4 text-sm text-muted-foreground">Processing your request...</p>
client/src/pages/Account.tsx:1280:          </div>
client/src/pages/Account.tsx:1281:        ) : (
client/src/pages/Account.tsx:1282:          <EmailChangeForm 
client/src/pages/Account.tsx:1283:            currentEmail={user.email} 
client/src/pages/Account.tsx:1284:            onSubmit={(data) => {
client/src/pages/Account.tsx:1285:              changeEmailMutation.mutate(data, {
client/src/pages/Account.tsx:1286:                onSuccess: () => {
client/src/pages/Account.tsx:1287:                  toast({
client/src/pages/Account.tsx:1288:                    title: "Verification email sent",
client/src/pages/Account.tsx:1289:                    description: "Please check your inbox to complete the email change.",
client/src/pages/Account.tsx:1290:                    variant: "default",
client/src/pages/Account.tsx:1291:                  });
client/src/pages/Account.tsx:1292:                  setIsChangingEmail(false);
client/src/pages/Account.tsx:1293:                },
client/src/pages/Account.tsx:1294:                onError: (error: any) => {
client/src/pages/Account.tsx:1295:                  toast({
client/src/pages/Account.tsx:1296:                    title: "Failed to send verification",
client/src/pages/Account.tsx:1297:                    description: error.message || "An error occurred while processing your request.",
client/src/pages/Account.tsx:1298:                    variant: "destructive",
client/src/pages/Account.tsx:1299:                  });
client/src/pages/Account.tsx:1300:                }
client/src/pages/Account.tsx:1301:              });
client/src/pages/Account.tsx:1302:            }}
client/src/pages/Account.tsx:1303:          />
client/src/pages/Account.tsx:1304:        )}
client/src/pages/Account.tsx:1305:      </DialogContent>
client/src/pages/Account.tsx:1306:    </Dialog>
client/src/pages/Account.tsx:1307:
client/src/pages/Account.tsx:1308:    {/* Upgrade Plan Dialog for Free Users */}
client/src/pages/Account.tsx:1309:    <Dialog open={isUpgradingPlan} onOpenChange={setIsUpgradingPlan}>
client/src/pages/Account.tsx:1310:      <DialogContent className="sm:max-w-[500px]">
client/src/pages/Account.tsx:1311:        <DialogHeader>
client/src/pages/Account.tsx:1312:          <DialogTitle>Upgrade to Pro</DialogTitle>
client/src/pages/Account.tsx:1313:          <DialogDescription>
client/src/pages/Account.tsx:1314:            Unlock all premium features to accelerate your career growth.
client/src/pages/Account.tsx:1315:          </DialogDescription>
client/src/pages/Account.tsx:1316:        </DialogHeader>
client/src/pages/Account.tsx:1317:        <div className="py-6">
client/src/pages/Account.tsx:1318:          <div className="rounded-xl bg-primary/5 p-5 border border-primary/20 mb-6">
client/src/pages/Account.tsx:1319:            <h3 className="font-semibold text-lg mb-3 flex items-center">
client/src/pages/Account.tsx:1320:              <Sparkles className="h-5 w-5 mr-2 text-primary" />
client/src/pages/Account.tsx:1321:              Pro Plan Benefits
client/src/pages/Account.tsx:1322:            </h3>
client/src/pages/Account.tsx:1323:            <ul className="space-y-3">
client/src/pages/Account.tsx:1324:              <li className="flex items-start">
client/src/pages/Account.tsx:1325:                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
client/src/pages/Account.tsx:1326:                <div>
client/src/pages/Account.tsx:1327:                  <span className="font-medium">Advanced Resume Builder</span>
client/src/pages/Account.tsx:1328:                  <p className="text-sm text-muted-foreground">Create unlimited professional resumes with AI enhancement</p>
client/src/pages/Account.tsx:1329:                </div>
client/src/pages/Account.tsx:1330:              </li>
client/src/pages/Account.tsx:1331:              <li className="flex items-start">
client/src/pages/Account.tsx:1332:                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
client/src/pages/Account.tsx:1333:                <div>
client/src/pages/Account.tsx:1334:                  <span className="font-medium">Unlimited Interview Practice</span>
client/src/pages/Account.tsx:1335:                  <p className="text-sm text-muted-foreground">Practice with unlimited AI-generated questions and feedback</p>
client/src/pages/Account.tsx:1336:                </div>
client/src/pages/Account.tsx:1337:              </li>
client/src/pages/Account.tsx:1338:              <li className="flex items-start">
client/src/pages/Account.tsx:1339:                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
client/src/pages/Account.tsx:1340:                <div>
client/src/pages/Account.tsx:1341:                  <span className="font-medium">AI Career Coach</span>
client/src/pages/Account.tsx:1342:                  <p className="text-sm text-muted-foreground">Get personalized career advice whenever you need it</p>
client/src/pages/Account.tsx:1343:                </div>
client/src/pages/Account.tsx:1344:              </li>
client/src/pages/Account.tsx:1345:              <li className="flex items-start">
client/src/pages/Account.tsx:1346:                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
client/src/pages/Account.tsx:1347:                <div>
client/src/pages/Account.tsx:1348:                  <span className="font-medium">Cover Letter Generator</span>
client/src/pages/Account.tsx:1349:                  <p className="text-sm text-muted-foreground">Create tailored cover letters for every application</p>
client/src/pages/Account.tsx:1350:                </div>
client/src/pages/Account.tsx:1351:              </li>
client/src/pages/Account.tsx:1352:            </ul>
client/src/pages/Account.tsx:1353:          </div>
client/src/pages/Account.tsx:1354:
client/src/pages/Account.tsx:1355:          {/* Billing cycle tabs */}
client/src/pages/Account.tsx:1356:          <div className="mb-6">
client/src/pages/Account.tsx:1357:            <Tabs defaultValue="monthly" className="w-full" onValueChange={(value) => setBillingCycle(value as 'monthly' | 'quarterly' | 'annual')}>
client/src/pages/Account.tsx:1358:              <TabsList className="grid w-full grid-cols-3">
client/src/pages/Account.tsx:1359:                <TabsTrigger value="monthly">Monthly</TabsTrigger>
client/src/pages/Account.tsx:1360:                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
client/src/pages/Account.tsx:1361:                <TabsTrigger value="annual">Annual</TabsTrigger>
client/src/pages/Account.tsx:1362:              </TabsList>
client/src/pages/Account.tsx:1363:              <TabsContent value="monthly" className="pt-4">
client/src/pages/Account.tsx:1364:                <div className="flex justify-between items-center">
client/src/pages/Account.tsx:1365:                  <div>
client/src/pages/Account.tsx:1366:                    <p className="text-lg font-semibold">$15.00 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
client/src/pages/Account.tsx:1367:                    <p className="text-sm text-muted-foreground">Cancel anytime</p>
client/src/pages/Account.tsx:1368:                  </div>
client/src/pages/Account.tsx:1369:                  <div className="space-x-2">
client/src/pages/Account.tsx:1370:                    <Button variant="outline" onClick={() => setIsUpgradingPlan(false)}>Cancel</Button>
client/src/pages/Account.tsx:1371:                    <Button onClick={() => upgradeSubscription('monthly')}>Upgrade Now</Button>
client/src/pages/Account.tsx:1372:                  </div>
client/src/pages/Account.tsx:1373:                </div>
client/src/pages/Account.tsx:1374:              </TabsContent>
client/src/pages/Account.tsx:1375:              <TabsContent value="quarterly" className="pt-4">
client/src/pages/Account.tsx:1376:                <div className="flex justify-between items-center">
client/src/pages/Account.tsx:1377:                  <div>
client/src/pages/Account.tsx:1378:                    <div className="flex items-center">
client/src/pages/Account.tsx:1379:                      <p className="text-lg font-semibold">$30.00 <span className="text-sm font-normal text-muted-foreground">/ 3 months</span></p>
client/src/pages/Account.tsx:1380:                      <span className="ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5">Save $15</span>
client/src/pages/Account.tsx:1381:                    </div>
client/src/pages/Account.tsx:1382:                    <p className="text-sm text-muted-foreground">$10.00 per month, billed quarterly</p>
client/src/pages/Account.tsx:1383:                  </div>
client/src/pages/Account.tsx:1384:                  <div className="space-x-2">
client/src/pages/Account.tsx:1385:                    <Button variant="outline" onClick={() => setIsUpgradingPlan(false)}>Cancel</Button>
client/src/pages/Account.tsx:1386:                    <Button onClick={() => upgradeSubscription('quarterly')}>Upgrade Now</Button>
client/src/pages/Account.tsx:1387:                  </div>
client/src/pages/Account.tsx:1388:                </div>
client/src/pages/Account.tsx:1389:              </TabsContent>
client/src/pages/Account.tsx:1390:              <TabsContent value="annual" className="pt-4">
client/src/pages/Account.tsx:1391:                <div className="flex justify-between items-center">
client/src/pages/Account.tsx:1392:                  <div>
client/src/pages/Account.tsx:1393:                    <div className="flex items-center">
client/src/pages/Account.tsx:1394:                      <p className="text-lg font-semibold">$72.00 <span className="text-sm font-normal text-muted-foreground">/ year</span></p>
client/src/pages/Account.tsx:1395:                      <span className="ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5">Save $108</span>
client/src/pages/Account.tsx:1396:                    </div>
client/src/pages/Account.tsx:1397:                    <p className="text-sm text-muted-foreground">$6.00 per month, billed annually</p>
client/src/pages/Account.tsx:1398:                  </div>
client/src/pages/Account.tsx:1399:                  <div className="space-x-2">
client/src/pages/Account.tsx:1400:                    <Button variant="outline" onClick={() => setIsUpgradingPlan(false)}>Cancel</Button>
client/src/pages/Account.tsx:1401:                    <Button onClick={() => upgradeSubscription('annual')}>Upgrade Now</Button>
client/src/pages/Account.tsx:1402:                  </div>
client/src/pages/Account.tsx:1403:                </div>
client/src/pages/Account.tsx:1404:              </TabsContent>
client/src/pages/Account.tsx:1405:            </Tabs>
client/src/pages/Account.tsx:1406:          </div>
client/src/pages/Account.tsx:1407:        </div>
client/src/pages/Account.tsx:1408:      </DialogContent>
client/src/pages/Account.tsx:1409:    </Dialog>
client/src/pages/Account.tsx:1410:
client/src/pages/Account.tsx:1411:    {/* Payment Methods Management Dialog */}
client/src/pages/Account.tsx:1412:    <Dialog open={isManagingPaymentMethods} onOpenChange={setIsManagingPaymentMethods}>
client/src/pages/Account.tsx:1413:      <DialogContent className="sm:max-w-[500px]">
client/src/pages/Account.tsx:1414:        <DialogHeader>
client/src/pages/Account.tsx:1415:          <DialogTitle>Payment Methods</DialogTitle>
client/src/pages/Account.tsx:1416:          <DialogDescription>
client/src/pages/Account.tsx:1417:            Manage your payment methods for subscription billing.
client/src/pages/Account.tsx:1418:          </DialogDescription>
client/src/pages/Account.tsx:1419:        </DialogHeader>
client/src/pages/Account.tsx:1420:
client/src/pages/Account.tsx:1421:        {!setupIntentClientSecret ? (
client/src/pages/Account.tsx:1422:          <div className="py-6 space-y-4">
client/src/pages/Account.tsx:1423:            {/* Current Payment Method */}
client/src/pages/Account.tsx:1424:            {paymentMethodInfo ? (
client/src/pages/Account.tsx:1425:              <div className="rounded-md border p-4">
client/src/pages/Account.tsx:1426:                <h3 className="font-medium mb-3">Current Payment Method</h3>
client/src/pages/Account.tsx:1427:                <div className="flex items-center">
client/src/pages/Account.tsx:1428:                  <div className="p-3 bg-muted rounded-md mr-4">
client/src/pages/Account.tsx:1429:                    <CreditCardIcon className="h-6 w-6" />
client/src/pages/Account.tsx:1430:                  </div>
client/src/pages/Account.tsx:1431:                  <div>
client/src/pages/Account.tsx:1432:                    <p className="font-medium capitalize">{paymentMethodInfo.brand} •••• {paymentMethodInfo.last4}</p>
client/src/pages/Account.tsx:1433:                    <p className="text-sm text-muted-foreground">
client/src/pages/Account.tsx:1434:                      Expires {paymentMethodInfo.exp_month}/{paymentMethodInfo.exp_year}
client/src/pages/Account.tsx:1435:                    </p>
client/src/pages/Account.tsx:1436:                  </div>
client/src/pages/Account.tsx:1437:                </div>
client/src/pages/Account.tsx:1438:              </div>
client/src/pages/Account.tsx:1439:            ) : (
client/src/pages/Account.tsx:1440:              <div className="rounded-md border p-4 text-center py-8">
client/src/pages/Account.tsx:1441:                <p className="text-muted-foreground mb-2">No payment methods found</p>
client/src/pages/Account.tsx:1442:                <p className="text-sm text-muted-foreground">Add a payment method to manage your subscription</p>
client/src/pages/Account.tsx:1443:              </div>
client/src/pages/Account.tsx:1444:            )}
client/src/pages/Account.tsx:1445:
client/src/pages/Account.tsx:1446:            <div className="flex justify-end">
client/src/pages/Account.tsx:1447:              <Button 
client/src/pages/Account.tsx:1448:                onClick={initializePaymentMethodsUpdate}
client/src/pages/Account.tsx:1449:                disabled={isLoading}
client/src/pages/Account.tsx:1450:              >
client/src/pages/Account.tsx:1451:                {isLoading ? (
client/src/pages/Account.tsx:1452:                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
client/src/pages/Account.tsx:1453:                ) : (
client/src/pages/Account.tsx:1454:                  <>{paymentMethodInfo ? 'Update Payment Method' : 'Add Payment Method'}</>
client/src/pages/Account.tsx:1455:                )}
client/src/pages/Account.tsx:1456:              </Button>
client/src/pages/Account.tsx:1457:            </div>
client/src/pages/Account.tsx:1458:          </div>
client/src/pages/Account.tsx:1459:        ) : (
client/src/pages/Account.tsx:1460:          <div className="py-6">
client/src/pages/Account.tsx:1461:            <Elements stripe={stripePromise} options={{ clientSecret: setupIntentClientSecret }}>
client/src/pages/Account.tsx:1462:              <PaymentMethodForm 
client/src/pages/Account.tsx:1463:                onSuccess={() => {
client/src/pages/Account.tsx:1464:                  setIsManagingPaymentMethods(false);
client/src/pages/Account.tsx:1465:                  setSetupIntentClientSecret(null);
client/src/pages/Account.tsx:1466:                  fetchPaymentMethodInfo();
client/src/pages/Account.tsx:1467:                  toast({
client/src/pages/Account.tsx:1468:                    title: "Payment method updated",
client/src/pages/Account.tsx:1469:                    description: "Your payment method has been updated successfully.",
client/src/pages/Account.tsx:1470:                    variant: "default",
client/src/pages/Account.tsx:1471:                  });
client/src/pages/Account.tsx:1472:                }}
client/src/pages/Account.tsx:1473:                onCancel={() => {
client/src/pages/Account.tsx:1474:                  setSetupIntentClientSecret(null);
client/src/pages/Account.tsx:1475:                }}
client/src/pages/Account.tsx:1476:              />
client/src/pages/Account.tsx:1477:            </Elements>
client/src/pages/Account.tsx:1478:          </div>
client/src/pages/Account.tsx:1479:        )}
client/src/pages/Account.tsx:1480:      </DialogContent>
client/src/pages/Account.tsx:1481:    </Dialog>
client/src/pages/Account.tsx:1482:  </div>
client/src/pages/Account.tsx:1483:  );
client/src/pages/Account.tsx:1484:}
