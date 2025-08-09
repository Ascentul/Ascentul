import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { LoadingState } from './loading-state';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
export function QueryWrapper({ data, isLoading, isError, errorComponent, emptyComponent, loadingMessage = 'Loading data...', loadingVariant = 'default', loadingSize = 'md', mascotAction = 'loading', isEmpty = (data) => Array.isArray(data) && data.length === 0, children }) {
    // Handle loading state
    if (isLoading) {
        return (_jsx(LoadingState, { message: loadingMessage, variant: loadingVariant, size: loadingSize, mascotAction: mascotAction }));
    }
    // Handle error state
    if (isError) {
        if (errorComponent) {
            return _jsx(_Fragment, { children: errorComponent });
        }
        return (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: "There was an error loading the data. Please try again." })] }));
    }
    // Handle undefined data
    if (!data) {
        return (_jsxs(Alert, { children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "No Data" }), _jsx(AlertDescription, { children: "No data was found. This might be unexpected behavior." })] }));
    }
    // Handle empty data (if the data is empty according to the provided isEmpty function)
    if (isEmpty(data)) {
        if (emptyComponent) {
            return _jsx(_Fragment, { children: emptyComponent });
        }
        return (_jsx("div", { className: "flex flex-col items-center justify-center p-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "No items found." }) }));
    }
    // Render the children with the data
    return _jsx(_Fragment, { children: children(data) });
}
