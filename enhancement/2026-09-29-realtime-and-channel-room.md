# Enhancement: Realtime Presence, Channel Rooms, and P2P Debts

## 1. Thời gian
2026-09-29; cập nhật Realtime channel lifecycle lúc 20:42 +07.

## 2. Feature
- **Global & Room Realtime Presence:** Hiển thị danh sách toàn bộ user (tối đa 30) kèm trạng thái online/offline và đang ở phòng nào. Hỗ trợ hiển thị "In-room" / "Outside" trong chi tiết phòng.
- **In-app Notification:** Hệ thống thông báo lưu database (SQL) cho các sự kiện: Xin vào phòng (được duyệt/từ chối), được mời vào phòng.
- **Invite Member:** Cho phép Owner mời người chưa phải thành viên tham gia phòng.
- **Neo-brutalism Marquee Banner:** Chạy chữ thông báo realtime (ai trễ, nợ quỹ, trả quỹ) trong phòng với phong cách gai góc, mạnh mẽ.
- **Channel Room (Customize) & P2P Debts:** Bổ sung loại phòng `Channel` (kế thừa từ `Meeting` nhưng ẩn khỏi homepage với người ngoài, chỉ tham gia qua Invite). Bổ sung hệ thống quản lý quỹ cá nhân (Peer-to-Peer Debt) độc lập với quỹ phòng, cho phép tạo nợ qua lại, quét QR cá nhân, và dashboard quản lý khoản nợ/chủ nợ.

## 3. Lý do change
- Tăng cường tính tương tác và minh bạch của hệ thống thông qua realtime presence và notifications.
- Khắc phục giới hạn của quỹ chung bằng cách cho phép các thành viên trong nhóm tự quản lý các khoản chi tiêu cá nhân (chia sẻ chi phí, ăn uống, cafe) thông qua hệ thống P2P Debt (Channel Room).
- Tăng cường trải nghiệm UI/UX (Marquee Banner, Search client-side).

## 4. Cách thức change
- **Database (Supabase):** 
  - Tạo table `AppNotification` (id, user_id, type, content, is_read, created_at).
  - Thêm cột `type` (ENUM: 'meeting', 'channel') cho table `Room`.
  - Tạo table `PeerDebt` (id, room_id, creditor_id, debtor_id, amount, reason, status, created_at, updated_at).
  - Tạo table `UserQrCode` (user_id, image_url, type).
  - Thiết lập RLS policies cho các table mới.
- **Realtime:**
  - Setup Supabase Presence cho global online users và in-room tracking.
  - Tích hợp thêm event broadcast cho `PeerDebt` và In-app notifications.
  - Tạo tên channel instance bằng UUID để các subscription đồng thời không tái sử dụng một channel đã `subscribe()`.
  - Giữ nguyên logical topic, Postgres Changes filters, debounce và cleanup lifecycle.
- **Backend/API (Server Actions):**
  - Viết các action: send_invite, accept_invite, create_peer_debt, update_peer_debt_status.
- **Frontend (UI/UX):**
  - Homepage: Sidebar danh sách user (Client-side search).
  - Room Detail: Marquee Banner (dùng CSS animation infinity loop), Modal Invite.
  - Channel Room: Dashboard 2 tab (Who I owe, Who owes me), History tab, QR List.

## 5. Scope ảnh hưởng
- `Room` entity và luồng tạo phòng.
- Hệ thống Realtime/Context.
- Database TypeScript schema cho `rooms.type` và `app_notifications`.
- Layout chính của Homepage và Room Detail.
- Không làm ảnh hưởng logic `Meeting` cũ vì `Channel` được tách nhánh xử lý riêng cho phần P2P Debt.

## 6. Lợi ích
- App trở nên "sống động" hơn với Realtime Presence và Marquee Banner.
- Mở rộng tệp use-case: Không chỉ quản lý điểm danh, mà còn trở thành công cụ split-bill tiện lợi cho nhóm nhỏ (Channel mode).
