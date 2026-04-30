import React from 'react';
import { Package, Truck, Home } from 'lucide-react';

type ShippingStatusType = 'preparing' | 'shipped' | 'delivered';

interface ShippingStatusProps {
  status: ShippingStatusType;
}

export default function ShippingStatus({ status }: ShippingStatusProps) {
  const steps = [
    { key: 'preparing', label: '배송 준비중', icon: <Package size={16} /> },
    { key: 'shipped', label: '배송 출발', icon: <Truck size={16} /> },
    { key: 'delivered', label: '배송 완료', icon: <Home size={16} /> },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center justify-between w-full relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10"></div>
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500 -z-10"
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      ></div>
      
      {steps.map((step, idx) => {
        const isActive = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        
        return (
          <div key={step.key} className="flex flex-col items-center gap-1.5 bg-white px-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isActive ? 'bg-blue-500 text-white shadow-sm shadow-blue-200' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step.icon}
            </div>
            <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-600' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
