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
import { DataTable } from 'mantine-datatable';

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
    owner_name?: string | null;
}

const CompanyPreview = () => {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { t } = getTranslation();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({ visible: false, message: '', type: 'danger' });
    const [activeTab, setActiveTab] = useState<'details' | 'prices' | 'orders' | 'shops'>('details');

    interface DeliveredProductRecord {
        id: number;
        product_name: string;
        product_image?: string | null;
        shop_id?: number | null;
        shop_name?: string | null;
        price: number;
        delivery_price: number | null;
    }
    const [deliveredProducts, setDeliveredProducts] = useState<DeliveredProductRecord[]>([]);
    const [dpLoading, setDpLoading] = useState(false);

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

    // Fetch delivered products when the tab is active
    useEffect(() => {
        const fetchDeliveredProducts = async () => {
            if (!id || activeTab !== 'orders') return;
            setDpLoading(true);
            try {
                const { data: ordersData, error } = await supabase
                    .from('orders')
                    .select(
                        `id, delivery_price, product_id, products!inner(id, title, price, sale_price, thumbnail_url, image_url, shop)`
                    )
                    .eq('delivery_company_id', id)
                    .order('created_at', { ascending: false });
                if (error) throw error;

                const records: DeliveredProductRecord[] = (ordersData || []).map((o: any) => {
                    const product = Array.isArray(o.products) ? o.products[0] : o.products;
                    const price = product?.sale_price ?? product?.price ?? 0;
                    const image = product?.thumbnail_url || product?.image_url || null;
                    return {
                        id: o.id,
                        product_name: product?.title || 'Unknown',
                        product_image: image,
                        shop_id: product?.shop ?? null,
                        price: Number(price) || 0,
                        delivery_price: o.delivery_price ?? null,
                    };
                });

                // Fetch shop names for displayed products
                const shopIds = Array.from(new Set(records.map((r) => r.shop_id).filter(Boolean))) as number[];
                if (shopIds.length) {
                    const { data: shopsData } = await supabase.from('shops').select('id, shop_name').in('id', shopIds);
                    const idToName = new Map<number, string>((shopsData || []).map((s: any) => [s.id, s.shop_name]));
                    records.forEach((r) => {
                        r.shop_name = r.shop_id ? idToName.get(r.shop_id) || null : null;
                    });
                }

                setDeliveredProducts(records);
            } catch (e) {
                console.error(e);
                setAlert({ visible: true, message: t('error') || 'Error loading delivered products', type: 'danger' });
            } finally {
                setDpLoading(false);
            }
        };
        fetchDeliveredProducts();
    }, [id, activeTab]);

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
                    <span>{company.company_name}</span>
                </li>
            </ul>

            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            {/* Header cover like shops */}
            <div className="mb-6 rounded-md overflow-hidden">
                <div className="relative h-64 w-full">
                    <img src={company.logo_url || '/assets/images/img-placeholder-fallback.webp'} alt={`${company.company_name} Cover`} className="h-full w-full object-cover" />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-6">
                        <div className="flex items-center">
                            <div className="h-24 w-24 rounded-lg border-4 border-white overflow-hidden bg-white mr-4">
                                <img src={company.logo_url || '/assets/images/user-placeholder.webp'} alt={company.company_name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{company.company_name}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-5">
                <div className="flex border-b border-[#ebedf2] dark:border-[#191e3a]">
                    <button
                        type="button"
                        className={`p-4 border-b-2 ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        {t('details') || 'Details'}
                    </button>
                    <button
                        type="button"
                        className={`p-4 border-b-2 ${activeTab === 'prices' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => setActiveTab('prices')}
                    >
                        {t('prices') || 'Prices'}
                    </button>
                    <button
                        type="button"
                        className={`p-4 border-b-2 ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        {t('orders') || 'Orders'}
                    </button>
                    <button
                        type="button"
                        className={`p-4 border-b-2 ${activeTab === 'shops' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => setActiveTab('shops')}
                    >
                        {t('shops') || 'shops'}
                    </button>
                  
                </div>
            </div>

            {activeTab === 'details' && (
                <div className="panel p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h5 className="text-lg font-semibold mb-3">{t('details') || 'Details'}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">{t('company_owner') || 'Company Owner'}</div>
                                        <div>{company.owner_name || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">{t('phone')}</div>
                                        <div className="flex items-center">
                                            <IconPhone className="h-5 w-5 text-success mr-2" />
                                            {company.phone || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">{t('email') || 'Email'}</div>
                                        <div>{company.email || '—'}</div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <div className="text-sm text-gray-500">{t('address')}</div>
                                        <div className="flex">
                                            <IconMapPin className="h-5 w-5 text-primary mr-2" />
                                            {company.address || '—'}
                                        </div>
                                    </div>
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
            )}

            {activeTab === 'prices' && (
                <div className="panel p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-500">{t('delivery_price') || 'Delivery Price'}</div>
                            <div>{company.delivery_price != null ? Number(company.delivery_price).toFixed(2) : '—'}</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="panel p-6">
                    <p className="text-gray-500">{t('no_orders_placeholder') || 'Orders view coming soon.'}</p>
                </div>
            )}

            {activeTab === 'shops' && (
                <div className="panel p-6">
                    <p className="text-gray-500">{t('no_shops_placeholder') || 'shops linked to this delivery company will be shown here.'}</p>
                </div>
            )}

           
        </div>
    );
};

export default CompanyPreview;


