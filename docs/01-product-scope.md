# Product scope

## Actors

| Actor | Quyền global | Quyền trong room |
| --- | --- | --- |
| User | Dùng Home, My Rooms, Funds | Tự request/join/leave; tự đổi attendance của mình nếu là member |
| Owner | Như User | Quản lý room mình sở hữu, requests, members, attendance, funds (khoản đóng quỹ), payment confirmation, payment images; archive; transfer ownership |
| Admin | Quản trị toàn app | Có mọi quyền Owner trên mọi room; quản lý users và archived data |

## Screens

| Route | Nội dung |
| --- | --- |
| `/` | Home: active rooms, create room, join/request room |
| `/meeting/[roomId]` | Members và Funds; chỉ room member/owner/admin được vào |
| `/my-rooms` | Rooms owned và rooms joined |
| `/funds` | Fund obligations (nghĩa vụ quỹ) của current user; click mở `Funds` của room |
| `/settings` | Admin-only: rooms, members, soft-deleted users/rooms |
| `/login` | Auth0 entry; onboarding sync sau callback |

## Room access

- **Public:** user trở thành member ngay sau join.
- **Private:** user tạo join request; owner/admin approve hoặc reject. Không có password. Non-members see room name, owner and member count. Requests may be cancelled and resubmitted after rejection; rejection has no reason/history requirement.
- Owner không thể leave. Họ chỉ archive room hoặc transfer ownership cho một active member/user theo rule cần chốt.
- Member leave room không xóa fund records hoặc payment history.

## Explicitly out of scope, unless BOSS bổ sung

- Chat, email notification, recurring meeting schedule, file/image crop, hard delete UI, multi-currency, payment gateway.
