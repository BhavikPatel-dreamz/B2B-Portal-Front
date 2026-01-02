import React, { useState, useEffect } from 'react';
import DashboardIcon from "../Icons/DashboardIcon";
import UserIcon from "../Icons/UserIcon";
import LocationIcon from "../Icons/LocationIcon";
import OrderIcon from "../Icons/OrderIcon";
import WishlistIcon from "../Icons/WishlistIcon";
import Credit from "../Icons/Credit";
import NotificationIcon from "../Icons/NotificationIcon";
import SettingsIcon from "../Icons/SettingsIcon";
import DashboardPage from './dashboard/DashboardPage';
import UserManagementPage from './dashboard/UserManagementPage';
import LocationPage from './dashboard/LocationPage';
import OrderManagementPage from './dashboard/OrderManagementPage';
import WishlistPage from './dashboard/WishlistPage';
import CreditManagementPage from './dashboard/CreditManagementPage';
import NotificationPage from './dashboard/NotificationPage';
import SettingsPage from './dashboard/SettingsPage';
import ProxyTestPage from './dashboard/ProxyTestPage';
import { CurrentUserProvider, useCurrentUser } from '../hooks/useCurrentUser';

interface CompanyAppProps {
    containerId: string;
    proxyUrl: string;
    customerId: string;
    shop: string;
    isAdmin: boolean;
    isMainContact: boolean;
    logo: string
}
// tempreroloiy removed --- 'settings' 'credit'
type RouteId = 'dashboard' | 'usermanagement' | 'location' | 'ordermanagement' | 'wishlist' | 'notification' | 'proxytest';

// Main App Component with User Context

