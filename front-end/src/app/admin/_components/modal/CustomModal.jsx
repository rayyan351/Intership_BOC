import React from 'react'
import { Modal } from 'antd'

export default function CustomModal({ children, open, onCancel, title, width }) {
  return (
    <Modal
      title={<span className="text-lg font-bold text-gray-900">{title}</span>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={width}
    >
      {children}
    </Modal>
  )
}