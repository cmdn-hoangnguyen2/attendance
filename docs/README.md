# DiemDanhCMDN — Planning Pack

Mục tiêu: tạo app điểm danh và quản lý quỹ cho tối đa khoảng 30 người, trước hết hoàn thành UI responsive bằng mock data, sau đó mới tích hợp server.

## Tài liệu

| File | Nội dung |
| --- | --- |
| [01-product-scope.md](./01-product-scope.md) | Scope, actors và các màn hình |
| [02-architecture.md](./02-architecture.md) | Kiến trúc đề xuất và lựa chọn platform |
| [03-domain-and-states.md](./03-domain-and-states.md) | Domain model, lifecycle và rule nghiệp vụ |
| [04-auth-security.md](./04-auth-security.md) | Auth0, session và authorization |
| [05-realtime.md](./05-realtime.md) | Realtime contract và consistency |
| [06-ui-mock-phase.md](./06-ui-mock-phase.md) | Phase UI-first với mock data |
| [07-api-backend-phase.md](./07-api-backend-phase.md) | Backend clean architecture và API boundary |
| [08-delivery-sequence.md](./08-delivery-sequence.md) | Trình tự delivery cho agent |
| [09-open-questions.md](./09-open-questions.md) | Các quyết định bắt buộc trước khi build |
| [10-references.md](./10-references.md) | Nguồn research chính thức |

## Quyết định tạm thời

- Next.js App Router, TypeScript, Tailwind CSS, `clsx` + `tailwind-merge` qua helper `cn()`.
- Desktop-first, responsive, Inter, 8-point grid, flat UI.
- Auth0 là identity provider và source of truth cho global role `admin`/`user`; database app không phát hành, tự quản lý login token, hoặc override global role.
- Vercel + Supabase là baseline MVP. Chưa chọn Cloudflare làm default vì adapter Next.js Workers hiện khuyến nghị `vinext` và đang beta.
- Supabase Postgres + private Storage + Realtime Broadcast thay Pusher cho MVP 30 người.
- Room và user chỉ soft-delete/archive tại application level. Không có UI hard-delete.

Các mục ghi **Open decision** chưa được phép tự suy diễn thành behavior production.
