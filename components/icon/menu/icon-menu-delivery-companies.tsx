import { FC } from 'react';

interface IconMenuDeliveryCompaniesProps {
    className?: string;
}

const IconMenuDeliveryCompanies: FC<IconMenuDeliveryCompaniesProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Building */}
            <rect x="3" y="6" width="8" height="12" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="13" y="9" width="8" height="9" rx="1" fill="currentColor" />
            {/* Windows */}
            <rect x="5" y="8" width="2" height="2" fill="currentColor" />
            <rect x="8" y="8" width="2" height="2" fill="currentColor" />
            <rect x="5" y="11" width="2" height="2" fill="currentColor" />
            <rect x="8" y="11" width="2" height="2" fill="currentColor" />
            {/* Door */}
            <rect x="6.5" y="14" width="3" height="4" fill="currentColor" />
            {/* Arrow/Logistics mark */}
            <path d="M14 6h4l-1.2-1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 6l-1.2 1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default IconMenuDeliveryCompanies;


