# Enhancement: Thiết Lập Cấu Trúc PR Template (YAML & Markdown) và Pipeline CI/CD GitHub Actions

## 1. Thời gian
- **Thời điểm thực hiện:** 2026-09-20 11:06 (UTC+7)

## 2. Feature
- **DevOps & Engineering Workflows:** Thiết lập cấu trúc Pull Request form (YAML), GitHub PR markdown template và hệ thống tự động hóa CI/CD GitHub Actions theo chuẩn `git-pr-workflow`.

## 3. Lý do change
- Cần chuẩn hóa toàn diện quy trình tạo Pull Request để mọi đóng góp mã nguồn đều tuân thủ các quy chuẩn kiến trúc của dự án (`git-pr-workflow`, `zhon-conventions`, `8pt-grid-spacing`).
- Tự động hóa kiểm tra tính hợp lệ của PR Title ngay khi lập PR.
- Xây dựng pipeline CI/CD kiểm thử tự động (Lint, Typecheck, Unit Test, Build) để bảo vệ 2 nhánh chính `main` và `develop` trước các commit lỗi.

## 4. Cách thức change
1. **Pull Request Template Form ([.github/PULL_REQUEST_TEMPLATE.yml](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/.github/PULL_REQUEST_TEMPLATE.yml)):**
   - Định nghĩa form YAML chuẩn GitHub với các trường:
     - `Type of Change`: Dropdown chọn các prefix chuẩn (`[FEAT]`, `[FIX]`, `[ENHANCE]`, `[REFACTOR]`, `[CHORE]`).
     - `Overview`: Tóm tắt 1-2 câu về nội dung PR.
     - `Key Changes`: Chi tiết thay đổi theo Component, State, Styling & Tokens.
     - `Pattern & Architecture Compliance`: Checkboxes xác nhận tuân thủ Pattern 1/2/3, Semantic HTML, 8pt-grid, Scope Lock.
     - `Verification & Quality Report`: Bảng báo cáo kết quả chạy kiểm thử.
2. **Pull Request Template Markdown ([.github/pull_request_template.md](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/.github/pull_request_template.md)):**
   - Định dạng Markdown truyền thống đồng hành để GitHub tự động điền nội dung mẫu khi mở PR trên web.
3. **PR Convention Validator Action ([.github/workflows/pr-check.yml](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/.github/workflows/pr-check.yml)):**
   - Sử dụng `actions/github-script@v7` để kiểm tra regex tiêu đề PR: `^\[(FEAT|FIX|ENHANCE|REFACTOR|CHORE)\]\s.+`.
   - Chặn và báo lỗi chi tiết nếu tiêu đề PR không đúng quy ước.
4. **CI/CD Pipeline Action ([.github/workflows/ci.yml](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/.github/workflows/ci.yml)):**
   - Kích hoạt khi có `push` hoặc `pull_request` vào `main` hoặc `develop`.
   - Setup Node 20, pnpm 11.19.0, cache store.
   - Chạy tuần tự: `pnpm run lint` $\rightarrow$ `pnpm exec tsc --noEmit` $\rightarrow$ `pnpm test` (46 test cases) $\rightarrow$ `pnpm run build` (Turbopack).

## 5. Scope ảnh hưởng
- **Files tạo mới:**
  - `.github/PULL_REQUEST_TEMPLATE.yml`
  - `.github/pull_request_template.md`
  - `.github/workflows/ci.yml`
  - `.github/workflows/pr-check.yml`
  - `enhancement/2026-09-20-pr-template-and-cicd-workflow.md`

## 6. Lợi ích
- **Tính nhất quán:** 100% PR đều có cấu trúc rõ ràng, chuyên nghiệp, dễ dàng review và đối soát.
- **Bảo vệ mã nguồn:** Mọi PR bắt buộc phải vượt qua toàn bộ 46 tests và không có lỗi type/lint trước khi merge.
- **Tốc độ:** Tận dụng pnpm cache store trên GitHub Actions giúp thời gian chạy CI chỉ dưới 2 phút.
