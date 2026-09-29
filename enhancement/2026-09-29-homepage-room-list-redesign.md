# Homepage Room List Redesign

## 1. Thời gian

- 2026-09-29 16:31:34 +07

## 2. Feature

- Homepage room catalog và online-member sidebar proportion.

## 3. Lý do change

- Sidebar thành viên chiếm 4/12 cột nên làm hẹp vùng nội dung chính.
- Danh sách phòng dùng một container có divider theo hàng, tạo cảm giác table UI và khó phân biệt từng phòng.
- Loading skeleton chưa phản ánh đúng layout room card cần triển khai.

## 4. Cách thức change

- Điều chỉnh desktop layout từ main/sidebar `8/4` thành `9/3`.
- Chuyển homepage room results sang responsive catalog grid: một cột mặc định và hai cột từ breakpoint `xl`.
- Bổ sung `catalog` layout cho `RoomCard`; layout mặc định tiếp tục phục vụ trang `/my-rooms`.
- Giữ nguyên search, visibility filter, room action states, realtime handlers và pagination contract hiện tại.
- Bổ sung heading, result count, accessible search label và skeleton đồng bộ với room catalog.
- Reuse design tokens, Hugeicons và dependencies hiện có; không thêm dependency hoặc thay đổi domain/data layer.

## 5. Scope ảnh hưởng

- `src/components/layout/PageLayout.tsx`: thay đổi desktop column proportion khi có sidebar.
- `src/app/page.tsx`: composition của homepage room catalog.
- `src/modules/rooms/presentation/RoomCard.tsx`: thêm presentation layout `catalog`.
- `src/modules/rooms/presentation/RoomListFilter.tsx`: cập nhật hierarchy và search/filter toolbar.
- `src/modules/rooms/presentation/RoomSkeletonGrid.tsx`: đồng bộ loading state với catalog grid.

Không thuộc scope:

- Pagination data logic hoặc backend query.
- Room repository, realtime subscription, authentication và authorization.
- Redesign trang `/my-rooms`.

## 6. Lợi ích

- Tăng diện tích hiển thị room catalog và giảm độ rộng sidebar thành viên.
- Mỗi phòng trở thành một interactive card dễ scan thay vì một hàng giống table.
- Responsive layout rõ ràng hơn trên desktop, tablet và mobile.
- Giữ nguyên business behavior và tránh side effect sang các trang sử dụng chung `RoomCard`.
