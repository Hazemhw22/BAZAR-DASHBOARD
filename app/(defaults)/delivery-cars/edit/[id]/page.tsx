'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';

interface EditPageProps {
    params: { id: string };
}

interface ShopOption {
    id: number;
    shop_name: string;
}

const EditDeliveryCarPage = ({ params }: EditPageProps) => {
    const router = useRouter();
    const { t } = getTranslation();
    const [shops, setShops] = useState<ShopOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

    const [formData, setFormData] = useState({
        shop_id: '',
        plate_number: '',
        brand: '',
        model: '',
        color: '',
        capacity: '',
        status: 'active',
        car_number: '',
        car_model: '',
        driver_name: '',
        driver_phone: '',
    });

    useEffect(() => {
        const load = async () => {
            const [{ data: shopData }, { data: car }] = await Promise.all([
                supabase.from('shops').select('id, shop_name').order('shop_name', { ascending: true }),
                supabase.from('delivery_cars').select('*').eq('id', params.id).single(),
            ]);
            setShops((shopData as ShopOption[]) || []);
            if (car) {
                setFormData({
                    shop_id: car.shop_id?.toString() || '',
                    plate_number: car.plate_number || '',
                    brand: car.brand || '',
                    model: car.model || '',
                    color: car.color || '',
                    capacity: car.capacity?.toString() || '',
                    status: car.status || 'active',
                    car_number: car.car_number || '',
                    car_model: car.car_model || '',
                    driver_name: car.driver_name || '',
                    driver_phone: car.driver_phone || '',
                });
            }
        };
        load();
    }, [params.id]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.shop_id) {
            setAlert({ type: 'danger', message: t('shop_selection_required') });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                shop_id: parseInt(formData.shop_id),
                plate_number: formData.plate_number || null,
                brand: formData.brand || null,
                model: formData.model || null,
                color: formData.color || null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                status: formData.status || null,
                car_number: formData.car_number || null,
                car_model: formData.car_model || null,
                driver_name: formData.driver_name || null,
                driver_phone: formData.driver_phone || null,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('delivery_cars').update(payload).eq('id', params.id);
            if (error) throw error;
            setAlert({ type: 'success', message: t('updated_successfully') });
            setTimeout(() => router.push('/delivery-cars'), 1000);
        } catch (err: any) {
            console.error(err);
            setAlert({ type: 'danger', message: err.message || 'Error' });
        } finally {
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
                        <span>{t('edit')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('edit')}</h1>
                <p className="text-gray-500">{t('update_record')}</p>
            </div>

            {alert && <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />}

            <div className="panel">
                <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                        <label htmlFor="shop_id">{t('shop')}</label>
                        <select id="shop_id" className="form-select" value={formData.shop_id} onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })} required>
                            <option value="">{t('select_shop')}</option>
                            {shops.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.shop_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="plate_number">{t('plate_number')}</label>
                        <input id="plate_number" type="text" className="form-input" value={formData.plate_number} onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="brand">{t('brand')}</label>
                        <input id="brand" type="text" className="form-input" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="model">{t('model')}</label>
                        <input id="model" type="text" className="form-input" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="color">{t('color')}</label>
                        <input id="color" type="text" className="form-input" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="capacity">{t('capacity')}</label>
                        <input id="capacity" type="number" className="form-input" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="status">{t('status')}</label>
                        <select id="status" className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                            <option value="active">{t('active')}</option>
                            <option value="inactive">{t('inactive')}</option>
                            <option value="maintenance">{t('maintenance') || 'Maintenance'}</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="car_number">{t('car_number')}</label>
                        <input id="car_number" type="text" className="form-input" value={formData.car_number} onChange={(e) => setFormData({ ...formData, car_number: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="car_model">{t('car_model')}</label>
                        <input id="car_model" type="text" className="form-input" value={formData.car_model} onChange={(e) => setFormData({ ...formData, car_model: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="driver_name">{t('driver_name')}</label>
                        <input id="driver_name" type="text" className="form-input" value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="driver_phone">{t('driver_phone')}</label>
                        <input id="driver_phone" type="tel" className="form-input" value={formData.driver_phone} onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })} />
                    </div>

                    <div className="lg:col-span-2 flex justify-end gap-4 mt-4">
                        <button type="button" className="btn btn-outline-danger" onClick={() => router.push('/delivery-cars')} disabled={loading}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t('submitting') : t('update')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDeliveryCarPage;


