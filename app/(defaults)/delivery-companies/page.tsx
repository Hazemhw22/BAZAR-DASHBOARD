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

interface DeliveryCompany {
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
    updated_at?: string | null;
}

const DeliveryCompaniesList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<DeliveryCompany[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<DeliveryCompany[]>([]);
    const [records, setRecords] = useState<DeliveryCompany[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<DeliveryCompany[]>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<DeliveryCompany | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data, error } = await supabase.from('delivery_companies').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                setItems((data as DeliveryCompany[]) || []);
            } catch (error) {
                console.error('Error fetching delivery companies:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
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
                    (item.company_name || '').toLowerCase().includes(s) ||
                    (item.company_number || '').toLowerCase().includes(s) ||
                    (item.phone || '').toLowerCase().includes(s) ||
                    (item.email || '').toLowerCase().includes(s) ||
                    (item.address || '').toLowerCase().includes(s)
                );
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor as keyof DeliveryCompany);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const deleteRow = (id: number | null = null) => {
        if (id) {
            const found = items.find((c) => c.id === id);
            if (found) {
                setCompanyToDelete(found);
                setShowConfirmModal(true);
            }
        }
    };

    const confirmDeletion = async () => {
        if (!companyToDelete || !companyToDelete.id) return;
        try {
            const { error } = await supabase.from('delivery_companies').delete().eq('id', companyToDelete.id);
            if (error) throw error;
            setItems((prev) => prev.filter((c) => c.id !== companyToDelete.id));
            setAlert({ visible: true, message: t('deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Deletion error:', error);
            setAlert({ visible: true, message: t('error_deleting_record'), type: 'danger' });
        } finally {
            setShowConfirmModal(false);
            setCompanyToDelete(null);
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
                        <Link href="/delivery-companies/add" className="btn btn-primary gap-2">
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
                            router.push(`/delivery-companies/preview/${record.id}`);
                        }}
                        columns={[
                            { accessor: 'id', title: t('id'), sortable: true, render: ({ id }) => <strong className="text-info">#{id}</strong> },
                            {
                                accessor: 'company_name',
                                title: t('name') || 'Name',
                                sortable: true,
                                render: ({ company_name, logo_url }) => (
                                    <div className="flex items-center font-semibold">
                                        <div className="w-max rounded-full ltr:mr-2 rtl:ml-2 flex items-center justify-center">
                                            <img className="h-8 w-8 rounded-full object-cover" src={logo_url || `/assets/images/user-placeholder.webp`} alt="" />
                                        </div>
                                        <div>{company_name}</div>
                                    </div>
                                ),
                            },
                            { accessor: 'company_number', title: t('number') || 'Number', sortable: true },
                            { accessor: 'phone', title: t('phone'), sortable: true },
                            { accessor: 'email', title: t('email') || 'Email', sortable: true },
                            {
                                accessor: 'delivery_price',
                                title: t('price') || 'Price',
                                sortable: true,
                                render: ({ delivery_price }) => (delivery_price !== null && delivery_price !== undefined ? <span>{Number(delivery_price).toFixed(2)}</span> : '—'),
                            },
                            {
                                accessor: 'created_at',
                                title: t('created_date') || 'Created',
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
                                        <Link href={`/delivery-companies/edit/${id}`} className="flex hover:text-info" onClick={(e) => e.stopPropagation()}>
                                            <IconEdit className="h-4.5 w-4.5" />
                                        </Link>
                                        <Link href={`/delivery-companies/preview/${id}`} className="flex hover:text-primary" onClick={(e) => e.stopPropagation()}>
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
                    setCompanyToDelete(null);
                }}
                onConfirm={confirmDeletion}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
                size="sm"
            />
        </div>
    );
};

export default DeliveryCompaniesList;


