import React from 'react';

interface SkeletonProps {
  className?: string;
  type?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ 
  className = '', 
  type = 'rectangular', 
  width, 
  height 
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200";
  
  let typeClasses = "";
  if (type === 'circular') {
    typeClasses = "rounded-full";
  } else if (type === 'text') {
    typeClasses = "rounded-md h-4";
  } else {
    typeClasses = "rounded-xl";
  }

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div 
      className={`${baseClasses} ${typeClasses} ${className}`} 
      style={style}
      aria-hidden="true"
    />
  );
}
