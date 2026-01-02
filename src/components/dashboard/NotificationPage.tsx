import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";

interface PageProps {
  customerId: string;
  shop: string;
  proxyUrl: string;
}

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

interface NotificationCounts {
  totalCount: number;
  readCount: number;
  unreadCount: number;
}


interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface NotificationApiResponse {
  notificationsdata: Notification[];
  unreadCount: number;
  totalCount: number;
  PendingCount: number;
  readCount: number;
  pagination: Pagination;
  filters: {
    activityType: string | null;
    receiverId: string | null;
    senderId: string | null;
    search: string | null;
    isRead: string | null;
  };
}


const inMemoryCache = new Map<string, any>();

function getCacheKey(prefix: string, params: Record<string, string | number | undefined>) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] === undefined ? "" : String(params[k])}`)
    .join("&");
  return `${prefix}?${sorted}`;
}

function getFromCache<T = any>(key: string): T | null {
  if (!inMemoryCache.has(key)) return null;
  return inMemoryCache.get(key) as T;
}

function setToCache(key: string, value: any, ttlMs: number = 1000 * 60) {
  inMemoryCache.set(key, value);
  if (ttlMs > 0) {
    setTimeout(() => {
      inMemoryCache.delete(key);
    }, ttlMs);
  }
}

function invalidateCache(prefix: string) {
  for (const key of Array.from(inMemoryCache.keys())) {
    if (key.startsWith(prefix)) inMemoryCache.delete(key);
  }
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
    return dt;
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

const NotificationPage: React.FC<PageProps> = ({ customerId, shop, proxyUrl }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    totalCount: 0,
    readCount: 0,
    unreadCount: 0,
  });

  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");

  const activeRequestsRef = useRef<Set<string>>(new Set());
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { currentUser } = useCurrentUser();
  const effectiveCustomerId = currentUser?.customerId || customerId;

  const markAsRead = async (notificationId: string, activityType: string) => {
    const key = `mark_read_${notificationId}`;
    if (activeRequestsRef.current.has(key)) return;
    activeRequestsRef.current.add(key);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
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
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n)));
        setError((data && data.error) || "Failed to mark as read");
        return;
      }
      if (data?.notification) {
        const serverNotif = data.notification as Partial<Notification> & { id?: string };
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? {
                ...n,
                isRead: serverNotif.isRead === undefined ? true : !!serverNotif.isRead,
                activityType: serverNotif.activityType ?? n.activityType,
              }
              : n
          )
        );
      }
      invalidateCache("notifications");
    } catch (err) {
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n)));
      setError(err instanceof Error ? err.message : "An error occurred while marking as read");
    } finally {
      activeRequestsRef.current.delete(key);
    }
  };

  const fetchNotifications = async (force = false, pageToLoad = 1, append = false) => {
    if (!effectiveCustomerId) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    const paramsObj: Record<string, string | number | undefined> = {
      customerId: effectiveCustomerId,
      shop,
      page: pageToLoad,
    };
    const cacheKey = getCacheKey("notifications", paramsObj);
    const requestKey = `fetch_notifications_${cacheKey}`;
    if (activeRequestsRef.current.has(requestKey)) return;
    try {
      if (pageToLoad === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      if (!force) {
        const cached = getFromCache<NotificationApiResponse>(cacheKey);
        if (cached) {
          setNotifications((prev) => (append ? [...prev, ...(cached.notificationsdata || [])] : cached.notificationsdata || []));
          setPagination(cached.pagination);
          setHasLoadedOnce(true);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }
      activeRequestsRef.current.add(requestKey);
      const params = new URLSearchParams(
        Object.entries(paramsObj).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      );
      const res = await fetch(`${proxyUrl}/notification?${params.toString()}`);
      const data: NotificationApiResponse = await res.json();
      setCounts({
        totalCount: data.totalCount,
        readCount: data.readCount,
        unreadCount: data.unreadCount,
      });
      if (!res.ok) {
        throw new Error((data as any).error || "Failed to fetch notifications");
      }
      setNotifications((prev) => (append ? [...prev, ...(data.notificationsdata || [])] : data.notificationsdata || []));
      setPagination(data.pagination);
      setToCache(cacheKey, data, 1000 * 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setHasLoadedOnce(true);
      activeRequestsRef.current.delete(requestKey);
    }
  };

  useEffect(() => {
    setPage(1);
    if (!effectiveCustomerId) return;
    fetchNotifications(true, 1, false);
  }, [effectiveCustomerId, shop, proxyUrl]);

  useEffect(() => {
    const container = listContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (loading || loadingMore) return;
          const totalPages = pagination?.totalPages ?? 1;
          if (page >= totalPages) return;
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNotifications(false, nextPage, true);
        });
      },
      { root: container, rootMargin: "0px", threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pagination, page, loading, loadingMore]);

  const handleRefresh = () => {
    invalidateCache("notifications");
    setPage(1);
    fetchNotifications(true, 1, false);
  };


  const filteredNotifications = useMemo(() => {
    if (statusFilter === "all") return notifications;
    return notifications.filter((n) => n.activityType === statusFilter);
  }, [notifications, statusFilter]);

  return (
    <div>
      {(hasLoadedOnce || !loading) && (<header className="bg-white border-[#DDE4FF] mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Notification System</h1>
            <p className="text-[#6B7280] text-sm">Manage your notifications and alerts</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </header>)}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl px-6 py-3">
        {(!hasLoadedOnce || loading) && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-600">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading notifications...</div>
            </div>
          </div>
        )}

        {hasLoadedOnce && !loading && notifications.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500 border border-dashed border-[#DDE4FF] rounded-2xl">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-xl font-semibold mb-1">No notifications yet</p>
            <p className="text-sm text-gray-600 mb-1">You’ll see your notifications here once they arrive.</p>
            <p className="text-xs text-gray-600">Customer ID: {effectiveCustomerId ?? "-"}</p>
          </div>
        )}

        {hasLoadedOnce && !loading && notifications.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-[#DDE4FF] rounded-2xl p-4">
                <p className="text-xs uppercase text-gray-500 mb-1">Total Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{counts.totalCount}</p>
              </div>
              <div className="border border-[#DDE4FF] rounded-2xl p-4">
                <p className="text-xs uppercase text-gray-500 mb-1">Read</p>
                <p className="text-2xl font-semibold text-emerald-600">{counts.readCount}</p>
              </div>
              <div className="border border-[#DDE4FF] rounded-2xl p-4">
                <p className="text-xs uppercase text-gray-500 mb-1">Unread</p>
                <p className="text-2xl font-semibold text-amber-600">{counts.unreadCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
              <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
                {(["all", "pending", "approved"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full font-medium transition ${statusFilter === status ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {status === "all" ? "All" : status === "pending" ? "Pending" : "Approved"}
                  </button>
                ))}
              </div>
            </div>

            <div ref={listContainerRef} className="border border-[#DDE4FF] rounded-2xl max-h-[455px] overflow-y-auto">
              <ul className="divide-y divide-[#E5E7EB]">
                {filteredNotifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id, n.activityType);
                    }}
                    className={`px-5 py-4 flex items-start justify-between transition ${!n.isRead ? "bg-[#EEF2FF] hover:bg-[#e6f0ff]" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xl">🔔</div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">Notification</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusClasses(n.activityType)}`}>
                            {getStatusLabel(n.activityType)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700">{n.message}</p>

                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                          <span>{formatDateTime(n.createdAt)}</span>
                          {n.senderId && <span>From: {String(n.senderId).split("/").slice(-1)[0]}</span>}
                          {n.receiverId && <span>To: {String(n.receiverId).split("/").slice(-1)[0]}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button className="text-xs font-medium text-[#5866FF] hover:underline mt-1 cursor-pointer">View details</button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="w-full flex items-center justify-center py-3" ref={sentinelRef}>
                {loadingMore ? (
                  <div className="text-xs text-gray-400">Loading more notifications...</div>
                ) : pagination && page >= (pagination.totalPages ?? 1) ? (
                  <div className="text-xs text-gray-400">No more notifications</div>
                ) : (
                  <div className="text-xs text-gray-400">Scroll to load more</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
