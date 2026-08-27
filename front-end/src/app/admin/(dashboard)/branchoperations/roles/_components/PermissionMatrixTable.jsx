// src/app/admin/(dashboard)/branchoperations/roles/_components/PermissionMatrixTable.jsx
'use client';

import React, { useState, useMemo } from 'react';
import { Spin } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import { useGetRolesAndModulesQuery } from '@/services/roleApi';

const ACTION_TYPES = [
  { type: 'view', label: 'View', width: 'w-[12%]' },
  { type: 'create', label: 'Add', width: 'w-[12%]' },
  { type: 'edit', label: 'Update', width: 'w-[12%]' },
  { type: 'delete', label: 'Delete', width: 'w-[12%]' },
  { type: 'special', label: 'Status / Stock', width: 'w-[14%]' },
];

export default function PermissionMatrixTable({ value = [], onChange }) {
  const { data, isLoading } = useGetRolesAndModulesQuery();
  const modules = data?.modules || [];
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const globalColumnKeys = useMemo(() => {
    const mapping = {};
    ACTION_TYPES.forEach((act) => {
      mapping[act.type] = modules
        .flatMap((mod) => mod.resources)
        .flatMap((res) => res.actions)
        .filter((a) => a.type === act.type)
        .map((a) => a.key);
    });
    return mapping;
  }, [modules]);

  const handleGlobalColumnToggle = (actionType, enable) => {
    if (!onChange) return;
    const targetKeys = globalColumnKeys[actionType] || [];
    let updated;
    if (enable) {
      updated = Array.from(new Set([...value, ...targetKeys]));
    } else {
      updated = value.filter((k) => !targetKeys.includes(k));
    }
    onChange(updated);
  };

  const handleModuleRowToggle = (columnKeys, enable) => {
    if (!onChange) return;
    let updated;
    if (enable) {
      updated = Array.from(new Set([...value, ...columnKeys]));
    } else {
      updated = value.filter((k) => !columnKeys.includes(k));
    }
    onChange(updated);
  };

  const handleToggleSingle = (key) => {
    if (!onChange) return;
    const exists = value.includes(key);
    const updated = exists ? value.filter((k) => k !== key) : [...value, key];
    onChange(updated);
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex justify-center items-center">
        <Spin tip="Loading matrix..." />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-400 text-[11px] font-semibold">
              <th className="py-2.5 px-4 w-[38%] font-semibold">Module / Resource</th>
              {ACTION_TYPES.map((act) => {
                const colKeys = globalColumnKeys[act.type] || [];
                const isGlobalChecked = colKeys.length > 0 && colKeys.every((k) => value.includes(k));

                return (
                  <th key={act.type} className={`py-2.5 px-2 text-center ${act.width}`}>
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="font-semibold text-neutral-500 text-[11px]">{act.label}</span>
                      {colKeys.length > 0 && (
                        <CustomSwitch
                          checked={isGlobalChecked}
                          onChange={(checked) => handleGlobalColumnToggle(act.type, checked)}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100 text-xs">
            {modules.map((mod) => {
              const isCollapsed = Boolean(collapsedSections[mod.key]);

              return (
                <React.Fragment key={mod.key}>
                  {/* Category Header Row */}
                  <tr
                    onClick={() => toggleSection(mod.key)}
                    className="bg-neutral-50/70 hover:bg-neutral-100/60 cursor-pointer transition select-none"
                  >
                    <td className="py-2 px-4 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-neutral-400">
                          {isCollapsed ? <RightOutlined /> : <DownOutlined />}
                        </span>
                        <span className="text-xs font-semibold text-neutral-900">
                          {mod.title}
                        </span>
                      </div>
                    </td>

                    {ACTION_TYPES.map((act) => {
                      const columnKeys = mod.resources
                        .flatMap((r) => r.actions)
                        .filter((a) => a.type === act.type)
                        .map((a) => a.key);

                      if (!columnKeys.length) {
                        return (
                          <td key={act.type} className="py-2 px-2 text-center">
                            <span className="text-neutral-200 text-xs select-none">—</span>
                          </td>
                        );
                      }

                      const isAllChecked = columnKeys.every((k) => value.includes(k));

                      return (
                        <td
                          key={act.type}
                          className="py-2 px-2 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CustomSwitch
                            checked={isAllChecked}
                            onChange={(checked) => handleModuleRowToggle(columnKeys, checked)}
                          />
                        </td>
                      );
                    })}
                  </tr>

                  {/* Child Items */}
                  {!isCollapsed &&
                    mod.resources.map((res) => (
                      <tr key={res.resource} className="hover:bg-amber-50/20 transition">
                        <td className="py-2.5 px-4 pl-9">
                          <span className="font-medium text-neutral-700 block text-xs">
                            {res.resource}
                          </span>
                          {res.description && (
                            <span className="text-[11px] text-neutral-400 block font-normal">
                              {res.description}
                            </span>
                          )}
                        </td>

                        {ACTION_TYPES.map((act) => {
                          const targetAction = res.actions.find((a) => a.type === act.type);

                          return (
                            <td key={act.type} className="py-2.5 px-2 text-center">
                              {targetAction ? (
                                <CustomSwitch
                                  checked={value.includes(targetAction.key)}
                                  onChange={() => handleToggleSingle(targetAction.key)}
                                />
                              ) : (
                                <span className="text-neutral-200 select-none text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}