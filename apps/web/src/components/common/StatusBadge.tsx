import React from 'react';

type StatusType = 'active' | 'recruiting' | 'progress' | 'ongoing' | 'completed' | 'closed' | 'draft';

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let text = '';
  let bgColor = '';
  let color = '';

  switch (status) {
    case 'active':
    case 'recruiting':
      text = '모집중';
      bgColor = '#dcfce7'; // green-100
      color = '#166534'; // green-800
      break;
    case 'progress':
    case 'ongoing':
      text = '진행중';
      bgColor = '#dbeafe'; // blue-100
      color = '#1e40af'; // blue-800
      break;
    case 'completed':
      text = '완료';
      bgColor = '#f3f4f6'; // gray-100
      color = '#374151'; // gray-700
      break;
    case 'closed':
      text = '마감';
      bgColor = '#fee2e2'; // red-100
      color = '#b91c1c'; // red-800
      break;
    case 'draft':
      text = '임시저장';
      bgColor = '#fef3c7'; // yellow-100
      color = '#92400e'; // yellow-800
      break;
    default:
      text = status;
      bgColor = '#f3f4f6';
      color = '#374151';
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: bgColor,
      color: color,
    }}>
      {text}
    </span>
  );
}
