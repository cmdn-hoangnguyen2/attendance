---
name: 8pt-grid-spacing
description: >
  Use this skill whenever creating, scaffolding, or styling any new UI
  component in React, Next.js (App Router), or Vue 3 — including buttons,
  cards, forms, layouts, sections, and pages. Automatically apply the
  8-Point Grid spacing system (multiples of 8, or 4 for fine adjustments)
  to every padding, margin, gap, width, height, and border-radius value
  BEFORE writing the code — do not wait for the user to mention "8pt",
  "grid", or "spacing" explicitly. Also trigger when reviewing or editing
  existing component styles to flag and auto-fix any value that breaks
  the grid, using the Internal ≤ External rule and Proximity Ratio
  described below.
---

# 8-Point Grid System

Skill này định chuẩn sinh code và chuẩn hóa giao diện cho React, Next.js (App Router) và Vue 3. Áp dụng tự động ngay từ lần sinh mã đầu tiên (generate-first) và cung cấp diff sửa lỗi khi tái cấu trúc hoặc review mã nguồn đã có.

---

## 1. Nguyên tắc gốc

- **Mọi giá trị đo được (padding, margin, gap, width, height, border-radius)** phải là **bội số của 8** (8, 16, 24, 32, 40, 48, 56, 64, 80, 96px).
- **Quy tắc bước 4px:** Cho phép các giá trị bước 4 (4, 12, 20, 28px) **CHỈ** khi cần tinh chỉnh mịn cho:
  1. Khoảng cách vi mô giữa icon nhỏ và văn bản đi kèm.
  2. Độ dày hoặc căn chỉnh hairline border.
  3. Bù trừ quang học cho line-height.
  *Bắt buộc phải ghi rõ lý do bằng comment ngay tại dòng code khi dùng bước 4px.*
- **Base Spacing Scale chuẩn:**

| Token | Giá trị | Vai trò | Tailwind v3/v4 Class |
| :--- | :--- | :--- | :--- |
| `space-1` | `4px` | Fine-tune (icon gap, border offset) | `p-1`, `m-1`, `gap-1` |
| `space-2` | `8px` | Internal spacing nhỏ nhất (icon-to-text, label-to-input) | `p-2`, `m-2`, `gap-2` |
| `space-3` | `16px` | Padding component nguyên tử (button, input, chip) | `p-4`, `m-4`, `gap-4` |
| `space-4` | `24px` | Padding card, khoảng cách giữa các field trong cùng 1 group | `p-6`, `m-6`, `gap-6` |
| `space-5` | `32px` | Khoảng cách giữa các group/section nhỏ | `p-8`, `m-8`, `gap-8` |
| `space-6` | `48px` | Padding section, khoảng cách phân tách khối chức năng | `p-12`, `m-12`, `gap-12` |
| `space-7` | `64px+` | Hero container, khoảng cách block lớn trên màn hình lớn | `p-16`, `m-16`, `gap-16` |

---

## 2. Quan hệ Internal ≤ External (Phần lõi bắt buộc)

Quy tắc phân cấp thị giác cốt lõi: người dùng nhận thức cấu trúc giao diện dựa trên khoảng cách.

- **Định nghĩa:**
  - **Internal spacing:** Khoảng cách bên **TRONG** một thực thể hoặc một nhóm thông tin đơn lẻ (padding nội tại của button, khoảng cách giữa label và input, khoảng cách giữa avatar và tên).
  - **External spacing:** Margin hoặc gap phân cách giữa các **NHÓM RIÊNG BIỆT** (khoảng cách giữa form field này sang form field khác, khoảng cách giữa card này sang card kế tiếp).
- **Luật bất biến:**
  $$\text{Internal Spacing} \le \text{External Spacing}$$
  **KHÔNG BAO GIỜ** được để Internal > External. Nếu Internal > External, thị giác người dùng sẽ gom nhầm phần tử của nhóm lân cận vào nhóm hiện tại.
