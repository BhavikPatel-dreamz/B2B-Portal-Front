import { useState } from "react";
import OrderDetailsModal from "./OrderDetailsModal";
import SettingsIcon from "app/Icons/SettingsIcon";
import NotificationIcon from "app/Icons/NotificationIcon";

const OrderListing = () => {
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [startDate, setStartDate] = useState('dd/mm/yy');
  const [endDate, setEndDate] = useState('dd/mm/yy');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = [
    {
      id: '#ORD-2401',
      status: 'Approved',
      statusColor: 'bg-emerald-500',
      customer: 'John Smith - Acme Corp',
      phone: '+1 (555) 123-4567',
      amount: '$2,459',
      date: '2024-01-15',
      items: [
        { name: 'Widget A', quantity: 'x3' },
        { name: 'Widget B', quantity: 'x3' }
      ]
    },
    {
      id: '#ORD-2402',
      status: 'Pending approval',
      statusColor: 'bg-orange-500',
      customer: 'Sarah Johnson - TechStart Inc',
      phone: '+1 (555) 234-5678',
      amount: '$1,236',
      date: '2024-01-14',
      items: [
        { name: 'Widget A', quantity: 'x4' },
        { name: 'Widget B', quantity: 'x2' }
      ]
    },
    {
      id: '#ORD-2403',
      status: 'Processing',
      statusColor: 'bg-blue-500',
      customer: 'Mike Brown - Global Solutions',
      phone: '+1 (555) 345-6789',
      amount: '$3,150',
      date: '2024-01-13',
      items: [
        { name: 'Widget A', quantity: 'x5' },
        { name: 'Widget B', quantity: 'x3' }
      ]
    },
    {
      id: '#ORD-2404',
      status: 'Approved',
      statusColor: 'bg-emerald-500',
      customer: 'Emily Davis - Innovation Labs',
      phone: '+1 (555) 456-7890',
      amount: '$1,890',
      date: '2024-01-12',
      items: [
        { name: 'Widget A', quantity: 'x2' },
        { name: 'Widget B', quantity: 'x4' }
      ]
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Order Management</h1>
          <p className="text-[#6B7280] text-sm">Manage and approve customer orders</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
          <SettingsIcon color="#5866FF"/>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
          <NotificationIcon color="#5866FF"/>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Order#, customer, phone..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Role Filter */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{selectedRole}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Start Date */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <span>{startDate}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 7H14M5 1V5M11 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* End Date */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <span>{endDate}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 7H14M5 1V5M11 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            Export CV
          </button>
        </div>
      </div>

      {/* Order Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order:any, index) => (
          <div key={index} className="bg-white rounded-[20px] border border-[#DDE4FF] p-5 hover:shadow-md transition-shadow">
            {/* Order Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-3">
                <div className='flex items-center gap-3'>
                  <span className="text-base font-bold text-[#030917]">{order.id}</span>
                  <span className={`${order.statusColor} text-white text-xs font-medium px-2.5 py-1 rounded`}>
                    {order.status}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-900 font-medium">{order.customer}</div>
                  <div className="text-sm text-gray-500">{order.phone}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[24px] font-bold text-[#000000]">{order.amount}</div>
                <div className="text-xs text-[#6F7177]">{order.date}</div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4 bg-[#F5F5FF] p-[15px]">
              <div className="text-[16px] font-semibold text-[#000000] mb-2">Items:</div>
              <ul className="space-y-1">
                {order.items.map((item:any, itemIndex:any) => (
                  <li key={itemIndex} className="text-xs text-[#6F7177] font-normal">
                    • {item.name} {item.quantity}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button className="flex items-center justify-center gap-2 p-[11px] text-[#4B5563] rounded-md text-sm hover:bg-gray-50 h-10 bg-[#E5E7EB4D] shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Buy Again
              </button>
              <button 
                onClick={() => setSelectedOrder(order)}
                className="flex items-center justify-center gap-2 p-[11px] text-[#4B5563] rounded-md text-sm hover:bg-gray-50 h-10 bg-[#E5E7EB4D] shadow-sm"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default OrderListing;