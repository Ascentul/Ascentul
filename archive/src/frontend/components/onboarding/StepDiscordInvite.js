import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
const StepDiscordInvite = ({ onNext, onSkip }) => {
    const handleJoinDiscord = () => {
        // First open Discord in new tab
        window.open("https://discord.gg/xJSSYxWt", "_blank");
        // Then immediately continue to next step (plan selection)
        onNext();
    };
    return (_jsx(motion.div, { className: "max-w-xl mx-auto text-center space-y-6", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, children: _jsxs("div", { className: "py-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "You're not building alone." }), _jsx("p", { className: "text-muted-foreground mb-8", children: "Join the Ascentul Discord to connect with other driven professionals, get support, share wins, and grow alongside a high-agency community." }), _jsx(Button, { onClick: handleJoinDiscord, className: "w-full bg-[#1333c2] hover:bg-[#0f2aae] text-white font-semibold py-6 px-6 rounded-md", size: "lg", children: "Join the Ascentul Discord" }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: onSkip, className: "text-sm text-muted-foreground hover:text-foreground", children: "Not now, skip this step" }) })] }) }));
};
export default StepDiscordInvite;
