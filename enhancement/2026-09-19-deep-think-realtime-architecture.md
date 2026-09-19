# Kiến trúc Đồng bộ Realtime Toàn diện (Lobby & Room) & Trải nghiệm Thu hồi Quyền Truy cập

## 1. Thời gian

2026-09-19 23:14:00 +07

## 2. Feature

Deep-Think Realtime Architecture: Đồng bộ Realtime hai chiều tại Sảnh danh mục phòng họp (`useLobbyRealtime`), xử lý chuyển trạng thái đơn duyệt tức thời (`RoomCard`), và Modal thu hồi quyền truy cập khi thành viên bị xóa (`AccessRevokedModal`).

## 3. Lý do change

1. **Điểm nghẽn đồng bộ tại Trang chủ / Lobby:**
   - Trước đây chỉ có trang chi tiết phòng họp (`/meeting/[roomId]`) và trang quỹ (`/funds`) được đấu nối Supabase Realtime.
   - Trang chủ (`/`) và trang "Phòng của tôi" (`/my-rooms`) hoạt động theo cơ chế static fetch (chỉ gọi `fetchData()` một lần duy nhất khi mount).
   - Hậu quả: Khi User gửi yêu cầu tham gia phòng kín và được Chủ phòng phê duyệt, UI của User tại Lobby vẫn hiển thị nút "Hủy yêu cầu" và "Đang chờ duyệt...". Chỉ sau khi F5 tải lại trang, User mới thấy mình đã vào phòng.
   - Khi hai màn hình cùng mở sảnh ngoài phòng, nếu một bên xóa/thêm thành viên trong phòng thì màn hình còn lại không hề thấy biến động số lượng thành viên (`memberCount`).
2. **Điểm nghẽn trải nghiệm thành viên bị xóa (Kicked Member UX):**
   - Khi một thành viên đang ở trong phòng họp mà bị Chủ phòng hoặc Admin xóa quyền thành viên (`status = 'removed'`), UI trước đây chuyển đột ngột sang màn hình "Phòng kín — Yêu cầu quyền truy cập" như một người lạ vô tình ghé thăm.
   - Thành viên không nhận được thông báo rõ ràng về việc mình đã bị xóa khỏi phiên họp, gây bối rối và thiếu tính minh bạch.

## 4. Cách thức change

1. **Xây dựng Hook `useLobbyRealtime` (`src/lib/realtime/useLobbyRealtime.ts`):**
   - Mở kênh Realtime chuyên biệt cho sảnh ngoài phòng (`lobby:global`).
   - Đăng ký lắng nghe sự kiện `postgres_changes` trên 3 bảng trọng yếu:
     - `rooms`: Nhận biết phòng họp mới được tạo, chỉnh sửa tên/chế độ riêng tư, hoặc lưu trữ.
     - `room_memberships`: Nhận biết mọi biến động gia nhập, rời phòng hoặc bị xóa thành viên để cập nhật ngay số lượng thành viên (`memberCount`) và danh sách phòng đã tham gia (`joinedRoomIds`).
     - `join_requests`: Nhận biết đơn xin vào phòng được tạo, phê duyệt (`approved`), từ chối (`rejected`) hoặc hủy bỏ (`canceled`).
   - Áp dụng cơ chế **Debounce 300ms** để triệt tiêu tải dồn dập (thundering herd) khi có nhiều thay đổi cơ sở dữ liệu cùng lúc.
   - Tự động hủy đăng ký (unsubscribe & removeChannel) khi người dùng rời khỏi trang sảnh.

2. **Cập nhật Logic `RoomCard` & Điều hướng trực tiếp (`src/modules/rooms/presentation/RoomCard.tsx`):**
   - Mở rộng điều kiện `canDirectlyEnter`:
     ```typescript
     const canDirectlyEnter =
       isMember ||
       isOwner ||
       currentUser?.role === "admin" ||
       joinRequestStatus === "approved";
     ```
   - Ngay khi đơn xin vào phòng được duyệt qua Realtime, thẻ phòng lập tức chuyển sang nút CTA màu xanh lá "Vào phòng họp" (`/meeting/[roomId]`), loại bỏ hoàn toàn nút "Hủy yêu cầu".
   - Bổ sung lớp bảo vệ (Guard) trong `handleCancelRequest`: Nếu người dùng đã là thành viên hoặc đơn đã được duyệt (`approved`), hàm sẽ chặn thao tác hủy gửi lên backend.

