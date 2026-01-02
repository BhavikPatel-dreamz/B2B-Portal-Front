import { useEffect, useRef, useState } from "react";
import NotificationIcon from "../../Icons/NotificationIcon";
import OrderIcon from "../../Icons/OrderIcon";

import ErrorIcon from "../../Icons/ErrorIcon";
import "./dashboard.css";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import type { Order, OrdersResponse } from "../../types/order";

interface DashboardPageProps {
    customerId: string;
    shop: string;
    proxyUrl: string;
}

interface StatCardProps {
    title: string;
    value: string | number;
    trend: number;
    bgColor: string;
    icon: React.ReactNode;
}

const StatCard = ({ title, value, trend, bgColor, icon }: StatCardProps) => {
    const isPositive = trend >= 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#DDE4FF] p-4 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <span className="text-[#030917] text-[18px] font-semibold">
                    {title}
                </span>
                <div className={`p-2 rounded-lg ${bgColor}`}>
                    {icon}
                </div>
            </div>

            <h2 className="dashborad-overview-title text-3xl font-bold text-gray-900">
                {value}
            </h2>

            <div className="flex items-center gap-1 text-sm">
                <span
                    className={`font-medium flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
                </span>
                <span className="text-gray-500">vs last month</span>
            </div>
        </div>
    );
};


const OrderCard = ({ order }: { order: Order }) => {
    const status =
        order.displayFinancialStatus?.toLowerCase() === "paid"
            ? "Approved"
            : "Pending";

    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-[#DDE4FF]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg">
                    📦
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">
                        {order.name || order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                        {order.customer?.firstName} {order.customer?.lastName} ·{" "}
                        {order.companyLocation?.name || "Company Order"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                        }`}
                >
                    {status}
                </span>
                <button className="px-4 py-1 bg-[#E5E7EB4D] border border-[#E5E7EB] hover:bg-gray-50 rounded-md text-sm font-medium text-[#111827]">
                    View
                </button>
            </div>
        </div>
    );
};

type ActivityType = "pending" | "approved" | string;

interface Notification {
    id: string;
    message: string;
    activityType: ActivityType;
    shopId?: string;
    receiverId?: string | null;
    senderId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    isRead?: boolean;
}

