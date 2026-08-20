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
  { type: 'special', label: 'Status / Stock', width: 'w-[16%]' },
];

export default function PermissionMatrixTable({
  value = [],
  onChange,
}) {
  const { data, isLoading } = useGetRolesAndModulesQuery();
  const modules = data?.modules || [];
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Map all global action keys across all modules by action type
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

  // Handle Global Column Toggle (Turns ON/OFF the entire column for ALL modules)
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

  // Handle Module Row Toggle (Turns ON/OFF the action for a specific parent module)
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

  // Handle Single Action Toggle
  const handleToggleSingle = (key) => {
    if (!onChange) return;
    const exists = value.includes(key);
    const updated = exists ? value.filter((k) => k !== key) : [...value, key];
    onChange(updated);
  };

  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center items-center rounded-xl border border-neutral-200 bg-white">
        <Spin tip="Loading permission matrix..." />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Dual-Tier Header with Column Master Toggles */}
          {/* Dual-Tier Balanced Header */}
          {/* Dual-Tier Balanced Header */}
          <thead>
            {/* Tier 1: Main Category Titles */}
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-6 w-[36%] text-center align-middle border-r border-neutral-200">
                Resource Name
              </th>
              <th
                colSpan={5}
                className="py-2.5 px-3 text-center bg-neutral-100/60 text-neutral-800 text-[11px] font-bold uppercase tracking-wider"
              >
                Permissions
              </th>
            </tr>

            {/* Tier 2: Column Action Labels & Master Switches */}
            <tr className="bg-neutral-50/70 border-b border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              {/* Empty spacer under Resource Name */}
              <th className="py-2 px-6 border-r border-neutral-200 bg-neutral-50/40"></th>

              {/* Master Switches directly aligned under each action column */}
              {ACTION_TYPES.map((act) => {
                const colKeys = globalColumnKeys[act.type] || [];
                const isGlobalChecked = colKeys.length > 0 && colKeys.every((k) => value.includes(k));

                return (
                  <th key={act.type} className={`py-2 px-3 text-center ${act.width}`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] tracking-wider text-neutral-500 font-bold">{act.label}</span>
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
                  {/* Collapsible Parent Category Row */}
                  <tr
                    onClick={() => toggleSection(mod.key)}
                    className="bg-neutral-50/80 hover:bg-neutral-100/70 cursor-pointer transition select-none border-t border-b border-neutral-200/90"
                  >
                    <td className="py-2.5 px-6 font-bold text-neutral-900 border-r border-neutral-200/70">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[9px] text-neutral-400">
                          {isCollapsed ? <RightOutlined /> : <DownOutlined />}
                        </span>
                        <span className="text-xs uppercase tracking-wide">
                          {mod.title}
                        </span>
                      </div>
                    </td>

                    {/* Module-Level Category Switches */}
                    {ACTION_TYPES.map((act) => {
                      const columnKeys = mod.resources
                        .flatMap((r) => r.actions)
                        .filter((a) => a.type === act.type)
                        .map((a) => a.key);

                      if (!columnKeys.length) {
                        return (
                          <td key={act.type} className="py-2.5 px-3 text-center">
                            <span className="text-neutral-300 text-xs select-none">—</span>
                          </td>
                        );
                      }

                      const isAllChecked = columnKeys.every((k) => value.includes(k));

                      return (
                        <td
                          key={act.type}
                          className="py-2.5 px-3 text-center"
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

                  {/* Child Feature Rows */}
                  {!isCollapsed &&
                    mod.resources.map((res) => (
                      <tr key={res.resource} className="hover:bg-neutral-50/40 transition">
                        <td className="py-3 px-6 pl-11 border-r border-neutral-100">
                          <span className="font-semibold text-neutral-800 block text-xs">
                            {res.resource}
                          </span>
                          {res.description && (
                            <span className="text-[11px] text-neutral-400 block font-normal mt-0.5">
                              {res.description}
                            </span>
                          )}
                        </td>

                        {ACTION_TYPES.map((act) => {
                          const targetAction = res.actions.find((a) => a.type === act.type);

                          return (
                            <td key={act.type} className="py-3 px-3 text-center">
                              {targetAction ? (
                                <CustomSwitch
                                  checked={value.includes(targetAction.key)}
                                  onChange={() => handleToggleSingle(targetAction.key)}
                                />
                              ) : (
                                <span className="text-neutral-300 select-none text-xs">—</span>
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