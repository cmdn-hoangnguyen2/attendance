# 8-Point Grid Spacing Reference Sheet

Bảng tra cứu nhanh các token khoảng cách, tỉ lệ thị giác Gestalt và kích thước container cho toàn bộ quy trình thiết kế UI.

---

## 1. Base Scale (Hệ 8pt chuẩn)

| Token Name | Pixel Value | Rem (Base 16px) | Tailwind Equivalent | Ngữ cảnh sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| `space-1` | `4px` | `0.25rem` | `1` | Khoảng cách vi mô (fine-tune), gap icon nhỏ, viền |
| `space-2` | `8px` | `0.5rem` | `2` | Khoảng cách nội tại tối thiểu (label $\to$ input, icon $\to$ text) |
| `space-3` | `16px` | `1rem` | `4` | Padding component nguyên tử (Button, Input, Badge) |
| `space-4` | `24px` | `1.5rem` | `6` | Padding Card, khoảng cách giữa các input field trong 1 group |
| `space-5` | `32px` | `2rem` | `8` | Khoảng cách giữa các group/block nhỏ |
| `space-6` | `48px` | `3rem` | `12` | Padding section, khoảng cách phân cách các section vừa |
| `space-7` | `64px` | `4rem` | `16` | Padding lớn, hero section, khoảng cách giữa các phân đoạn chính |
| `space-8` | `80px` | `5rem` | `20` | Hero container trên màn hình desktop lớn |
| `space-9` | `96px` | `6rem` | `24` | Khoảng cách trang chủ, padding chân trang |

---

## 2. Bảng đối chiếu Proximity Ratio (Gestalt Law)

Nguyên tắc: $\text{Khoảng cách giữa các nhóm (External)} \ge 2 \times \text{Khoảng cách trong nhóm (Internal)}$.

| Ngữ cảnh UI | Internal Spacing | External Spacing | Tỉ lệ đạt được | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Form Stack** | `8px` (`gap-2`) | `24px` (`gap-6`) | **1:3** | Nhãn và input gắn chặt, các field cách xa rõ rệt |
| **Card Layout** | `16px` (`gap-4`) | `32px` (`gap-8`) | **1:2** | Nội dung trong card kết nối, các card tách biệt |
| **Navbar Links** | `8px` (`gap-2`) | `24px` (`gap-6`) | **1:3** | Icon đi liền nhãn, các menu item có không gian thở |
| **Data List** | `8px` (`gap-2`) | `16px` (`space-y-4`) | **1:2** | Từng dòng dữ liệu rõ ràng, dễ quét mắt |
| **Modal Body** | `16px` (`gap-4`) | `32px` (`mt-8`) | **1:2** | Nút hành động footer tách biệt khỏi nội dung form |

---

## 3. Padding theo vai trò Container

| Loại Container | Kích thước Padding Chuẩn | Tailwind Class | Minh họa |
| :--- | :--- | :--- | :--- |
| **Button / Input** | `16px` ngang, `8px` dọc | `px-4 py-2` | Nút bấm tiêu chuẩn, chiều cao đạt 40px |
| **Compact Button** | `12px` ngang, `4px` dọc *(ngoại lệ 4pt)* | `px-3 py-1` | Nút nhỏ / tag chip |
| **Card / Panel** | `24px` xung quanh | `p-6` | Hộp nội dung chuẩn |
| **Section (Page)** | `32px` mobile, `48px` desktop | `p-8 lg:p-12` | Các khối nội dung trên landing page |
| **Page Wrapper** | `16px` mobile, `32px` tablet, `64px` desktop | `px-4 sm:px-8 lg:px-16` | Lề bao quanh toàn bộ ứng dụng |
