import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
const ReviewDeleteDialog = ({ isOpen, onClose, onConfirm, reviewId, }) => {
    return (_jsx(AlertDialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure you want to delete this review?" }), _jsx(AlertDialogDescription, { children: "This action will hide the review from all views and reports. The data will remain in the database but will be marked as deleted." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: onClose, children: "Cancel" }), _jsx(AlertDialogAction, { onClick: onConfirm, className: "bg-red-600 hover:bg-red-700 text-white", children: "Delete" })] })] }) }));
};
export default ReviewDeleteDialog;
