import { createRealtimeChannelName } from "../realtime/createRealtimeChannelName.mjs";

/** @typedef {import("../../types/domain").User} User */
/** @typedef {{ currentUser: User | null, globalRole: "admin" | "user", isLoading: boolean, error: string | null }} AuthState */
/** @typedef {{ channel: (name: string) => any, removeChannel: (channel: any) => unknown }} RealtimeClient */

/**
 * Realtime/browser events only request an authoritative profile. They never
 * supply identity or roles, and a healthy refresh retains the existing channel.
 * @param {{
 *   client: RealtimeClient,
 *   eventTarget: EventTarget,
 *   clearTokenCache: () => void,
 *   onStateChange: (state: AuthState) => void,
 *   fetchProfile?: typeof fetch
 * }} options
 */
export function createBrowserAuthLifecycle({
  client,
  eventTarget,
  clearTokenCache,
  onStateChange,
  fetchProfile = fetch,
}) {
  /** @type {AuthState} */
  let state = { currentUser: null, globalRole: "user", isLoading: true, error: null };
  let active = false;
  let generation = 0;
  /** @type {Promise<void> | null} */
  let pending = null;
  /** @type {(() => void) | null} */
  let cancelRequest = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let refreshTimer = null;
  let queuedRefresh = false;
  let ownChannel = null;

  const publish = () => onStateChange({ ...state });

  function cancelScheduledRefresh() {
    if (refreshTimer !== null) clearTimeout(refreshTimer);
    refreshTimer = null;
    queuedRefresh = false;
  }

  function removeOwnChannel() {
    if (!ownChannel) return;
    const channel = ownChannel;
    ownChannel = null;
    // SDK removal is async; cleanup must not leave an unhandled rejection.
    void Promise.resolve(client.removeChannel(channel)).catch(() => {});
  }

  function scheduleRefresh() {
    if (!active) return;
    if (refreshTimer !== null) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      if (!active) return;
      if (pending) {
        queuedRefresh = true;
        return;
      }
      void refresh();
    }, 300);
  }

  function subscribeOwnProfile(userId) {
    ownChannel = client.channel(createRealtimeChannelName(`user-lifecycle:${userId}`));
    ownChannel.on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "users",
      filter: `id=eq.${userId}`,
    }, scheduleRefresh);
    ownChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") scheduleRefresh();
    });
  }

  function invalidateIdentity(error) {
    clearTokenCache();
    cancelScheduledRefresh();
    removeOwnChannel();
    state = { currentUser: null, globalRole: "user", isLoading: false, error };
  }

  async function refresh() {
    if (!active) return;
    if (pending) {
      queuedRefresh = true;
      return pending;
    }
    cancelScheduledRefresh();
    const requestGeneration = ++generation;
    const controller = new AbortController();
    const isCurrent = () => active && requestGeneration === generation;
    let timeout;
    const deadline = new Promise((_, reject) => {
      cancelRequest = () => {
        controller.abort();
        reject(new Error("Profile request ended."));
      };
      timeout = setTimeout(() => cancelRequest?.(), 15000);
    });

    // Initial loading is visible; background signals retain valid identity.
    state = { ...state, isLoading: state.currentUser === null, error: null };
    publish();

    const load = async () => {
      const response = await fetchProfile("/api/me", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        return { status: response.status, data: null };
      }
      if (!response.ok) throw new Error("Profile request failed.");
      // Body parsing is part of the same finite deadline as the fetch.
      const data = await response.json();
      return { status: response.status, data };
    };

    pending = (async () => {
      try {
        const result = await Promise.race([load(), deadline]);
        if (!isCurrent() || controller.signal.aborted) return;
        if (result.status === 401) {
          invalidateIdentity(null);
          return;
        }
        if (result.status === 403) {
          invalidateIdentity("Tài khoản đã được lưu trữ. Vui lòng liên hệ quản trị viên.");
          return;
        }

        const data = result.data;
        const validProfile = typeof data?.user?.id === "string" &&
          data.user.id.length > 0 && data.user.status === "active" &&
          ["admin", "user"].includes(data.globalRole);
        if (!validProfile) {
          invalidateIdentity("Hồ sơ đăng nhập không hợp lệ.");
          return;
        }

        const previousUser = state.currentUser;
        const replacedAccount = previousUser !== null &&
          (previousUser.id !== data.user.id || previousUser.auth0Subject !== data.user.auth0Subject);
        if (replacedAccount) {
          clearTokenCache();
          cancelScheduledRefresh();
          removeOwnChannel();
        }
        state = { currentUser: data.user, globalRole: data.globalRole, isLoading: false, error: null };
        if (!ownChannel) subscribeOwnProfile(data.user.id);
      } catch {
        if (!isCurrent()) return;
        state = { ...state, error: "Không thể tải phiên đăng nhập. Vui lòng thử lại." };
      } finally {
        clearTimeout(timeout);
        if (isCurrent()) {
          cancelRequest = null;
          pending = null;
          state = { ...state, isLoading: false };
          publish();
          if (queuedRefresh) {
            queuedRefresh = false;
            void refresh();
          }
        }
      }
    })();
    return pending;
  }

  function detach() {
    active = false;
    generation++;
    eventTarget.removeEventListener("focus", scheduleRefresh);
    eventTarget.removeEventListener("online", scheduleRefresh);
    cancelScheduledRefresh();
    removeOwnChannel();
    cancelRequest?.();
    cancelRequest = null;
    pending = null;
  }

  function start() {
    if (active) return pending ?? Promise.resolve();
    active = true;
    eventTarget.addEventListener("focus", scheduleRefresh);
    eventTarget.addEventListener("online", scheduleRefresh);
    return refresh();
  }

  function logout() {
    clearTokenCache();
    detach();
    state = { currentUser: null, globalRole: "user", isLoading: false, error: null };
    publish();
  }

  return { start, refresh, logout, dispose: detach };
}

/**
 * Preserve the existing financial notification scopes. Auth lifecycle listens
 * on its own users channel and never consumes these financial events.
 * @param {{
 *   userId: string,
 *   onDataChange: () => void,
 *   enabled?: boolean,
 *   client: RealtimeClient
 * }} options
 */
export function subscribeUserRealtime({ userId, onDataChange, enabled = true, client }) {
  if (!enabled || !userId) return () => {};

  let active = true;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  const notify = () => {
    if (!active) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (active) onDataChange();
    }, 300);
  };
  const channel = client.channel(createRealtimeChannelName(`user:${userId}`));
  channel.on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "fund_contributions",
    filter: `contributor_id=eq.${userId}`,
  }, notify);
  channel.on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "payments",
  }, notify);
  channel.on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "app_notifications",
    filter: `user_id=eq.${userId}`,
  }, notify);
  channel.subscribe();

  return () => {
    if (!active) return;
    active = false;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    void Promise.resolve(client.removeChannel(channel)).catch(() => {});
  };
}
