'use client';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import IconEdit from '@/components/icon/icon-edit';
import { getTranslation } from '@/i18n';

interface DriverRecord {
    id: number;
    name: string;
    shop_id: number | string;
    number?: string | null;
    phone?: string | null;
    id_number?: string | null;
    car_id?: number | null;
    status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    shops?: { shop_name: string } | null;
    delivery_cars?: { plate_number: string | null } | null;
}

interface PageProps { params: { id: string } }

const DeliveryDriverPreviewPage = ({ params }: PageProps) => {
    const router = useRouter();
    const { t } = getTranslation();
    const [driver, setDriver] = useState<DriverRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const { data, error } = await supabase
                    .from('delivery_drivers')
                    .select('*, shops(shop_name), delivery_cars(plate_number)')
                    .eq('id', params.id)
                    .single();
                if (error) throw error;
                setDriver(data as DriverRecord);
            } catch (e) {
                console.error('Error fetching delivery driver:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchDriver();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!driver) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="mb-2 text-xl font-bold">{t('record_not_found') || 'Record not found'}</h2>
                    <p className="mb-4 text-gray-500">{t('no_description_available')}</p>
                    <Link href="/delivery-drivers" className="btn btn-primary">
                        {t('back_to_list') || 'Back to list'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <div onClick={() => router.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-4 cursor-pointer text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </div>
                <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
                    <li>
                        <Link href="/" className="text-primary hover:underline">{t('home')}</Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/delivery-drivers" className="text-primary hover:underline">{t('delivery_drivers') || 'Delivery Drivers'}</Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('preview')}</span>
                    </li>
                </ul>
            </div>

            <div className="panel">
                <div className="mb-5 flex justify-between">
                    <h2 className="text-2xl font-bold">{driver.name || `#${driver.id}`}</h2>
                    <Link href={`/delivery-drivers/edit/${driver.id}`} className="btn btn-primary gap-2">
                        <IconEdit className="h-5 w-5" />
                        {t('edit')}
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">{t('shop')}</h3>
                            <p className="mt-2">{driver.shops?.shop_name || driver.shop_id}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t('status')}</h3>
                            <p className="mt-2">
                                <span className={`badge badge-outline-${driver.status === 'active' ? 'success' : driver.status === 'inactive' ? 'danger' : 'warning'}`}>{driver.status || t('pending')}</span>
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t('created_date')}</h3>
                            <p className="mt-2">{driver.created_at ? new Date(driver.created_at).toLocaleString() : '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t('updated_at') || 'Updated at'}</h3>
                            <p className="mt-2">{driver.updated_at ? new Date(driver.updated_at).toLocaleString() : '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('name')}</h4>
                                <p className="mt-1">{driver.name || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('phone')}</h4>
                                <p className="mt-1">{driver.phone || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('number') || 'Number'}</h4>
                                <p className="mt-1">{driver.number || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('id_number') || 'ID Number'}</h4>
                                <p className="mt-1">{driver.id_number || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('car')}</h4>
                                <p className="mt-1">{driver.delivery_cars?.plate_number || (driver.car_id ? `#${driver.car_id}` : '-')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDriverPreviewPage;


