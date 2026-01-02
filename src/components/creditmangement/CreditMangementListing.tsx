import ErrorIcon from "app/Icons/ErrorIcon";
import NotificationIcon from "app/Icons/NotificationIcon";
import SettingsIcon from "app/Icons/SettingsIcon";
import UpGraph from "app/Icons/UpGraph";


const CreditManagementListing = () => {
    return (
        <div>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Credit Management</h1>
                        <p className="text-[#6B7280] text-sm">Monitor and manage credit limits</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                            <SettingsIcon color="#5866FF" />
                        </button>
                        <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                            <NotificationIcon color="#5866FF" />
                        </button>
                    </div>
                </div>

                {/* Admin Credit Pool Overview */}
                <div className="rounded-lg border-2 border-[rgba(36,99,235,0.20)] bg-[rgba(36,99,235,0.06)] shadow-[0_1px_2px_0_rgba(15,23,41,0.05)] p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">$</span>
                        </div>
                        <h2 className="text-[23px] font-bold text-[#0F1729]">Admin Credit Pool Overview</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center bg-white p-4 rounded-lg">
                            <p className="text-[13.2px] text-[#65758B] mb-2">Total Available</p>
                            <p className="text-[24px] font-bold text-[#2463EB]">$500,000</p>
                        </div>
                        <div className="text-center bg-white p-4 rounded-lg">
                            <p className="text-[13.2px] text-[#65758B] mb-2">Allocated</p>
                            <p className="text-[24px] font-bold text-[#0F1729]">$250,000</p>
                        </div>
                        <div className="text-center bg-white p-4 rounded-lg">
                            <p className="text-[13.2px] text-[#65758B] mb-2">Unallocated</p>
                            <p className="text-[24px] font-bold text-[#0B9E41]">$250,000</p>
                        </div>
                    </div>
                </div>

                {/* Company Credit Overview */}
                <div className="rounded-lg border-2 border-[rgba(36,99,235,0.20)] bg-white shadow-[0_1px_2px_0_rgba(15,23,41,0.05)] p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Company Credit Overview</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-4">
                        <div className="text-center bg-[#F1F5F980] p-4">
                            <p className="text-xs text-[#65758B] mb-2">Monthly Limit</p>
                            <p className="text-[20.3px] font-bold text-gray-900">$250,000</p>
                        </div>
                        <div className="text-center bg-[#F1F5F980] p-4">
                            <p className="text-xs text-[#65758B] mb-2">Used This Month</p>
                            <p className="text-[20.3px] font-bold text-[#EF4343]">$227,500</p>
                        </div>
                        <div className="text-center bg-[#F1F5F980] p-4">
                            <p className="text-xs text-[#65758B] mb-2">Remaining</p>
                            <p className="text-[20.3px] font-bold text-[#21C45D]">$22,500</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-[#0F1729]">Current Month Usage</p>
                            <p className="text-[13.6px] font-bold text-[#EF4343]">91%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-[#2463EB] h-2.5 rounded-full" style={{ width: '91%' }}></div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-[13px] mb-4 flex items-center gap-3">
                        <ErrorIcon />
                        <p className="text-[13px] font-normal text-[#EF4343]">
                            <span className="font-semibold">WARNING:</span> Credit usage is at 91%. You've exceeded 90% of your limit. Request an increase immediately.
                        </p>
                    </div>

                    {/* Request Button */}
                    <button className="w-full bg-[#2463EB] text-white font-medium py-3 px-4 rounded-lg transition-colors">
                        Request Credit Increase
                    </button>
                </div>
                {/* Current Month Usage Breakdown */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 mt-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.66699 1.66669V5.00002" stroke="#2463EB" stroke-width="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.333 1.66669V5.00002" stroke="#2463EB" stroke-width="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15.8333 3.33331H4.16667C3.24619 3.33331 2.5 4.07951 2.5 4.99998V16.6666C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6666V4.99998C17.5 4.07951 16.7538 3.33331 15.8333 3.33331Z" stroke="#2463EB" stroke-width="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.5 8.33331H17.5" stroke="#2463EB" stroke-width="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>


                        </div>
                        <h2 className="text-[23px] font-bold text-[#0F1729]">Current Month Usage Breakdown</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[15px] font-normal text-[#0F1729]">Product Orders</span>
                                <div>
                                    <div className="text-sm font-semibold text-[#0F1729]">$145,000</div>
                                    <div className="text-right text-[#65758B] font-normal text-[11.6px]">64%</div>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-[#2463EB] h-2 rounded-full" style={{ width: '64%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[15px] font-normal text-[#0F1729]">Service Subscriptions</span>
                                <div>
                                    <div className="text-sm font-semibold text-[#0F1729]">$52,500</div>
                                    <div className="text-right text-[#65758B] font-normal text-[11.6px]">23%</div>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-[#2463EB] h-2 rounded-full" style={{ width: '23%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[15px] font-normal text-[#0F1729]">Custom Requests</span>
                                <div>
                                    <div className="text-sm font-semibold text-[#0F1729]">$30,000</div>
                                    <div className="text-right text-[#65758B] font-normal text-[11.6px]">13%</div>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-[#2463EB] h-2 rounded-full" style={{ width: '13%' }}></div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-base text-[15.5px] font-bold text-[#0F1729]">Total Used</span>
                                <span className="text-base text-[17.7px] font-bold text-[#0F1729]">$227,500</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions and User Credit Usage */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Recent Credit Transactions */}
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <UpGraph color="#2463EB" />
                            </div>
                            <h2 className="text-[23.1px] font-bold text-[#0F1729]">Recent Credit Transactions</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-[15.6px] font-normal text-[#0F1729] mb-[5px]">BORG-2410</p>
                                        <p className="text-[10.9px] font-normal text-[#65758B]">Oct 15, 2024 - 10:45 AM</p>
                                    </div>
                                    <span className="text-[13.6px] font-bold text-[#EF4343]">-$8,200</span>
                                </div>
                                <p className="text-xs border border-[#E1E7EF] text-[#0F1729] font-bold w-fit py-[3px] px-[11px] rounded-[9999px]">Product Order</p>
                            </div>

                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="text-[15.6px] font-normal text-[#0F1729] mb-[5px]">BORG-2409</p>
                                        <p className="text-[10.9px] font-normal text-[#65758B]">Oct 14, 2024 - 2:30 PM</p>
                                    </div>
                                    <span className="text-[13.6px] font-bold text-[#EF4343]">-$12,400</span>
                                </div>
                                <p className="text-xs border border-[#E1E7EF] text-[#0F1729] font-bold w-fit py-[3px] px-[11px] rounded-[9999px]">Service Subscription</p>
                            </div>

                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="text-[15.6px] font-normal text-[#0F1729] mb-[5px]">BORG-2408</p>
                                        <p className="text-[10.9px] font-normal text-[#65758B]">Oct 13, 2024 - 9:15 AM</p>
                                    </div>
                                    <span className="text-[13.6px] font-bold text-[#EF4343]">-$5,800</span>
                                </div>
                                <p className="text-xs border border-[#E1E7EF] text-[#0F1729] font-bold w-fit py-[3px] px-[11px] rounded-[9999px]">Product Order</p>
                            </div>

                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="text-[15.6px] font-normal text-[#0F1729] mb-[5px]">BORG-2407</p>
                                        <p className="text-[10.9px] font-normal text-[#65758B]">Oct 12, 2024 - 4:20 PM</p>
                                    </div>
                                    <span className="text-[13.6px] font-bold text-[#EF4343]">-$15,200</span>
                                </div>
                                <p className="text-xs border border-[#E1E7EF] text-[#0F1729] font-bold w-fit py-[3px] px-[11px] rounded-[9999px]">Custom Request</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="text-[15.6px] font-normal text-[#0F1729] mb-[5px]">Credit Added</p>
                                        <p className="text-[10.9px] font-normal text-[#65758B]">Oct 1, 2024 - 12:00 PM</p>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">+$250,000</span>
                                </div>
                                <p className="text-xs border border-[#E1E7EF] text-[#0F1729] font-bold w-fit py-[3px] px-[11px] rounded-[9999px]">Monthly Allocation</p>
                            </div>
                        </div>
                    </div>

                    {/* User Credit Usage */}
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 1.66663V18.3333" stroke="#2463EB" stroke-width="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M14.1667 4.16663H7.91667C7.14312 4.16663 6.40125 4.47392 5.85427 5.0209C5.30729 5.56788 5 6.30974 5 7.08329C5 7.85684 5.30729 8.59871 5.85427 9.14569C6.40125 9.69267 7.14312 9.99996 7.91667 9.99996H12.0833C12.8569 9.99996 13.5987 10.3073 14.1457 10.8542C14.6927 11.4012 15 12.1431 15 12.9166C15 13.6902 14.6927 14.432 14.1457 14.979C13.5987 15.526 12.8569 15.8333 12.0833 15.8333H5" stroke="#2463EB" stroke-width="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">User Credit Usage</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-[15.1px] font-semibold text-[#0F1729]">John Smith</p>

                                    </div>
                                    <span className="px-2 py-1 bg-[#EF4343] text-white text-xs font-semibold rounded-[9999px]">92%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                                    <div className="bg-[#2463EB] h-4 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Total: $46,000 / $50,000</p>
                                <p className="text-xs text-[#EF4343]">⚠ Approaching limit</p>
                            </div>

                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Sarah Johnson</p>

                                    </div>
                                    <span className="px-2 py-1 bg-[#EF4343] text-white text-xs font-semibold rounded-[9999px]">88%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                                    <div className="bg-[#2463EB] h-4 rounded-full" style={{ width: '88%' }}></div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Total: $35,200 / $40,000</p>
                                <p className="text-xs text-red-500">⚠ Approaching limit</p>
                            </div>

                            <div className="pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Michael Chen</p>

                                    </div>
                                    <span className="px-2 py-1 bg-[#EF4343] text-white text-xs font-semibold rounded-[9999px]">65%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                                    <div className="bg-[#2463EB] h-4 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Total: $19,500 / $30,000</p>
                                <p className="text-xs text-red-500">⚠ Approaching limit</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Emily Davis</p>
                                    </div>
                                    <span className="px-2 py-1 bg-[#EF4343] text-white text-xs font-semibold rounded-[9999px]">52%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                                    <div className="bg-[#2463EB] h-4 rounded-full" style={{ width: '52%' }}></div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Total: $15,600 / $30,000</p>
                                <p className="text-xs text-red-500">⚠ Approaching limit</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditManagementListing;
