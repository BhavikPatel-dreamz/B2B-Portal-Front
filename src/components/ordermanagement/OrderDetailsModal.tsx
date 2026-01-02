
import Calender from 'app/Icons/Calender';
import CompanyIcon from 'app/Icons/CompanyIcon';
import DollerIcon from 'app/Icons/DollerIcon';
import OrderIcon from 'app/Icons/OrderIcon';
import PhoneIcon from 'app/Icons/PhoneIcon';
import React, { useState } from 'react';

// Modal Component
const OrderDetailsModal = ({ order, onClose }: any) => {
    if (!order) return null;

    const getStatusColor = (status: any) => {
        switch (status) {
            case 'Approved': return 'bg-[#049665]';
            case 'Pending approval': return 'bg-orange-500';
            case 'Processing': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-[600px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                            <p className="text-sm text-gray-500">Complete information about this order</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>


                {/* Content */}
                <div className="px-[30px] ">
                    {/* Order ID and Status */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-[5px]">
                            <span className="text-[24px] font-extrabold text-gray-900">{order.id}</span>
                            <span className={`${getStatusColor(order.status)} text-white text-xs font-medium px-3 py-1 rounded`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-xs text-[#6F7177]">Order Date: {order.date}</p>
                    </div>
                    <div className='w-[540px] h-px bg-[#DDE4FF] m-auto '></div>

                    {/* Customer Information */}
                    <div className="py-6 border-b border-b-[#DDE4FF]">

                        <div className="flex items-center gap-2 mb-3">
                            <div className='rounded-[5px] border border-gray-200 bg-[#FCFCFC] shadow-sm p-1'>
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">Customer Information</h3>
                        </div>
                        <div className="flex gap-20 rounded-lg space-y-2">
                            <div className='flex flex-col gap-5'>
                                <div className="">
                                    <div className="text-[13px] text-[#6F7177]">Name</div>
                                    <div className="text-sm font-medium text-black">{order.customer.split(' - ')[0]}</div>
                                </div>
                                <div>
                                    <div className="text-[13px] text-[#6F7177]">Phone</div>
                                    <div className='flex gap-1 items-center'>
                                        <PhoneIcon />
                                        <div className="text-sm font-medium text-black">{order.phone}</div>
                                    </div>
                                </div>
                            </div>
                            <div className='flex flex-col gap-5'>
                                <div>
                                    <div className="text-[13px] text-[#6F7177]">Company</div>
                                    <div className='flex gap-1 items-center'>
                                        <CompanyIcon color='#000' width='14px' height='14px' />
                                        <div className="text-sm font-medium text-black">{order.customer.split(' - ')[1]}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[13px] text-[#6F7177]">Order Date</div>
                                    <div className='flex gap-1 items-center'>
                                        <Calender width='16px' height='16px' />
                                        <div className="text-sm font-medium text-black">{order.date}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="py-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className='rounded-[5px] border border-[#DDE4FF] bg-[#FCFCFC] shadow-sm p-1'>
                                <OrderIcon />
                            </div>
                            <h3 className="font-semibold text-gray-900">Order Items</h3>
                        </div>
                        <div className="border border-[#DDE4FF] rounded-[10px] overflow-hidden divide-y divide-[#DDE4FF]">
                            {order.items.map((item: any, idx: any) => (
                                <div key={idx} className="flex items-center gap-3 bg-white p-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <OrderIcon color='#5866FF' />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {item.name} {item.quantity}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Order Summary */}
                    <div className="">
                        <div className="flex items-center gap-2 mb-[17px]">
                            <div className='rounded-[5px] border border-[#DDE4FF] bg-[#FCFCFC] shadow-sm p-1'>
                                <DollerIcon />
                            </div>
                            <h3 className="font-semibold text-gray-900">Order Summary</h3>
                        </div>
                        <div className="bg-[#DDE4FF26] rounded-[10px] border border-[#DDE4FF]" >
                            <div className=' p-4 space-y-2'>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">$1,236</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">$0.00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-gray-900">$0.00</span>
                                </div>
                            </div>

                            <div className="border-t border-[#DDE4FF] p-4 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-gray-900">{order.amount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-[#DDE4FF] rounded-lg flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#DDE4FF] text-[#030917] rounded-lg text-sm font-medium hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Buy Again
                    </button>
                    {order.status === 'Pending approval' && (
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5866FF] text-white rounded-lg text-sm font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <g clip-path="url(#clip0_176_387)">
                                    <path d="M8.53583 13.5951L5 10.0584L6.17833 8.88008L8.53583 11.2367L13.2492 6.52258L14.4283 7.70175L8.53583 13.5951Z" fill="white" />
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.833008 10C0.833008 4.93754 4.93717 0.833374 9.99967 0.833374C15.0622 0.833374 19.1663 4.93754 19.1663 10C19.1663 15.0625 15.0622 19.1667 9.99967 19.1667C4.93717 19.1667 0.833008 15.0625 0.833008 10ZM9.99967 17.5C9.01476 17.5 8.03949 17.306 7.12955 16.9291C6.21961 16.5522 5.39281 15.9998 4.69637 15.3033C3.99993 14.6069 3.44749 13.7801 3.07058 12.8702C2.69367 11.9602 2.49967 10.985 2.49967 10C2.49967 9.01513 2.69367 8.03986 3.07058 7.12991C3.44749 6.21997 3.99993 5.39318 4.69637 4.69674C5.39281 4.0003 6.21961 3.44785 7.12955 3.07094C8.03949 2.69403 9.01476 2.50004 9.99967 2.50004C11.9888 2.50004 13.8965 3.29022 15.303 4.69674C16.7095 6.10326 17.4997 8.01092 17.4997 10C17.4997 11.9892 16.7095 13.8968 15.303 15.3033C13.8965 16.7099 11.9888 17.5 9.99967 17.5Z" fill="white" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_176_387">
                                        <rect width="20" height="20" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                            Approve Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
export default OrderDetailsModal;
