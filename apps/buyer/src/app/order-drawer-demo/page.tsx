"use client";

import React, { useState } from 'react';
import { OrderDrawer } from '../../components/orders/OrderDrawer';

export default function OrderDrawerDemo() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 relative">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Order Drawer UI Demo</h1>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
        >
          Open Order Drawer
        </button>
      </div>

      <OrderDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}
