import { FC } from 'react';

interface IconMenuDeliveryCarsProps {
    className?: string;
}

const IconMenuDeliveryCars: FC<IconMenuDeliveryCarsProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* جسم السيارة */}
            <rect opacity="0.5" x="3" y="10" width="18" height="7" rx="2" fill="currentColor" />
            {/* السقف */}
            <rect x="6" y="7" width="12" height="3" rx="1" fill="currentColor" />
            {/* العجلات */}
            <circle cx="7.5" cy="18" r="1.5" fill="currentColor" />
            <circle cx="16.5" cy="18" r="1.5" fill="currentColor" />
        </svg>
    );
};

export default IconMenuDeliveryCars;
