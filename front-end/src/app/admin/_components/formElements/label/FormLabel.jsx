import React from 'react'

export default function FormLabel({children, className='', htmlFor, ...props}) {
    if (!children) return null;

  return (
    <label
      htmlFor={htmlFor}
      className={`block font-semibold text-gray-700 text-sm mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}
