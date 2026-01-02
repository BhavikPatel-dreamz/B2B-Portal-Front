import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import type {
    Order,
    OrderFilters,
    OrderPagination,
    OrdersResponse,
    DateRangePreset,
    FilterOption,
    CompanyLocation,
    CompanyCustomer
} from "../../types/order";
import FilterIcon from "../../Icons/FilterIcon";
import ExportIcon from "../../Icons/ExportIcon";
import CloseIcon from "../../Icons/CloseIcon";

interface PageProps {
    customerId: string;
    shop: string;
    proxyUrl: string;
}

const OrderManagementPage = ({ customerId, shop, proxyUrl }: PageProps) => {
    const { currentUser, hasPermission } = useCurrentUser();

    // State management
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageInfo, setPageInfo] = useState<{
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        endCursor: string | null;
        startCursor: string | null;
    }>({
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null,
    });
    const [totalCount, setTotalCount] = useState(0);

    // Filter states
    const [filters, setFilters] = useState<OrderFilters>({
        dateRange: { preset: 'all' },
        sortKey: 'CREATED_AT',
        reverse: true,
    });
    const [pendingFilters, setPendingFilters] = useState<OrderFilters>({
        dateRange: { preset: 'all' },
        sortKey: 'CREATED_AT',
        reverse: true,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingSearchQuery, setPendingSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [availableLocations, setAvailableLocations] = useState<CompanyLocation[]>([]);
    const [availableCustomers, setAvailableCustomers] = useState<CompanyCustomer[]>([]);
    const [isViewDetails, setViewDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [search, setSearch] = useState('');

    // Pagination
    const [pageSize] = useState(20);

    // Date range presets
    const dateRangePresets: DateRangePreset[] = [
        { label: 'All Time', value: 'all' },
        { label: 'Last Week', value: 'last_week' },
        { label: 'Current Month', value: 'current_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'Last 3 Months', value: 'last_3_months' },
        { label: 'Custom', value: 'custom' },
    ];

    // Status filter options
    const financialStatusOptions: FilterOption[] = [
        { label: 'All', value: '' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Authorized', value: 'AUTHORIZED' },
        { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Partially Refunded', value: 'PARTIALLY_REFUNDED' },
        { label: 'Refunded', value: 'REFUNDED' },
        { label: 'Voided', value: 'VOIDED' },
    ];

    const fulfillmentStatusOptions: FilterOption[] = [
        { label: 'All', value: '' },
        { label: 'Unfulfilled', value: 'UNFULFILLED' },
        { label: 'Partially Fulfilled', value: 'PARTIAL' },
        { label: 'Fulfilled', value: 'FULFILLED' },
        { label: 'Restocked', value: 'RESTOCKED' },
    ];

    // Fetch orders function
    const fetchOrders = useCallback(
        async (resetPagination: boolean = false) => {
            if (!currentUser) return;

            setIsLoading(true);
            setError(null);

            try {
                const pagination: OrderPagination = {
                    first: pageSize,
                };

                if (!resetPagination && pageInfo.endCursor) {
                    pagination.after = pageInfo.endCursor;
                }

                const requestBody = {
                    customerId,
                    shop,
                    filters: {
                        ...filters,
                        query: searchQuery.trim() || undefined,
                    },
                    pagination,
                };

                const response = await fetch(`${proxyUrl}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                const data: OrdersResponse = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch orders');
                }

                if (resetPagination) {
                    setOrders(data.orders || []);
                } else {
                    setOrders(prev => [...prev, ...(data.orders || [])]);
                }

                setPageInfo({
                    hasNextPage: data.pageInfo?.hasNextPage || false,
                    hasPreviousPage: data.pageInfo?.hasPreviousPage || false,
                    endCursor: data.pageInfo?.endCursor || null,
                    startCursor: data.pageInfo?.startCursor || null,
                });

                setTotalCount(data.totalCount || 0);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
                setError(errorMessage);
                console.error('Error fetching orders:', err);
            } finally {
                setIsLoading(false);
            }
        },
        [currentUser, customerId, shop, proxyUrl, filters, searchQuery, pageSize, pageInfo.endCursor]
    );

    // Whenever filters or searchQuery change, refetch orders (including initial load)
    useEffect(() => {
        if (!currentUser) return;
        fetchOrders(true);
    }, [filters, searchQuery, currentUser, fetchOrders]);

    // Fetch available customers for filtering (for super admins)
    const fetchCustomers = useCallback(
        async () => {
            if (!currentUser?.company.companyId || !currentUser.permissions.canAccessAllLocations) return;

            try {
                const response = await fetch(
                    `${proxyUrl}/company-customers?companyId=${currentUser.company.companyId}&shop=${shop}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setAvailableCustomers(data.customers || []);
                }
            } catch (err) {
                console.error('Error fetching customers:', err);
            }
        },
        [currentUser?.company.companyId, currentUser?.permissions.canAccessAllLocations, proxyUrl, shop]
    );

    // Fetch available locations for filtering
    const fetchLocations = useCallback(
        async () => {
            if (!currentUser?.company.companyId) return;

            try {
                const response = await fetch(
                    `${proxyUrl}/company-locations?companyId=${currentUser.company.companyId}&shop=${shop}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setAvailableLocations(data.locations || []);
                }
            } catch (err) {
                console.error('Error fetching locations:', err);
            }
        },
        [currentUser?.company.companyId, proxyUrl, shop]
    );

    // Initial load (only locations + customers)
    useEffect(() => {
        if (currentUser) {
            fetchLocations();
            if (currentUser.permissions.canAccessAllLocations) {
                fetchCustomers(); // Fetch customers only for super admins
            }
        }
    }, [currentUser, fetchLocations, fetchCustomers]);

    // Handle pending filter changes (don't apply immediately)
    const handlePendingFilterChange = (newFilters: Partial<OrderFilters>) => {
        setPendingFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handle pending search changes (don't apply immediately)
    const handlePendingSearchChange = (query: string) => {
        setPendingSearchQuery(query);
    };

    // Apply filters function
    const applyFilters = () => {
        setFilters(pendingFilters);
        setSearchQuery(pendingSearchQuery);
    };

    // Clear all filters
    const clearAllFilters = () => {
        const defaultFilters: OrderFilters = {
            dateRange: { preset: 'all' },
            sortKey: 'CREATED_AT',
            reverse: true,
        };
        setPendingFilters(defaultFilters);
        setPendingSearchQuery('');
        setFilters(defaultFilters);
        setSearchQuery('');
    };

    // Check if filters have changed
    const hasFilterChanges = () => {
        return (
            JSON.stringify(filters) !== JSON.stringify(pendingFilters) ||
            searchQuery !== pendingSearchQuery
        );
    };

    // Load more orders
    const loadMore = () => {
        if (pageInfo.hasNextPage && !isLoading) {
            fetchOrders(false);
        }
    };

    // Format currency
    const formatCurrency = (amount: string, currencyCode: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
        }).format(parseFloat(amount));
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get order status badge color
    const getStatusBadgeColor = (status: string, type: 'financial' | 'fulfillment') => {
        if (type === 'financial') {
            switch (status?.toLowerCase()) {
                case 'paid': return 'bg-green-100 text-green-800';
                case 'pending': return 'bg-yellow-100 text-yellow-800';
                case 'partially_paid': return 'bg-blue-100 text-blue-800';
                case 'refunded':
                case 'voided': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        } else {
            switch (status?.toLowerCase()) {
                case 'fulfilled': return 'bg-green-100 text-green-800';
                case 'unfulfilled': return 'bg-yellow-100 text-yellow-800';
                case 'partial': return 'bg-blue-100 text-blue-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }
    };

    // Check if user can access order management
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading user information...</p>
                </div>
            </div>
        );
    }

    if (!hasPermission('canManageOrders')) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
                <div className="text-4xl mb-4">🚫</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600">
                    You don&apos;t have permission to access order management. Please contact your company administrator.
                </p>
            </div>
        );
    }

    // Export orders to CSV
    const handleExport = () => {
        if (orders.length === 0) {
            alert('There are no orders to export yet.');
            return;
        }

        const headers = [
            'Order Name / Number',
            'Order ID',
            'Date',
            'Customer Name',
            'Customer Email',
            'Location',
            'Payment Status',
            'Fulfillment Status',
            'Total Amount',
            'Currency'
        ];

        const csvRows = [
            headers.join(','),
            ...orders.map(order => {
                const values = [
                    order.name || '',
                    order.id || '',
                    order.createdAt ? formatDate(order.createdAt) : '',
                    `${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''}`.trim(),
                    order.customer?.email ?? '',
                    order.companyLocation?.name ?? 'Company Order',
                    order.displayFinancialStatus ?? '',
                    order.displayFulfillmentStatus ?? '',
                    order.totalPriceSet?.shopMoney?.amount ?? '',
                    order.totalPriceSet?.shopMoney?.currencyCode ?? ''
                ];

                return values
                    .map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`)
                    .join(',');
            })
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'orders.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            {/* Header */}
            <header className="bg-white border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            Order Management
                        </h1>
                        <p className="text-[#6B7280] text-sm">
                            {currentUser.permissions.canAccessAllLocations
                                ? 'View and manage all company orders'
                                : `View orders for your assigned locations (${currentUser.permissions.assignedLocationIds.length})`
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                        >
                            <FilterIcon />
                            Filters
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <ExportIcon />
                            Export
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters Section */}
            {showFilters && (
                <div className="bg-white rounded-lg border border-[#DDE4FF] p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {/* Date Range Filter */}
                        <div>
                            <label htmlFor="date-range-filter" className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <select
                                id="date-range-filter"
                                value={pendingFilters.dateRange?.preset || 'all'}
                                onChange={(e) => handlePendingFilterChange({
                                    dateRange: { preset: e.target.value as DateRangePreset['value'] }
                                })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {dateRangePresets.map(preset => (
                                    <option key={preset.value} value={preset.value}>
                                        {preset.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location Filter */}
                        {(currentUser.permissions.canAccessAllLocations || availableLocations.length > 1) && (
                            <div>
                                <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <select
                                    id="location-filter"
                                    value={pendingFilters.locationId || ''}
                                    onChange={(e) => handlePendingFilterChange({
                                        locationId: e.target.value || undefined
                                    })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">All Locations</option>
                                    {availableLocations.map(location => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Customer Filter - Only for Super Admins */}
                        {currentUser.permissions.canAccessAllLocations && availableCustomers.length > 0 && (
                            <div>
                                <label htmlFor="customer-filter" className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                                <select
                                    id="customer-filter"
                                    value={pendingFilters.customerId || ''}
                                    onChange={(e) => handlePendingFilterChange({
                                        customerId: e.target.value || undefined
                                    })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">All Customers</option>
                                    {availableCustomers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.firstName} {customer.lastName} ({customer.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Financial Status Filter */}
                        <div>
                            <label htmlFor="financial-status-filter" className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                            <select
                                id="financial-status-filter"
                                value={pendingFilters.financialStatus || ''}
                                onChange={(e) => handlePendingFilterChange({
                                    financialStatus: e.target.value || undefined
                                })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {financialStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Fulfillment Status Filter */}
                        <div>
                            <label htmlFor="fulfillment-status-filter" className="block text-sm font-medium text-gray-700 mb-2">Fulfillment Status</label>
                            <select
                                id="fulfillment-status-filter"
                                value={pendingFilters.fulfillmentStatus || ''}
                                onChange={(e) => handlePendingFilterChange({
                                    fulfillmentStatus: e.target.value || undefined
                                })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {fulfillmentStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            {hasFilterChanges() && (
                                <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    Filters not applied
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={clearAllFilters}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={applyFilters}
                                disabled={!hasFilterChanges() || isLoading}
                                className="px-6 py-2 bg-[#5866FF] hover:bg-[#4e5be6] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Applying...
                                    </>
                                ) : (
                                    'Apply Filters'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search by order number, customer name, or email..."
                        value={pendingSearchQuery}
                        onChange={(e) => handlePendingSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="w-8 h-8 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {pendingSearchQuery !== searchQuery && (
                    <div className="mt-2">
                        <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Search not applied - click &quot;Apply Filters&quot; above
                        </span>
                    </div>
                )}
            </div>

            {/* Orders Summary */}
            {isLoading ? (
                // Skeleton counters while loading
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-6 bg-gray-300 rounded" />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-6 bg-gray-300 rounded" />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-6 bg-gray-300 rounded" />
                    </div>
                </div>
            ) : totalCount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h3>
                        <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Orders Displayed</h3>
                        <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Access Level</h3>
                        <p className="text-sm font-medium text-[#5866FF]">
                            {currentUser.permissions.canAccessAllLocations ? 'All Locations' : 'Restricted Locations'}
                        </p>
                    </div>
                </div>
            ) : null}

            {isViewDetails && selectedOrder && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                    <div className="p-[30px] bg-white rounded-[15px] w-full max-w-[800px] h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Order Details {selectedOrder.name || ''}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {formatDate(selectedOrder.createdAt)} •{' '}
                                    {selectedOrder.companyLocation?.name || 'Company Order'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setViewDetails(false);
                                    setSelectedOrder(null);
                                    setSearch('');
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Summary badges */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Customer</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {selectedOrder.customer?.email}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Payment / Fulfillment</div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedOrder.displayFinancialStatus && (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedOrder.displayFinancialStatus, 'financial')}`}>
                                            {selectedOrder.displayFinancialStatus.replace('_', ' ')}
                                        </span>
                                    )}
                                    {selectedOrder.displayFulfillmentStatus && (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedOrder.displayFulfillmentStatus, 'fulfillment')}`}>
                                            {selectedOrder.displayFulfillmentStatus.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Total</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {selectedOrder.totalPriceSet?.shopMoney
                                        ? formatCurrency(
                                            selectedOrder.totalPriceSet.shopMoney.amount,
                                            selectedOrder.totalPriceSet.shopMoney.currencyCode
                                        )
                                        : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Search inside modal */}
                        <div className="py-2">
                            <input
                                type="text"
                                placeholder="Search items by name, product, or SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-[40px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] text-sm"
                            />
                        </div>

                        {/* Items table */}
                        <div className="flex-1 overflow-auto py-4">
                            {(() => {
                                const lineItems = selectedOrder.lineItems?.edges || [];
                                const q = search.trim().toLowerCase();

                                const filteredLineItems = q
                                    ? lineItems.filter(({ node }) => {
                                        const name = node.name?.toLowerCase() || '';
                                        const productTitle = node.product?.title?.toLowerCase() || '';
                                        const sku = node.variant?.sku?.toLowerCase() || '';
                                        return (
                                            name.includes(q) ||
                                            productTitle.includes(q) ||
                                            sku.includes(q)
                                        );
                                    })
                                    : lineItems;

                                if (filteredLineItems.length === 0) {
                                    return (
                                        <div className="text-center text-gray-500 py-8 text-sm">
                                            No items found for this order.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Item
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        SKU
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Qty
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Unit Price
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Line Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredLineItems.map(({ node }) => {
                                                    const unitAmount =
                                                        node.originalUnitPriceSet?.shopMoney?.amount ?? '0';
                                                    const currencyCode =
                                                        node.originalUnitPriceSet?.shopMoney?.currencyCode ??
                                                        selectedOrder.totalPriceSet?.shopMoney?.currencyCode ??
                                                        'INR';
                                                    const qty = node.quantity ?? 1;
                                                    const lineTotal = (
                                                        Number(unitAmount) * qty
                                                    ).toString();

                                                    return (
                                                        <tr key={node.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                <div className="font-medium">{node.name}</div>
                                                                {node.product?.title && (
                                                                    <div className="text-xs text-gray-500">
                                                                        {node.product.title}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {node.variant?.sku || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                {qty}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                {formatCurrency(unitAmount, currencyCode)}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                                {formatCurrency(lineTotal, currencyCode)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchOrders(true)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Orders List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                    </div>
                </div>
            ) : orders.length > 0 ? (
                <div>
                    <div className="grid grid-cols-1 gap-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg border border-[#DDE4FF] p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {order.name || order.id}
                                            </h3>
                                            <div className="flex gap-2">
                                                {order.displayFinancialStatus && (
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.displayFinancialStatus, 'financial')}`}>
                                                        {order.displayFinancialStatus.replace('_', ' ')}
                                                    </span>
                                                )}
                                                {order.displayFulfillmentStatus && (
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.displayFulfillmentStatus, 'fulfillment')}`}>
                                                        {order.displayFulfillmentStatus.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">Customer:</span>
                                                <br />
                                                {order.customer?.firstName} {order.customer?.lastName}
                                                <br />
                                                {order.customer?.email}
                                            </div>
                                            <div>
                                                <span className="font-medium">Location:</span>
                                                <br />
                                                {order.companyLocation?.name || 'Company Order'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Date:</span>
                                                <br />
                                                {formatDate(order.createdAt)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Total:</span>
                                                <br />
                                                <span className="text-lg font-semibold text-gray-900">
                                                    {order.totalPriceSet?.shopMoney
                                                        ? formatCurrency(
                                                            order.totalPriceSet.shopMoney.amount,
                                                            order.totalPriceSet.shopMoney.currencyCode
                                                        )
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 lg:mt-0 lg:ml-6 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setSearch('');
                                                setViewDetails(true);
                                            }}
                                            className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            View Details
                                        </button>
                                        {hasPermission('canManageOrders') && (
                                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">
                                                Actions
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More Button */}
                    {pageInfo.hasNextPage && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={loadMore}
                                disabled={isLoading}
                                className="px-6 py-2 bg-[#5866FF] hover:bg-[#4e5be6] text-white rounded-lg disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Load More Orders'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-[#DDE4FF] p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h2>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || Object.values(filters).some(Boolean)
                                ? 'No orders match your current filters. Try adjusting your search criteria.'
                                : 'No orders have been placed yet for your assigned locations.'
                            }
                        </p>
                        {(searchQuery || Object.values(filters).some(Boolean)) && (
                            <button
                                onClick={clearAllFilters}
                                className="px-4 py-2 bg-[#5866FF] hover:bg-[#4e5be6] text-white rounded-lg"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagementPage;