- **Ví dụ chuẩn bắt buộc áp dụng khi sinh code:**
  - Label $\to$ Input (internal): `8px` (`space-2` / `gap-2`)
  - Field này $\to$ Field kia trong cùng form (external, cùng nhóm): `24px` (`space-4` / `gap-6` hoặc `space-y-6`)
  - Group này $\to$ Group kia (external, khác nhóm chức năng): `32px` - `48px` (`space-5` hoặc `space-6`)
  - **Tỉ lệ khuyến nghị:** Tỉ lệ $\text{Internal} : \text{External}$ tối thiểu là **1:2**, tối ưu nhất là **1:3** để phân biệt rõ ràng mà không cần phụ thuộc vào border hay background nền.

---

## 3. Proximity Ratio (Nguyên lý Gestalt)

- **Cơ sở khoa học:** *Gestalt Law of Proximity* — Các đối tượng nằm gần nhau được bộ não tự động diễn giải là có mối quan hệ gắn kết; các đối tượng cách xa nhau được hiểu là độc lập.
- **Công thức tính toán khi xây dựng layout nhiều tầng:**
  $$\text{Khoảng cách giữa các nhóm} \ge 2 \times \text{Khoảng cách trong nội bộ nhóm}$$
- **Bảng tra cứu Proximity theo ngữ cảnh UI:**

| Ngữ cảnh UI | Internal Spacing | External Spacing | Tỉ lệ (Ratio) | Mẫu triển khai |
| :--- | :--- | :--- | :--- | :--- |
| **Form field** (label, input, helper text) | `8px` | `24px` (giữa các field) | **1:3** | `gap-2` (label-input) vs `gap-6` (form stack) |
| **Card nội bộ** (header, body, footer) | `16px` | `32px` (giữa các card) | **1:2** | `gap-4` (card content) vs `gap-8` (grid card) |
| **Navigation item** (icon và text nhãn) | `8px` | `24px` (giữa các nav link) | **1:3** | `gap-2` (icon-text) vs `gap-6` (nav items) |
| **List item** (tiêu đề dòng và mô tả phụ) | `4px` - `8px` | `16px` - `24px` (giữa các dòng) | **1:2 - 1:3** | `gap-1` hoặc `gap-2` vs `divide-y` / `space-y-4` |

> [!WARNING]
> Khi phát hiện tỉ lệ $\text{Ratio} < 2$ giữa các nhóm liên tiếp, **PHẢI** đưa ra cảnh báo trong comment code hoặc trong câu trả lời kèm đề xuất điều chỉnh lại giá trị spacing.

---

## 4. Padding theo vai trò Container

Khi sinh mã cho container, áp dụng trực tiếp bảng chuẩn dưới đây:

| Loại Container | Padding chuẩn | Tailwind Class | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Button, Input, Chip, Badge** | `16px` ngang, `8px`/`10px` dọc | `px-4 py-2` | Component nguyên tử, bấm chạm dễ dàng |
| **Card, Popover, Dropdown Menu** | `24px` | `p-6` | Đủ thoáng cho nội dung bên trong |
| **Section trong Page, Modal, Drawer** | `32px` - `48px` | `p-8` đến `p-12` | Phân cách các cụm chức năng lớn |
| **Hero, Page Container tổng** | `48px` - `96px` | `py-12 px-6` $\to$ `lg:py-24 lg:px-12` | Thu nhỏ theo tỉ lệ ở mobile (`py-8 px-4`) |

---

## 5. Ngoại lệ hợp lệ (Không ép 8pt cứng nhắc)

