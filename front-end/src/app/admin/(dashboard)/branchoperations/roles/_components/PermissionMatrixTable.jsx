// src/app/admin/(dashboard)/branchoperations/roles/_components/PermissionMatrixTable.jsx
'use client';

import React, { useState } from 'react';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';

const ACTION_TYPES = [
  { type: 'view', label: 'View', width: 'w-[12%]' },
  { type: 'create', label: 'Add', width: 'w-[12%]' },
  { type: 'edit', label: 'Update', width: 'w-[12%]' },
  { type: 'delete', label: 'Delete', width: 'w-[12%]' },
  { type: 'special', label: 'Status / Stock', width: 'w-[16%]' },
];

export default function PermissionMatrixTable({
  modules = [],
  selectedPermissions = [],
  onTogglePermission,
  onBatchToggle,
}) {
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Dual-Tier Header */}
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] font-bold uppercase tracking-wider">
              <th rowSpan={2} className="py-3 px-6 w-[36%] align-middle border-r border-neutral-200">
                Names
              </th>
              <th colSpan={5} className="py-2 px-3 text-center border-b border-neutral-200 bg-neutral-100/50 text-neutral-800 text-[11px]">
                Permissions
              </th>
            </tr>
            <tr className="bg-neutral-50/50 border-b border-neutral-200 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              {ACTION_TYPES.map((act) => (
                <th key={act.type} className={`py-2 px-3 text-center ${act.width}`}>
                  {act.label}
                </th>
              ))}
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

                    {/* Master Category Switches */}
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

                      const isAllChecked = columnKeys.every((k) => selectedPermissions.includes(k));

                      return (
                        <td
                          key={act.type}
                          className="py-2.5 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CustomSwitch
                            checked={isAllChecked}
                            onChange={(checked) => onBatchToggle(columnKeys, checked)}
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
                                  checked={selectedPermissions.includes(targetAction.key)}
                                  onChange={() => onTogglePermission(targetAction.key)}
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