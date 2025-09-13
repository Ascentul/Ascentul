import { jsx as _jsx } from "react/jsx-runtime";
import Layout from '@/components/Layout';
const PrivateLayout = ({ children }) => {
    return _jsx(Layout, { children: children });
};
export default PrivateLayout;
