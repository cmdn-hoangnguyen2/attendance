# Cải Tiến: Badge "Phòng Đã Lưu Trữ" & Grid 4 Cột Tại Trang Quỹ Cá Nhân

1. **Thời gian:** 2026-09-20 23:26:30 (ICT)
2. **Feature:** Giao diện Quỹ cá nhân (Personal Funds UI Enhancement).
3. **Lý do change:**
   - Theo quy định tại `docs/03-domain-and-states.md#L46` ("Existing outstanding fund contributions remain payable and remain visible in Funds with Room archived badge") và `docs/06-ui-mock-phase.md#L27` ("Funds (My Contributions): empty, fund contribution cards 4 columns, archived-room badge").
   - Trước đây, trang `/funds` chưa gắn badge `Phòng đã lưu trữ` trên các thẻ nợ quỹ thuộc phòng đã archive, và lưới hiển thị tối đa 3 cột trên desktop.
4. **Cách thức change:**
   - Trong `src/app/funds/page.tsx`:
     + Đọc thuộc tính `room?.status === "archived"` của phòng tương ứng với từng bản ghi nợ quỹ.
     + Hiển thị badge `Phòng đã lưu trữ` (`bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-full px-2 py-0.5 text-[10px] font-bold`) tại góc trên của thẻ khoản quỹ.
     + Cập nhật grid layout sang `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`.
5. **Scope ảnh hưởng:**
   - `src/app/funds/page.tsx`
6. **Lợi ích:**
   - Đáp ứng 100% tài liệu nghiệp vụ và thiết kế UI mock phase.
   - Giúp người dùng phân biệt tức thì khoản nợ quỹ nào thuộc phòng đang mở hay phòng đã đóng/lưu trữ.
   - Tối ưu hóa không gian hiển thị trên màn hình máy tính để bàn lớn.
