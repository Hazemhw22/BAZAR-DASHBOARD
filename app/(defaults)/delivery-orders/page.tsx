'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { sortBy } from 'lodash';
import { createClient } from '@supabase/supabase-js';

// Types
interface Shop {
    id: string;
    shop_name: string;
}

interface OrderData {
    id: string;
    created_at: string;
    updated_at?: string;
    status: string;
    shipping_method: any;
    shipping_address: any;
    payment_method: any;
    notes?: string;
    products?: {
        id: number;
        title: string;
        price: number;
        images: any[];
        shop: number;
        shops?: {
            shop_name: string;
        };
    };
    profiles?: {
        id: string;
        full_name: string;
        email: string;
    };
}

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const deliveryMethods = [
    { value: 'pazar', label: 'Pazar Delivery' },
    { value: 'shop', label: 'Shop Direct' },
    { value: 'external', label: 'External Company' },
];

const statusSteps = ['processing', 'on the way', 'completed'];
const statusColors: Record<string, string> = {
    processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700',
    'on the way': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700',
};

const PAGE_SIZES = [10, 20, 30, 50, 100];

function parseJsonField(field: any) {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch {
            return {};
        }
    }
    return field || {};
}

function formatOrderForDisplay(order: OrderData) {
    const shippingAddress = parseJsonField(order.shipping_address);
    const paymentMethod = parseJsonField(order.payment_method);
    const shippingMethod = parseJsonField(order.shipping_method);

    return {
        id: order.id,
        name: order.products?.title || 'Product',
        image: order.products?.images?.[0] || null,
        buyer: order.profiles?.full_name || shippingAddress.name || 'Unknown Customer',
        shop_name: order.products?.shops?.shop_name || 'Unknown Shop',
        city: shippingAddress.city || '-',
        date: order.created_at,
        total: order.products?.price ? `${order.products.price} ₪` : '-',
        status: order.status,
        delivery: deliveryMethods.find((m) => m.value === shippingMethod?.type)?.label || '-',
        payment: paymentMethod?.type || '-',
        car: shippingMethod?.car || 'Toyota Camry',
        raw: order,
    };
}

// أضف هذه الدالة لرفع البيانات إلى جدول delivery_orders
async function insertDeliveryOrder(order: OrderData) {
    // يمكنك تعديل القيم حسب الحاجة أو حسب ما هو متوفر لديك
    const { id, status, created_at, updated_at, products, shipping_method } = order;
    const shop_id = products?.shop;
    const car_id = shipping_method?.car_id || null;
    const driver_id = shipping_method?.driver_id || null;
    const notes = order.notes || '';
    const order_id = id;

    const { error } = await supabase.from('delivery_orders').insert([
        {
            order_id,
            shop_id,
            car_id,
            driver_id,
            status,
            notes,
            created_at,
            updated_at: updated_at || created_at,
        },
    ]);
    return error;
}

