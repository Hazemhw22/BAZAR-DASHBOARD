import { FC } from 'react';

interface IconMenuDeliveryDriversProps {
    className?: string;
}

const IconMenuDeliveryDrivers: FC<IconMenuDeliveryDriversProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* رأس السائق */}
            <circle opacity="0.5" cx="12" cy="7" r="3" fill="currentColor" />
            {/* جسم السائق */}
            <ellipse cx="12" cy="16" rx="6" ry="4" fill="currentColor" />
        </svg>
    );
};

export default IconMenuDeliveryDrivers;
