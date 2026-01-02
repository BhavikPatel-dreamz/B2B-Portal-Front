import DeleteIcon from 'app/Icons/DeleteIcon';
import EditIcon from 'app/Icons/EditIcon';
import LastOrder from 'app/Icons/LastOrder';
import NotificationIcon from 'app/Icons/NotificationIcon';
import PluseIcon from 'app/Icons/PluseIcon';
import ReportIcon from 'app/Icons/ReportIcon';
import SearchIcon from 'app/Icons/SearchIcon';
import SettingsIcon from 'app/Icons/SettingsIcon';
import UpdateIcon from 'app/Icons/UpdateIcon';
import UpGraph from 'app/Icons/UpGraph';
import React, { useState, useEffect } from 'react';
import { useSubmit, useSearchParams,  useNavigation } from "react-router";

interface User {
    id: string | number;
    name: string;
    email: string;
    company: string;
    role: string;
    credit: string;
    creditLimit: string;
    locations: string;
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

interface EditFormData {
    name: string;
    email: string;
    creditLimit: string;
    role: string;
    locations: string;
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

interface ActionResult {
    success?: boolean;
    error?: string;
}

interface UserManagementProps {
    initialUsers?: User[];
    pageInfo?: PageInfo;
    availableRoles?: Role[];
    availableLocations?: Location[];
    actionResult?: ActionResult | null;
}

const UserManagement: React.FC<UserManagementProps> = ({
    initialUsers,
    pageInfo,
    availableRoles = [],
    availableLocations = [],
    actionResult
}) => {
    const submit = useSubmit();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || '');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || 'Sort: Name');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('Activity');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToUpdateCredit, setUserToUpdateCredit] = useState<User | null>(null);
    const [newCreditLimit, setNewCreditLimit] = useState('');

    // Edit/Add User Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({
        name: '',
        email: '',
        creditLimit: '',
        role: availableRoles.length > 0 ? availableRoles[0].name : 'Admin',
        locations: ''
    });

    // State for selected locations in the modal
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [formError, setFormError] = useState<string | null>(null);

    const users: User[] = initialUsers || [];

    // Handle search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== searchParams.get("query")) {
                setSearchParams(prev => {
                    prev.set("query", searchQuery);
                    prev.delete("after"); // Reset pagination on search
                    return prev;
                });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, setSearchParams, searchParams]);

    // Handle sort change
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSort = e.target.value;
        setSortBy(newSort);
        setSearchParams(prev => {
            prev.set("sort", newSort);
            return prev;
        });
    };

    const handleNextPage = () => {
        if (pageInfo?.hasNextPage) {
            setSearchParams(prev => {
                prev.set("after", pageInfo.endCursor);
                return prev;
            });
        }
    };

    const handlePrevPage = () => {
        // Simple back implementation - effectively just reloading or going back in history
        // Real implementation would need 'before' cursor support in loader
        window.history.back();
    };

    const openReportsModal = (user: User) => {
        setSelectedUser(user);
        setActiveTab('Activity');
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setEditFormData({
            name: '',
            email: '',
            creditLimit: '',
            role: availableRoles.length > 0 ? availableRoles[0].name : 'Admin',
            locations: ''
        });
        setSelectedLocationIds([]);
        setFormError(null);
        setIsEditModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            creditLimit: user.creditLimit.replace(/[$,]/g, ''),
            role: user.role,
            locations: user.locations
        });
        // We don't have location IDs in the user object yet, so we can't pre-select them accurately
        // unless we parse the names or update the user object.
        // For now, we'll leave it empty or try to match names if possible.
        setSelectedLocationIds([]);
        setFormError(null);
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (field: keyof EditFormData, value: string) => {
        setFormError(null);
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLocationToggle = (locationId: string) => {
        setSelectedLocationIds(prev => {
            if (prev.includes(locationId)) {
                return prev.filter(id => id !== locationId);
            } else {
                return [...prev, locationId];
            }
        });
    };

    const handleExport = () => {
        if (typeof window === 'undefined') {
            return;
        }
        if (users.length === 0) {
            window.alert('There are no users to export yet.');
            return;
        }
        window.alert('Exporting user list as CSV.');
        const headers = ['Name', 'Email', 'Company', 'Role', 'Credit', 'Credit Limit', 'Locations'];
        const csvRows = [
            headers.join(','),
            ...users.map(user => {
                const values = [
                    user.name,
                    user.email,
                    user.company,
                    user.role,
                    user.credit,
                    user.creditLimit,
                    user.locations
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

    const handleEditFormSubmit = () => {
        setFormError(null);
        if (editingUser) {
            // Update existing user - Not implemented in backend yet
            console.log('Updating user:', editingUser.id, editFormData);
        } else {
            if (!editFormData.name.trim()) {
                setFormError('Name is required');
                return;
            }
            if (!editFormData.email.trim()) {
                setFormError('Email is required');
                return;
            }
            // Add new user
            const formData = new FormData();
            formData.append("intent", "create_user");
            formData.append("name", editFormData.name);
            formData.append("email", editFormData.email);
            formData.append("role", editFormData.role);
            // Send selected location IDs as comma separated string
            formData.append("locations", selectedLocationIds.join(','));

            submit(formData, { method: "post" });
        }
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setFormError(null);
    };

    const closeModal = () => {
        setSelectedUser(null);
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
    };

    const handleDeleteConfirm = () => {
        console.log('Deleting user:', userToDelete);
        setUserToDelete(null);
    };

    const handleDeleteCancel = () => {
        setUserToDelete(null);
    };

    const handleUpdateCreditClick = (user: User) => {
        setUserToUpdateCredit(user);
        const currentLimit = user.creditLimit.replace(/[$,]/g, '');
        setNewCreditLimit(currentLimit);
    };

    const handleUpdateCreditConfirm = () => {
        console.log('Updating credit limit for:', userToUpdateCredit, 'New limit:', newCreditLimit);
        setUserToUpdateCredit(null);
        setNewCreditLimit('');
    };

    const handleUpdateCreditCancel = () => {
        setUserToUpdateCredit(null);
        setNewCreditLimit('');
    };

    useEffect(() => {
        if (!actionResult || editingUser) return;
        if (actionResult.success) {
            setIsEditModalOpen(false);
            setEditFormData({
                name: '',
                email: '',
                creditLimit: '',
                role: availableRoles.length > 0 ? availableRoles[0].name : 'Admin',
                locations: ''
            });
            setSelectedLocationIds([]);
            setFormError(null);
        } else if (actionResult.error) {
            setFormError(actionResult.error);
        }
    }, [actionResult, editingUser, availableRoles]);

    const renderTabContent = () => {
        if (!selectedUser) return null;

        switch (activeTab) {
            case 'Activity':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-[#DDE4FF]">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <LastOrder color="#5866FF" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-[#030917] font-semibold">Last Order</p>
                                <p className="text-xs text-[#6F7177] font-normal">{selectedUser.reports.activity.lastOrder}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded">
                                Completed
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-[#DDE4FF]">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <UpGraph color='#5866FF' />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-[#030917] font-semibold">Total Orders</p>
                                <p className="text-xs text-[#6F7177] font-normal">{selectedUser.reports.activity.totalOrders}</p>
                            </div>
                            <span className="text-lg font-semibold text-gray-900">
                                {selectedUser.reports.activity.totalOrdersCount}
                            </span>
                        </div>
                    </div>
                );
            case 'Orders':
                return (
                    <div className="space-y-3">
                        {selectedUser.reports.orders.map((order) => (
                            <div key={order.id} className="p-[15px] rounded-lg border border-[#DDE4FF]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-[#030917] text-[14px]">Order {order.id}</span>
                                    <span className="text-[16px] font-bold  text-black">{order.amount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-normal text-[#6F7177]">{order.date}</span>
                                    <span className="text-[11px] font-medium text-gray-700">{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'Credit Usage':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-[#F0F0FF] rounded-lg border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[#030917]">Credit Used</span>
                                <span className="text-xs  font-bold text-black">
                                    {selectedUser.reports.creditUsage.creditUsed} / {selectedUser.reports.creditUsage.creditLimit}
                                </span>
                            </div>
                            <div className="w-full bg-indigo-200 rounded-full h-2">
                                <div
                                    className="bg-[#5866FF] h-2 rounded-full"
                                    style={{
                                        width: `${(parseInt(selectedUser.reports.creditUsage.creditUsed.replace(/[$,]/g, '')) /
                                            parseInt(selectedUser.reports.creditUsage.creditLimit.replace(/[$,]/g, ''))) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {selectedUser.reports.creditUsage.transactions.map((transaction) => (
                                <div key={transaction.id} className="p-4 border border-[#DDE4FF] rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900">Order {transaction.id}</span>
                                        <span className="text-[16px] font-semibold text-red-600">{transaction.amount}</span>
                                    </div>
                                    <span className="text-sm text-[#6F7177]">{transaction.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
                    <p className="text-[#6B7280] text-sm">Manage Company Users and assign roles</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddUser}
                        className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-5 py-4 rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                        <PluseIcon />
                        Add User
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
                        <SettingsIcon color="#5866FF" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
                        <NotificationIcon color="#5866FF" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 mt-8">
                <div className="w-[40%] flex relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-[15%] px-4 py-2.5 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                >
                    <option>All Roles</option>
                    {availableRoles.map(role => (
                        <option key={role.value} value={role.name}>{role.name}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="w-[30%] px-4 py-2.5 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                >
                    <option>Sort: Name</option>
                    <option>Sort: Company</option>
                    <option>Sort: Credit</option>
                </select>
                <button onClick={handleExport} className="w-[15%] px-4 py-2.5 border border-[#D1D5DB] rounded-lg hover:bg-gray-50 font-medium transition-colors">
                    Export CV
                </button>
            </div>

            {/* User Cards */}
            <div className="space-y-4">
                {users.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No users found.
                    </div>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-[#030917]">{user.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role.includes('Admin')
                                            ? 'bg-[#5866FF] text-white'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <p className="text-[#6B7280] mb-1">{user.email}</p>
                                    <p className="text-[#6B7280] mb-3">Company: {user.company}</p>
                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="text-gray-600">
                                            Credit: <span className="font-semibold text-[#030917]">{user.credit}</span> / <span className="font-semibold text-[#6B7280]">{user.creditLimit}</span>
                                        </span>
                                        <span className="text-gray-600">
                                            Locations: <span className="text-[#6B7280]">{user.locations}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(user)}
                                        className="flex gap-4 px-4 py-1 bg-[#E5E7EB4D] border border-[#E5E7EB] hover:bg-gray-50 rounded-md text-sm font-medium text-[#4B5563] transition-colors"
                                    >
                                        <EditIcon />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateCreditClick(user)}
                                        className="flex gap-4 px-4 py-1 bg-[#E5E7EB4D] border border-[#E5E7EB] hover:bg-gray-50 rounded-md text-sm font-medium text-[#4B5563] transition-colors"
                                    >
                                        <UpdateIcon />
                                        Update Credit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openReportsModal(user)}
                                        className="flex gap-4 px-4 py-1 bg-[#E5E7EB4D] border border-[#E5E7EB] hover:bg-gray-50 rounded-md text-sm font-medium text-[#4B5563] transition-colors"
                                    >
                                        <ReportIcon />
                                        Reports
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteClick(user)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pageInfo && (
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handlePrevPage}
                        disabled={!pageInfo.hasPreviousPage}
                        className={`px-4 py-2 border border-[#D1D5DB] rounded-lg font-medium transition-colors ${!pageInfo.hasPreviousPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={!pageInfo.hasNextPage}
                        className={`px-4 py-2 border border-[#D1D5DB] rounded-lg font-medium transition-colors ${!pageInfo.hasNextPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Edit/Add User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[22px] font-bold text-[#030917]">
                                {editingUser ? 'Edit User' : 'Add User'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formError && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}
                            <div>
                                <label htmlFor="user-name" className="block text-sm font-medium text-[#030917] mb-2">
                                    Name
                                </label>
                                <input
                                    id="user-name"
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="user-email" className="block text-sm font-medium text-[#030917] mb-2">
                                    Email
                                </label>
                                <input
                                    id="user-email"
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="john@gmail.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="user-credit-limit" className="block text-sm font-medium text-[#030917] mb-2">
                                    Credit Limit
                                </label>
                                <input
                                    id="user-credit-limit"
                                    type="number"
                                    value={editFormData.creditLimit}
                                    onChange={(e) => handleEditFormChange('creditLimit', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="5000"
                                />
                            </div>

                            <div>
                                <label htmlFor="user-role" className="block text-sm font-medium text-[#030917] mb-2">
                                    Role
                                </label>
                                <select
                                    id="user-role"
                                    value={editFormData.role}
                                    onChange={(e) => handleEditFormChange('role', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                                >
                                    {availableRoles.length > 0 ? (
                                        availableRoles.map(role => (
                                            <option key={role.value} value={role.name}>{role.name}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option>Admin</option>
                                            <option>Order Only</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <p className="block text-sm font-medium text-[#030917] mb-2">
                                    Locations
                                </p>
                                <div className="border border-[#E5E7EB] rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {availableLocations.length > 0 ? (
                                        availableLocations.map(location => (
                                            <div key={location.id} className="flex items-center mb-2 last:mb-0">
                                                <input
                                                    type="checkbox"
                                                    id={`loc-${location.id}`}
                                                    checked={selectedLocationIds.includes(location.id)}
                                                    onChange={() => handleLocationToggle(location.id)}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <label htmlFor={`loc-${location.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                                                    {location.name}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No locations available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleEditFormSubmit}
                            disabled={isSubmitting}
                            className="w-full mt-6 px-4 py-3 bg-[#5866FF] hover:bg-[#4e5be6] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : (editingUser ? 'Update User' : 'Add User')}
                        </button>
                    </div>
                </div>
            )}

            {/* Reports Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[630px]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-[22px] font-bold text-gray-900">User Reports - {selectedUser.name}</h2>
                                <p className="text-[13px] font-normal text-[#6F7177]">Activity and Usage Reports</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-[#F5F5FF] bg-[#F5F5FF] p-1">
                            {['Activity', 'Orders', 'Credit Usage'].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab
                                        ? 'bg-white'
                                        : 'text-[#6F7177]'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[400px] p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-[22px] font-bold text-[#030917]">Are you sure?</h3>
                            <button
                                type="button"
                                onClick={handleDeleteCancel}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm font-normal text-[#6F7177] mb-6">
                            This will permanently remove {userToDelete.name} from the system. This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleDeleteCancel}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Credit Modal */}
            {userToUpdateCredit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] p-6">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-[22px] font-bold text-[#030917]">User Credit Limit</h3>
                                <p className="text-[13px] font-normal text-[#6F7177]">Update monthly credit limit for {userToUpdateCredit.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleUpdateCreditCancel}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-6">
                            <label htmlFor="update-credit-limit" className="block text-sm font-semibold text-black mb-2">
                                New Credit Limit
                            </label>
                            <input
                                id="update-credit-limit"
                                type="number"
                                value={newCreditLimit}
                                onChange={(e) => setNewCreditLimit(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter new credit limit"
                            />
                            <div className="mt-3 text-sm text-gray-500 space-y-1">
                                <p>Current: {userToUpdateCredit.creditLimit}</p>
                                <p>Used: {userToUpdateCredit.credit}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleUpdateCreditConfirm}
                            className="w-full mt-6 px-4 py-3 bg-[#5866FF] hover:bg-[#4e5be6] text-white rounded-lg font-medium transition-colors"
                        >
                            Update Credit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
