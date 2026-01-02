import type { ReactNode } from 'react';
import { useCurrentUser, type UserPermissions, type RoleAssignment } from '../hooks/useCurrentUser';


interface PermissionGuardProps {
    children: ReactNode;
    permission: keyof UserPermissions;
    fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Usage:
 * <PermissionGuard permission="canManageUsers">
 *   <UserManagementContent />
 * </PermissionGuard>
 */
export function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
    const { hasPermission, currentUser } = useCurrentUser();

    if (!currentUser || currentUser.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading permissions...</p>
                </div>
            </div>
        );
    }

    if (!hasPermission(permission)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access this page. Please contact your company administrator if you believe this is an error.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                        <div className="font-semibold text-blue-900 mb-1">Your Current Role:</div>
                        <div className="text-blue-700">{currentUser.roles.join(', ') || 'Member'}</div>
                        <div className="font-semibold text-blue-900 mt-3 mb-1">Company:</div>
                        <div className="text-blue-700">{currentUser.company.companyName}</div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

interface RoleGuardProps {
    children: ReactNode;
    roles: string[];
    requireAll?: boolean;
    fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user roles
 * Usage:
 * <RoleGuard roles={['Company Admin', 'Location Admin']}>
 *   <AdminContent />
 * </RoleGuard>
 */
export function RoleGuard({ children, roles, requireAll = false, fallback }: RoleGuardProps) {
    const { hasRole, currentUser } = useCurrentUser();

    if (!currentUser || currentUser.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading permissions...</p>
                </div>
            </div>
        );
    }

    const hasAccess = requireAll
        ? roles.every(role => hasRole(role))
        : roles.some(role => hasRole(role));

    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        This page requires one of the following roles: {roles.join(', ')}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                        <div className="font-semibold text-blue-900 mb-1">Your Current Role:</div>
                        <div className="text-blue-700">{currentUser.roles.join(', ') || 'Member'}</div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

interface LocationGuardProps {
    children: ReactNode;
    locationId: string;
    fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on location access
 * Usage:
 * <LocationGuard locationId="gid://shopify/CompanyLocation/123">
 *   <LocationContent />
 * </LocationGuard>
 */
export function LocationGuard({ children, locationId, fallback }: LocationGuardProps) {
    const { canAccessLocation, currentUser } = useCurrentUser();

    if (!currentUser || currentUser.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading permissions...</p>
                </div>
            </div>
        );
    }

    if (!canAccessLocation(locationId)) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access this location. Please contact your company administrator.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                        <div className="font-semibold text-blue-900 mb-1">Your Assigned Locations:</div>
                        <div className="text-blue-700">
                            {currentUser.permissions.canAccessAllLocations
                                ? 'All Locations'
                                : currentUser.roleAssignments
                                    .filter((ra: RoleAssignment) => ra.locationName)
                                    .map((ra: RoleAssignment) => ra.locationName)
                                    .join(', ') || 'None'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
