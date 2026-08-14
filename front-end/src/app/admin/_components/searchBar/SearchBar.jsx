// src/app/admin/_components/searchBar/SearchBar.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  delay = 300,
}) {
  // Local state for instant typing response
  const [displayValue, setDisplayValue] = useState(value);

  // Ref to hold the active timer ID across renders
  const timerRef = useRef(null);

  // Keep internal state synced if parent value changes externally (e.g., form reset)
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;

    // 1. Update local display immediately so typing feels instant
    setDisplayValue(newValue);

    // 2. Clear any pending timer from previous keystrokes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 3. Set a new timer to notify parent only after user stops typing
    timerRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
    }, delay);
  };

  return (
    <div className="w-full max-w-xs">
      <Input
        prefix={<SearchOutlined className="text-gray-400 mr-1" />}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        allowClear
        className="h-10 rounded-lg shadow-sm hover:border-amber-500 focus:border-amber-500"
      />
    </div>
  );
}