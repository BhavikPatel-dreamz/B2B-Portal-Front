import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

// Define user role types
export type UserRole = 'Company Admin' | 'Location Admin' | 'Ordering Only' | 'Member';

// Define permission types
export interface UserPermissions {
    canManageUsers: boolean;
    canManageLocations: boolean;
    canManageOrders: boolean;
    canViewReports: boolean;
    canManageCredit: boolean;
    canManageSettings: boolean;
    canAccessAllLocations: boolean;
    assignedLocationIds: string[];
}

// Company information
export interface CompanyInfo {
    companyId: string;
    companyName: string;
    externalId?: string;
    isMainContact: boolean;
    mainContact?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    totalSpent?: {
        amount: string;
        currencyCode: string;
    };
    locationsCount: number;
}

// Role assignment details
export interface RoleAssignment {
    role: string;
    locationId?: string;
    locationName?: string;
}

// Current user data structure
export interface CurrentUser {
    customerId: string;
    customerName: string;
    customerEmail: string;
    company: CompanyInfo;
    roles: string[];
    roleAssignments: RoleAssignment[];
    permissions: UserPermissions;
    isLoading: boolean;
    error: string | null;
}

// Context type
interface CurrentUserContextType {
    currentUser: CurrentUser | null;
    refreshUser: () => Promise<void>;
    hasPermission: (permission: keyof UserPermissions) => boolean;
    hasRole: (role: UserRole | string) => boolean;
    canAccessLocation: (locationId: string) => boolean;
}

// Create context
const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

// Provider props
interface CurrentUserProviderProps {
    children: ReactNode;
    customerId: string;
    shop: string;
    proxyUrl: string;
}

/**
 * Determine user permissions based on roles
 */
function calculatePermissions(roles: string[], roleAssignments: RoleAssignment[], isMainContact: boolean): UserPermissions {
    const roleNames = roles.map(r => r.toLowerCase());
    const hasCompanyAdmin = roleNames.some(r => r.includes('company admin') || r.includes('admin'));
    const hasLocationAdmin = roleNames.some(r => r.includes('location admin'));
    const hasOrderingOnly = roleNames.some(r => r.includes('ordering only'));

    // Get all assigned location IDs
    const assignedLocationIds = roleAssignments
        .filter(ra => ra.locationId)
        .map(ra => ra.locationId as string);

    return {
        // Company admins and main contacts can manage users
        canManageUsers: hasCompanyAdmin || isMainContact,

        // Company admins and main contacts can manage locations
        canManageLocations: hasCompanyAdmin || isMainContact,

        // Company admins, location admins, and main contacts can manage orders
        canManageOrders: hasCompanyAdmin || hasLocationAdmin || hasOrderingOnly || isMainContact,

        // All users can view reports (but data is filtered by permissions)
        canViewReports: true,

        // Company admins and main contacts can manage credit
        canManageCredit: hasCompanyAdmin || isMainContact,

        // Company admins and main contacts can manage settings
        canManageSettings: hasCompanyAdmin || isMainContact,

        // Company admins and main contacts can access all locations
        canAccessAllLocations: hasCompanyAdmin || isMainContact,

        // Store assigned location IDs
        assignedLocationIds,
    };
}

/**
 * Provider component that fetches and manages current user data
 */
export function CurrentUserProvider({ children, customerId, shop, proxyUrl }: CurrentUserProviderProps) {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const fetchUserData = async () => {
        try {
            setCurrentUser(prev => prev ? { ...prev, isLoading: true, error: null } : null);

            const params = new URLSearchParams({
                customerId,
                shop,
                action: 'current-user'
            });

            const response = await fetch(`${proxyUrl}/customer-company?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user data');
            }

            if (!data.hasCompany || !data.companies || data.companies.length === 0) {
                throw new Error('No company found for this user');
            }

            // Use the first company (most users will only have one)
            const company = data.companies[0];

            // Check if this user is the main contact
            const isMainContact = company.mainContact?.id === `gid://shopify/Customer/${customerId}`;

            const permissions = calculatePermissions(
                company.roles || [],
                company.roleAssignments || [],
                isMainContact
            );

            const userData: CurrentUser = {
                customerId,
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                company: {
                    companyId: company.companyId,
                    companyName: company.companyName,
                    externalId: company.externalId,
                    isMainContact,
                    mainContact: company.mainContact,
                    totalSpent: company.totalSpent,
                    locationsCount: company.locationsCount || 0,
                },
                roles: company.roles || [],
                roleAssignments: company.roleAssignments || [],
                permissions,
                isLoading: false,
                error: null,
            };

            setCurrentUser(userData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
            setCurrentUser(prev => prev ? { ...prev, isLoading: false, error: errorMessage } : null);
            console.error('Error fetching current user:', err);
        }
    };

    useEffect(() => {
        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, shop, proxyUrl]);

    const hasPermission = (permission: keyof UserPermissions): boolean => {
        if (!currentUser) return false;
        const value = currentUser.permissions[permission];
        return typeof value === 'boolean' ? value : false;
    };

    const hasRole = (role: UserRole | string): boolean => {
        if (!currentUser) return false;
        return currentUser.roles.some(r => r.toLowerCase() === role.toLowerCase());
    };

    const canAccessLocation = (locationId: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.permissions.canAccessAllLocations) return true;
        return currentUser.permissions.assignedLocationIds.includes(locationId);
    };

    const contextValue: CurrentUserContextType = {
        currentUser,
        refreshUser: fetchUserData,
        hasPermission,
        hasRole,
        canAccessLocation,
    };

    return (
        <CurrentUserContext.Provider value={contextValue}>
            {children}
        </CurrentUserContext.Provider>
    );
}

/**
 * Hook to access current user context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser() {
    const context = useContext(CurrentUserContext);
    if (context === undefined) {
        throw new Error('useCurrentUser must be used within a CurrentUserProvider');
    }
    return context;
}
