# Agent Workflow & Engineering Guardrails — DiemDanhCMDN

Tài liệu này định nghĩa quy chuẩn làm việc bắt buộc cho tất cả các AI Agent tham gia phát triển, bảo trì và mở rộng dự án DiemDanhCMDN.

---

## 1. Nguồn Chân Lý & Bối Cảnh (Trust Sources & Context)

- **Single Source of Truth (Phạm vi nghiệp vụ):** Toàn bộ nghiệp vụ, logic và luồng hoạt động **CHỈ** được thực hiện trong phạm vi thư mục `docs/`. Tuyệt đối không tự ý suy diễn, phỏng đoán hoặc đưa vào các tính năng nằm ngoài tài liệu.
- **Quy chuẩn Lập trình (Coding Conventions):** Tuân thủ 100% các quy ước trong skill `zhon-conventions` (tách biệt logic JSX, semantic HTML, conditional flow, BEM/Tailwind hooks).
- **Quy chuẩn Giao diện (UI Styling):** Áp dụng tự động và triệt để hệ thống `8-point grid spacing` (`8pt-grid-spacing`):
  - Mọi giá trị đo lường (`padding`, `margin`, `gap`, `width`, `height`, `border-radius`) bắt buộc là bội số của 8 (8, 16, 24, 32, 40, 48, 56, 64, 80, 96px).
  - Bước 4px (4, 12, 20, 28px) **CHỈ** dùng khi tinh chỉnh icon nhỏ, hairline border hoặc line-height quang học và **BẮT BUỘC** có comment giải thích tại dòng code.
  - **Luật bất biến Internal $\le$ External:** Khoảng cách nội bộ các phần tử trong nhóm luôn nhỏ hơn hoặc bằng khoảng cách giữa các nhóm khác nhau.
  - **Proximity Ratio (Gestalt):** Khoảng cách giữa các nhóm $\ge 2 \times$ khoảng cách trong nhóm (khuyến nghị 1:2 đến 1:3).
  - **Padding container chuẩn:** Button/Input 16px (`px-4 py-2`), Card 24px (`p-6`), Section 32-48px (`p-8`/`p-12`), Page/Hero 48-96px.

---

## 2. Quy Định Quản Lý Cải Tiến (Enhancement Documentation Protocol)

Khi phát sinh bất kỳ yêu cầu hoặc cập nhật mang tính cải tiến/nâng cấp hệ thống:
- Tạo thư mục `enhancement/` tại thư mục gốc của dự án.
- Tạo file tài liệu markdown (ví dụ: `enhancement/YYYY-MM-DD-feature-name.md`) với cấu trúc bắt buộc theo đúng cú pháp sau:
  1. **Thời gian:** Thời điểm thực hiện (ngày giờ cụ thể).
  2. **Feature:** Tên tính năng / module liên quan.
  3. **Lý do change:** Tại sao cần thay đổi, vấn đề hoặc điểm nghẽn hiện tại là gì.
  4. **Cách thức change:** Giải pháp kỹ thuật, cách tiếp cận triển khai chi tiết.
  5. **Scope ảnh hưởng:** Danh sách các file bị tác động, logic và data flow liên quan.
  6. **Lợi ích:** Giá trị cụ thể mang lại (hiệu năng, trải nghiệm người dùng DX/UX, độ tin cậy, v.v.).

---

## 3. Ranh Giới Phạm Vi & Chống Over-Engineering (Scope Guardrails)

- Khi thực hiện task hoặc debug: **CHỈ can thiệp và thay đổi trong đúng phạm vi (scope) được giao**.
- Nếu phát hiện vấn đề cần tối ưu hóa hoặc mở rộng (enhancement): **KHÔNG tự ý làm ngay**. Bắt buộc phải lên Plan đề xuất gửi User, chờ User phê duyệt mới được thực hiện.
- Nghiêm cấm mọi hành vi out-of-scope hoặc over-engineering (thêm thư viện thừa thãi, trừu tượng hóa quá mức, tự ý thay đổi kiến trúc tổng thể).

---

## 4. Quy Trình Làm Việc Chuẩn 8 Bước (Standard Operating Flow)

Mọi tương tác thực thi tác vụ phải tuân thủ nghiêm ngặt 8 bước sau:

1. **Nhận thông tin:** Tiếp nhận yêu cầu, task hoặc lỗi từ User.
2. **Draft info:** Lập bản tóm tắt/phác thảo sơ bộ về những gì đã hiểu và hướng tiếp cận.
3. **Hỏi ngược lại user:** Đặt câu hỏi làm rõ các điểm mơ hồ, chưa rõ ràng hoặc thiếu dữ liệu.
4. **Cập nhật Draft:** Tiếp nhận phản hồi từ User và cập nhật, bổ sung vào bản draft.
5. **Xử lý Conflict (nếu có):** Nếu thông tin mới mâu thuẫn với tài liệu hoặc quy định hiện tại, phải hỏi lại User ngay để thống nhất hướng xử lý.
6. **Lên Plans chi tiết:** Sau khi vấn đề đã hoàn toàn rõ ràng, lập bản kế hoạch chi tiết bao gồm:
   - **Tên task**
   - **Thực hiện tại file nào (Target Files - [MODIFY])**
   - **File mới nào dự kiến được tạo ra (New Files - [NEW])**
   - **Kịch bản kiểm thử (Test Cases)**
   - **Tiêu chí chấp thuận (Acceptance Criteria):** Liệt kê chi tiết nhất có thể dưới dạng checkbox `[ ]` (về coding, logic, UI, responsive, test).
   *(Dừng lại chờ User duyệt Plan trước khi viết code).*
7. **Thực thi code:** Tiến hành chỉnh sửa/viết code chính xác theo scope trong plan đã được duyệt.
8. **Báo cáo & Xác nhận trước test:** Báo cáo các công việc đã hoàn thành cho User và hỏi User xem có cần thay đổi gì không **TRƯỚC KHI** chạy build test.

---

> [!CRITICAL]
> **ĐIỀU CẤM KỴ TUYỆT ĐỐI (HARD RESTRICTION):**
> **KHÔNG ĐƯỢC DÙNG SUBAGENT BROWSER (`browser_subagent`)** trừ khi có yêu cầu bằng văn bản trực tiếp từ User.
