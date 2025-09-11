'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import IconEdit from '@/components/icon/icon-edit';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import { getTranslation } from '@/i18n';

interface Company {
    id: number;
    company_name: string;
    company_number?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    location?: string | null;
    logo_url?: string | null;
    delivery_price?: number | null;
    details?: string | null;
    created_at?: string | null;
}

const CompanyPreview = () => {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { t } = getTranslation();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({ visible: false, message: '', type: 'danger' });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const { data, error } = await supabase.from('delivery_companies').select('*').eq('id', id).single();
                if (error) throw error;
                setCompany(data as Company);
            } catch (e) {
                console.error(e);
                setAlert({ visible: true, message: t('error') || 'Error fetching company', type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCompany();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!company) return <div className="text-center p-6">{t('not_found') || 'Not found'}</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <div onClick={() => router.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 cursor-pointer text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </div>
                <Link href={`/delivery-companies/edit/${company.id}`} className="btn btn-primary flex items-center gap-2">
                    <IconEdit className="h-5 w-5" />
                    {t('edit')}
                </Link>
            </div>

            <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
                <li>
                    <Link href="/" className="text-primary hover:underline">{t('home')}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/delivery-companies" className="text-primary hover:underline">{t('delivery_companies') || 'Delivery Companies'}</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{company.company_name}</span>
                </li>
            </ul>

            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <div className="panel p-0 overflow-hidden">
                <div className="relative h-48 w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <div className="absolute bottom-0 left-0 w-full p-6">
                        <div className="flex items-center">
                            <div className="h-20 w-20 rounded-lg border-4 border-white overflow-hidden bg-white mr-4">
                                <img src={company.logo_url || '/assets/images/user-placeholder.webp'} alt={company.company_name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{company.company_name}</h1>
                                {company.company_number && <div className="mt-1 text-sm text-gray-600">#{company.company_number}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h5 className="text-lg font-semibold mb-3">{t('details') || 'Details'}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-500">{t('phone')}</div>
                                    <div className="flex items-center"><IconPhone className="h-5 w-5 text-success mr-2" />{company.phone || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">{t('email') || 'Email'}</div>
                                    <div>{company.email || '—'}</div>
                                </div>
                                <div className="sm:col-span-2">
                                    <div className="text-sm text-gray-500">{t('address')}</div>
                                    <div className="flex"><IconMapPin className="h-5 w-5 text-primary mr-2" />{company.address || '—'}</div>
                                </div>
                                {company.location && (
                                    <div className="sm:col-span-2">
                                        <div className="text-sm text-gray-500">{t('location')}</div>
                                        <div>{company.location}</div>
                                    </div>
                                )}
                                {company.delivery_price !== null && company.delivery_price !== undefined && (
                                    <div>
                                        <div className="text-sm text-gray-500">{t('price') || 'Delivery Price'}</div>
                                        <div>{Number(company.delivery_price).toFixed(2)}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {company.details && (
                            <div>
                                <h5 className="text-lg font-semibold mb-3">{t('notes') || 'Notes'}</h5>
                                <p className="text-gray-600">{company.details}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="panel">
                            <h5 className="text-lg font-semibold mb-3">{t('created_date') || 'Created'}</h5>
                            <div>{company.created_at ? new Date(company.created_at).toLocaleString() : '—'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyPreview;


