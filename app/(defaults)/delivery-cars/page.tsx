'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import { sortBy } from 'lodash';
import { DataTableSortStatus, DataTable } from 'mantine-datatable';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ConfirmModal from '@/components/modals/confirm-modal';
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
    driver_name?: string | null;
    shops?: {
        shop_name: string;
    } | null;
}

const DeliveryCarsList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<DeliveryCar[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<DeliveryCar[]>([]);
    const [records, setRecords] = useState<DeliveryCar[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<DeliveryCar[]>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [carToDelete, setCarToDelete] = useState<DeliveryCar | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const { data, error } = await supabase
                    .from('delivery_cars')
                    .select(
                        `
                        *,
                        shops(shop_name),
                        delivery_drivers!inner(name, phone)
                    `,
                    )
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // اختر أول سائق مرتبط بالسيارة
                const carsWithDriver = (data || []).map((car: any) => ({
                    ...car,
                    driver_name: car.delivery_drivers?.[0]?.name || '-',
                    driver_phone: car.delivery_drivers?.[0]?.phone || '-',
                }));

                setItems(carsWithDriver as DeliveryCar[]);
            } catch (error) {
                console.error('Error fetching delivery cars:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
    }, []);

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
            items.filter((item) => {
                const s = search.toLowerCase();
                return (
                    (item.plate_number || '').toLowerCase().includes(s) ||
                    (item.brand || '').toLowerCase().includes(s) ||
                    (item.model || '').toLowerCase().includes(s) ||
                    (item.color || '').toLowerCase().includes(s) ||
                    (item.car_number || '').toLowerCase().includes(s) ||
                    (item.car_model || '').toLowerCase().includes(s) ||
                    (item.driver_name || '').toLowerCase().includes(s) ||
                    (item.shops?.shop_name || '').toLowerCase().includes(s)
                );
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor as keyof DeliveryCar);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const deleteRow = (id: number | null = null) => {
        if (id) {
            const found = items.find((c) => c.id === id);
            if (found) {
                setCarToDelete(found);
                setShowConfirmModal(true);
            }
        }
    };

    const confirmDeletion = async () => {
        if (!carToDelete || !carToDelete.id) return;
        try {
            const { error } = await supabase.from('delivery_cars').delete().eq('id', carToDelete.id);
            if (error) throw error;
            setItems((prev) => prev.filter((c) => c.id !== carToDelete.id));
            setAlert({ visible: true, message: t('deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Deletion error:', error);
            setAlert({ visible: true, message: t('error_deleting_record'), type: 'danger' });
        } finally {
            setShowConfirmModal(false);
            setCarToDelete(null);
        }
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {alert.visible && (
                <div className="mb-4 ml-4 max-w-96">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') : t('error')}
                        message={alert.message}
                        onClose={() => setAlert({ visible: false, message: '', type: 'success' })}
                    />
                </div>
            )}
            <div className="invoice-table">
                <div className="mb-4.5 flex flex-col gap-5 px-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-danger gap-2">
                            <IconTrashLines />
                            {t('delete')}
                        </button>
                        <Link href="/delivery-cars/add" className="btn btn-primary gap-2">
                            <IconPlus />
                            {t('add_new')}
                        </Link>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="datatables pagination-padding relative">
                    <DataTable
                        className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap cursor-pointer'}`}
                        records={records}
                        onRowClick={(record) => {
                            router.push(`/delivery-cars/edit/${record.id}`);
                        }}
                        columns={[
                            { accessor: 'id', title: t('id'), sortable: true, render: ({ id }) => <strong className="text-info">#{id}</strong> },
                            { accessor: 'shops.shop_name', title: t('shop'), sortable: true, render: ({ shops }) => <span>{shops?.shop_name || '—'}</span> },
                            { accessor: 'plate_number', title: t('plate_number'), sortable: true },
                            { accessor: 'brand', title: t('brand'), sortable: true },
                            { accessor: 'model', title: t('model'), sortable: true },
                            { accessor: 'color', title: t('color'), sortable: true },
                            { accessor: 'capacity', title: t('capacity'), sortable: true },
                            { accessor: 'driver_name', title: t('driver_name'), sortable: true, render: ({ driver_name }) => <span>{driver_name || '-'}</span> },
                            {
                                accessor: 'status',
                                title: t('status'),
                                sortable: true,
                                render: ({ status }) => {
                                    const v = (status || '').toString();
                                    const statusClass = v === 'active' || v === 'Approved' ? 'success' : v === 'inactive' || v === 'Rejected' ? 'danger' : 'warning';
                                    return <span className={`badge badge-outline-${statusClass}`}>{v || t('pending')}</span>;
                                },
                            },
                            {
                                accessor: 'created_at',
                                title: t('created_date'),
                                sortable: true,
                                render: ({ created_at }) => (created_at ? <span>{new Date(created_at).toLocaleDateString()}</span> : ''),
                            },
                            {
                                accessor: 'action',
                                title: t('actions'),
                                sortable: false,
                                textAlignment: 'center',
                                render: ({ id }) => (
                                    <div className="mx-auto flex w-max items-center gap-4">
                                        <Link href={`/delivery-cars/edit/${id}`} className="flex hover:text-info" onClick={(e) => e.stopPropagation()}>
                                            <IconEdit className="h-4.5 w-4.5" />
                                        </Link>
                                        <Link href={`/delivery-cars/preview/${id}`} className="flex hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                            <IconEye />
                                        </Link>
                                        <button
                                            type="button"
                                            className="flex hover:text-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteRow(id as number);
                                            }}
                                        >
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        highlightOnHover
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                        paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                        minHeight={300}
                    />

                    {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_deletion')}
                message={t('confirm_delete_record')}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setCarToDelete(null);
                }}
                onConfirm={confirmDeletion}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
                size="sm"
            />
        </div>
    );
};

export default DeliveryCarsList;
