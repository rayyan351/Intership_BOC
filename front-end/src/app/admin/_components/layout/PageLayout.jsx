// src/app/admin/_components/layout/PageLayout.jsx
import React from 'react';
import CustomButton from '../formElements/button/Custombutton';
import { PlusOutlined } from '@ant-design/icons';
import CustomCard from '../cards/CustomCard';
import SearchBar from '../searchBar/SearchBar';

export default function PageLayout({
  title,
  subTitle,
  children,
  onAdd,
  addText = "Add",
  searchValue,
  onSearch,
  searchPlaceholder = "Search...",
  showSearch = true,
  extra, // Custom components (e.g. dropdown filters)
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Subtitle Area */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-gray-900">
            {title}
          </h1>
          {subTitle && <p className="text-xs sm:text-sm text-gray-500">{subTitle}</p>}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {extra && extra}

          {showSearch && onSearch && (
            <SearchBar
              value={searchValue}
              onChange={onSearch}
              placeholder={searchPlaceholder}
            />
          )}

          {onAdd && (
            <CustomButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
              className="bg-[#ffc400] text-black hover:!bg-[#e6b000] font-semibold border-none h-10 px-5 rounded-xl flex items-center justify-center shadow-sm"
            >
              {addText}
            </CustomButton>
          )}
        </div>
      </div>

      {/* Main Content Card Container */}
      <CustomCard>
        {children}
      </CustomCard>
    </div>
  );
}