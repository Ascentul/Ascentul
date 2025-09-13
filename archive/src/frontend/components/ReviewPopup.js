import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/lib/useUserData';
export function ReviewPopup({ isOpen, onClose, onSubmitSuccess }) {
    const { toast } = useToast();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            rating: 0,
            feedback: '',
            name: user?.name || ''
        }
    });
    // Update name field when user data changes or loads
    useEffect(() => {
        if (user?.name) {
            setValue('name', user.name);
        }
    }, [user, setValue]);
    const onSubmit = async (data) => {
        if (rating === 0) {
            toast({
                title: "Rating required",
                description: "Please select a rating between 1 and 5 stars.",
                variant: "destructive",
            });
            return;
        }
        try {
            setIsSubmitting(true);
            const response = await apiRequest('POST', '/api/review/submit', {
                rating,
                feedback: data.feedback,
                name: data.name
            });
            if (response.ok) {
                toast({
                    title: "Thank you for your feedback!",
                    description: "Your review has been submitted successfully.",
                });
                // Reset form
                reset();
                setRating(0);
                // Call success callback if provided
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                }
                // Close the popup
                onClose();
            }
            else {
                throw new Error('Failed to submit review');
            }
        }
        catch (error) {
            console.error('Error submitting review:', error);
            toast({
                title: "Submission failed",
                description: "There was an error submitting your review. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleCancel = () => {
        reset();
        setRating(0);
        onClose();
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.2 }, className: "bg-card max-w-md w-full rounded-lg shadow-lg p-6 m-4", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Share Your Feedback" }), _jsx("p", { className: "text-muted-foreground", children: "How would you rate your experience with Ascentul?" })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), children: [_jsx("div", { className: "flex justify-center mb-6", children: [1, 2, 3, 4, 5].map((star) => (_jsx("button", { type: "button", className: "text-4xl focus:outline-none transition-transform hover:scale-110", onMouseEnter: () => setHoveredRating(star), onMouseLeave: () => setHoveredRating(0), onClick: () => setRating(star), children: _jsx(Star, { size: 32, className: `${(hoveredRating || rating) >= star
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'}` }) }, star))) }), _jsx("div", { className: "text-center mb-4 h-6", children: rating > 0 && (_jsx("p", { className: "text-primary font-medium", children: rating === 5 ? 'Excellent! We\'re thrilled you love it!' :
                                        rating === 4 ? 'Great! Thanks for the positive feedback.' :
                                            rating === 3 ? 'Good. We appreciate your feedback.' :
                                                rating === 2 ? 'Thanks for your feedback. We\'ll work to improve.' :
                                                    'We\'re sorry to hear that. We\'ll do better.' })) }), _jsx("div", { className: "mb-4", children: _jsx(Textarea, { ...register('feedback'), placeholder: "Share your thoughts (optional)", className: "resize-none", rows: 4 }) }), _jsxs("div", { className: "mb-6", children: [_jsx(Label, { htmlFor: "name", className: "block text-sm font-medium mb-1", children: "Name (used in testimonial)" }), _jsx(Input, { id: "name", ...register('name'), placeholder: "Your name" })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleCancel, disabled: isSubmitting, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Submitting...' : 'Submit Review' })] })] })] }) })) }));
}
// Hook for accessing the review popup from anywhere in the app
export function useReviewPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const openReviewPopup = () => setIsOpen(true);
    const closeReviewPopup = () => setIsOpen(false);
    const ReviewPopupComponent = ({ onSubmitSuccess }) => (_jsx(ReviewPopup, { isOpen: isOpen, onClose: closeReviewPopup, onSubmitSuccess: onSubmitSuccess }));
    return {
        openReviewPopup,
        closeReviewPopup,
        ReviewPopupComponent
    };
}