export default function DeliveryOrdersPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<string>('');
    const [selectedDelivery, setSelectedDelivery] = useState<string>('');
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [displayOrders, setDisplayOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [sortStatus, setSortStatus] = useState<{ columnAccessor: string; direction: 'asc' | 'desc' }>({
        columnAccessor: 'date',
        direction: 'desc',
    });
    const [shopDeliveryMethod, setShopDeliveryMethod] = useState<string>('');

    // Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            const { data } = await supabase.from('shops').select('id, shop_name');
            if (data) {
                setShops(data);
                if (data.length > 0) setSelectedShop(data[0].id);
            }
        };
        fetchShops();
    }, []);

    // Fetch delivery_method for selected shop
    useEffect(() => {
        if (!selectedShop) {
            setShopDeliveryMethod('');
            return;
        }
        const fetchShopDelivery = async () => {
            const { data } = await supabase.from('shops').select('delivery_method').eq('id', selectedShop).single();
            setShopDeliveryMethod(data?.delivery_method || '');
        };
        fetchShopDelivery();
    }, [selectedShop, selectedDelivery]);

    // Fetch orders
    useEffect(() => {
        if (!selectedShop) {
            setOrders([]);
            setDisplayOrders([]);
            setLoading(false);
            return;
        }
        setOrders([]); // Clear previous orders immediately when shop changes
        setDisplayOrders([]);
        setLoading(true);
        const fetchOrders = async () => {
            let query = supabase
                .from('orders')
                .select(
                    `
      id, created_at, status, shipping_method, shipping_address, payment_method,
      products (
        id, title, price, images, shop,
        shops (shop_name)
      ),
      profiles (
        id, full_name, email
      )
    `,
                )
                .eq('products.shop', selectedShop);

            const { data } = await query.order('created_at', { ascending: false });
            if (data) {
                // تصفية الطلبات التي تحتوي على منتج ومتجر معروف فقط
                const normalizedOrders = data
                    .map((order: any) => ({
                        ...order,
                        products: Array.isArray(order.products) ? order.products[0] : order.products,
                        profiles: Array.isArray(order.profiles) ? order.profiles[0] : order.profiles,
                    }))
                    .filter((order: any) => order.products && order.products.title && order.products.shops && order.products.shops.shop_name && order.products.shop?.toString() === selectedShop);
                const formatted = normalizedOrders.map((order: any) => formatOrderForDisplay(order));
                setOrders(normalizedOrders);
                setDisplayOrders(formatted);
            } else {
                setOrders([]);
                setDisplayOrders([]);
            }
            setLoading(false);
        };
        fetchOrders();
    }, [selectedShop]);

    // Handle Delivery Method change and update all orders for selected shop
    const handleDeliveryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDelivery = e.target.value;
        if (!selectedShop || !newDelivery) {
            setSelectedDelivery(newDelivery);
            return;
        }

        const confirmed = window.confirm('Are you sure you want to update the delivery method for this shop?');
        if (!confirmed) return;

        setSelectedDelivery(newDelivery);
        setLoading(true);

        // تحديث فقط المتجر المختار
        await supabase.from('shops').update({ delivery_method: newDelivery }).eq('id', selectedShop);

        setLoading(false);
    };

    // Search & sort
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(
            displayOrders.filter((item) => {
                return (
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.buyer.toLowerCase().includes(search.toLowerCase()) ||
                    item.total.toLowerCase().includes(search.toLowerCase()) ||
                    item.shop_name.toLowerCase().includes(search.toLowerCase()) ||
                    item.city.toLowerCase().includes(search.toLowerCase())
                );
            }),
        );
    }, [search, displayOrders]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    }, [sortStatus]);

    // Update order status
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        const { data, error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId).select().single();

        if (!error && data) {
            // بعد تحديث الطلب، أضف أو حدث في جدول delivery_orders
            await insertDeliveryOrder(data);
            setDisplayOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
        }
    };

    return (
        <div className="p-2 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-6">
                <div className="w-full md:w-auto">
                    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">Shop</label>
                    <select
                        className="form-input w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2"
                        value={selectedShop}
                        onChange={(e) => {
                            setSelectedShop(e.target.value);
                            setDisplayOrders([]);
                            setRecords([]);
                        }}
                    >
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                                {shop.shop_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-auto">
                    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">Delivery Method</label>
                    <select
                        className="form-input w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2"
                        value={selectedDelivery}
                        onChange={handleDeliveryChange}
                    >
                        <option value="">All</option>
                        {deliveryMethods.map((method) => (
                            <option key={method.value} value={method.value}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div
                className="panel mt-4 md:mt-6 mx-auto overflow-x-auto"
                style={{
                    maxWidth: '100vw',
                    minWidth: 0,
                    width: '100%',
                    padding: '1rem',
                }}
            >
                {/* البحث فوق الجدول */}
                <div className="flex justify-end mb-3">
                    <input type="text" className="form-input w-full md:w-72" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="datatables">
                    <div className="overflow-x-auto">
                        <DataTable
                            className={loading ? 'pointer-events-none' : 'cursor-pointer'}
                            style={{ fontSize: '0.95rem', minWidth: 700 }}
                            records={records}
                            columns={[
                                {
                                    accessor: 'id',
                                    title: 'Order ID',
                                    sortable: true,
                                    render: ({ id }) => <strong className="text-info">#{id}</strong>,
                                },
                                {
                                    accessor: 'image',
                                    title: 'Image',
                                    sortable: false,
                                    render: ({ image, name }) => (
                                        <div className="flex items-center font-semibold">
                                            <div className="w-max rounded-full bg-white-dark/30 p-0.5 ltr:mr-2 rtl:ml-2">
                                                <img className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover" src={image || '/assets/images/product-placeholder.jpg'} alt={name} />
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'name',
                                    title: 'Product Name',
                                    sortable: true,
                                },
                                {
                                    accessor: 'buyer',
                                    title: 'Customer',
                                    sortable: true,
                                },
                                {
                                    accessor: 'shop_name',
                                    title: 'Shop',
                                    sortable: true,
                                    render: ({ shop_name }) => <span className="font-medium">{shop_name}</span>,
                                },
                                {
                                    accessor: 'city',
                                    title: 'City',
                                    sortable: true,
                                    render: ({ city }) => <span>{city}</span>,
                                },
                                {
                                    accessor: 'delivery',
                                    title: 'Delivery',
                                    sortable: false,
                                    render: () => <span>{deliveryMethods.find((m) => m.value === shopDeliveryMethod)?.label || '-'}</span>,
                                },
                                {
                                    accessor: 'payment',
                                    title: 'Payment',
                                    sortable: false,
                                },
                                {
                                    accessor: 'date',
                                    title: 'Date',
                                    sortable: true,
                                    render: ({ date }) => new Date(date).toLocaleDateString(),
                                },
                                {
                                    accessor: 'car',
                                    title: 'Car',
                                    sortable: false,
                                },
                                {
                                    accessor: 'total',
                                    title: 'Total',
                                    sortable: true,
                                    render: ({ total }) => <span className="font-semibold text-success">{total}</span>,
                                },
                                {
                                    accessor: 'status',
                                    title: <span style={{ fontSize: '1rem' }}>Status</span>,
                                    sortable: true,
                                    render: ({ status, id, raw }) => {
                                        // استخدم حالة محلية لكل صف
                                        const [selectedStatus, setSelectedStatus] = React.useState(status);

                                        const uniqueStatusSteps = Array.from(new Set(statusSteps));

                                        return (
                                            <div className="flex items-center gap-1 md:gap-2">
                                                <select
                                                    value={selectedStatus}
                                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                                    className={`
                        border rounded px-1 py-0.5 text-xs font-bold
                        transition
                        ${statusColors[selectedStatus] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'}
                    `}
                                                    style={{
                                                        fontSize: '0.85rem',
                                                        minWidth: 70,
                                                        maxWidth: 110,
                                                        paddingRight: 12,
                                                        paddingLeft: 6,
                                                    }}
                                                >
                                                    {uniqueStatusSteps.map((s) => (
                                                        <option
                                                            key={s}
                                                            value={s}
                                                            className={statusColors[s]}
                                                            style={{
                                                                color: s === 'processing' ? '#b45309' : s === 'on the way' ? '#1d4ed8' : s === 'completed' ? '#166534' : undefined,
                                                                background: s === 'processing' ? '#fef9c3' : s === 'on the way' ? '#dbeafe' : s === 'completed' ? '#bbf7d0' : undefined,
                                                            }}
                                                        >
                                                            {s.replace(/^\w/, (c) => c.toUpperCase())}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-50"
                                                    disabled={selectedStatus === status}
                                                    onClick={async () => {
                                                        if (selectedStatus !== status) {
                                                            // 1. تحديث حالة الطلب في جدول orders
                                                            await updateOrderStatus(id, selectedStatus);

                                                            // 2. رفع كل بيانات الطلب إلى جدول delivery_orders
                                                            await insertDeliveryOrder({
                                                                ...raw,
                                                                status: selectedStatus,
                                                            });

                                                            // 3. تحديث الحالة في الجدول مباشرة
                                                            setDisplayOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: selectedStatus } : order)));
                                                        }
                                                    }}
                                                    style={{ fontSize: '0.85rem' }}
                                                    title="Update"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    },
                                },
                            ]}
                            highlightOnHover
                            totalRecords={initialRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                            fetching={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
