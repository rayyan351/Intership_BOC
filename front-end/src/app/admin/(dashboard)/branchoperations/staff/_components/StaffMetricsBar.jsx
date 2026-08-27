// src/app/admin/(dashboard)/branchoperations/staff/_components/StaffMetricsBar.jsx
'use client';

import React from 'react';
import { TeamOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

export default function StaffMetricsBar({ metrics, activeStatusFilter, onStatusFilterChange }) {
  const cards = [
    {
      id: '',
      label: 'Total Staff',
      count: metrics.total,
      icon: <TeamOutlined className="text-base" />,
      iconBg: 'bg-slate-100 text-slate-700',
      activeStyles: 'border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900/10',
      inactiveStyles: 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300',
      activePill: 'bg-neutral-900 text-white',
      inactivePill: 'bg-slate-200/70 text-slate-600',
    },
    {
      id: 'active',
      label: 'Active Accounts',
      count: metrics.active,
      icon: <CheckCircleOutlined className="text-base" />,
      iconBg: 'bg-emerald-50 text-emerald-600',
      activeStyles: 'border-emerald-500 bg-emerald-50/30 shadow-sm ring-1 ring-emerald-500/20',
      inactiveStyles: 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300',
      activePill: 'bg-emerald-600 text-white',
      inactivePill: 'bg-slate-200/70 text-slate-600',
    },
    {
      id: 'inactive',
      label: 'Suspended / Inactive',
      count: metrics.inactive,
      icon: <StopOutlined className="text-base" />,
      iconBg: 'bg-rose-50 text-rose-500',
      activeStyles: 'border-rose-400 bg-rose-50/30 shadow-sm ring-1 ring-rose-400/20',
      inactiveStyles: 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300',
      activePill: 'bg-rose-500 text-white',
      inactivePill: 'bg-slate-200/70 text-slate-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {cards.map((card) => {
        const isActive = activeStatusFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onStatusFilterChange(card.id)}
            className={`p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex items-center justify-between select-none ${
              isActive ? card.activeStyles : card.inactiveStyles
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform ${card.iconBg}`}
              >
                {card.icon}
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500 block tracking-tight">
                  {card.label}
                </span>
                <span className="text-xl font-extrabold text-neutral-900 leading-none mt-1 block tracking-tight">
                  {card.count}
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                isActive ? card.activePill : card.inactivePill
              }`}
            >
              {card.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}