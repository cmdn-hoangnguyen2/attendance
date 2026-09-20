# DiemDanhCMDN — Hệ Thống Điểm Danh & Quản Lý Quỹ Nội Bộ

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Auth0](https://img.shields.io/badge/Auth0-SDK_v4_OIDC-eb5424?style=flat-square&logo=auth0)](https://auth0.com/)
[![Tests](https://img.shields.io/badge/Tests-46%2F46_Passed-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)

**DiemDanhCMDN** là giải pháp web full-stack hiện đại, minh bạch và chuyên nghiệp phục vụ công tác điểm danh định kỳ, giám sát sự hiện diện và quản lý nghĩa vụ đóng quỹ nội bộ cho các đội nhóm, câu lạc bộ và phòng họp doanh nghiệp.

Dự án được xây dựng theo kiến trúc Clean Architecture / Domain-Driven Design (DDD), vận hành với hệ thống kiểm soát quyền hạn chặt chẽ (RBAC) và cơ chế cập nhật dữ liệu thời gian thực (Realtime).

---

## 📑 Mục Lục

- [1. Tính Năng Nổi Bật (Features)](#1-tính-năng-nổi-bật-features)
- [2. Ngăn Xếp Công Nghệ (Tech Stack)](#2-ngăn-xếp-công-nghệ-tech-stack)
- [3. Kiến Trúc Hệ Thống (Architecture)](#3-kiến-trúc-hệ-thống-architecture)
- [4. Phân Quyền & Vai Trò (Roles & RBAC)](#4-phân-quyền--vai-trò-roles--rbac)
- [5. Cấu Trúc Thư Mục (Project Structure)](#5-cấu-trúc-thư-mục-project-structure)
- [6. Hướng Dẫn Cài Đặt (Getting Started)](#6-hướng-dẫn-cài-đặt-getting-started)
- [7. Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance)](#7-kiểm-thử--đảm-bảo-chất-lượng-quality-assurance)
- [8. Quy Chuẩn Kỹ Thuật (Engineering Conventions)](#8-quy-chuẩn-kỹ-thuật-engineering-conventions)

---

## 1. Tính Năng Nổi Bật (Features)

### 🚪 1. Quản Lý Không Gian Phòng Họp (Rooms Management)
- **Chế độ phòng đa dạng:** Hỗ trợ tạo phòng **Công khai (Public)** — tham gia tức thì, hoặc phòng **Riêng tư (Private)** — yêu cầu gửi duyệt tham gia (`JoinRequest`).
- **Phê duyệt thành viên:** Chủ phòng và Admin có toàn quyền duyệt hoặc từ chối yêu cầu vào phòng riêng tư.
- **Chuyển nhượng quyền sở hữu (Ownership Transfer):** Chuyển giao quyền chủ phòng cho bất kỳ thành viên đang hoạt động trong phòng.
- **Lưu trữ an toàn (Archive Room):** Đóng băng toàn bộ hoạt động phòng (chặn tạo mới thành viên, cuộc họp, quỹ). Yêu cầu xác nhận bằng cụm từ bảo mật bắt buộc: `Archive this room`. Admin toàn cục có quyền khôi phục lại phòng đã lưu trữ.

### ⏱️ 2. Quy Trình Điểm Danh Chuẩn Xác (Meeting & Attendance Flow)
- **Hạn chót điểm danh nghiêm ngặt:** Hạn chót tự điểm danh được tính chính xác tới từng giây khớp với giờ bắt đầu (`startsAt`). Vào lúc `10:00:00`, cuộc họp 10:00 được coi là đã trễ.
- **Tự điểm danh:** Thành viên chủ động đánh dấu trạng thái `Có mặt (present)`, `Vắng mặt (absent)`, hoặc `Xin phép (leave)` trước giờ họp.
- **Snapshot Ứng viên đóng quỹ (Fund Candidates List):** Khi chạm mốc deadline, hệ thống tự động lọc toàn bộ thành viên vắng mặt vào danh sách ứng viên. Danh sách này đóng vai trò là dữ liệu kiểm toán và **không tự động sinh nghĩa vụ tài chính**, giúp Chủ phòng/Admin xem xét và ra quyết định công tâm trước khi tạo khoản đóng quỹ.
- **Đóng phiên tự động (Scheduled Close Session):** Tích hợp Route Handler `/api/cron/close-sessions` (Vercel Cron lúc 00:00) kết hợp cơ chế bảo vệ ở tầng đọc (`read-level expiration guard`), đảm bảo phiên họp cũ không bị rò rỉ sang ngày hôm sau ngay cả khi cron job bị hoãn.

### 💰 3. Sổ Quỹ Phòng & Thanh Toán Minh Bạch (Funds & Payments)
- **Tạo khoản đóng quỹ:** Khởi tạo từ danh sách ứng viên vắng mặt hoặc chỉ định bất kỳ thành viên nào với lý do chuẩn hóa (`Đi trễ`, `Bận nhưng chưa xin phép`, `Khác`) và số tiền số nguyên (VND integer, không dùng số thực/floating point).
- **Mã QR Ngân Hàng Tích Hợp:** Tải lên và hiển thị trực quan ảnh mã QR/thông tin tài khoản nhận tiền của từng phòng họp (lưu trữ trên Supabase Storage).
- **Xác nhận thanh toán 2 chiều (Confirm / Revert):** Chủ phòng hoặc Admin xác nhận khoản tiền đã nhận; hỗ trợ hoàn tác giao dịch nếu có sai sót, toàn bộ hành động đều được ghi vết vào `audit_logs`.
- **Ràng buộc khi xóa thành viên:** Xóa thành viên vẫn còn nợ quỹ bắt buộc phải nhập chính xác chuỗi xác thực tiếng Anh: `I agree to remove this user`.

### 🛡️ 4. Bảng Điều Khiển Quản Trị Hệ Thống (Admin Console — Settings)
- **Giám sát toàn diện:** Quản lý toàn bộ danh sách người dùng, phòng họp hoạt động và dữ liệu lưu trữ.
- **Xóa mềm người dùng (Soft-Delete User):** Khi Admin xóa mềm tài khoản (yêu cầu gõ chuỗi xác thực `Archive this user`), hệ thống bắt buộc thực hiện chuyển giao quyền sở hữu tất cả các phòng người đó đang làm chủ sang cho một Admin tiếp nhận trước khi vô hiệu hóa tài khoản.
- **Khôi phục tài khoản (Restore User):** Cho phép kích hoạt lại các tài khoản đã bị lưu trữ.
- **Bảo vệ truy cập:** Tài khoản ở trạng thái `soft_deleted` sẽ bị chặn truy cập hoàn toàn và hiển thị thông báo hỗ trợ trung lập.

### 🔄 5. Trải Nghiệm Đồng Bộ Thời Gian Thực (Realtime Experience)
- Tích hợp **Supabase Realtime Channels** đa bảng (`rooms`, `room_memberships`, `join_requests`, `meeting_sessions`, `attendance_records`, `fund_contributions`, `payments`, `users`).
- Cơ chế gom nhóm sự kiện (Debouncing bursts) giúp giao diện cập nhật mượt mà tức thì khi có biến động về điểm danh, thành viên hoặc quỹ mà không gây nghẽn hiệu năng.

### 🔀 6. Chế Độ Kép Linh Hoạt (Dual-Mode Authentication)
- **Chế độ Giả lập (`NEXT_PUBLIC_ALLOW_MOCK_AUTH=true`):** Bật thanh chuyển đổi nhanh giữa 4 vai trò (Khách, Thành viên, Chủ phòng, Quản trị viên) phục vụ kiểm thử giao diện và phát triển offline mà không phụ thuộc kết nối Internet.
- **Chế độ Thực tế (`NEXT_PUBLIC_ALLOW_MOCK_AUTH=false`):** Tự động kích hoạt toàn bộ luồng Auth0 OIDC chuẩn (`/auth/login`, `/auth/logout`, `/auth/callback`), mã hóa session cookie phía server (BFF Pattern) và đồng bộ user vào database.

---

## 2. Ngăn Xếp Công Nghệ (Tech Stack)

| Lĩnh vực | Công nghệ | Phiên bản | Vai trò & Lý do lựa chọn |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.3.5` | React Server Components, Route Handlers, Turbopack compile siêu tốc |
| **Core UI** | React / React DOM | `19.2.8` | Nền tảng render giao diện khai báo hiện đại |
| **Styling** | Tailwind CSS | `v4` | Hệ thống styling linh hoạt, cấu hình theo chuẩn thiết kế |
| **Design System** | 8-Point Grid Spacing | Custom | Mọi kích thước và khoảng cách là bội số của 8 (8, 16, 24, 32, 48px) |
| **Icon Set** | Hugeicons React | `^1.1.10` | Bộ icon vector chuyên nghiệp, sắc nét và đồng bộ |
| **Xác thực (Auth)** | `@auth0/nextjs-auth0` | `^4.30.0` | Quản lý phiên server-side, bảo vệ route, phân quyền RBAC |
| **Cơ sở dữ liệu** | Supabase PostgreSQL | Latest | Lưu trữ quan hệ ACID, hỗ trợ Row Level Security (RLS) |
| **Realtime** | Supabase Realtime | Latest | Kênh Broadcast lắng nghe sự thay đổi dữ liệu thời gian thực |
| **Lưu trữ file** | Supabase Storage | Latest | Quản lý và cung cấp URL cho ảnh mã QR chuyển khoản |
| **Kiểm thử** | Node.js Test Runner | Native | Thực thi unit tests độc lập, tốc độ cực cao, không cần thư viện nặng |
| **CI / CD** | GitHub Actions | v4 | Tự động hóa kiểm tra Lint, Typecheck, Unit Test và Build |

---

## 3. Kiến Trúc Hệ Thống (Architecture)

Dự án áp dụng chặt chẽ mô hình **Clean Architecture** và **Domain-Driven Design (DDD)** nhằm đảm bảo tính độc lập, dễ bảo trì và kiểm thử:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Presentation Layer                  │
│       (Pages, Layouts, Server Components, Modals, Tabs)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Application / Use Cases                  │
│   (Room Commands, Attendance Actions, Fund Calculations)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     Domain Entity & Ports                   │
│   (Entities, State Rules, Repository Interfaces, Policies)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Infrastructure Adapters                    │
│   (Supabase Repositories, Auth0 Client, Realtime Hooks)     │
└─────────────────────────────────────────────────────────────┘
```

- **Nguyên tắc ranh giới:** Tầng giao diện và Route Handlers chỉ tương tác thông qua Repository Interfaces. Mã nguồn nghiệp vụ không phụ thuộc trực tiếp vào SDK của bên thứ ba.
- **Bảo mật RLS đa tầng:** Bên cạnh việc kiểm tra quyền hạn ở tầng server (Next.js), Supabase PostgreSQL áp dụng chính sách **Row Level Security (RLS)** làm lớp bảo vệ phòng thủ chiều sâu (Defense-in-Depth).

---

## 4. Phân Quyền & Vai Trò (Roles & RBAC)

Hệ thống phân định rạch ròi giữa **Global Identity Role** (Auth0 quản lý) và **Resource Ownership** (Database quản lý):

```
                       ┌─────────────────────────┐
                       │  Auth0 Identity Server  │
                       └────────────┬────────────┘
                                    │ Custom Claim: https://diemdanh.cmdn/role
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          ┌──────────────┐                    ┌──────────────┐
          │    admin     │                    │     user     │
          └───────┬──────┘                    └───────┬──────┘
                  │                                   │ Có thể tạo phòng
                  ▼                                   ▼
        Quản trị toàn hệ thống               ┌───────────────────┐
        Có mọi quyền Owner                   │    Room Owner     │ (Resource-level)
                                             └───────────────────┘
```

| Vai trò | Phạm vi quản lý | Quyền hạn chi tiết |
| :--- | :--- | :--- |
| **User** | Toàn cục | Xem danh sách phòng họp công khai, xin vào phòng riêng tư, tự điểm danh, theo dõi và xem thông tin nộp quỹ cá nhân. |
| **Owner** | Cấp phòng họp (`room.owner_id === user.id`) | Toàn quyền cấu hình phòng, phê duyệt thành viên, điều chỉnh điểm danh, lập quỹ, xác nhận tiền chuyển khoản, tải ảnh QR, lưu trữ hoặc chuyển quyền phòng. |
| **Admin** | Cấp hệ thống (Toàn cục) | Sở hữu tất cả quyền hạn của Chủ phòng trên mọi phòng họp; quản lý danh sách người dùng, xóa mềm tài khoản và khôi phục phòng họp/người dùng đã lưu trữ. |

---

## 5. Cấu Trúc Thư Mục (Project Structure)

```text
DiemDanhCMDN/
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.yml    # Form mẫu Pull Request theo chuẩn git-pr-workflow
│   ├── pull_request_template.md     # Template PR Markdown hiển thị trên GitHub Web
│   └── workflows/
│       ├── ci.yml                   # Pipeline GitHub Actions (Lint, Typecheck, Test, Build)
│       └── pr-check.yml             # Action tự động kiểm tra định dạng tiêu đề PR [TYPE]
├── docs/                            # Single Source of Truth (Tài liệu nghiệp vụ & kiến trúc)
├── enhancement/                     # Tài liệu theo dõi các cải tiến hệ thống theo chuẩn
├── src/
│   ├── app/                         # Next.js App Router (Thin route layer)
│   │   ├── api/cron/close-sessions/ # Route Handler đóng phiên họp tự động
│   │   ├── funds/                   # Trang quản lý quỹ cá nhân (/funds)
│   │   ├── meeting/[roomId]/        # Trang chi tiết phòng họp & điểm danh (/meeting/[id])
│   │   ├── my-rooms/                # Trang danh sách phòng của tôi (/my-rooms)
│   │   ├── settings/                # Trang quản trị hệ thống (/settings - Admin only)
│   │   ├── layout.tsx               # Root Layout bao bọc Auth & Header
│   │   └── page.tsx                 # Trang chủ hiển thị phòng họp bento grid (/)
│   ├── components/layout/           # Các component bố cục (PageContainer, AppHeader, Banner)
│   ├── context/                     # Auth Context hỗ trợ chế độ kép (Mock & Auth0)
│   ├── lib/                         # Cấu hình singleton (Auth0, Supabase Client & Server)
│   ├── modules/                     # Modules nghiệp vụ (Clean Architecture)
│   │   ├── admin/                   # Quản lý người dùng, audit log, cài đặt hệ thống
│   │   ├── funds/                   # Quản lý nghĩa vụ đóng quỹ, thanh toán, ảnh QR
│   │   ├── meetings/                # Phiên họp, quy trình điểm danh, ứng viên đóng quỹ
│   │   └── rooms/                   # Không gian phòng họp, thành viên, yêu cầu tham gia
│   └── types/                       # Định nghĩa TypeScript Domain Entities & Database
├── supabase/
│   └── migrations/                  # 5 bản migration SQL (Schema, RLS, Seed, Storage, Realtime)
└── tests/
    └── unit/                        # 46 test cases kiểm thử logic nghiệp vụ & realtime
```

---

## 6. Hướng Dẫn Cài Đặt (Getting Started)

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản `>= 20.x`
- **pnpm**: Phiên bản `^11.19.0` (Khuyến nghị dùng Corepack: `corepack enable`)

### 1. Khởi tạo mã nguồn và cài đặt dependencies
```bash
git clone <repository-url>
cd DiemDanhCMDN
pnpm install
```

### 2. Cấu hình biến môi trường
Sao chép file mẫu và điền các thông tin kết nối Supabase và Auth0:
```bash
cp .env.example .env.local
```

Nội dung `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=payment-images

# Auth0 Configuration
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_SECRET=your-64-character-hex-secret

# Chế độ xác thực: "true" để chạy Mock nội bộ, "false" để dùng Auth0 thật
NEXT_PUBLIC_ALLOW_MOCK_AUTH=false

# (Tùy chọn) Khóa bảo vệ Endpoint Cron đóng phiên họp tự động
CRON_SECRET=your-secure-cron-secret
```

### 3. Cập nhật Cơ sở dữ liệu Supabase
Chạy tuần tự các script SQL trong thư mục `supabase/migrations/` trên Supabase SQL Editor:
1. `20260919000001_initial_schema.sql` (Cấu trúc bảng và chỉ mục)
2. `20260919000002_rls_policies.sql` (Kích hoạt Row Level Security)
3. `20260919000003_seed_data.sql` (Dữ liệu mẫu kiểm thử)
4. `20260919000004_storage_setup.sql` (Storage Bucket cho mã QR)
5. `20260919000005_realtime_setup.sql` (Kích hoạt Realtime Publication)

### 4. Khởi động môi trường phát triển
```bash
pnpm dev
```
Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000).

---

## 7. Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance)

Dự án duy trì bộ kiểm thử tự động toàn diện, không phụ thuộc mạng ngoài, đảm bảo tính toàn vẹn của logic nghiệp vụ:

```bash
# Chạy toàn bộ 46 Unit Tests
pnpm test

# Kiểm tra an toàn kiểu dữ liệu TypeScript
pnpm exec tsc --noEmit

# Kiểm tra chuẩn cú pháp và quy tắc React 19
pnpm run lint

# Thực hiện build production với Turbopack
pnpm run build
```

### 📊 Báo Cáo Kiểm Thử (Test Suites Breakdown)
- **Auth0 Integration & Onboarding Sync (13 tests):** Xác thực trích xuất claim role, đồng bộ database, chặn tài khoản `soft_deleted`, chuyển đổi cờ `NEXT_PUBLIC_ALLOW_MOCK_AUTH`.
- **Scheduled Close Session Flow (7 tests):** Kiểm tra cơ chế chặn phiên quá hạn ở tầng đọc (`read-level expiration guard`), bộ đóng hàng loạt (`closeExpiredSessions`) và bảo mật Cron Route.
- **Fund Payment & Revert Actions (4 tests):** Máy trạng thái chuyển đổi giữa `outstanding` $\leftrightarrow$ `paid`, xác thực hoàn tác và ghi nhận audit log.
- **Realtime State & Edge Cases (18 tests):** Lắng nghe đa bảng, kiểm tra thành viên bị kick, hủy yêu cầu tham gia, tính toán số lượng thành viên và xử lý ngắt kết nối kênh mạng.
- **User Realtime Flow (4 tests):** Đồng bộ hóa tức thì các khoản quỹ riêng của từng cá nhân.

---

## 8. Quy Chuẩn Kỹ Thuật (Engineering Conventions)

Mọi đóng góp mã nguồn cho dự án bắt buộc tuân thủ 3 nguyên tắc nền tảng:

1. **`zhon-conventions`:**
   - Tách biệt logic xử lý ra khỏi JSX (JSX thuần túy khai báo, không lồng hàm xử lý mảng phức tạp).
   - Không lồng toán tử 3 ngôi (No nested ternaries).
   - Sử dụng Semantic HTML chuẩn (Mỗi trang chỉ có đúng 1 thẻ `<main>`, sử dụng đúng `nav`, `section`, `article`, `header`).
2. **`8pt-grid-spacing`:**
   - 100% các giá trị đo lường (`padding`, `margin`, `gap`, `border-radius`, kích thước nút chạm) bắt buộc là bội số của 8 (8, 16, 24, 32, 40, 48px).
   - Tuân thủ luật bất biến $\text{Internal Spacing} \le \text{External Spacing}$ và tỉ lệ lân cận Gestalt $\text{Proximity Ratio} \ge 2:1$.
   - Toàn bộ các trang và thanh điều hướng đồng bộ chuẩn container: `max-w-7xl px-6`.
3. **`git-pr-workflow`:**
   - Nhánh phát triển: `develop` $\to$ Nhánh phát hành: `main`.
   - Tiêu đề commit và PR bắt buộc tuân thủ tiền tố: `[FEAT]`, `[FIX]`, `[ENHANCE]`, `[REFACTOR]`, hoặc `[CHORE]`.
   - Mọi cải tiến hệ thống đều được lưu trữ tài liệu trong thư mục `enhancement/`.
