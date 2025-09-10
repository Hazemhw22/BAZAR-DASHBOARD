'use client';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import IconEdit from '@/components/icon/icon-edit';
import { getTranslation } from '@/i18n';

interface DeliveryCar {
    id: number;
    shop_id: number | string;
    plate_number?: string | null;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    capacity?: number | null;
    status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    car_number?: string | null;
    car_model?: string | null;
    shops?: {
        shop_name: string;
    } | null;
}

interface DeliveryDriver {
    name: string | null;
    phone: string | null;
}

interface PageProps {
    params: { id: string };
}

const DeliveryCarPreviewPage = ({ params }: PageProps) => {
    const router = useRouter();
    const { t } = getTranslation();
    const [car, setCar] = useState<DeliveryCar | null>(null);
    const [driver, setDriver] = useState<DeliveryDriver | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCarAndDriver = async () => {
            try {
                // جلب بيانات السيارة
                const { data: carData, error: carError } = await supabase.from('delivery_cars').select('*, shops(shop_name)').eq('id', params.id).single();
                if (carError) throw carError;
                setCar(carData as DeliveryCar);

                // جلب بيانات السائق المرتبط بالسيارة
                const { data: driverData, error: driverError } = await supabase.from('delivery_drivers').select('name, phone').eq('car_id', params.id).single(); // إذا كان هناك أكثر من سائق يمكن إزالة single()
                if (driverError) throw driverError;
                setDriver(driverData as DeliveryDriver);
            } catch (e) {
                console.error('Error fetching delivery car or driver:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchCarAndDriver();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="mb-2 text-xl font-bold">{t('record_not_found') || 'Record not found'}</h2>
                    <p className="mb-4 text-gray-500">{t('no_description_available')}</p>
                    <Link href="/delivery-cars" className="btn btn-primary">
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
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/delivery-cars" className="text-primary hover:underline">
                            {t('delivery_cars')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('preview')}</span>
                    </li>
                </ul>
            </div>

            <div className="panel">
                <div className="mb-5 flex justify-between">
                    <h2 className="text-2xl font-bold">{car.plate_number || car.car_number || `#${car.id}`}</h2>
                    <Link href={`/delivery-cars/edit/${car.id}`} className="btn btn-primary gap-2">
                        <IconEdit className="h-5 w-5" />
                        {t('edit')}
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">{t('shop')}</h3>
                            <p className="mt-2">{car.shops?.shop_name || car.shop_id}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t('status')}</h3>
                            <p className="mt-2">
                                <span className={`badge badge-outline-${car.status === 'active' ? 'success' : car.status === 'inactive' ? 'danger' : 'warning'}`}>{car.status || t('pending')}</span>
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t('created_date')}</h3>
                            <p className="mt-2">{car.created_at ? new Date(car.created_at).toLocaleString() : '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t('updated_at') || 'Updated at'}</h3>
                            <p className="mt-2">{car.updated_at ? new Date(car.updated_at).toLocaleString() : '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('plate_number')}</h4>
                                <p className="mt-1">{car.plate_number || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('brand')}</h4>
                                <p className="mt-1">{car.brand || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('model')}</h4>
                                <p className="mt-1">{car.model || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('color')}</h4>
                                <p className="mt-1">{car.color || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('capacity')}</h4>
                                <p className="mt-1">{car.capacity?.toString() || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('car_number')}</h4>
                                <p className="mt-1">{car.car_number || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('car_model')}</h4>
                                <p className="mt-1">{car.car_model || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('driver_name')}</h4>
                                <p className="mt-1">{driver?.name || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-600 dark:text-gray-400">{t('driver_phone')}</h4>
                                <p className="mt-1">{driver?.phone || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryCarPreviewPage;
