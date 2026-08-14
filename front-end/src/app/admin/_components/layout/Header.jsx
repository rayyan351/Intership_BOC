'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Avatar, Modal, Form, Space, message } from 'antd';
import { UserOutlined, LogoutOutlined, ProfileOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';

const { Header: AntHeader } = Layout;

export default function AdminHeader() {
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState({ name: 'Admin', email: '' });
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const [messageApi, contextHolder] = message.useMessage();

  // Load active user details from local storage or API
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
    // Clear storage completely so ProtectedRoute blocks access
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    messageApi.success('Logged out successfully');
    
    setTimeout(() => {
      router.replace('/admin/login');
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/profile`,
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

      // Update Local State & Storage
      const updatedUser = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
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
      label: 'View Profile',
      icon: <ProfileOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  return (
    <>
      {contextHolder}

      <AntHeader 
        style={{ backgroundColor: '#000000' }}
        className="border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-50 h-16"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/images/brand/BurgerO'clock logo.webp"
            alt="Admin Logo"
            width={40}
            height={40}
            style={{height:'auto', width:'auto'}}
            className="object-contain"
          />
          <span className="font-bold text-lg tracking-wide uppercase text-white hidden sm:inline">
            Admin Panel
          </span>
        </div>

        <Dropdown 
          menu={{ 
            items: userMenuItems,
            onClick: handleMenuClick 
          }} 
          placement="bottomRight" 
          trigger={['click']}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
        >
          <div className="flex items-center gap-3 cursor-pointer hover:bg-zinc-900 p-1.5 rounded-lg transition">
            <Avatar size="large" icon={<UserOutlined />} className="bg-[#ffc400] text-black font-bold" />
            <span className="text-sm font-semibold text-white hidden md:inline">{user.name}</span>
          </div>
        </Dropdown>
      </AntHeader>

      {/* View / Edit Profile Modal */}
      <Modal
        title={
          <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserOutlined className="text-[#ffc400]" /> Admin Profile
          </span>
        }
        open={isProfileModalOpen}
        onCancel={() => setIsProfileModalOpen(false)}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProfileUpdate}
          className="pt-4"
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

          <Space style={{ width: '100%', justifyContent: 'flex-end' }} className="pt-4">
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