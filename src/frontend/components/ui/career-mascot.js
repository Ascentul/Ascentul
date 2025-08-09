import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
export function CareerMascot({ action, className = '', size = 'md' }) {
    // Calculate size in pixels based on prop
    const sizeMap = {
        sm: 64,
        md: 96,
        lg: 128
    };
    const pixelSize = sizeMap[size];
    // Get the appropriate compass mascot image based on the action
    const getMascotImage = () => {
        switch (action) {
            case 'loading':
                return (_jsxs("svg", { width: pixelSize, height: pixelSize, viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, children: [_jsx("circle", { cx: "50", cy: "50", r: "45", stroke: "#0C29AB", strokeWidth: "6", fill: "none" }), _jsx("path", { d: "M50 5 L50 15", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M50 85 L50 95", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M5 50 L15 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M85 50 L95 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("circle", { cx: "50", cy: "50", r: "3", fill: "#0C29AB" }), _jsx(motion.path, { d: "M50 30 L50 70", stroke: "#0C29AB", strokeWidth: "4", strokeLinecap: "round", fill: "none", animate: { rotate: 360 }, transition: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }, style: { transformOrigin: "50px 50px" } }), _jsx(motion.path, { d: "M40 40 L50 25 L60 40 Z", fill: "#0C29AB", animate: { rotate: 360 }, transition: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }, style: { transformOrigin: "50px 50px" } })] }));
            case 'thinking':
                return (_jsxs("svg", { width: pixelSize, height: pixelSize, viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, children: [_jsx("circle", { cx: "50", cy: "50", r: "45", stroke: "#0C29AB", strokeWidth: "6", fill: "none" }), _jsx("path", { d: "M50 5 L50 15", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M50 85 L50 95", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M5 50 L15 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M85 50 L95 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("circle", { cx: "50", cy: "50", r: "3", fill: "#0C29AB" }), _jsx(motion.path, { d: "M50 30 L50 70", stroke: "#0C29AB", strokeWidth: "4", strokeLinecap: "round", fill: "none", animate: { rotate: [-30, 30, -30] }, transition: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }, style: { transformOrigin: "50px 50px" } }), _jsx(motion.path, { d: "M40 40 L50 25 L60 40 Z", fill: "#0C29AB", animate: { rotate: [-30, 30, -30] }, transition: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }, style: { transformOrigin: "50px 50px" } }), _jsx(motion.path, { d: "M75 25 Q 85 20 80 15", stroke: "#0C29AB", strokeWidth: "2", strokeDasharray: "4 2", fill: "none", initial: { opacity: 0 }, animate: {
                                opacity: [0, 1, 0],
                                scale: [0.8, 1, 0.8]
                            }, transition: {
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop",
                                times: [0, 0.5, 1]
                            } })] }));
            case 'success':
                return (_jsxs("svg", { width: pixelSize, height: pixelSize, viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, children: [_jsx("circle", { cx: "50", cy: "50", r: "45", stroke: "#0C29AB", strokeWidth: "6", fill: "none" }), _jsx("path", { d: "M50 5 L50 15", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M50 85 L50 95", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M5 50 L15 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M85 50 L95 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("circle", { cx: "50", cy: "50", r: "3", fill: "#0C29AB" }), _jsx(motion.path, { d: "M50 30 L50 70", stroke: "#0C29AB", strokeWidth: "4", strokeLinecap: "round", fill: "none", initial: { rotate: 180 }, animate: { rotate: 0 }, transition: {
                                duration: 0.8,
                                type: "spring",
                                stiffness: 100
                            }, style: { transformOrigin: "50px 50px" } }), _jsx(motion.path, { d: "M40 40 L50 25 L60 40 Z", fill: "#0C29AB", initial: { rotate: 180 }, animate: { rotate: 0 }, transition: {
                                duration: 0.8,
                                type: "spring",
                                stiffness: 100
                            }, style: { transformOrigin: "50px 50px" } }), _jsx(motion.path, { d: "M65 30 L 75 20 L 70 30 L 80 25", stroke: "#FFD700", strokeWidth: "3", strokeLinecap: "round", initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, transition: {
                                delay: 0.5,
                                duration: 0.3
                            } })] }));
            case 'achievement':
                return (_jsxs("svg", { width: pixelSize, height: pixelSize, viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, children: [_jsx("circle", { cx: "50", cy: "50", r: "45", stroke: "#0C29AB", strokeWidth: "6", fill: "none" }), _jsx("path", { d: "M50 5 L50 15", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M50 85 L50 95", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M5 50 L15 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M85 50 L95 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("circle", { cx: "50", cy: "50", r: "3", fill: "#0C29AB" }), _jsx("path", { d: "M50 30 L50 70", stroke: "#0C29AB", strokeWidth: "4", strokeLinecap: "round", fill: "none" }), _jsx("path", { d: "M40 40 L50 25 L60 40 Z", fill: "#0C29AB" }), _jsxs(motion.g, { initial: { scale: 0 }, animate: { scale: 1 }, transition: {
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.3
                            }, children: [_jsx("circle", { cx: "75", cy: "25", r: "12", fill: "#FFD700", stroke: "#0C29AB", strokeWidth: "2" }), _jsx("path", { d: "M70 25 L 80 25 M 75 20 L 75 30", stroke: "#0C29AB", strokeWidth: "2", strokeLinecap: "round" })] }), _jsx(motion.path, { d: "M20 20 L 25 25 M 80 80 L 75 75 M 20 80 L 25 75", stroke: "#FFD700", strokeWidth: "2", strokeLinecap: "round", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.6, duration: 0.4 } })] }));
            default:
                return (_jsxs("svg", { width: pixelSize, height: pixelSize, viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, children: [_jsx("circle", { cx: "50", cy: "50", r: "45", stroke: "#0C29AB", strokeWidth: "6", fill: "none" }), _jsx("path", { d: "M50 5 L50 15", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M50 85 L50 95", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M5 50 L15 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("path", { d: "M85 50 L95 50", stroke: "#0C29AB", strokeWidth: "6", strokeLinecap: "round" }), _jsx("circle", { cx: "50", cy: "50", r: "3", fill: "#0C29AB" }), _jsx("path", { d: "M50 30 L50 70", stroke: "#0C29AB", strokeWidth: "4", strokeLinecap: "round" }), _jsx("path", { d: "M40 40 L50 25 L60 40 Z", fill: "#0C29AB" })] }));
        }
    };
    return (_jsx("div", { className: `flex items-center justify-center ${className}`, children: _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.8 }, transition: { duration: 0.2 }, children: getMascotImage() }, action) }) }));
}
