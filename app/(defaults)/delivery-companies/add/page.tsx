'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import Tabs from '@/components/tabs';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPlus from '@/components/icon/icon-plus';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { getTranslation } from '@/i18n';

const MapSelector = dynamic(() => import('@/components/map/map-selector'), { ssr: false });

const BUCKET = 'delivery-company-logos';

interface DriverForm {
    name: string;
    phone: string;
}

interface CarForm {
    car_number: string;
    car_model: string;
}

const AddDeliveryCompanyPage = () => {
    const router = useRouter();
    const { t } = getTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({ visible: false, message: '', type: 'success' });

    const [form, setForm] = useState({
        company_name: '',
        company_number: '',
        phone: '',
        email: '',
        address: '',
        logo_url: '',
        delivery_price: '',
        details: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const [drivers, setDrivers] = useState<DriverForm[]>([{ name: '', phone: '' }]);
    const [cars, setCars] = useState<CarForm[]>([{ car_number: '', car_model: '' }]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const addDriver = () => setDrivers((prev) => [...prev, { name: '', phone: '' }]);
    const removeDriver = (index: number) => setDrivers((prev) => prev.filter((_, i) => i !== index));
    const updateDriver = (index: number, field: keyof DriverForm, value: string) => {
        setDrivers((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
    };

    const addCar = () => setCars((prev) => [...prev, { car_number: '', car_model: '' }]);
    const removeCar = (index: number) => setCars((prev) => prev.filter((_, i) => i !== index));
    const updateCar = (index: number, field: keyof CarForm, value: string) => {
        setCars((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    };

    const uploadLogo = async (file: File): Promise<string | null> => {
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
            return data.publicUrl || null;
        } catch (e) {
            console.error(e);
            setAlert({ visible: true, message: t('error') || 'Error uploading logo', type: 'danger' });
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.company_name?.trim()) {
            setAlert({ visible: true, message: t('name') + ' ' + (t('required') || 'required'), type: 'danger' });
            return;
        }

        setLoading(true);
        try {
            // Insert company
            const insertPayload = {
                company_name: form.company_name,
                company_number: form.company_number || null,
                phone: form.phone || null,
                email: form.email || null,
                address: form.address || null,
                logo_url: form.logo_url || null,
                delivery_price: form.delivery_price ? parseFloat(form.delivery_price) : null,
                details: form.details || null,
                latitude: form.latitude,
                longitude: form.longitude,
            } as any;

            const { data: company, error } = await supabase.from('delivery_companies').insert([insertPayload]).select().single();
            if (error) throw error;

            const companyId = company.id as number;

            // Insert related cars
            const carsToInsert = cars
                .filter((c) => c.car_number || c.car_model)
                .map((c) => ({
                    company_id: companyId,
                    car_number: c.car_number || null,
                    car_model: c.car_model || null,
                }));
            if (carsToInsert.length > 0) {
                await supabase.from('delivery_cars').insert(carsToInsert);
            }

            // Insert related drivers
            const driversToInsert = drivers
                .filter((d) => d.name)
                .map((d) => ({
                    company_id: companyId,
                    name: d.name,
                    phone: d.phone || null,
                }));
            if (driversToInsert.length > 0) {
                await supabase.from('delivery_drivers').insert(driversToInsert);
            }

            setAlert({ visible: true, message: t('created_successfully'), type: 'success' });
            router.push('/delivery-companies');
        } catch (err: any) {
            console.error(err);
            setAlert({ visible: true, message: err.message || (t('error') || 'Error creating record'), type: 'danger' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
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
                        <Link href="/delivery-companies" className="text-primary hover:underline">
                            {t('delivery_companies') || 'Delivery Companies'}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_new')}</span>
                    </li>
                </ul>
            </div>

            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <Tabs
                        tabs={[
                            { name: t('basic_info'), icon: 'store' },
                            { name: t('cars_and_drivers') || 'Cars & Drivers', icon: 'users' },
                            { name: t('prices') || 'Prices', icon: 'cash' },
                            { name: t('address') || 'Address', icon: 'map-pin' },
                        ]}
                        onTabClick={(tab) => setActiveTab(tab)}
                        activeTab={activeTab}
                    />
                </div>

                {activeTab === 0 && (
                    <div className="panel mb-5">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('basic_information')}</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white">{t('name')}</label>
                                    <input name="company_name" type="text" className="form-input" value={form.company_name} onChange={handleInputChange} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white">{t('number') || 'Company Number'}</label>
                                    <input name="company_number" type="text" className="form-input" value={form.company_number} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white">{t('phone')}</label>
                                    <input name="phone" type="tel" className="form-input" value={form.phone} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white">{t('email') || 'Email'}</label>
                                    <input name="email" type="email" className="form-input" value={form.email} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white">{t('price') || 'Delivery Price'}</label>
                                    <input name="delivery_price" type="number" step="0.01" className="form-input" value={form.delivery_price} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-3">{t('logo') || 'Logo'}</label>
                                <div className="mb-4">
                                    <img src={form.logo_url || '/assets/images/user-placeholder.webp'} alt="Company Logo" className="w-36 h-36 rounded-full object-cover border-2 border-gray-200" />
                                </div>
                                <div className="relative">
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = await uploadLogo(file);
                                        if (url) setForm((prev) => ({ ...prev, logo_url: url }));
                                    }} />
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                                        {t('select_logo')}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5">
                            <label className="block text-sm font-bold text-gray-700 dark:text-white">{t('details') || 'Details'}</label>
                            <textarea name="details" className="form-textarea" rows={4} value={form.details} onChange={handleInputChange} />
                        </div>
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="panel mb-5">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('cars_and_drivers') || 'Cars & Drivers'}</h5>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h6 className="font-semibold mb-3">{t('drivers') || 'Drivers'}</h6>
                                <div className="space-y-4">
                                    {drivers.map((d, i) => (
                                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                            <div>
                                                <label className="block text-sm font-bold">{t('name')}</label>
                                                <input type="text" className="form-input" value={d.name} onChange={(e) => updateDriver(i, 'name', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold">{t('phone')}</label>
                                                <input type="tel" className="form-input" value={d.phone} onChange={(e) => updateDriver(i, 'phone', e.target.value)} />
                                            </div>
                                            <div className="sm:col-span-2 flex justify-end">
                                                {i > 0 && (
                                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeDriver(i)}>
                                                        <IconX className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addDriver}>
                                        <IconPlus className="h-4 w-4 mr-2" /> {t('add')}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h6 className="font-semibold mb-3">{t('cars') || 'Cars'}</h6>
                                <div className="space-y-4">
                                    {cars.map((c, i) => (
                                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                            <div>
                                                <label className="block text-sm font-bold">{t('car_number') || 'Car Number'}</label>
                                                <input type="text" className="form-input" value={c.car_number} onChange={(e) => updateCar(i, 'car_number', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold">{t('car_model') || 'Car Model'}</label>
                                                <input type="text" className="form-input" value={c.car_model} onChange={(e) => updateCar(i, 'car_model', e.target.value)} />
                                            </div>
                                            <div className="sm:col-span-2 flex justify-end">
                                                {i > 0 && (
                                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeCar(i)}>
                                                        <IconX className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addCar}>
                                        <IconPlus className="h-4 w-4 mr-2" /> {t('add')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="panel mb-5">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('prices') || 'Prices'}</h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold">{t('price') || 'Delivery Price'}</label>
                                <input name="delivery_price" type="number" step="0.01" className="form-input" value={form.delivery_price} onChange={handleInputChange} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-bold">{t('details') || 'Details / Notes'}</label>
                                <textarea name="details" className="form-textarea" rows={3} value={form.details} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="panel mb-5">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('address')}</h5>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <div className="flex items-center">
                                    <span className="mt-1 ltr:mr-2 rtl:ml-2 text-primary">
                                        <IconMapPin className="h-5 w-5" />
                                    </span>
                                    <textarea name="address" className="form-textarea flex-1" value={form.address} onChange={handleInputChange} rows={2} />
                                </div>
                            </div>
                           
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white">{t('company_location') || 'Company Location'}</label>
                                <div className="h-[400px] mb-4">
                                    <MapSelector initialPosition={form.latitude && form.longitude ? [form.latitude, form.longitude] : null} onChange={handleLocationChange} height="400px" useCurrentLocationByDefault={true} />
                                </div>
                                {form.latitude && form.longitude && (
                                    <p className="text-sm mt-2">
                                        {t('selected_coordinates')}: <span className="font-semibold">{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <button type="button" className="btn btn-outline-danger" onClick={() => router.back()}>
                        {t('cancel')}
                    </button>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? t('submitting') : (t('create') || 'Create')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddDeliveryCompanyPage;


