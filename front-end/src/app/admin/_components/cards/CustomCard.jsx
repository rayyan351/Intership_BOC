import { Card } from 'antd'
import React from 'react'

export default function CustomCard({ children }) {
    return (
        <Card className="rounded-2xl shadow-sm border-grey p-2 sm:p-4 ">{children}</Card>
    )
}
