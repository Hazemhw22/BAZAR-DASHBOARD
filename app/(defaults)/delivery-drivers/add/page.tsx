'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';

interface ShopOption {
    id: number;
    shop_name: string;
}
interface CarOption {
    id: number;
    plate_number: string | null;
    brand?: string | null;
    model?: string | null;
}

const AddDeliveryDriverPage = () => {
    const router = useRouter();
    const { t } = getTranslation();
    const [shops, setShops] = useState<ShopOption[]>([]);
    const [cars, setCars] = useState<CarOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        shop_id: '',
        phone: '',
        id_number: '',
        car_id: '',
        status: 'active',
    });

    useEffect(() => {
        const fetchOptions = async () => {
            const [{ data: shopData }, { data: carsData }] = await Promise.all([
                supabase.from('shops').select('id, shop_name').order('shop_name', { ascending: true }),
                supabase.from('delivery_cars').select('id, plate_number, brand, model').order('created_at', { ascending: false }),
            ]);
            setShops((shopData as ShopOption[]) || []);
            setCars((carsData as CarOption[]) || []);
        };
        fetchOptions();
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim() || !formData.shop_id) {
            setAlert({ type: 'danger', message: t('name') + ' / ' + t('shop') + ' ' + (t('required') || 'required') });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                shop_id: parseInt(formData.shop_id),
                phone: formData.phone || null,
                id_number: formData.id_number || null,
                car_id: formData.car_id ? parseInt(formData.car_id) : null,
                status: formData.status || null,
            };
            const { error } = await supabase.from('delivery_drivers').insert([payload]);
            if (error) throw error;
            setAlert({ type: 'success', message: t('created_successfully') });
            setTimeout(() => router.push('/delivery-drivers'), 1000);
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
                        <Link href="/delivery-drivers" className="text-primary hover:underline">
                            {t('delivery_drivers')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_new')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('add_new')}</h1>
                <p className="text-gray-500">{t('create_new_record')}</p>
            </div>

            {alert && <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />}

            <div className="panel">
                <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                        <label htmlFor="name">{t('name')}</label>
                        <input id="name" type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>

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
                        <label htmlFor="car_id">{t('car')}</label>
                        <select id="car_id" className="form-select" value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}>
                            <option value="">{t('select') || 'Select'}</option>
                            {cars.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.brand ? `${c.brand}${c.model ? ' ' + c.model : ''} (${c.plate_number || '-'})` : `#${c.id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="phone">{t('phone')}</label>
                        <input id="phone" type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="id_number">{t('id_number')}</label>
                        <input id="id_number" type="text" className="form-input" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="status">{t('status')}</label>
                        <select id="status" className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                            <option value="active">{t('active')}</option>
                            <option value="inactive">{t('inactive')}</option>
                            <option value="on_leave">{t('on_leave') || 'On Leave'}</option>
                        </select>
                    </div>

                    <div className="lg:col-span-2 flex justify-end gap-4 mt-4">
                        <button type="button" className="btn btn-outline-danger" onClick={() => router.push('/delivery-drivers')} disabled={loading}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t('submitting') : t('create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeliveryDriverPage;