3. **Tích hợp `useLobbyRealtime` vào Sảnh Trang Chủ & Phòng của tôi:**
   - `src/app/page.tsx`: Kết nối hook với `setRefreshKey`, giúp sảnh tự động refresh dữ liệu `findCatalog` và `joinedRoomIds` ngay lập tức.
   - `src/app/my-rooms/page.tsx`: Kết nối hook để danh sách "Phòng tôi làm chủ" và "Phòng đã tham gia" luôn được đồng bộ trực tiếp.

4. **Xây dựng Modal `AccessRevokedModal` (`src/modules/meetings/presentation/AccessRevokedModal.tsx`):**
   - Áp dụng triệt để quy chuẩn `8pt-grid-spacing` (padding 32px `p-8`, bo góc 24px `rounded-3xl`, icon 64x64px, nút bấm `px-6 py-3`).
   - Thiết kế **Non-dismissible**: Không cho phép đóng bằng phím ESC hay click backdrop ra ngoài; lớp backdrop làm mờ màn hình (`backdrop-blur-sm bg-black/60`) khóa hoàn toàn mọi thao tác trong phòng họp.
   - Hiển thị thông điệp dứt khoát: "Hết hạn quyền vào phòng họp — Bạn đã bị chủ phòng hoặc quản trị viên xóa khỏi phòng họp. Quyền truy cập và thao tác của bạn trong phòng đã kết thúc."
   - Nút hành động chính duy nhất: "Quay về trang chủ" chuyển hướng người dùng an toàn về `/`.

5. **Tích hợp Phát hiện Thành viên Bị Xóa tại `src/app/meeting/[roomId]/page.tsx`:**
   - Tính toán `isCurrentUserRemoved`:
     ```typescript
     const isCurrentUserRemoved = useMemo(() => {
       if (!currentUser || isOwnerOrAdmin) return false;
       const userMembership = memberships.find((m) => m.userId === currentUser.id);
       return userMembership?.status === "removed";
     }, [currentUser, isOwnerOrAdmin, memberships]);
     ```
   - Khi Chủ phòng xóa thành viên, Realtime phát tín hiệu `room_memberships` -> `fetchData()` lấy bản ghi cập nhật -> `isCurrentUserRemoved` chuyển thành `true` -> Modal `AccessRevokedModal` xuất hiện ngay lập tức trên màn hình của người bị xóa.

## 5. Scope ảnh hưởng

- `src/lib/realtime/useLobbyRealtime.ts` [NEW]: Hook Realtime cấp toàn cục cho Sảnh Lobby.
- `src/modules/rooms/presentation/RoomCard.tsx` [MODIFY]: Logic chuyển trạng thái vào phòng ngay khi approved.
- `src/app/page.tsx` [MODIFY]: Đấu nối Realtime cho trang chủ và bảo vệ hàm hủy đơn.
- `src/app/my-rooms/page.tsx` [MODIFY]: Đấu nối Realtime cho trang phòng của tôi.
- `src/modules/meetings/presentation/AccessRevokedModal.tsx` [NEW]: Modal thông báo bị xóa khỏi phòng họp.
- `src/app/meeting/[roomId]/page.tsx` [MODIFY]: Bắt sự kiện thành viên bị kick và kích hoạt modal thông báo.

## 6. Lợi ích

- **Trải nghiệm Sảnh sống động (Lively Lobby):** Người dùng nhìn thấy số lượng thành viên tăng/giảm theo thời gian thực mà không cần F5. Hai màn hình cạnh nhau phản ánh chính xác từng thay đổi.
- **Duyệt đơn không độ trễ:** Người xin vào phòng kín được chuyển trạng thái "Vào phòng họp" ngay tích tắc khi chủ phòng bấm duyệt.
- **Rõ ràng và Văn minh:** Thành viên bị mời ra khỏi phòng nhận được thông báo đàng hoàng, có nút điều hướng về trang chủ một cách lịch sự thay vì gặp lỗi 403 hoặc trang khóa khó hiểu.
- **Bảo mật và Nhất quán dữ liệu:** Loại bỏ khả năng người dùng bấm "Hủy yêu cầu" khi yêu cầu đó đã được duyệt thành công.
- **Chuẩn hóa thiết kế:** 100% tuân thủ `8pt-grid-spacing` và `zhon-conventions`.
