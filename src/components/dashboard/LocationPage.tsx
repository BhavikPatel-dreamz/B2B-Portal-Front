import { useState, useEffect, useRef, useMemo } from 'react';
import DeleteIcon from "../../Icons/DeleteIcon";
import EditIcon from "../../Icons/EditIcon";
import LocationIcon from "../../Icons/LocationIcon";
import PluseIcon from "../../Icons/PluseIcon";
import UserCheckIcon from "../../Icons/UserCheckIcon";
import CloseIcon from "../../Icons/CloseIcon";
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface PageProps {
    customerId: string;
    shop: string;
    proxyUrl: string;
}

interface Location {
    id: string | number;
    name: string;
    company?: string;
    address: string;
    assignedUsers: number;
    phone?: string | null;
    externalId?: string | null;
    note?: string | null;
    shippingAddress?: AddressData | null;
    billingAddress?: AddressData | null;
}

interface AddressData {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
}

interface LocationFormData {
    name: string;
    phone: string;
    externalId: string;
    note: string;
    billingAddress: {
        address1: string;
        address2: string;
        city: string;
        province: string;
        zip: string;
        country: string;
    };
    shippingAddress: {
        address1: string;
        address2: string;
        city: string;
        province: string;
        zip: string;
        country: string;
    };
    billingSameAsShipping: boolean;
}

type LocationRole = {
    roleName: string;
    locationName: string;
};

type User = {
    id: string;
    name: string;
    email?: string;
    company?: string;
    role?: string;
    credit?: number;
    locations?: string;
    locationRoles?: LocationRole[];
    matchedRoles?: string[];
};

type PageInfo = {
    hasNextPage: boolean;
    endCursor?: string | null;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
};

function useDebounce<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

const countries = [
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
];

const statesByCountry: Record<string, { code: string; name: string }[]> = {
    US: [
        { code: 'NY', name: 'New York' },
        { code: 'CA', name: 'California' },
        { code: 'TX', name: 'Texas' },
        { code: 'FL', name: 'Florida' },
        { code: 'WA', name: 'Washington' },
    ],
    IN: [
        { code: 'GJ', name: 'Gujarat' },
        { code: 'MH', name: 'Maharashtra' },
        { code: 'DL', name: 'Delhi' },
        { code: 'RJ', name: 'Rajasthan' },
        { code: 'KA', name: 'Karnataka' },
    ],
    CA: [
        { code: 'ON', name: 'Ontario' },
        { code: 'QC', name: 'Quebec' },
        { code: 'BC', name: 'British Columbia' },
        { code: 'AB', name: 'Alberta' },
        { code: 'MB', name: 'Manitoba' },
    ],
    GB: [
        { code: 'ENG', name: 'England' },
        { code: 'SCT', name: 'Scotland' },
        { code: 'WLS', name: 'Wales' },
        { code: 'NIR', name: 'Northern Ireland' },
        { code: 'LND', name: 'London' },
    ],
    AU: [
        { code: 'NSW', name: 'New South Wales' },
        { code: 'VIC', name: 'Victoria' },
        { code: 'QLD', name: 'Queensland' },
        { code: 'WAU', name: 'Western Australia' },
        { code: 'SA', name: 'South Australia' },
    ],
};

const countryNameToCode: Record<string, string> = {
    'India': 'IN',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'Australia': 'AU'
};

