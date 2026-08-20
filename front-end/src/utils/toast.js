// src/utils/toast.js
import React, { useCallback } from 'react';
import { message } from 'antd';

export const useToast = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showSuccess = useCallback(
    (content, duration = 3) => {
      // Defer to the next tick to avoid concurrent render execution warnings
      setTimeout(() => {
        messageApi.open({
          type: 'success',
          content: <span className="font-medium text-gray-800">{content}</span>,
          duration,
        });
      }, 0);
    },
    [messageApi]
  );

  const showError = useCallback(
    (content, duration = 3) => {
      setTimeout(() => {
        messageApi.open({
          type: 'error',
          content: <span className="font-medium text-red-600">{content}</span>,
          duration,
        });
      }, 0);
    },
    [messageApi]
  );

  const showInfo = useCallback(
    (content, duration = 3) => {
      setTimeout(() => {
        messageApi.open({
          type: 'info',
          content: <span className="font-medium text-blue-600">{content}</span>,
          duration,
        });
      }, 0);
    },
    [messageApi]
  );

  const showWarning = useCallback(
    (content, duration = 3) => {
      setTimeout(() => {
        messageApi.open({
          type: 'warning',
          content: <span className="font-medium text-amber-600">{content}</span>,
          duration,
        });
      }, 0);
    },
    [messageApi]
  );

  return {
    contextHolder,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};