interface Pagination {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface NotificationApiResponse {
    notificationsdata: Notification[];
    unreadCount?: number;
    pagination: Pagination;
    filters: {
        activityType: string | null;
        receiverId: string | null;
        senderId: string | null;
        search: string | null;
        isRead: string | null;
    };
}

function formatDateTime(dt?: string | null) {
    if (!dt) return "";
    try {
        const d = new Date(dt);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return dt || "";
    }
}

function getStatusClasses(activityType?: ActivityType) {
    switch (activityType) {
        case "pending":
            return "bg-amber-50 text-amber-700";
        case "approved":
            return "bg-emerald-50 text-emerald-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

function getStatusLabel(activityType?: ActivityType) {
    switch (activityType) {
        case "pending":
            return "Pending";
        case "approved":
            return "Approved";
        default:
            return activityType ?? "Unknown";
    }
}

const DashboardPage = ({ customerId, shop, proxyUrl }: DashboardPageProps) => {

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loadingNotifications, setLoadingNotifications] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const activeRequestsRef = useRef<Set<string>>(new Set());
    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [currentMonthOrder, setCurrentMonthOrder] = useState({ currentMonthOrderCount: 0, monthlyChangePercentage: 0 }); currentMonthOrder

    const { currentUser } = useCurrentUser();
    const effectiveCustomerId = currentUser?.customerId || customerId;

    const fetchNotificationsPage = async (page = 1) => {
        if (!effectiveCustomerId) {
            setLoadingNotifications(false);
            return;
        }
        if (page === 1) {
            setLoadingNotifications(true);
            setError(null);
        } else {
            setLoadingMore(true);
            setError(null);
        }
        try {
            const params = new URLSearchParams({
                customerId: String(effectiveCustomerId),
                shop,
                page: String(page),
                isRead: "false",
            });
            const res = await fetch(`${proxyUrl}/notification?${params.toString()}`);
            const data: NotificationApiResponse = await res.json();
            if (!res.ok) {
                throw new Error((data as any).error || "Failed to fetch notifications");
            }
            const incoming = data.notificationsdata || [];
            if (page === 1) {
                setNotifications(incoming);
            } else {
                setNotifications((prev) => [...prev, ...incoming]);
            }
            setPagination(data.pagination || null);
            setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : (data.notificationsdata || []).filter(n => !n.isRead).length);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch notifications");
        } finally {
            setLoadingNotifications(false);
            setLoadingMore(false);
        }
    };

    const loadNextPageIfNeeded = () => {
        if (!pagination) return;
        const nextPage = pagination.page + 1;
        if (nextPage > pagination.totalPages) return;
        if (loadingMore || loadingNotifications) return;
        fetchNotificationsPage(nextPage);
    };

    const handleScroll = () => {
        const el = listContainerRef.current;
        if (!el || !pagination) return;
        const { scrollTop, clientHeight, scrollHeight } = el;
        if (scrollTop + clientHeight >= scrollHeight - 120) {
            const nextPage = pagination.page + 1;
            if (nextPage <= pagination.totalPages && !loadingMore) {
                fetchNotificationsPage(nextPage);
            }
        }
    };

    const markAsRead = async (notificationId: string, activityType: string) => {
        const key = `mark_read_${notificationId}`;
        if (activeRequestsRef.current.has(key)) return;
        activeRequestsRef.current.add(key);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
            const form = new FormData();
            form.append("action", "UPDATE_NOTIFICATION");
            form.append("notificationId", notificationId);
            form.append("activityType", activityType || "pending");
            form.append("isRead", "true");
            const res = await fetch(`${proxyUrl}/notification`, {
                method: "POST",
                body: form,
            });
            const data = await res.json();
            if (!res.ok) {
                setNotifications((prev) => [...(Array.isArray(prev) ? prev : []), { id: notificationId, message: "", activityType, isRead: false }].filter(Boolean));
                setUnreadCount((c) => c + 1);
                setError((data && data.error) || "Failed to mark as read");
                activeRequestsRef.current.delete(key);
                return;
            }
            if (typeof data?.unreadCount === "number") {
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            setNotifications((prev) => [...(Array.isArray(prev) ? prev : []), { id: notificationId, message: "", activityType, isRead: false }].filter(Boolean));
            setUnreadCount((c) => c + 1);
            setError(err instanceof Error ? err.message : "An error occurred while marking as read");
        } finally {
            activeRequestsRef.current.delete(key);
        }
    };

    const fetchRecentOrders = async () => {
        if (!effectiveCustomerId) return;

        setLoadingOrders(true);
        setOrdersError(null);

        try {
            const res = await fetch(`${proxyUrl}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerId: effectiveCustomerId,
                    shop,
                    filters: {
                        sortKey: "CREATED_AT",
                        reverse: true,
                    },
                    pagination: {
                        first: 5,
                    },
                }),
            });

            const data: OrdersResponse = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch orders");
            }
            setCurrentMonthOrder({
                currentMonthOrderCount: data.currentMonthOrderCount,
                monthlyChangePercentage: data.monthlyChangePercentage,
            });
            setOrders(data.orders || []);
        } catch (err) {
            setOrdersError(err instanceof Error ? err.message : "Failed to load orders");
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchRecentOrders();
    }, [effectiveCustomerId, shop, proxyUrl]);

    useEffect(() => {
        fetchNotificationsPage(1);
    }, [effectiveCustomerId, shop, proxyUrl]);

    useEffect(() => {
        const el = listContainerRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [pagination, loadingMore, loadingNotifications]);

    return (
        <div>
            <header className="bg-white border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="dashboard-overview-title text-3xl font-bold text-gray-900 mb-1">
                            Dashboard Overview
                        </h1>
                        <p id="hello" className="text-[#6B7280] text-sm">
                            Monitor your B2B operations and key metrics
                        </p>
                    </div>

                    <div className="flex items-center gap-3 relative">
                        <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF] cursor-pointer relative shadow-sm hover:shadow-md"
                            aria-label={`Notifications ${unreadCount} unread`}
                        >
                            {loadingNotifications ? (
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <span className="w-5 h-5 border-2 border-[#F5F5FF] border-t-[#5866FF] rounded-full animate-spin"></span>
                                </div>
                            ) : (
                                <NotificationIcon color="#5866FF" />
                            )}

                            {!loadingNotifications && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    title="Total Orders"
                    value={currentMonthOrder.currentMonthOrderCount}
                    trend={currentMonthOrder.monthlyChangePercentage}
                    bgColor="#5866FF"
                    icon={<OrderIcon color="#5866FF" />}
                />
                <StatCard
                    title="Pending Approvals"
                    value="34"
                    trend={-35}
                    bgColor="bg-red-50"
                    icon={<ErrorIcon color="#EF4444" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-xl shadow-sm border border-[#DDE4FF] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Recent Orders
                            </h3>
                            <p className="text-sm text-[#6B7280] font-normal">
                                Latest orders requiring attention
                            </p>
                        </div>
                        <button className="px-4 py-1 bg-[#E5E7EB4D] border border-[#E5E7EB] hover:bg-gray-50 rounded-md text-sm font-medium text-[#111827] transition-colors">
                            View All
                        </button>
                    </div>

                    {loadingOrders ? (
                        <div className="flex items-center justify-center h-[150px] text-sm text-gray-500">
                            Loading recent orders...
                        </div>
                    ) : ordersError ? (
                        <div className="text-sm text-red-600">{ordersError}</div>
                    ) : orders.length === 0 ? (
                        <div className="text-sm text-gray-500">No recent orders found</div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}

                </section>

                <section className="bg-white rounded-xl shadow-sm border border-[#DDE4FF] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Unread Notifications
                            </h3>
                            <p className="text-sm text-gray-500">
                                Click a notification to mark it as read
                            </p>
                        </div>
                        <button
                            onClick={() => fetchNotificationsPage(1)}
                            className="px-4 py-1 bg-[#E5E7EB4D] border border-[#E5E7EB] hover:bg-gray-50 rounded-md text-sm font-medium text-[#111827] transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="mb-3 text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                            {error}
                        </div>
                    )}

                    {loadingNotifications && notifications.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-[250px] text-sm text-gray-600">
                            <div className="flex flex-col items-center gap-3">
                                <span className="w-6 h-6 border-2 border-[#F5F5FF] border-t-[#5866FF] rounded-full animate-spin"></span>
                                <p>Loading unread notifications...</p>
                            </div>
                        </div>
                    )
                        : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center w-full h-[250px] text-sm text-gray-500">
                                <div className="text-3xl mb-1">🔔</div>
                                <p>No unread notifications</p>
                            </div>
                        ) : (
                            <div
                                ref={listContainerRef}
                                className="border border-[#E5E7EB] rounded-2xl max-h-[373px] overflow-y-auto"
                            >
                                <ul className="divide-y divide-[#E5E7EB]">
                                    {notifications.map((n) => (
                                        <li
                                            key={n.id}
                                            onClick={() => {
                                                if (!n.isRead) markAsRead(n.id, n.activityType);
                                            }}
                                            className="px-5 py-4 flex items-start justify-between transition bg-[#EEF2FF] hover:bg-[#e6f0ff] cursor-pointer"
                                        >
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xl">
                                                    🔔
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            Notification
                                                        </p>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusClasses(
                                                                n.activityType
                                                            )}`}
                                                        >
                                                            {getStatusLabel(n.activityType)}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-700">
                                                        {n.message}
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                                                        <span>{formatDateTime(n.createdAt)}</span>
                                                        {n.senderId && (
                                                            <span>
                                                                From:{" "}
                                                                {String(n.senderId).split("/").slice(-1)[0]}
                                                            </span>
                                                        )}
                                                        {n.receiverId && (
                                                            <span>
                                                                To:{" "}
                                                                {String(n.receiverId).split("/").slice(-1)[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <button className="text-xs font-medium text-[#5866FF] hover:underline mt-1 cursor-pointer">
                                                    View details
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                    {loadingMore && (
                                        <li className="px-5 py-4 flex items-center justify-center text-sm text-gray-600">
                                            Loading more...
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                </section>
            </div>
        </div>
    );
};

export default DashboardPage;
