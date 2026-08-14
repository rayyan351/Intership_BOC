'use client';

import { message } from 'antd';

export function useToast() {
  const [messageApi, contextHolder] = message.useMessage();

  const showSuccess = (content, duration = 3) => {
    messageApi.open({
      type: 'success',
      content: <span className="font-medium text-gray-800">{content}</span>,
      duration,
      className: 'custom-toast-success',
    });
  };

  const showError = (content, duration = 4) => {
    messageApi.open({
      type: 'error',
      content: <span className="font-medium text-gray-800">{content}</span>,
      duration,
      className: 'custom-toast-error',
    });
  };

  const showInfo = (content, duration = 3) => {
    messageApi.open({
      type: 'info',
      content: <span className="font-medium text-gray-800">{content}</span>,
      duration,
    });
  };

  return {
    contextHolder,
    showSuccess,
    showError,
    showInfo,
  };
}