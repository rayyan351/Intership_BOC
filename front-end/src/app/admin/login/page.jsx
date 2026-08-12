'use client';

import React from 'react';
import { Card, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useLoginMutation } from '@/services/authApi';

// 1. Define Yup Validation Schema
const schema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email'),
  password: yup
    .string()
    .required('Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // 2. Initialize React Hook Form with Yup Resolver
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // RTK Query hook
  const [login, { isLoading }] = useLoginMutation();

  // 3. Form Submit Handler
  const handleLogin = async (values) => {
    try {
      const data = await login(values).unwrap();

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem(
        'adminUser',
        JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        })
      );

      messageApi.success('Welcome back, Admin!');

      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 500);
    } catch (error) {
      messageApi.error(error?.data?.message || error?.message || 'Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
      {contextHolder}
      <div className="w-full max-w-[420px] mx-auto">
        <Card
          style={{ width: '100%', maxWidth: '420px' }}
          className="shadow-2xl rounded-2xl border-zinc-800 bg-white p-2 sm:p-4"
        >
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div 
              style={{ backgroundColor: '#000000' }} 
              className="mb-4 px-6 py-3 rounded-xl shadow-md border border-zinc-800 flex items-center justify-center min-w-[160px] h-[60px]"
            >
              <Image
                src="/images/brand/BurgerO'clock logo.webp"
                alt="Burger O'Clock Logo"
                width={140}
                height={50}
                className="object-contain max-h-full w-auto"
                priority
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Sign in to manage your restaurant portal
            </p>
          </div>

          {/* Use standard HTML form wrapped with React Hook Form's handleSubmit */}
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <FormInput
              name="email"
              control={control}
              label="Email Address"
              placeholder="admin@burgeroclock.com"
              prefix={<MailOutlined className="text-zinc-400 mr-1" />}
            />

            <FormInput
              name="password"
              control={control}
              label="Password"
              type="password"
              placeholder="••••••••"
              prefix={<LockOutlined className="text-zinc-400 mr-1" />}
            />

            <div className="pt-2">
              <CustomButton
                variant="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full !h-11 text-sm font-semibold"
              >
                Sign In
              </CustomButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}