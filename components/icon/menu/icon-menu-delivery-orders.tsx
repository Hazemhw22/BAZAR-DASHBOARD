import { FC } from 'react';

interface IconMenuDeliveryOrdersProps {
    className?: string;
}

const IconMenuDeliveryOrders: FC<IconMenuDeliveryOrdersProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* صندوق يمثل الورقة */}
            <rect opacity="0.5" x="4" y="3" width="16" height="18" rx="2" fill="currentColor" />
            {/* خطوط تمثل النصوص */}
            <rect x="7" y="7" width="10" height="2" rx="1" fill="currentColor" />
            <rect x="7" y="11" width="7" height="2" rx="1" fill="currentColor" />
            <rect x="7" y="15" width="8" height="2" rx="1" fill="currentColor" />
        </svg>
    );
};

export default IconMenuDeliveryOrders;