function CompanyAppContent({ proxyUrl, customerId, shop, isAdmin, isMainContact, logo }: CompanyAppProps) {
    const BASE_PATH = "/pages/b2b-page";
    const { currentUser, hasPermission } = useCurrentUser();
    const [activeRoute, setActiveRoute] = useState<RouteId>('dashboard');
    const isSuperUser = isAdmin && isMainContact;
    const userRoles = new Set<string>(
        currentUser?.roleAssignments?.map((ra: any) => ra.role) ?? []
    );

    const backendBaseUrl = proxyUrl.replace('/api/proxy', '');
    const resolvedLogo =
        logo && logo.startsWith('/')
            ? `${backendBaseUrl}${encodeURI(logo)}`
            : '';

    const canSeeRoute = (routeId: RouteId): boolean => {
        if (isSuperUser) return true;

        if (!currentUser || currentUser.isLoading) return false;

        const hasLocationAdmin = userRoles.has('Location admin');
        const hasOrderingOnly = userRoles.has('Ordering only');

        // Allowed routes per role
        const locationAdminRoutes: RouteId[] = [
            'dashboard',
            'usermanagement',
            'location',
            'ordermanagement',
            'wishlist',
        ];

        const orderingOnlyRoutes: RouteId[] = [
            'dashboard',
            'ordermanagement',
            'wishlist',
        ];

        const allowed = new Set<RouteId>();


        if (hasLocationAdmin) {
            locationAdminRoutes.forEach(r => allowed.add(r));
        }

        if (hasOrderingOnly) {
            orderingOnlyRoutes.forEach(r => allowed.add(r));
        }

        if (!hasLocationAdmin && !hasOrderingOnly) return false;

        return allowed.has(routeId);
    };

    // Sync route with URL hash
    useEffect(() => {
        const syncRouteFromPath = () => {
            const path = window.location.pathname.replace(BASE_PATH, "");
            const route = path.split("/")[1] as RouteId;

            if (route && isValidRoute(route)) {
                setActiveRoute(route);
            } else {
                setActiveRoute("dashboard");
            }
        };

        syncRouteFromPath();
        window.addEventListener("popstate", syncRouteFromPath);

        return () => window.removeEventListener("popstate", syncRouteFromPath);
    }, []);

    // Update URL hash when route changes
    const navigateTo = (route: RouteId) => {
        const newUrl = `${BASE_PATH}/${route}`;
        window.history.pushState({}, "", newUrl);
        setActiveRoute(route);
    };

    // Validate if route is valid
    const isValidRoute = (route: string): route is RouteId => {
        const validRoutes: RouteId[] = ['dashboard', 'usermanagement', 'location', 'ordermanagement', 'wishlist', 'notification', 'proxytest'];
        return validRoutes.includes(route as RouteId);
    };

    const renderContent = () => {
        switch (activeRoute) {
            case 'dashboard':
                return <DashboardPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            case 'usermanagement':
                return <UserManagementPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            case 'location':
                return <LocationPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            case 'ordermanagement':
                return <OrderManagementPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            case 'wishlist':
                return <WishlistPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            // case 'credit':
            //     return <CreditManagementPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            case 'notification':
                return <NotificationPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            // case 'settings':
            //     return <SettingsPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            case 'proxytest':
                return <ProxyTestPage customerId={customerId} shop={shop} proxyUrl={proxyUrl} />;
            default:
                return <div className="p-6">Page not found</div>;
        }
    };

    const NavItem = ({ id, icon, label, requiresPermission }: {
        id: RouteId,
        icon: React.ReactNode,
        label: string,
        requiresPermission?: 'canManageUsers' | 'canManageLocations' | 'canManageOrders' | 'canManageCredit' | 'canManageSettings'
    }) => {
        if (!canSeeRoute(id)) {
            return null;
        }

        if (!isSuperUser && requiresPermission && !hasPermission(requiresPermission)) {
            return null;
        }

        return (
            <button
                onClick={() => navigateTo(id)}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm leading-5 font-[inter] font-medium w-full text-left
                           border box-border transition-colors duration-150 cursor-pointer
                          ${activeRoute === id
                        ? 'bg-white text-[#5866FF] border-[#DDE4FF]'
                        : 'border-transparent text-[#6F7177] hover:bg-gray-50'
                    }`}
            >
                {icon}
                {label}
            </button>
        );
    };

    return (
        <div className="flex h-[92vh] bg-[#F6F8FA] p-5">
            {/* Sidebar */}
            <aside className="w-64 flex flex-col justify-between">
                <div>
                    {/* HEADER LOGO */}
                    <div className="pb-4 border-b border-gray-200">
                        <div className="flex flex-col items-center text-center gap-2">

                            {/* Logo container */}
                            <div className="w-25 h-25 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center overflow-hidden">
                                {resolvedLogo ? (
                                    <img
                                        src={resolvedLogo}
                                        crossOrigin="anonymous"
                                        alt="Company Logo"
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <span className="text-[#5866FF] font-extrabold text-xl font-[inter]">
                                        B2B
                                    </span>
                                )}
                            </div>

                            {/* Subtitle only */}
                            <p className="text-sm text-[#6B7280] font-medium">
                                Enterprise Dashboard
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1 mt-3 pr-5">
                        <NavItem id="dashboard" icon={<DashboardIcon />} label="Dashboard" />
                        <NavItem id="usermanagement" icon={<UserIcon />} label="User Management" requiresPermission="canManageUsers" />
                        <NavItem id="location" icon={<LocationIcon />} label="Locations Management" requiresPermission="canManageLocations" />
                        <NavItem id="ordermanagement" icon={<OrderIcon />} label="Order Management" requiresPermission="canManageOrders" />
                        <NavItem id="wishlist" icon={<WishlistIcon />} label="Wishlist Management" />
                        {/* <NavItem id="credit" icon={<Credit />} label="Credit Management" requiresPermission="canManageCredit" /> */}
                        <NavItem id="notification" icon={<NotificationIcon />} label="Notification System" />
                        {/* <NavItem id="settings" icon={<SettingsIcon />} label="Settings & Admin Controls" requiresPermission="canManageSettings" /> */}
                    </nav>
                </div>

                {/* User Info Section */}
                {currentUser && !currentUser.isLoading && (
                    <div className="mt-auto pt-5 border-t border-gray-200">
                        <div className="px-3 py-2">
                            <div className="text-sm font-semibold text-gray-900">
                                {currentUser.customerName
                                    ?.split(" ")
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ")}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{currentUser.company.companyName}</div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-white rounded-[20px] p-[30px] border-[1px] border-[#DDDFE6]">
                {renderContent()}
            </main>
        </div>
    );
}

//Wrapper component that provides CurrentUserProvider

export function CompanyApp(props: CompanyAppProps) {
    return (
        <CurrentUserProvider
            customerId={props.customerId}
            shop={props.shop}
            proxyUrl={props.proxyUrl}
        >
            <CompanyAppContent {...props} />
        </CurrentUserProvider>
    );
}
