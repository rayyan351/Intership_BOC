// src/app/admin/(dashboard)/products/_components/DealsBundlesView.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Image } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
import DealModal from './DealModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import { formatPrice } from '@/lib/currency';
import {
  useGetDealsQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
} from '@/services/dealApi';

export default function DealsBundlesView({ searchTerm = '', createTrigger }) {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('deals:edit');
  const canDelete = hasPermission('deals:delete');
  const canToggleStatus = hasPermission('deals:status') || hasPermission('deals:toggle_stock');

  const { data: deals = [], isLoading } = useGetDealsQuery();
  const [createDeal, { isLoading: isCreating }] = useCreateDealMutation();
  const [updateDeal, { isLoading: isUpdating }] = useUpdateDealMutation();
  const [deleteDeal] = useDeleteDealMutation();

  // Listen for create button clicks from top PageLayout
  useEffect(() => {
    if (createTrigger && createTrigger.startsWith('deal-')) {
      setSelectedDeal(null);
      setIsModalOpen(true);
    }
  }, [createTrigger]);

  const handleSaveDeal = async (formData) => {
    try {
      if (selectedDeal) {
        await updateDeal({ id: selectedDeal._id, body: formData }).unwrap();
        showSuccess('Deal updated successfully!');
      } else {
        await createDeal(formData).unwrap();
        showSuccess('Deal created successfully!');
      }
      setIsModalOpen(false);
      setSelectedDeal(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save deal');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    if (!canToggleStatus) return;
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);

      const formData = new FormData();
      formData.append('isShown', isChecked);

      await updateDeal({ id: record._id, body: formData }).unwrap();

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsedTime));
      }

      showSuccess(`"${record.title}" ${isChecked ? 'is now active' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update deal status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteDeal = async (id) => {
    try {
      await deleteDeal(id).unwrap();
      showSuccess('Deal deleted successfully!');
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete deal');
    }
  };

  const filteredDeals = deals.filter(
    (deal) =>
      deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.dealType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Deal / Bundle',
      key: 'deal',
      width: 240,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.image?.startsWith('http') ? record.image : `http://localhost:5000${record.image}`}
            alt={record.title}
            width={46}
            height={46}
            className="rounded-xl object-cover border border-neutral-100 min-w-[46px] shrink-0"
            fallback="/placeholder.png"
            preview={false}
          />
          <div className="min-w-0">
            <span className="font-semibold text-neutral-900 text-xs block truncate">{record.title}</span>
            <span className="text-[11px] text-neutral-400 line-clamp-1 font-normal">{record.description || 'No description'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'dealType',
      key: 'dealType',
      width: 140,
      render: (type) => (
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
          {type}
        </span>
      ),
    },
    {
      title: 'Inclusions & Choices',
      key: 'inclusions',
      width: 320,
      render: (_, record) => (
        <div className="space-y-1">
          {record.fixedItems?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.fixedItems.map((item, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                >
                  {item.quantity}x {item.product?.name || 'Item'}
                </span>
              ))}
            </div>
          )}

          {record.choiceGroups?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.choiceGroups.map((cg, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700"
                >
                  {cg.selectCount}x {cg.title} ({cg.options?.length || 0} opts)
                </span>
              ))}
            </div>
          )}

          {!record.fixedItems?.length && !record.choiceGroups?.length && (
            <span className="text-xs text-neutral-400 font-normal">No items configured</span>
          )}
        </div>
      ),
    },
    {
      title: 'Pricing',
      key: 'pricing',
      width: 160,
      render: (_, record) => {
        const discount =
          record.originalPrice > 0
            ? Math.round(((record.originalPrice - record.dealPrice) / record.originalPrice) * 100)
            : 0;
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-neutral-900">
                {formatPrice(record.dealPrice || 0)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono">
                  {discount}% OFF
                </span>
              )}
            </div>
            {record.originalPrice > 0 && (
              <span className="text-[11px] font-mono text-neutral-400 line-through block mt-0.5">
                {formatPrice(record.originalPrice)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      width: 120,
      render: (isShown, record) => (
        <div className="flex items-center gap-2">
          <CustomSwitch
            checked={record.isShown ?? true}
            disabled={!canToggleStatus}
            loading={updatingId === record._id}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <span className={`text-[11px] font-semibold ${record.isShown ?? true ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {record.isShown ?? true ? 'Active' : 'Hidden'}
          </span>
        </div>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      render: (dateStr) => (
        <span className="text-neutral-500 text-xs font-normal whitespace-nowrap">
          {formatRelativeTime(dateStr)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      align: 'right',
      width: 100,
      render: (_, record) => {
        if (!canEdit && !canDelete) {
          return (
            <Tag color="default" className="text-[10px] font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }

        return (
          <TableActions
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => {
              setSelectedDeal(record);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDeleteDeal(record._id)}
            deleteTitle="Delete Deal / Bundle?"
            deleteDescription={`Are you sure you want to delete "${record.title}"?`}
          />
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <Table
          columns={columns}
          dataSource={filteredDeals}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 8,
            showTotal: (total, range) => (
              <span className="text-xs text-neutral-400 font-normal">
                Showing {range[0]}-{range[1]} of {total} deals
              </span>
            ),
          }}
          scroll={{ x: 1100 }}
          size="middle"
        />

        <DealModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDeal(null);
          }}
          onSubmit={handleSaveDeal}
          loading={isCreating || isUpdating}
          initialValues={selectedDeal}
        />
      </div>
    </>
  );
}