Chỉ chấp nhận các ngoại lệ sau mà không tính là lỗi phá lưới:
1. **Ảnh / Assets cố định:** Asset hoặc ảnh có kích thước cố định từ Design (ví dụ banner 720px, avatar 40px/48px). Căn lề và khoảng cách **XUNG QUANH** ảnh theo hệ 8pt, không ép méo hoặc co kéo ảnh bất hợp lý.
2. **Typography (Font size / Line height):** Typography tuân theo thang Type Scale riêng hoặc bước nhảy 4px (12, 14, 16, 20, 24, 28, 32px) để đảm bảo tính dễ đọc và căn lề quang học.
3. **Border Width:** Đường viền phân cách `1px`, `2px` giữ nguyên giá trị vật lý.
4. **Third-party Icons:** Icon từ thư viện bên thứ 3 có kích thước cố định (ví dụ 20px từ Lucide, Tabler, Heroicons) được giữ nguyên, chỉ áp dụng hệ 8pt cho khoảng cách bao quanh icon.

---

## 6. Áp dụng theo Stack (Auto-detection)

Trước khi generate mã nguồn, agent **PHẢI** kiểm tra cấu hình project:

### Trường hợp A: Project dùng Tailwind CSS (`tailwind.config.*` hoặc Tailwind v4 `@theme`)
- Sử dụng các utility classes tương ứng bội số của 8:
  - `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px), `p-12` (48px), `p-16` (64px).
  - Tránh các class lẻ không thuộc hệ: `p-3` (12px), `p-5` (20px), `gap-2.5` (10px).
- Nếu project yêu cầu scale chuẩn hóa, tham khảo và gợi ý tích hợp file [assets/tailwind.spacing.snippet.ts](assets/tailwind.spacing.snippet.ts).

### Trường hợp B: Project dùng CSS Modules, Styled Components, hoặc Vue `<style scoped>`
- Khai báo và sử dụng Design Tokens biến CSS từ [assets/spacing-tokens.css](assets/spacing-tokens.css).
- Đường dẫn gợi ý: `styles/tokens/spacing.css` (React/Next.js) hoặc `src/assets/styles/spacing.css` (Vue).

### Trường hợp C: Project kết hợp cả hai
- Ưu tiên hệ thống đã được cấu hình sẵn trong project, **không tạo thêm hệ thống token thứ hai gây phân mảnh**.

---

## 7. Hành vi AUTO-FIX khi Generate hoặc Sửa Code

### Khi viết component mới:
- 100% các giá trị spacing (padding, margin, gap) phải chọn trực tiếp từ bảng Base Scale (Mục 1).
- **Tuyệt đối cấm** viết các con số ma thuật tùy tiện (ví dụ: `padding: 22px`, `margin: 10px`, `gap: 15px`, `mt-[18px]`).

### Khi review hoặc sửa component có sẵn:
- Khi phát hiện giá trị lệch lưới hoặc vi phạm $\text{Internal} \le \text{External}$, **PHẢI đề xuất diff cụ thể** chuyển về giá trị 8pt hợp lệ gần nhất.
- Kèm theo 1 dòng giải thích lý do rõ ràng.
- **Không tự động sửa âm thầm:** Luôn chỉ rõ giá trị cũ $\to$ giá trị mới trong phản hồi.

*Mẫu phản hồi Auto-fix:*
```diff
- <div className="p-[22px] gap-[10px]">
+ <div className="p-6 gap-3"> {/* Sửa 22px -> 24px (p-6) chuẩn container card; gap 10px -> 12px (gap-3) tinh chỉnh icon */}
```

---

## 8. Checklist xác nhận trước khi hoàn thành Code

Mỗi khi xuất code UI cho người dùng, hãy tự rà soát danh sách kiểm tra:
- [ ] **Scale chuẩn:** Mọi giá trị spacing thuộc bội số của 8 (hoặc 4px có comment giải thích).
- [ ] **Internal $\le$ External:** Khoảng cách nội bộ các phần tử luôn nhỏ hơn hoặc bằng khoảng cách giữa các nhóm.
- [ ] **Proximity Ratio:** Tỉ lệ phân cách giữa các nhóm so với trong nhóm đạt $\ge 2$.
- [ ] **Padding Container:** Padding các khối Button/Input, Card, Section tuân thủ bảng Mục 4.
- [ ] **Không có Magic Number:** Loại bỏ hoàn toàn các giá trị pixel tự do (`11px`, `13px`, `17px`, `22px`, v.v.).
