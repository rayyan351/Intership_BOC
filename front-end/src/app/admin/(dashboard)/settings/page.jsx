'use client';

import React from 'react';
import { Form, Card, Switch, Space, message } from 'antd';
import { SaveOutlined, ShopOutlined, SettingOutlined } from '@ant-design/icons';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';

export default function SettingsPage() {
  const [form] = Form.useForm();

  const handleSave = (values) => {
    console.log('Settings Saved:', values);
    message.success('Store settings updated successfully!');
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
          Store Settings
        </h1>
        <p className="text-sm text-gray-500">
          Manage your restaurant details, business hours, and operational preferences
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          storeName: "Burger O'Clock",
          contactEmail: "support@burgeroclock.com",
          contactPhone: "+1 (555) 019-2834",
          currency: "USD ($)",
          minimumOrder: "15.00",
          acceptingOrders: true,
        }}
        className="space-y-6"
      >
        <Space orientation="vertical" size="large" className="w-full">
          {/* General Store Profile */}
          <Card
            title={
              <Space align="center" size="middle">
                <ShopOutlined className="text-[#ffc400] text-xl" />
                <span className="text-gray-900 font-bold">General Details</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="storeName"
                label="Restaurant Name"
                placeholder="e.g. Burger O'Clock"
                rules={[{ required: true, message: 'Restaurant name is required' }]}
              />

              <FormInput
                name="contactEmail"
                label="Contact Email"
                type="email"
                placeholder="e.g. admin@burger.com"
                rules={[{ required: true, message: 'Contact email is required' }]}
              />

              <FormInput
                name="contactPhone"
                label="Phone Number"
                placeholder="e.g. +1 234 567 890"
                rules={[{ required: true, message: 'Phone number is required' }]}
              />

              <FormInput
                name="currency"
                label="Currency Symbol"
                placeholder="e.g. USD ($)"
                rules={[{ required: true, message: 'Currency is required' }]}
              />
            </div>
          </Card>

          {/* Operational & Orders Settings */}
          <Card
            title={
              <Space align="center" size="middle">
                <SettingOutlined className="text-[#ffc400] text-xl" />
                <span className="text-gray-900 font-bold">Order Configurations</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="minimumOrder"
                label="Minimum Order Amount ($)"
                type="number"
                placeholder="e.g. 10.00"
                rules={[{ required: true, message: 'Minimum order amount is required' }]}
              />

              <Form.Item
                name="acceptingOrders"
                label={<span className="font-semibold text-gray-700 text-sm">Online Ordering Status</span>}
                valuePropName="checked"
                className="mb-0"
              >
                <div className="pt-1">
                  <Space size="middle" align="center">
                    <Switch />
                    <span className="text-sm font-medium text-gray-600">
                      Accept incoming online orders
                    </span>
                  </Space>
                </div>
              </Form.Item>
            </div>
          </Card>

          {/* Action Row */}
          <Space size="large" style={{ width: '100%', justifyContent: 'flex-end' }} className="pt-2">
            <CustomButton
              variant="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              className="!h-11 !px-8"
            >
              Save Changes
            </CustomButton>
          </Space>
        </Space>
      </Form>
    </div>
  );
}