'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import Tabs from '@/components/tabs';
import IconX from '@/components/icon/icon-x';
import IconPlus from '@/components/icon/icon-plus';
import IconMapPin from '@/components/icon/icon-map-pin';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { getTranslation } from '@/i18n';

const MapSelector = dynamic(() => import('@/components/map/map-selector'), { ssr: false });

const BUCKET = 'delivery-company-logos';

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
    latitude?: number | null;
    longitude?: number | null;
}

interface DriverForm { name: string; phone: string }
interface CarForm { car_number: string; car_model: string }

const EditDeliveryCompanyPage = () => {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { t } = getTranslation();

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({ visible: false, message: '', type: 'success' });

    const [form, setForm] = useState<Company>({ id: 0, company_name: '' });
    const [drivers, setDrivers] = useState<DriverForm[]>([]);
    const [cars, setCars] = useState<CarForm[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [{ data: company, error: companyError }, { data: companyDrivers }, { data: companyCars }] = await Promise.all([
                    supabase.from('delivery_companies').select('*').eq('id', id).single(),
                    supabase.from('delivery_drivers').select('name, phone').eq('company_id', id),
                    supabase.from('delivery_cars').select('car_number, car_model').eq('company_id', id),
                ]);
                if (companyError) throw companyError;
                setForm((company as Company) || ({ id: 0, company_name: '' } as Company));
                setDrivers(((companyDrivers as any[]) || []).map((d) => ({ name: d.name || '', phone: d.phone || '' })));
                setCars(((companyCars as any[]) || []).map((c) => ({ car_number: c.car_number || '', car_model: c.car_model || '' })));
            } catch (e) {
                console.error(e);
                setAlert({ visible: true, message: t('error') || 'Error loading company', type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value } as Company));
    };

    const uploadLogo = async (file: File): Promise<string | null> => {
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const path = `${id}/logo-${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
            return data.publicUrl || null;
        } catch (e) {
            console.error(e);
            setAlert({ visible: true, message: t('error') || 'Error uploading logo', type: 'danger' });
            return null;
        }
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.company_name?.trim()) {
            setAlert({ visible: true, message: t('name') + ' ' + (t('required') || 'required'), type: 'danger' });
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                company_name: form.company_name,
                company_number: form.company_number || null,
                phone: form.phone || null,
                email: form.email || null,
                address: form.address || null,
                location: form.location || null,
                logo_url: form.logo_url || null,
                delivery_price: form.delivery_price ?? null,
                details: form.details || null,
                latitude: form.latitude ?? null,
                longitude: form.longitude ?? null,
            };
            const { error } = await supabase.from('delivery_companies').update(payload).eq('id', id);
            if (error) throw error;
            setAlert({ visible: true, message: t('updated_successfully'), type: 'success' });
        } catch (err: any) {
            console.error(err);
            setAlert({ visible: true, message: err.message || (t('error') || 'Error updating record'), type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <button onClick={() => router.back()} className="hover:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <ul className="flex space-x-2 rtl:space-x-reverse items-center">
                        <li>
                            <Link href="/" className="text-primary hover:underline">{t('home')}</Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                            <Link href="/delivery-companies" className="text-primary hover:underline">{t('delivery_companies') || 'Delivery Companies'}</Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                            <span className="text-black dark:text-white-dark">{t('edit')}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <form onSubmit={save}>
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
                        <div className="mb-5"><h5 className="text-lg font-semibold dark:text-white-light">{t('basic_information')}</h5></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold">{t('name')}</label>
                                    <input name="company_name" type="text" className="form-input" value={form.company_name || ''} onChange={handleInputChange} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold">{t('number') || 'Company Number'}</label>
                                    <input name="company_number" type="text" className="form-input" value={form.company_number || ''} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold">{t('phone')}</label>
                                    <input name="phone" type="tel" className="form-input" value={form.phone || ''} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold">{t('email') || 'Email'}</label>
                                    <input name="email" type="email" className="form-input" value={form.email || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <label className="block text-sm font-bold mb-3">{t('logo') || 'Logo'}</label>
                                <div className="mb-4">
                                    <img src={form.logo_url || '/assets/images/user-placeholder.webp'} alt="Company Logo" className="w-36 h-36 rounded-full object-cover border-2 border-gray-200" />
                                </div>
                                <div className="relative">
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = await uploadLogo(file);
                                        if (url) {
                                            setForm((prev) => ({ ...prev, logo_url: url }));
                                            await supabase.from('delivery_companies').update({ logo_url: url }).eq('id', id);
                                        }
                                    }} />
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => fileInputRef.current?.click()}>{t('select_logo')}</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                            <div>
                                <label className="block text-sm font-bold">{t('price') || 'Delivery Price'}</label>
                                <input name="delivery_price" type="number" step="0.01" className="form-input" value={form.delivery_price ?? ''} onChange={handleInputChange} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold">{t('details') || 'Details'}</label>
                                <textarea name="details" className="form-textarea" rows={4} value={form.details || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="panel mb-5">
                        <div className="mb-5"><h5 className="text-lg font-semibold dark:text-white-light">{t('address')}</h5></div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white">{t('address')}</label>
                                <div className="flex items-center">
                                    <span className="mt-1 ltr:mr-2 rtl:ml-2 text-primary"><IconMapPin className="h-5 w-5" /></span>
                                    <textarea name="address" className="form-textarea flex-1" value={form.address || ''} onChange={handleInputChange} rows={2} />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white">{t('location')}</label>
                                <input name="location" type="text" className="form-input" value={form.location || ''} onChange={handleInputChange} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white">{t('company_location') || 'Company Location'}</label>
                                <div className="h-[400px] mb-4">
                                    <MapSelector
                                        initialPosition={form.latitude && form.longitude ? [form.latitude, form.longitude] : null}
                                        onChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                                        height="400px"
                                        useCurrentLocationByDefault={false}
                                    />
                                </div>
                                {form.latitude && form.longitude && (
                                    <p className="text-sm mt-2">{t('selected_coordinates')}: <span className="font-semibold">{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</span></p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <button type="button" className="btn btn-outline-danger" onClick={() => router.back()}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') || 'Saving...' : t('save_changes') || 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
};

export default EditDeliveryCompanyPage;


