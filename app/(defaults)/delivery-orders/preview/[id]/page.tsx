'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

interface DeliveryOrderData {
    id: number;
    order_id: number;
    shop_id: number;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    orders?: any;
    shops?: any;
    delivery_cars?: {
        id: number;
        car_number: string;
        car_model: string;
        driver?: {
            id: number;
            name: string;
            phone: string;
        };
    }[];
}

const deliveryMethods = [
    { value: 'pazar', label: 'Pazar Delivery' },
    { value: 'shop', label: 'Shop Direct' },
    { value: 'external', label: 'External Company' },
];

const statusColors: Record<string, string> = {
    processing: 'badge-outline-warning',
    'on the way': 'badge-outline-primary',
    completed: 'badge-outline-success',
};

const DeliveryOrderPreview = () => {
    const params = useParams();
    const idParam = params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const cleanId = typeof id === 'string' ? id.split(':')[0] : id;

    const [deliveryOrder, setDeliveryOrder] = useState<DeliveryOrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [debugMsg, setDebugMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeliveryOrder = async () => {
            if (!id) {
                setDebugMsg('No ID found in URL params');
                setLoading(false);
                return;
            }

            setLoading(true);
            setDebugMsg(`Fetching delivery_order with order_id: ${cleanId}`);

            const { data, error } = await supabase
                .from('delivery_orders')
                .select(
                    `
                    *,
                    orders (
                        id, created_at, status, shipping_method, shipping_address, payment_method,
                        products (
                            id, title, price, images, shop,
                            shops (id, shop_name, logo_url, address, phone_numbers)
                        ),
                        profiles (id, full_name, email, phone)
                    ),
                    shops (
                        id, shop_name, logo_url, address, phone_numbers, delivery_method
                    ),
                    delivery_cars (
                        id, car_number, car_model,
                        driver:delivery_drivers (id, name, phone)
                    )
                `,
                )
                .eq('order_id', cleanId);

            if (error) {
                console.error('Supabase error:', error);
                setDebugMsg(`Supabase error: ${error.message}`);
                setDeliveryOrder(null);
            } else if (!data || data.length === 0) {
                console.warn('No delivery order found for ID:', cleanId);
                setDebugMsg(`No delivery order found for ID: ${cleanId}`);
                setDeliveryOrder(null);
            } else {
                setDeliveryOrder(data[0] as DeliveryOrderData);
                setDebugMsg(`Delivery order fetched successfully for ID: ${cleanId}`);
            }

            setLoading(false);
        };

        fetchDeliveryOrder();
    }, [cleanId, id, idParam]);

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!deliveryOrder)
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="text-red-500 text-lg font-semibold">Delivery Order Not Found</div>
                {debugMsg && <div className="mt-2 text-sm text-gray-400">{debugMsg}</div>}
            </div>
        );

    const order = deliveryOrder.orders;
    const shop = deliveryOrder.shops || order?.products?.shops;
    const cars = deliveryOrder.delivery_cars || [];

    const statusBadge = (status: string) => <span className={`badge ${statusColors[status] || 'badge-outline-secondary'} mx-2`}>{status.replace(/^\w/, (c) => c.toUpperCase())}</span>;

    return (
        <div className="p-4 md:p-8">
            <div className="mb-4">
                <Link href="/delivery-orders" className="text-primary hover:underline">
                    &larr; Back to Delivery Orders
                </Link>
            </div>

            <div className="panel max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Delivery Order #{deliveryOrder.id}</h2>
                        <div className="text-gray-500 text-sm">Created: {new Date(deliveryOrder.created_at).toLocaleString()}</div>
                        <div className="mt-2">
                            <strong>Status:</strong> {statusBadge(deliveryOrder.status)}
                        </div>
                    </div>
                    {shop?.logo_url && <img src={shop.logo_url} alt={shop.shop_name} className="h-20 w-20 rounded-lg object-cover border" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shop Info */}
                    <div className="panel border border-gray-200 dark:border-gray-700">
                        <h6 className="mb-2 text-lg font-semibold">Shop Information</h6>
                        <div className="space-y-2 text-white-dark">
                            <div>
                                <strong>Name:</strong> {shop?.shop_name || 'N/A'}
                            </div>
                            {shop?.address && (
                                <div>
                                    <strong>Address:</strong> {shop.address}
                                </div>
                            )}
                            {shop?.phone_numbers && shop.phone_numbers.length > 0 && (
                                <div>
                                    <strong>Phone:</strong> {shop.phone_numbers.join(', ')}
                                </div>
                            )}
                            {shop?.delivery_method && (
                                <div>
                                    <strong>Delivery Method:</strong> {deliveryMethods.find((m) => m.value === shop.delivery_method)?.label || '-'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cars & Drivers */}
                    <div className="panel border border-gray-200 dark:border-gray-700">
                        <h6 className="mb-2 text-lg font-semibold">Cars & Drivers</h6>
                        <div className="space-y-2 text-white-dark">
                            {cars.length > 0 ? (
                                <ul className="list-disc pl-5">
                                    {cars.map((car) => (
                                        <li key={car.id}>
                                            {car.car_model || 'Unknown Model'} ({car.car_number || 'N/A'}) - {car.driver?.name || 'No Driver'} / {car.driver?.phone || 'N/A'}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                'N/A'
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                {order && (
                    <div className="panel border border-gray-200 dark:border-gray-700 mt-6 p-4 md:p-6">
                        <h6 className="mb-4 text-lg font-semibold">Order Information</h6>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            {/* Order details */}
                            <div className="flex-1 space-y-2 text-white-dark">
                                <div>
                                    <strong>Order ID:</strong> {order.id}
                                </div>
                                <div>
                                    <strong>Product:</strong> {order.products?.title || 'N/A'}
                                </div>
                                <div>
                                    <strong>Customer:</strong> {order.profiles?.full_name || 'N/A'}
                                </div>
                                <div>
                                    <strong>Payment:</strong> {order.payment_method?.type || 'N/A'}
                                </div>
                                <div>
                                    <strong>Shipping Method:</strong> {order.shipping_method?.type || 'N/A'}
                                </div>
                                <div>
                                    <strong>Shipping Address:</strong> {order.shipping_address?.address || 'N/A'}
                                </div>
                                <div>
                                    <strong>Total:</strong> {order.products?.price ? `${order.products.price} ₪` : '-'}
                                </div>
                            </div>

                            {/* Product Image */}
                            {order.products?.images && order.products.images.length > 0 && (
                                <div className="flex-shrink-0">
                                    <img src={order.products.images[0]} alt={order.products.title} className="h-40 w-40 object-cover rounded-lg border" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {deliveryOrder.notes && (
                    <div className="panel border border-gray-200 dark:border-gray-700 mt-6">
                        <h6 className="mb-2 text-lg font-semibold">Notes</h6>
                        <div className="text-white-dark">{deliveryOrder.notes}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrderPreview;
