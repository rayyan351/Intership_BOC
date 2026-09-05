// src/app/admin/_components/layout/AdminHeader.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Avatar, Modal, Form, Space, message } from 'antd';
import { UserOutlined, LogoutOutlined, ProfileOutlined, DownOutlined } from '@ant-design/icons';
import Image from 'next/image';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import NotificationDropdown from '@/app/admin/_components/notifications/NotificationDropdown';
import { useGetSettingsQuery } from '@/services/settingApi';
import { getImageUrl, siteConfig } from '@/config/site';

const { Header: AntHeader } = Layout;

export default function AdminHeader() {
  const { data: settings } = useGetSettingsQuery();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState({ name: 'Admin', email: '', role: 'Administrator' });
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse cached user data', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    messageApi.success('Logged out successfully');
    
    setTimeout(() => {
      window.location.href = '/admin/login';
    }, 300);
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
      });
      setIsProfileModalOpen(true);
    } else if (key === 'logout') {
      handleLogout();
    }
  };

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(
        `${siteConfig.baseUrl}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedUser = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role || user.role,
      };

      setUser(updatedUser);
      localStorage.setItem('adminUser', JSON.stringify(updatedUser));
      
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
      }

      messageApi.success('Profile details updated!');
      setIsProfileModalOpen(false);
    } catch (error) {
      messageApi.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: <span className="font-semibold text-xs py-0.5">Account Profile</span>,
      icon: <ProfileOutlined className="text-xs" />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span className="font-semibold text-xs text-rose-600 py-0.5">Sign Out</span>,
      icon: <LogoutOutlined className="text-xs text-rose-600" />,
      danger: true,
    },
  ];

  const adminLogoUrl = getImageUrl(settings?.adminLogo);

  return (
    <>
      {contextHolder}

      <AntHeader 
        style={{ backgroundColor: '#000000' }}
        className="border-b border-neutral-900 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-50 h-16 select-none"
      >
        {/* Brand & Console Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative h-8 w-28 sm:w-32 shrink-0">
            <Image
              src={adminLogoUrl}
              alt="Admin Logo"
              fill
              priority
              sizes="128px"
              className="object-contain object-left"
            />
          </div>
          <span className="font-semibold text-[11px] tracking-wider uppercase text-neutral-400 hidden sm:inline">
            Console
          </span>
        </div>

        {/* Action Elements: Bell Dropdown + User Avatar */}
        <div className="flex items-center gap-4">
          <NotificationDropdown />

          <Dropdown 
            menu={{ 
              items: userMenuItems,
              onClick: handleMenuClick 
            }} 
            placement="bottomRight" 
            trigger={['click']}
          >
            <div className="flex items-center gap-3 cursor-pointer hover:bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-transparent hover:border-neutral-800 transition">
              <Avatar 
                size={34} 
                icon={<UserOutlined />} 
                className="bg-[#F4C61A] text-neutral-950 font-bold shrink-0 shadow-2xs" 
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-neutral-100 leading-tight block">{user.name}</span>
                <span className="text-[10px] text-neutral-400 capitalize font-medium leading-tight mt-0.5">
                  {user.role || 'Staff'}
                </span>
              </div>
              <DownOutlined className="text-[9px] text-neutral-500 ml-1 hidden md:inline" />
            </div>
          </Dropdown>
        </div>
      </AntHeader>

      {/* Modal: Account Settings */}
      <Modal
        title={
          <span className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <UserOutlined className="text-[#F4C61A]" /> Admin Profile
          </span>
        }
        open={isProfileModalOpen}
        onCancel={() => setIsProfileModalOpen(false)}
        footer={null}
        centered
        width={440}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProfileUpdate}
          className="pt-3 font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <FormInput
            name="name"
            label="Full Name"
            placeholder="Enter full name"
            rules={[{ required: true, message: 'Name is required' }]}
          />

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            placeholder="Enter email address"
            rules={[{ required: true, message: 'Email is required' }]}
          />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }} className="pt-3 border-t border-neutral-100 mt-4">
            <CustomButton variant="secondary" onClick={() => setIsProfileModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              Save Changes
            </CustomButton>
          </Space>
        </Form>
      </Modal>
    </>
  );
}