const LocationPage = ({ customerId, shop, proxyUrl }: PageProps) => {
    const { currentUser } = useCurrentUser();
    const [locations, setLocations] = useState<Location[]>([]);
    const [companyName, setCompanyName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTotalAssignedUsersModalOpen, setIsTotalAssignedUsersModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState<LocationFormData>({
        name: '',
        phone: '',
        externalId: '',
        note: '',
        billingAddress: {
            address1: '',
            address2: '',
            city: '',
            province: '',
            zip: '',
            country: ''
        },
        shippingAddress: {
            address1: '',
            address2: '',
            city: '',
            province: '',
            zip: '',
            country: ''
        },
        billingSameAsShipping: true
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

    // assigned Users modal state & helpers
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoadingInitial, setUsersLoadingInitial] = useState(false); 
    const [usersLoadingMore, setUsersLoadingMore] = useState(false); 
    const [usersError, setUsersError] = useState<string | null>(null);
    const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 350);

    // track if at least one fetch has completed for the assigned-users modal (prevents flash)
    const [usersHasLoadedOnce, setUsersHasLoadedOnce] = useState(false);

    const [selectedLocationForModal, setSelectedLocationForModal] = useState<Location | null>(null);

    const cacheRef = useRef<Map<string, { users: User[]; pageInfo: PageInfo | null }>>(new Map());
    const activeRequestsRef = useRef<Set<string>>(new Set());

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const isFetchingMoreRef = useRef(false);

    const getCacheKey = (prefix: string, obj: Record<string, string>) => {
        return `${prefix}_${Object.keys(obj).sort().map(k => `${k}=${obj[k]}`).join('&')}`;
    };

    //Fetch users (with caching + dedupe). Supports pagination (after param).
    const fetchUsers = async (after?: string) => {

        try {
            if (after) {
                setUsersLoadingMore(true);
                isFetchingMoreRef.current = true;
            } else {
                setUsersLoadingInitial(true);
                setUsersError(null);
            }

            const params = new URLSearchParams({
                customerId,
                shop,
                query: debouncedSearch ?? '',
            });

            if (after) params.append('after', after);

            const cacheKey = getCacheKey('users', {
                customerId,
                shop,
                query: debouncedSearch ?? '',
                after: after || '',
            });

            const requestKey = `fetch_users_${cacheKey}`;

            if (activeRequestsRef.current.has(requestKey)) {
                console.log("⛔ SKIPPING — request already in progress for:", requestKey);
                return;
            }

            const cached = !after ? cacheRef.current.get(cacheKey) : null;
            if (cached && !after) {
                setUsers([...cached.users].sort((a, b) => a.name.localeCompare(b.name)));
                setPageInfo(cached.pageInfo);
                return;
            }

            activeRequestsRef.current.add(requestKey);

            const url = `${proxyUrl}/usermanagement?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || 'Failed to fetch users');
            }

            const responseData = {
                users: data.users || [],
                pageInfo: data.pageInfo || null,
            };

            cacheRef.current.set(cacheKey, responseData);

            if (after) {
                setUsers((prev) => {
                    const combined = [...prev, ...responseData.users];
                    const map = new Map<string, User>();
                    combined.forEach(u => map.set(u.id, u));
                    const result = Array.from(map.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
                    return result;
                });
            } else {
                setUsers([...responseData.users].sort((a, b) => a.name.localeCompare(b.name)));
            }

            setPageInfo(responseData.pageInfo);

        } catch (err) {
            setUsersError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {

            if (after) {
                setUsersLoadingMore(false);
                isFetchingMoreRef.current = false;
            } else {
                setUsersLoadingInitial(false);
                setUsersHasLoadedOnce(true);
            }
            const cacheKey = getCacheKey('users', {
                customerId,
                shop,
                query: debouncedSearch ?? '',
                after: after || '',
            });
            const requestKey = `fetch_users_${cacheKey}`;
            activeRequestsRef.current.delete(requestKey);
        }
    };

    // Fetch locations
    const fetchLocations = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                customerId,
                shop,
            });

            const response = await fetch(`${proxyUrl}/locationmanagement?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch locations');
            }

            setLocations(data.locations || []);
            setCompanyName(data.companyName || 'Your Company');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch locations');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLocations();
    }, []);

    // Handle add location
    const handleAddLocation = () => {
        setFormData({
            name: '',
            phone: '',
            externalId: '',
            note: '',
            billingAddress: {
                address1: '',
                address2: '',
                city: '',
                province: '',
                zip: '',
                country: ''
            },
            shippingAddress: {
                address1: '',
                address2: '',
                city: '',
                province: '',
                zip: '',
                country: ''
            },
            billingSameAsShipping: true
        });
        setFormError(null);
        setIsAddModalOpen(true);
    };

    // Helper to find country code from API country string
    const getCountryCodeFromName = (countryName: string | null | undefined) => {
        if (!countryName) return '';
        const trimmed = countryName.trim();
        return countryNameToCode[trimmed] || '';
    };

    // Helper to match province name to a province code from statesByCountry
    const getProvinceCodeForCountry = (countryCode: string, provinceName: string | null | undefined) => {
        if (!countryCode || !provinceName) return '';
        const list = statesByCountry[countryCode];
        if (!list || list.length === 0) return '';
        const lower = provinceName.trim().toLowerCase();
        const found = list.find(s => s.name.toLowerCase() === lower || s.code.toLowerCase() === lower);
        return found ? found.code : '';
    };

    // Handle edit location
    const handleEditLocation = (location: Location) => {
        // Map billingAddress and shippingAddress from API (if present)
        const apiBilling = location.billingAddress || (location as any).billingAddress || null;
        const apiShipping = location.shippingAddress || (location as any).shippingAddress || null;

        // map country names to codes for the selects
        const billingCountryCode = getCountryCodeFromName(apiBilling?.country ?? null);
        const shippingCountryCode = getCountryCodeFromName(apiShipping?.country ?? null);

        // try to match province names to codes from the statesByCountry mapping
        const billingProvinceCode = getProvinceCodeForCountry(billingCountryCode, apiBilling?.province ?? null);
        const shippingProvinceCode = getProvinceCodeForCountry(shippingCountryCode, apiShipping?.province ?? null);

        const billingAddress = {
            address1: (apiBilling?.address1 ?? '') as string,
            address2: (apiBilling?.address2 ?? '') as string,
            city: (apiBilling?.city ?? '') as string,
            province: billingProvinceCode || (apiBilling?.province ?? '') as string,
            zip: (apiBilling?.zip ?? '') as string,
            country: billingCountryCode || ''
        };

        const shippingAddress = {
            address1: (apiShipping?.address1 ?? '') as string,
            address2: (apiShipping?.address2 ?? '') as string,
            city: (apiShipping?.city ?? '') as string,
            province: shippingProvinceCode || (apiShipping?.province ?? '') as string,
            zip: (apiShipping?.zip ?? '') as string,
            country: shippingCountryCode || ''
        };

        const same = (
            billingAddress.address1 === shippingAddress.address1 &&
            billingAddress.address2 === shippingAddress.address2 &&
            billingAddress.city === shippingAddress.city &&
            billingAddress.province === shippingAddress.province &&
            billingAddress.zip === shippingAddress.zip &&
            billingAddress.country === shippingAddress.country
        );

        setFormData({
            name: location.name || '',
            phone: location.phone ?? '',
            externalId: location.externalId ?? '',
            note: location.note ?? '',
            billingAddress,
            shippingAddress,
            billingSameAsShipping: same
        });

        setEditingLocation(location);
        setFormError(null);
        setIsEditModalOpen(true);
    };

    // Handle delete location
    const handleDeleteLocation = (location: Location) => {
        setLocationToDelete(location);
    };

    // Submit add location
    const submitAddLocation = async () => {
        if (!formData.name.trim()) {
            setFormError('Location name is required');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const params = new URLSearchParams({
                shop,
                logged_in_customer_id: customerId,
            });

            const addressToUse = formData.billingAddress;

            const response = await fetch(`${proxyUrl}/locationmanagement?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    name: formData.name,
                    phone: formData.phone,
                    externalId: formData.externalId,
                    note: formData.note,
                    address1: addressToUse.address1,
                    address2: addressToUse.address2,
                    city: addressToUse.city,
                    province: addressToUse.province,
                    zip: addressToUse.zip,
                    country: addressToUse.country,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create location');
            }

            setIsAddModalOpen(false);
            await fetchLocations();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create location');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit edit location
    const submitEditLocation = async () => {
        if (!editingLocation || !formData.name.trim()) {
            setFormError('Location name is required');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const params = new URLSearchParams({
                shop,
                logged_in_customer_id: customerId,
            });

            const addressToUse = formData.billingAddress;

            const response = await fetch(`${proxyUrl}/locationmanagement?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'edit',
                    locationId: editingLocation.id,
                    name: formData.name,
                    phone: formData.phone,
                    externalId: formData.externalId,
                    note: formData.note,
                    address1: addressToUse.address1,
                    address2: addressToUse.address2,
                    city: addressToUse.city,
                    province: addressToUse.province,
                    zip: addressToUse.zip,
                    country: addressToUse.country,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update location');
            }

            setIsEditModalOpen(false);
            setEditingLocation(null);
            await fetchLocations();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to update location');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit delete location
    const submitDeleteLocation = async () => {
        if (!locationToDelete) return;

        setIsSubmitting(true);

        try {
            const params = new URLSearchParams({
                shop,
                logged_in_customer_id: customerId,
            });

            const response = await fetch(`${proxyUrl}/locationmanagement?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    locationId: locationToDelete.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete location');
            }

            setLocationToDelete(null);
            await fetchLocations();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete location');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open assigned-users modal and fetch users
    const openAssignedUsersModal = (location: Location) => {
        setSelectedLocationForModal(location);
        setIsTotalAssignedUsersModalOpen(true);
        setSearch('');
        setUsers([]);
        setPageInfo(null);
        setUsersHasLoadedOnce(false);
        setUsersLoadingInitial(true);
        setUsersError(null);
    };

    // Re-fetch when search changes while modal is open (so search + lazy-loading works)
    useEffect(() => {
        if (isTotalAssignedUsersModalOpen && selectedLocationForModal) {
            setUsers([]);
            setPageInfo(null);
            setUsersHasLoadedOnce(false);
            setUsersLoadingInitial(true);
            setUsersError(null);
            const t = setTimeout(() => {
                fetchUsers();
            }, 0);
            return () => clearTimeout(t);
        }
    }, [debouncedSearch, isTotalAssignedUsersModalOpen, selectedLocationForModal]);

    // Reset loading/error when modal closes to avoid stale state
    useEffect(() => {
        if (!isTotalAssignedUsersModalOpen) {
            setUsersLoadingInitial(false);
            setUsersLoadingMore(false);
            setUsersError(null);
            setUsersHasLoadedOnce(false);
        }
    }, [isTotalAssignedUsersModalOpen]);

    // scroll handler for lazy loading
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const onScroll = () => {
            if (usersLoadingMore || isFetchingMoreRef.current) return;
            if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) return;

            const threshold = 200;
            const { scrollTop, scrollHeight, clientHeight } = el;
            if (scrollHeight - scrollTop - clientHeight < threshold) {
                fetchUsers(pageInfo.endCursor as string);
            }
        };

        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageInfo, usersLoadingMore, isTotalAssignedUsersModalOpen]);

    // Filtering users for the selected location
    const filteredUsers = useMemo(() => {
        if (!selectedLocationForModal) return [];

        const lowerSearch = debouncedSearch?.trim().toLowerCase() ?? '';
        const locNameLower = selectedLocationForModal.name.toLowerCase();

        const mapped = users.map((u) => {
            const matchedRoles = Array.isArray(u.locationRoles)
                ? u.locationRoles
                    .filter((lr) => (lr.locationName || '').toLowerCase() === locNameLower)
                    .map((lr) => lr.roleName)
                : [];

            return { ...u, matchedRoles };
        });

        const list = mapped.filter((u) => {
            if (!u.matchedRoles || u.matchedRoles.length === 0) return false;

            if (!lowerSearch) return true;

            const name = u.name ?? '';
            const email = u.email ?? '';
            const company = u.company ?? '';
            return (
                name.toLowerCase().includes(lowerSearch) ||
                email.toLowerCase().includes(lowerSearch) ||
                company.toLowerCase().includes(lowerSearch)
            );
        });

        // sort by name
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }, [users, debouncedSearch, selectedLocationForModal]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading locations...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    const isMainContact = currentUser?.company?.isMainContact;

    const allowedLocationNames = new Set<string>(
        currentUser?.roleAssignments?.map((ra: any) => ra.locationName) ?? []
    );

    // helper to get states for a country code
    const getStatesForCountry = (countryCode: string) => {
        return statesByCountry[countryCode] || [];
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Locations Management</h1>
                    <p className="text-[#6B7280] text-sm">
                        Manage company locations and assignments
                    </p>
                </div>

                {isMainContact &&<div className="flex items-center gap-3">
                    <button
                        onClick={handleAddLocation}
                        className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <PluseIcon /> Add New Location
                    </button>
                </div>}
            </div>

            {/* Cards Grid */}
            {locations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#DDE4FF] p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📍</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Locations Found</h2>
                        <p className="text-gray-600 mb-4">
                            No locations have been set up for your company yet. Click &quot;Add New Location&quot; to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {locations.map((location) => (
                        <div
                            key={location.id}
                            className="border border-[#DDE4FF] rounded-[10px] p-5"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-[#2563EB1A] text-blue-600 rounded-lg">
                                    <LocationIcon />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-[16px]">{location.name}</h3>
                                    <p className="text-[#6F7177] text-xs font-normal">
                                        {location.company || companyName}
                                    </p>
                                </div>
                            </div>

                            <p className="text-[#6F7177] font-semibold text-sm mb-3">{location.address}</p>

                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-4 bg-[#F5F5FF] p-2.5 w-[60%] cursor-pointer"
                                onClick={() => openAssignedUsersModal(location)}>
                                <UserCheckIcon />
                                <span>{location.assignedUsers} assigned users</span>
                            </div>

                            <div className="flex justify-between items-center gap-5">
                                {(() => {
                                    const canManageThisLocation =
                                        isMainContact || allowedLocationNames.has(location.name);

                                    if (!canManageThisLocation) {
                                        return null;
                                    }

                                    return (
                                        <>
                                            <button
                                                onClick={() => handleEditLocation(location)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#D1D5DB] text-[#4B5563] rounded-md text-sm hover:bg-gray-50 h-10 cursor-pointer"
                                            >
                                                <EditIcon /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLocation(location)}
                                                className="flex items-center justify-center p-2 border border-[#D1D5DB] text-red-500 rounded-md hover:bg-red-50 h-10 w-10 cursor-pointer"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Location Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                    <div className="bg-white rounded-[15px] w-full max-w-[700px]">
                        <div className="flex justify-between items-center px-8 pt-[30px]">
                            <h2 className="text-xl font-bold font-[inter]">Add New Location</h2>
                        </div>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-600 text-sm">
                                {formError}
                            </div>
                        )}
                        
                        <div className="max-h-[600px] overflow-y-auto">
                            <div className="space-y-5 px-5 pt-4">
                                <div>
                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                        Location Name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                        placeholder="e.g., Main Office"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                            Phone Number <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                            External ID <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.externalId}
                                            onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                                            className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                            placeholder="LOC-001"
                                        />
                                    </div>
                                </div>

                                {/* Billing Address Section */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 font-[inter] mb-4 border-b border-[#DDE4FF] pb-2">Billing Address</h3>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                Street Address <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.billingAddress.address1}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    billingAddress: { ...formData.billingAddress, address1: e.target.value }
                                                })}
                                                className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                placeholder="123 Main St"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                Address Line 2 <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.billingAddress.address2}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    billingAddress: { ...formData.billingAddress, address2: e.target.value }
                                                })}
                                                className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                placeholder="Apartment, suite, etc."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    Country <span style={{ color: '#ef4444' }}>*</span>
                                                </label>

                                                <select
                                                    value={formData.billingAddress.country}
                                                    onChange={(e) => {
                                                        const countryCode = e.target.value;
                                                        // reset province when country changes
                                                        setFormData({
                                                            ...formData,
                                                            billingAddress: {
                                                                ...formData.billingAddress,
                                                                country: countryCode,
                                                                province: ''
                                                            }
                                                        });

                                                        // if billingSameAsShipping is true, sync shipping
                                                        if (formData.billingSameAsShipping) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                shippingAddress: {
                                                                    ...prev.shippingAddress,
                                                                    country: countryCode,
                                                                    province: ''
                                                                }
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                >
                                                    <option value="">Select country</option>
                                                    {countries.map(c => (
                                                        <option key={c.code} value={c.code}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    State/Province <span style={{ color: '#ef4444' }}>*</span>
                                                </label>

                                                <select
                                                    value={formData.billingAddress.province}
                                                    onChange={(e) => {
                                                        const provCode = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            billingAddress: { ...formData.billingAddress, province: provCode }
                                                        });

                                                        if (formData.billingSameAsShipping) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                shippingAddress: { ...prev.shippingAddress, province: provCode }
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                    disabled={!formData.billingAddress.country}
                                                >
                                                    <option value="">{formData.billingAddress.country ? 'Select state/province' : 'Select country first'}</option>
                                                    {getStatesForCountry(formData.billingAddress.country).map(s => (
                                                        <option key={s.code} value={s.code}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    ZIP/Postal Code <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.billingAddress.zip}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        billingAddress: { ...formData.billingAddress, zip: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                    placeholder="10001"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    City <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.billingAddress.city}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        billingAddress: { ...formData.billingAddress, city: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                    placeholder="New York"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address Section */}
                                <div >
                                    <div className="flex items-center justify-between mb-3 border-b border-[#DDE4FF] pb-2">
                                        <h3 className="font-semibold text-gray-900 font-[inter] mb-4">Shipping Address</h3>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.billingSameAsShipping}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => {
                                                        const newState = {
                                                            ...prev,
                                                            billingSameAsShipping: checked
                                                        };
                                                        if (checked) {
                                                            // copy billing to shipping
                                                            newState.shippingAddress = { ...prev.billingAddress };
                                                        }
                                                        return newState;
                                                    });
                                                }}
                                                className="mr-2 cursor-pointer"
                                            />
                                            <span className="text-sm text-[#030917] font-medium cursor-pointer">Same as billing</span>
                                        </label>
                                    </div>

                                    {!formData.billingSameAsShipping && (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    Street Address <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.shippingAddress.address1}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        shippingAddress: { ...formData.shippingAddress, address1: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                    placeholder="123 Main St"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    Address Line 2 <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.shippingAddress.address2}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        shippingAddress: { ...formData.shippingAddress, address2: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                    placeholder="Apartment, suite, etc."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        Country <span style={{ color: '#ef4444' }}>*</span>
                                                    </label>

                                                    <select
                                                        value={formData.shippingAddress.country}
                                                        onChange={(e) => {
                                                            const countryCode = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                shippingAddress: {
                                                                    ...prev.shippingAddress,
                                                                    country: countryCode,
                                                                    province: ''
                                                                }
                                                            }));
                                                        }}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                    >
                                                        <option value="">Select country</option>
                                                        {countries.map(c => (
                                                            <option key={c.code} value={c.code}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        State/Province <span style={{ color: '#ef4444' }}>*</span>
                                                    </label>

                                                    <select
                                                        value={formData.shippingAddress.province}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            shippingAddress: { ...prev.shippingAddress, province: e.target.value }
                                                        }))}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                        disabled={!formData.shippingAddress.country}
                                                    >
                                                        <option value="">{formData.shippingAddress.country ? 'Select state/province' : 'Select country first'}</option>
                                                        {getStatesForCountry(formData.shippingAddress.country).map(s => (
                                                            <option key={s.code} value={s.code}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        ZIP/Postal Code <span style={{ color: '#ef4444' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.shippingAddress.zip}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shippingAddress: { ...formData.shippingAddress, zip: e.target.value }
                                                        })}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                        placeholder="10001"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        City <span style={{ color: '#ef4444' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.shippingAddress.city}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                                                        })}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                        placeholder="New York"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                        placeholder="Additional location information..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="create-location-buttons px-5 py-5 flex gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-[#DDE4FF] rounded-lg text-black font-semibold hover:bg-gray-50 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitAddLocation}
                                className="flex-1 px-4 py-2 bg-[#5866FF] hover:bg-[#4e5be6] text-white font-semibold rounded-md disabled:opacity-50 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Location Modal */}
            {isEditModalOpen && editingLocation && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                    <div className="bg-white rounded-[15px] w-full max-w-[700px]">
                        <div className="flex justify-between items-center px-8 pt-[30px]">
                            <h2 className="text-xl font-bold font-[inter]">Edit Location</h2>
                        </div>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 rounded p-3 m-3 text-red-600 text-sm">
                                {formError}
                            </div>
                        )}

                        <div className="max-h-[600px] overflow-y-auto">
                            <div className="space-y-5 px-5 pt-4">
                                <div>
                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                        Location Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                            External ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.externalId}
                                            onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                                            className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Billing Address Section */}
                                <div >
                                    <h3 className="font-semibold text-gray-900 font-[inter] mb-4 border-b border-[#DDE4FF] pb-2">Billing Address</h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                Street Address
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.billingAddress.address1}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    billingAddress: { ...formData.billingAddress, address1: e.target.value }
                                                })}
                                                className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                Address Line 2
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.billingAddress.address2}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    billingAddress: { ...formData.billingAddress, address2: e.target.value }
                                                })}
                                                className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    Country
                                                </label>

                                                <select
                                                    value={formData.billingAddress.country}
                                                    onChange={(e) => {
                                                        const countryCode = e.target.value;
                                                        // reset province when country changes
                                                        setFormData({
                                                            ...formData,
                                                            billingAddress: {
                                                                ...formData.billingAddress,
                                                                country: countryCode,
                                                                province: ''
                                                            }
                                                        });

                                                        // if billingSameAsShipping is true, sync shipping
                                                        if (formData.billingSameAsShipping) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                shippingAddress: {
                                                                    ...prev.shippingAddress,
                                                                    country: countryCode,
                                                                    province: ''
                                                                }
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                >
                                                    <option value="">Select country</option>
                                                    {countries.map(c => (
                                                        <option key={c.code} value={c.code}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    State/Province
                                                </label>

                                                <select
                                                    value={formData.billingAddress.province}
                                                    onChange={(e) => {
                                                        const provCode = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            billingAddress: { ...formData.billingAddress, province: provCode }
                                                        });

                                                        if (formData.billingSameAsShipping) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                shippingAddress: { ...prev.shippingAddress, province: provCode }
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                    disabled={!formData.billingAddress.country}
                                                >
                                                    <option value="">{formData.billingAddress.country ? 'Select state/province' : 'Select country first'}</option>
                                                    {getStatesForCountry(formData.billingAddress.country).map(s => (
                                                        <option key={s.code} value={s.code}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    ZIP/Postal Code
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.billingAddress.zip}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        billingAddress: { ...formData.billingAddress, zip: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    City
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.billingAddress.city}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        billingAddress: { ...formData.billingAddress, city: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 border-b border-[#DDE4FF] pb-2">
                                        <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.billingSameAsShipping}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => {
                                                        const newState = {
                                                            ...prev,
                                                            billingSameAsShipping: checked
                                                        };
                                                        if (checked) {
                                                            // copy billing to shipping
                                                            newState.shippingAddress = { ...prev.billingAddress };
                                                        }
                                                        return newState;
                                                    });
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-600">Same as billing</span>
                                        </label>
                                    </div>

                                    {!formData.billingSameAsShipping && (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    Street Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.shippingAddress.address1}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        shippingAddress: { ...formData.shippingAddress, address1: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                    Address Line 2
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.shippingAddress.address2}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        shippingAddress: { ...formData.shippingAddress, address2: e.target.value }
                                                    })}
                                                    className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        Country
                                                    </label>

                                                    <select
                                                        value={formData.shippingAddress.country}
                                                        onChange={(e) => {
                                                            const countryCode = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                shippingAddress: {
                                                                    ...prev.shippingAddress,
                                                                    country: countryCode,
                                                                    province: ''
                                                                }
                                                            }));
                                                        }}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                    >
                                                        <option value="">Select country</option>
                                                        {countries.map(c => (
                                                            <option key={c.code} value={c.code}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        State/Province
                                                    </label>

                                                    <select
                                                        value={formData.shippingAddress.province}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            shippingAddress: { ...prev.shippingAddress, province: e.target.value }
                                                        }))}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#6F7177] font-medium"
                                                        disabled={!formData.shippingAddress.country}
                                                    >
                                                        <option value="">{formData.shippingAddress.country ? 'Select state/province' : 'Select country first'}</option>
                                                        {getStatesForCountry(formData.shippingAddress.country).map(s => (
                                                            <option key={s.code} value={s.code}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        ZIP/Postal Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.shippingAddress.zip}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shippingAddress: { ...formData.shippingAddress, zip: e.target.value }
                                                        })}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.shippingAddress.city}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                                                        })}
                                                        className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-[inter] font-semibold text-[#030917] mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                                        placeholder="Additional location information..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="create-location-buttons px-5 py-5 flex gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-[#DDE4FF] rounded-lg text-black font-semibold hover:bg-gray-50 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitEditLocation}
                                className="flex-1 px-4 py-2 bg-[#5866FF] hover:bg-[#4e5be6] text-white font-semibold rounded-md disabled:opacity-50 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isTotalAssignedUsersModalOpen && selectedLocationForModal && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                    <div className="p-[30px] bg-white rounded-[15px] w-full max-w-[700px] h-[70vh] flex flex-col">
                        {/*pop-up Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Assigned Users to {selectedLocationForModal?.name}</h2>
                            <button onClick={() => { setIsTotalAssignedUsersModalOpen(false); setSelectedLocationForModal(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="py-3">
                            <input
                                type="text"
                                placeholder="Search by name, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-[46px] px-3 py-2 border border-[#DDE4FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#6F7177] placeholder:font-medium text-[#6F7177] font-medium"
                            />
                        </div>

                        <div ref={scrollContainerRef} className="flex-1 overflow-auto py-4">
                            
                            {(!usersHasLoadedOnce || usersLoadingInitial) && (
                                <div className="py-4 text-center text-sm text-gray-500">Loading users...</div>
                            )}

                            {usersError && (
                                <div className="py-4 text-center text-sm text-red-500">Error: {usersError}</div>
                            )}

                            {usersHasLoadedOnce && !usersLoadingInitial && filteredUsers.length === 0 && (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    No users assigned for this location{debouncedSearch ? " matching your search." : "."}
                                </div>
                            )}

                            {usersHasLoadedOnce && !usersLoadingInitial && filteredUsers.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role(s)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Credit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {u.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {u.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-700">
                                                            {u.matchedRoles?.join(", ")}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-800">
                                                            {u.credit ?? 0}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            
                                            {usersLoadingMore && users.length > 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        Loading more...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/*pop-up footer*/}
                        <div className="pt-3 border-t border-[#DDE4FF] flex justify-end">
                            <button
                                onClick={() => {
                                    setIsTotalAssignedUsersModalOpen(false);
                                    setSelectedLocationForModal(null);
                                }}
                                className="px-4 py-2 rounded border border-[#DDE4FF] text-sm cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {locationToDelete && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.60)] flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Delete Location</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{locationToDelete.name}</strong>?
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setLocationToDelete(null)}
                                className="flex-1 px-4 py-2 border border-[#DDE4FF] rounded-lg text-black font-semibold hover:bg-gray-50 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitDeleteLocation}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPage;
