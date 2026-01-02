import { useState, useEffect, useRef, useMemo } from 'react';
import DeleteIcon from '../../Icons/DeleteIcon';
import EditIcon from '../../Icons/EditIcon';
import SearchIcon from '../../Icons/SearchIcon';
import PluseIcon from '../../Icons/PluseIcon';
import { PermissionGuard } from '../PermissionGuard';

import LocationMultiSelectWithRoles from '../common/LocationMultiSelectWithRoles';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface PageProps {
    customerId: string;
    shop: string;
    proxyUrl: string;
}
interface User {
    id: string | number;
    name: string;
    email: string;
    company: string;
    role: string;
    credit: number;
    creditLimit: string;
    locations: string;
    locationRoles: {
        roleName: string;
        locationName: string;
    }[];
    reports: {
        activity: {
            lastOrder: string;
            totalOrders: string;
            totalOrdersCount: number;
        };
        orders: Array<{
            id: string;
            date: string;
            amount: string;
            status: string;
        }>;
        creditUsage: {
            creditUsed: string;
            creditLimit: string;
            transactions: Array<{
                id: string;
                date: string;
                amount: string;
            }>;
        };
    };
}
interface PageInfo {
    hasNextPage: boolean;
    endCursor: string;
    hasPreviousPage: boolean;
    startCursor: string;
}
interface Role {
    name: string;
    value: string;
}
interface Location {
    id: string;
    name: string;
    address: string;
}
interface EditFormData {
    name: string;
    email: string;
    credit: number | null;
    locationRoles: [];
}
interface CachedData<T> {
    data: T;
    timestamp: number;
}

// Cache duration: 1 day in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper functions for cache management
const getCacheKey = (prefix: string, params: Record<string, string>) => {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return `${prefix}:${sortedParams}`;
};

const getFromCache = <T,>(key: string): T | null => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        const { data, timestamp }: CachedData<T> = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
            return data;
        }
        localStorage.removeItem(key);
        return null;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
};

const setToCache = <T,>(key: string, data: T): void => {
    try {
        const cacheData: CachedData<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Cache write error:', error);
    }
};

const invalidateCache = (prefix: string): void => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Cache invalidation error:', error);
    }
};

