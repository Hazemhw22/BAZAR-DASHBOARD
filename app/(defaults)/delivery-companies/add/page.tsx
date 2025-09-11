'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import Tabs from '@/components/tabs';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPlus from '@/components/icon/icon-plus';
import dynamic from 'next/dynamic';
import { getTranslation } from '@/i18n';

// Map removed for delivery companies (no location in DB)
const BUCKET = 'delivery-company-logos';

interface DriverForm {
    name: string;
    phone: string;
    id_number: string;
    status: string;
}

interface CarForm {
    plate_number: string;
    brand: string;
    model: string;
    color: string;
    capacity: string;
    status: string;
    car_number: string;
    car_model: string;
    driver: DriverForm;
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
        owner_name: '',
        logo_url: '',
        delivery_price: '',
        details: '',
    });

    const [cars, setCars] = useState<CarForm[]>([
        {
            plate_number: '',
            brand: '',
            model: '',
            color: '',
            capacity: '',
            status: 'active',
            car_number: '',
            car_model: '',
            driver: { name: '', phone: '', id_number: '', status: 'active' },
        },
    ]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // No location handling

    // --- Car & Driver handlers ---
    const addCar = () =>
        setCars((prev) => [
            ...prev,
            {
                plate_number: '',
                brand: '',
                model: '',
                color: '',
                capacity: '',
                status: 'active',
                car_number: '',
                car_model: '',
                driver: { name: '', phone: '', id_number: '', status: 'active' },
            },
        ]);
    const removeCar = (index: number) => setCars((prev) => prev.filter((_, i) => i !== index));
    const updateCarField = (index: number, field: keyof CarForm, value: string) => {
        setCars((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    };
    const updateDriverField = (carIndex: number, field: keyof DriverForm, value: string) => {
        setCars((prev) => prev.map((c, i) => (i === carIndex ? { ...c, driver: { ...c.driver, [field]: value } } : c)));
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
                owner_name: form.owner_name || null,
                logo_url: form.logo_url || null,
                delivery_price: form.delivery_price ? parseFloat(form.delivery_price) : null,
                details: form.details || null,
                // no location fields
            };
            const { data: company, error } = await supabase.from('delivery_companies').insert([insertPayload]).select().single();
            if (error) throw error;

            const companyId = company.id;

            // Insert cars and drivers
            for (const c of cars) {
                const { data: car, error: carError } = await supabase
                    .from('delivery_cars')
                    .insert([
                        {
                            company_id: companyId,
                            shop_id: null,
                            plate_number: c.plate_number,
                            brand: c.brand,
                            model: c.model,
                            color: c.color,
                            capacity: c.capacity,
                            status: c.status,
                            car_number: c.car_number,
                            car_model: c.car_model,
                        },
                    ])
                    .select()
                    .single();
                if (carError) throw carError;

                // Insert driver linked to this car
                if (c.driver.name) {
                    const { error: driverError } = await supabase.from('delivery_drivers').insert([
                        {
                            company_id: companyId,
                            car_id: car.id,
                            name: c.driver.name,
                            phone: c.driver.phone || null,
                            id_number: c.driver.id_number || null,
                            status: c.driver.status || 'active',
                        },
                    ]);
                    if (driverError) throw driverError;
                }
            }

            setAlert({ visible: true, message: t('created_successfully'), type: 'success' });
            router.push('/delivery-companies');
        } catch (err: any) {
            console.error(err);
            setAlert({ visible: true, message: err.message || t('error') || 'Error creating record', type: 'danger' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <div onClick={() => router.back()} className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-4 text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            {t('delivery_companies')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_new')}</span>
                    </li>
                </ul>
            </div>

            {alert.visible && <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />}

            <form onSubmit={handleSubmit}>
                {/* Cover Image (visual parity with shops) */}
                <div className="panel mb-5 overflow-hidden">
                    <div className="relative h-52 w-full">
                        <img src={form.logo_url || '/assets/images/img-placeholder-fallback.webp'} alt="Company Cover" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="text-center flex flex-col items-center justify-center">
                                <h2 className="text-xl font-bold text-white mb-4">{t('company_cover_image') || 'Company Cover Image'}</h2>
                                <div className="relative inline-block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const url = await uploadLogo(file);
                                            if (url) setForm((prev) => ({ ...prev, logo_url: url }));
                                        }}
                                        className="hidden"
                                        id="company-cover-upload"
                                    />
                                    <label htmlFor="company-cover-upload" className="btn btn-primary cursor-pointer">
                                        {t('select_cover') || 'Select Cover'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Tabs
                    tabs={[
                        { name: t('basic_info'), icon: 'store' },
                        { name: t('cars_and_drivers'), icon: 'users' },
                        { name: t('prices'), icon: 'cash' },
                        { name: t('address'), icon: 'map-pin' },
                    ]}
                    activeTab={activeTab}
                    onTabClick={setActiveTab}
                />

                {/* Basic Info */}
                {activeTab === 0 && (
                    <div className="panel mb-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold">{t('name')}</label>
                                <input type="text" className="form-input" name="company_name" value={form.company_name} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">{t('company_owner') || 'Company Owner'}</label>
                                <input type="text" className="form-input" name="owner_name" value={form.owner_name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">{t('number')}</label>
                                <input type="text" className="form-input" name="company_number" value={form.company_number} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">{t('phone')}</label>
                                <input type="tel" className="form-input" name="phone" value={form.phone} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">{t('email')}</label>
                                <input type="email" className="form-input" name="email" value={form.email} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <label className="block text-sm font-bold mb-3">{t('logo')}</label>
                            <img src={form.logo_url || '/assets/images/user-placeholder.webp'} className="w-36 h-36 rounded-full object-cover border-2 border-gray-200 mb-4" />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const url = await uploadLogo(file);
                                    if (url) setForm((prev) => ({ ...prev, logo_url: url }));
                                }}
                            />
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                                {t('select_logo')}
                            </button>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold">{t('details')}</label>
                            <textarea name="details" className="form-textarea" rows={4} value={form.details} onChange={handleInputChange} />
                        </div>
                    </div>
                )}

                {/* Cars & Drivers */}
                {activeTab === 1 && (
                    <div className="panel mb-5 space-y-6">
                        {cars.map((c, i) => (
                            <div key={i} className=" p-4 rounded-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <h5 className="font-semibold">
                                        {t('car')} #{i + 1}
                                    </h5>
                                    {i > 0 && (
                                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeCar(i)}>
                                            <IconX className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input placeholder={t('plate_number')} className="form-input" value={c.plate_number} onChange={(e) => updateCarField(i, 'plate_number', e.target.value)} />
                                    <input placeholder={t('brand')} className="form-input" value={c.brand} onChange={(e) => updateCarField(i, 'brand', e.target.value)} />
                                    <input placeholder={t('model')} className="form-input" value={c.model} onChange={(e) => updateCarField(i, 'model', e.target.value)} />
                                    <input placeholder={t('color')} className="form-input" value={c.color} onChange={(e) => updateCarField(i, 'color', e.target.value)} />
                                    <input placeholder={t('capacity')} className="form-input" value={c.capacity} onChange={(e) => updateCarField(i, 'capacity', e.target.value)} />
                                    <input placeholder={t('car_number')} className="form-input" value={c.car_number} onChange={(e) => updateCarField(i, 'car_number', e.target.value)} />
                                    <input placeholder={t('car_model')} className="form-input" value={c.car_model} onChange={(e) => updateCarField(i, 'car_model', e.target.value)} />
                                    <select className="form-select" value={c.status} onChange={(e) => updateCarField(i, 'status', e.target.value)}>
                                        <option value="active">{t('active')}</option>
                                        <option value="inactive">{t('inactive')}</option>
                                    </select>
                                </div>

                                {/* Driver */}
                                <div className="mt-3 border-t pt-3">
                                    <h6 className="font-semibold">{t('driver')}</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input placeholder={t('name')} className="form-input" value={c.driver.name} onChange={(e) => updateDriverField(i, 'name', e.target.value)} />
                                        <input placeholder={t('phone')} className="form-input" value={c.driver.phone} onChange={(e) => updateDriverField(i, 'phone', e.target.value)} />
                                        <input placeholder={t('id_number')} className="form-input" value={c.driver.id_number} onChange={(e) => updateDriverField(i, 'id_number', e.target.value)} />
                                        <select className="form-select" value={c.driver.status} onChange={(e) => updateDriverField(i, 'status', e.target.value)}>
                                            <option value="active">{t('active')}</option>
                                            <option value="inactive">{t('inactive')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={addCar}>
                            <IconPlus className="h-4 w-4 mr-2" /> {t('add_car_driver')}
                        </button>
                    </div>
                )}

                {/* Prices */}
                {activeTab === 2 && (
                    <div className="panel mb-5">
                        <input placeholder={t('delivery_price')} className="form-input" name="delivery_price" value={form.delivery_price} onChange={handleInputChange} />
                    </div>
                )}

                {/* Address */}
                {activeTab === 3 && (
                    <div className="panel mb-5">
                        <textarea placeholder={t('address')} className="form-textarea mb-3" name="address" value={form.address} onChange={handleInputChange} />
                        {/* Location removed */}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <button type="button" className="btn btn-outline-danger" onClick={() => router.back()}>
                        {t('cancel')}
                    </button>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? t('submitting') : t('create')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddDeliveryCompanyPage;