const UserManagementPage = ({ customerId, shop, proxyUrl }: PageProps) => {
    const { currentUser } = useCurrentUser();

    const [users, setUsers] = useState<User[]>([]);
    const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // server-side page index (just for display)
    const [pageIndex, setPageIndex] = useState(1);

    // track if at least one fetch has completed
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Roles and locations
    const [roles, setRoles] = useState<Role[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState<any>({
        name: '',
        email: '',
        credit: 0,
        locationRoles: [],
    });
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});

    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Reports modal
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('Activity');

    // Request deduplication
    const activeRequestsRef = useRef<Set<string>>(new Set());

    // Debounce search with longer delay (800ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 800);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter + sort users (no slicing)
    const filteredUsers = useMemo(() => {
        const q = (debouncedSearch || '').trim().toLowerCase();

        const filtered = q
            ? users.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            )
            : users.slice();

        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return filtered;
    }, [users, debouncedSearch]);

    // Fetch users 
    const fetchUsers = async (
        cursor?: string,
        force: boolean = false,
        direction: 'after' | 'before' | 'none' = 'none'
    ) => {
        const paramsObj: Record<string, string> = {
            customerId,
            shop,
            query: debouncedSearch || '',
        };

        if (direction === 'after' && cursor) {
            paramsObj['after'] = cursor;
        } else if (direction === 'before' && cursor) {
            paramsObj['before'] = cursor;
        }

        const params = new URLSearchParams(paramsObj);
        const cacheKey = getCacheKey('users', paramsObj);
        const requestKey = `fetch_users_${cacheKey}`;

        // If a request with same key is already running, just skip – do NOT enter try/finally
        if (activeRequestsRef.current.has(requestKey)) {
            console.log('Request already in progress, skipping...', { requestKey });
            return;
        }

        // Check cache first (only if not forced)
        if (!force) {
            const cachedData = getFromCache<{ users: User[]; pageInfo: PageInfo | null }>(cacheKey);
            if (cachedData) {
                console.log('Using cached data for users', cachedData);
                setUsers(
                    [...(cachedData.users || [])].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    )
                );
                setPageInfo(cachedData.pageInfo || null);
                setLoading(false);
                setHasLoadedOnce(true);
                return;
            }
        }

        // No cache (or forced) – hit the network
        activeRequestsRef.current.add(requestKey);

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${proxyUrl}/usermanagement?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }

            const responseData = {
                users: data.users || [],
                pageInfo: data.pageInfo || null,
            };

            // Cache the response
            setToCache(cacheKey, responseData);

            setUsers(
                [...responseData.users].sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
            );
            setPageInfo(responseData.pageInfo);
        } catch (err) {
            console.error('fetchUsers error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {
            activeRequestsRef.current.delete(requestKey);
            setLoading(false);
            setHasLoadedOnce(true);
        }
    };

    // Fetch roles with caching
    const fetchRoles = async () => {
        try {
            const cacheKey = getCacheKey('roles', { customerId, shop });
            const cachedData = getFromCache<Role[]>(cacheKey);
            if (cachedData) {
                console.log('Using cached data for roles');
                setRoles(cachedData);
                return;
            }
            const params = new URLSearchParams({
                customerId,
                shop,
                action: 'roles'
            });
            const response = await fetch(`${proxyUrl}/usermanagement?${params.toString()}`);
            const data = await response.json();
            if (response.ok && data.roles) {
                setRoles(data.roles);
                setToCache(cacheKey, data.roles);
            }
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    };

    // Fetch locations with caching
    const fetchLocations = async (force = false) => {
        try {
            const cacheKey = getCacheKey('locations', { customerId, shop });
            if (!force) {
                const cachedData = getFromCache<Location[]>(cacheKey);
                if (cachedData) {
                    console.log('Using cached data for locations');
                    setLocations(cachedData);
                    return;
                }
            }
            const params = new URLSearchParams({
                customerId,
                shop,
                action: 'locations',
            });
            const response = await fetch(`${proxyUrl}/usermanagement?${params.toString()}`);
            const data = await response.json();
            if (response.ok && data.locations) {
                setLocations(data.locations);
                setToCache(cacheKey, data.locations);
            }
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        }
    };

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([
                fetchUsers(undefined, true, 'none'),
                fetchRoles(),
                fetchLocations(true)
            ]);
        };
        loadInitialData();
    }, []);

    // Reload when search changes (reset to page 1)
    useEffect(() => {
        setPageIndex(1);
        fetchUsers(undefined, true, 'none');
    }, [debouncedSearch]);

    // Handle pagination (cursor-based)
    const handleNextPage = () => {
        if (pageInfo?.hasNextPage && pageInfo.endCursor) {
            fetchUsers(pageInfo.endCursor, true, 'after');
            setPageIndex(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (pageInfo?.hasPreviousPage && pageInfo.startCursor) {
            fetchUsers(pageInfo.startCursor, true, 'before');
            setPageIndex(prev => Math.max(1, prev - 1));
        }
    };

    // Handle add user
    const handleAddUser = () => {
        setEditingUser(null);
        setEditFormData({
            name: '',
            email: '',
            credit: null,
            locationRoles: []
        });
        setSelectedLocationIds([]);
        setFormError(null);
        setIsEditModalOpen(true);
    };

    // Handle edit user
    const handleEdit = (user: any) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            credit: user.credit,
            locationRoles: user.locationRoles
        });
        setSelectedLocationIds([]);
        setFormError(null);
        setIsEditModalOpen(true);
    };

    // Handle form change (credit fix)
    const handleEditFormChange = (
        field: keyof EditFormData,
        value: any
    ) => {
        setFormError(null);
        setEditFormData((prev: EditFormData) => {
            if (field === 'credit') {
                if (value === '') {
                    return { ...prev, credit: null };
                }
                return { ...prev, credit: Number(value) };
            }
            return {
                ...prev,
                [field]: value,
            };
        });
    };

    // Handle location toggle
    const handleLocationToggle = (locationId: string) => {
        setSelectedLocationIds(prev => {
            if (prev.includes(locationId)) {
                return prev.filter(id => id !== locationId);
            } else {
                return [...prev, locationId];
            }
        });
    };

    // Handle form submit
    const handleEditFormSubmit = async () => {
        setFormError(null);
        if (!editFormData.name.trim()) {
            setFormError('Name is required');
            return;
        }
        if (!editFormData.email.trim()) {
            setFormError('Email is required');
            return;
        }
        setIsSubmitting(true);
        try {
            const action = editingUser ? 'edit' : 'create';
            const body: Record<string, any> = {
                customerId,
                shop,
                action,
                name: editFormData.name,
                email: editFormData.email,
                credit: editFormData.credit,
                locationRoles: editFormData.locationRoles
            };
            if (editingUser) {
                body.userId = editingUser.id.toString();
            }
            const response = await fetch(`${proxyUrl}/usermanagement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save user');
            }
            invalidateCache('users');
            setPageIndex(1);
            await fetchUsers(undefined, true, 'none');
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete
    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            const response = await fetch(`${proxyUrl}/usermanagement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId,
                    shop,
                    action: 'delete',
                    userId: userToDelete.id.toString()
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }
            invalidateCache('users');
            await fetchUsers(undefined, true, 'none');
            setUserToDelete(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete user');
        }
    };

    // Handle reports
    const openReportsModal = (user: User) => {
        setSelectedUser(user);
        setActiveTab('Activity');
    };

    const closeModal = () => {
        setSelectedUser(null);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setFormError(null);
    };

    // Export functionality (exports current page users)
    const handleExport = () => {
        if (users.length === 0) {
            alert('There are no users to export yet.');
            return;
        }
        const headers = ['Name', 'Email', 'Role', 'Locations', 'Credit'];
        const csvRows = [
            headers.join(','),
            ...users.map(user => {
                const values = [
                    user.name,
                    user.email,
                    user.role,
                    user.locations,
                    user.credit
                ];
                return values.map(value =>
                    `"${(value ?? '').toString().replace(/"/g, '""')}"`
                ).join(',');
            })
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'company-users.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const isMainContact = currentUser?.company?.isMainContact;
    const editableLocationNames = useMemo(() => {
        if (!currentUser || !currentUser.roleAssignments) return new Set<string>();
        return new Set<string>(
            currentUser.roleAssignments.map((ra: any) => ra.locationName)
        );
    }, [currentUser]);

    const toggleRow = (id: string | number) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Render
    return (
        <PermissionGuard permission="canManageUsers">
            <div>
                <header className="bg-white border-gray-200 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                User Management
                            </h1>
                            <p className="text-[#6B7280] text-sm">
                                Manage your company users and permissions
                            </p>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-[#DDE4FF]">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex-1 min-w-[200px] max-w-md">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <SearchIcon />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="dashboard-user-search w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExport}
                                    className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <div><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.1636 13.6896C16.8025 13.2404 17.2816 12.5992 17.5314 11.8592C17.7811 11.1192 17.7886 10.3188 17.5527 9.57427C17.0688 8.04638 15.586 7.20903 13.9835 7.21062H13.0576C12.8366 6.34918 12.4231 5.54909 11.8482 4.8706C11.2732 4.19211 10.5519 3.65289 9.73837 3.29354C8.92487 2.9342 8.04046 2.7641 7.1517 2.79605C6.26295 2.82799 5.39303 3.06115 4.60743 3.47798C3.82184 3.8948 3.14105 4.48442 2.61631 5.20244C2.09158 5.92046 1.73658 6.74817 1.57805 7.62325C1.41952 8.49833 1.46158 9.39798 1.70107 10.2545C1.94057 11.1109 2.37125 11.9019 2.96069 12.5678M9.57731 16.356L9.57411 9.17534M12.1129 13.8173L9.57411 16.356L7.03534 13.8173" stroke="currentColor" strokeWidth="1.59571" strokeLinecap="round" strokeLinejoin="round"></path></svg></div>
                                    Export
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <PluseIcon />
                                    Add User
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    {!hasLoadedOnce || loading ? (
                        <div className="p-12 text-center text-gray-500">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No users found</h2>
                            <p className="text-gray-600 mb-4">
                                Add your first user to get started.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location & Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredUsers.map((user) => {
                                            const userHasEditableLocation =
                                                Array.isArray(user.locationRoles) &&
                                                user.locationRoles.some(lr =>
                                                    editableLocationNames.has(lr.locationName)
                                                );
                                            const canManageUser = !!isMainContact || userHasEditableLocation;
                                            return (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {(() => {
                                                            const pairs = user.locationRoles || [];
                                                            const isExpanded = expandedRows[user.id];

                                                            // COLLAPSED → ONLY 2
                                                            if (!isExpanded) {
                                                                return (
                                                                    <div className="space-y-1">
                                                                        {pairs.slice(0, 2).map((lr, idx) => (
                                                                            <div key={idx}>
                                                                                <span className="font-medium ">{lr.locationName}</span>
                                                                                <span className="mx-1">–</span>
                                                                                <span className="text-gray-500">{lr.roleName}</span>
                                                                            </div>
                                                                        ))}

                                                                        {pairs.length > 2 && (
                                                                            <button
                                                                                onClick={() => toggleRow(user.id)}
                                                                                className="text-[#5866FF] font-medium hover:underline"
                                                                            >
                                                                                +{pairs.length - 2} more
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            // EXPANDED → ROW-WISE (VERTICAL)
                                                            return (
                                                                <div className="space-y-1">
                                                                    {pairs.map((lr, idx) => (
                                                                        <div key={idx}>
                                                                            <span className="font-medium">{lr.locationName}</span>
                                                                            <span className="mx-1">–</span>
                                                                            <span className="text-gray-600">{lr.roleName}</span>
                                                                        </div>
                                                                    ))}

                                                                    <button
                                                                        onClick={() => toggleRow(user.id)}
                                                                        className="text-blue-600 font-medium hover:underline"
                                                                    >
                                                                        Show less
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>   
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{user.credit}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            {canManageUser && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEdit(user)}
                                                                        className="text-green-600 hover:text-green-900 cursor-pointer"
                                                                        title="Edit User"
                                                                    >
                                                                        <EditIcon />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteClick(user)}
                                                                        className="text-red-600 hover:text-red-900 cursor-pointer"
                                                                        title="Delete User"
                                                                    >
                                                                        <DeleteIcon />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={!pageInfo?.hasPreviousPage || pageIndex === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={!pageInfo?.hasNextPage}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                    <div className="text-sm text-gray-600 ml-4">
                                        Page {pageIndex} • Showing {filteredUsers.length} users
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Add/Edit User Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                        <div className="bg-white rounded-[15px] p-6 max-w-[500px] w-full mx-4">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h2>
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
                                    {formError}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="user-name" className="block text-sm font-medium text-black mb-1">Name</label>
                                    <input
                                        placeholder='Enter User Name'
                                        id="user-name"
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="user-email" className="block text-sm font-medium text-black mb-1">Email</label>
                                    <input
                                        placeholder='user@gmail.com'
                                        id="user-email"
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="user-credit" className="block text-sm font-medium text-black mb-1">Credit</label>
                                    <input
                                        placeholder='user credit'
                                        id="user-credit"
                                        type="number"
                                        value={editFormData.credit ?? ''}
                                        onChange={(e) => handleEditFormChange('credit', e.target.value)}
                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                    />
                                </div>
                                <LocationMultiSelectWithRoles
                                    locations={locations}
                                    roles={roles}
                                    editFormData={editFormData}
                                    setEditFormData={setEditFormData}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={closeEditModal}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-[#DDE4FF] rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditFormSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-[#5866FF] hover:bg-[#4e5be6] text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {userToDelete && (
                    <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{userToDelete.name}</strong>?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setUserToDelete(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reports Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">User Reports: {selectedUser.name}</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="border-b border-gray-200 mb-4">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('Activity')}
                                        className={`px-4 py-2 ${activeTab === 'Activity' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        Activity
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('Orders')}
                                        className={`px-4 py-2 ${activeTab === 'Orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        Orders
                                    </button>
                                </div>
                            </div>
                            {activeTab === 'Activity' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Last Order</div>
                                            <div className="text-lg font-semibold">{selectedUser.reports.activity.lastOrder}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Total Orders</div>
                                            <div className="text-lg font-semibold">{selectedUser.reports.activity.totalOrders}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'Orders' && (
                                <div>
                                    {selectedUser.reports.orders.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No orders found</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedUser.reports.orders.map((order) => (
                                                <div key={order.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium">Order #{order.id}</div>
                                                        <div className="text-sm text-gray-600">{order.date}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold">{order.amount}</div>
                                                        <div className="text-sm text-gray-600">{order.status}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
};

export default UserManagementPage;
