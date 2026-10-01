# MVP Production Hardening

## 1. Thời gian

- Bắt đầu: 2026-09-30 (Asia/Ho_Chi_Minh)
- Trạng thái: Architectural spec và implementation plans A-H được BOSS duyệt; Package A đã qua local reset/database verification, B1 đang chốt implementation/review; chưa đóng toàn bộ package hoặc claim runtime acceptance.

## 2. Feature

- Audit toàn bộ redesign Tasks 1-7 để tìm missing feature, behavior, realtime, component state và mock data.
- Loại bỏ runtime mock data và mock authentication.
- Reset dữ liệu local/linked development, không migrate records cũ.
- Hoàn thiện Auth0, Supabase RLS, command boundary, transaction, realtime, notification, Storage và test coverage.
- Chỉ sửa UI khi cần cho contrast, accessibility hoặc behavior thật; không thực hiện redesign lần hai.

## 3. Lý do change

- UI regression suite hiện tại pass nhưng chưa chứng minh các flow chạy end to end với Backend thật.
- Runtime còn mock auth, mock invite users, mock peer debts, seed data và placeholder/no-op behavior.
- Auth0 identity chưa được nối rõ vào Supabase RLS; policy đọc/ghi hiện tại có nguy cơ vừa overexpose read vừa reject browser mutation.
- Một số multi-record mutation chưa atomic; payment revert xung đột với append-only database trigger.
- Realtime, notification, conflict, reconnect, error và permission states chưa có coverage đầy đủ.

## 4. Cách thức change

- Dùng `docs/superpowers/specs/2026-09-30-mvp-production-hardening-design.md` làm architectural source of truth.
- Khóa destructive reset bằng environment/project-reference guard; chỉ chạy trên target non-production đã được chứng minh.
- Giữ schema reproducible, reset không seed và tạo dữ liệu mới qua authenticated product flows.
- Dùng Auth0 third-party token cho Supabase RLS-protected read/realtime; dùng server command hoặc transactional function cho privileged/multi-record mutations.
- Realtime đóng vai trò invalidation signal và refetch authoritative state; Presence không dùng cho authorization.
- Master plan: `docs/superpowers/plans/2026-09-30-mvp-hardening.md`.
- Các implementation plans A-H có target files, interfaces, failing-test cases, implementation steps, verification và acceptance gates.
- Execution: BOSS chuyển sang coordinated subagents ngày 2026-10-01; tiếp tục trong worktree `codex/ui-ux-redesign`, Native browser verification.
- A1/A2/A3 có exclusive file ownership; controller giữ shared files, Git commits, infrastructure và destructive reset. Review và dependency gates không bị bỏ qua khi chạy song song.
- BOSS yêu cầu milestone nhỏ: M1 helpers/tests, M2 integration/RLS, M3 real-token runtime. Child patch calls bị kẹt hơn 5 phút (một call chờ escalation), không lưu source; controller ngắt và chuyển sang controller áp dụng worker-authored patch, agents review read-only. Không bypass permission, không giao cả package dài.
- M1-profile đã lưu và được hai reviewers duyệt: tránh UPSERT profile không đổi/archived, chỉ sync safe identity fields; lookup lỗi không bị coi là missing. Focused RED0/5 -> GREEN5/5; fullunit141/141PASS0skipped, TypeScript/scopedlint exit0, được kiểm tra lại ngày2026-10-01 trước checkpoint. SQL/token/realtime/concurrentDB acceptance vẫn pending. UI không đổi.
- M1-profile checkpoint633f443. M1-token thêm `src/lib/supabase/tokenProvider.ts` và `tests/unit/supabase-token-cache.test.mjs`: memory-only cache, expiry buffer60s, deadline10s cả fetch/body, dedup và invalidation khi clear. RED1fail/22skip (module chưa có) -> GREEN23/23,0skip; fullunit164/164, TypeScript/scopedlint0; fresh Challenger Astra6/medium spec/qualityPASS. Native TS import warning LOW được ghi rõ, không đổi package config hay suppress. Endpoint/logout integration và real-token gate chưa xong; UI không đổi, không thêm dependency.
- Zero-mock closure theo dependency: A xóa dead fixtures/seeds, B xóa mock auth, C thay mock invite, F thay mock debt; F/H chạy gate cuối.
- Giữ rule cũ: Channel invite-only, full integer-VND payment, không due date/partial-payment flow.
- Self-review đã khóa shared SQL command signature, Idempotency-Key, transaction lock order, package dependencies, zero-mock gate và audit coverage Tasks 1-7.
- Bổ sung RLS risk: `current_user='postgres'` trong SECURITY DEFINER có thể vượt policy khi function owner là postgres; deployed owner/grants chưa được kiểm tra. A/B phải loại bỏ shortcut này và chứng minh anon writes bị deny.
- Research từ official Supabase/Auth0/WCAG docs được gắn trong owning plans; actual tenant config/CLI/test credentials là execution prerequisites, chưa được claim hoàn tất.
- Preflight: Supabase CLI 2.118.0 đã tải qua `pnpm dlx`, Docker 28.3.0 reachable. CLI xác nhận `db reset --local/--linked --no-seed` và `--project-ref`; chưa chạy reset.
- Guard tests RED: actual guard module chưa tồn tại; regression pre-implementation có 69 pass/1 fail (guard mới), không có skipped tests.
- Remote target chưa đủ evidence: worktree không linked; `.env.local` ở main repo thiếu `APP_ENVIRONMENT`, dev/prod reset refs và DB password. Không suy diễn production exclusion và không reset remote.
- Đang tạo isolated local Supabase test database để kiểm chứng baseline bằng pgTAP; không tác động các OLS containers đang chạy.
- Ngày 2026-10-01, BOSS xác nhận chưa có production project. Guard bổ sung khai báo explicit `PRODUCTION_PROJECT_REF=none`; missing/blank vẫn bị từ chối. Remote link/CLI credentials chưa sẵn sàng.
- Local Supabase API/Auth/Storage/Realtime đã chạy trên 127.0.0.1:54321 với project riêng `diemdanh-mvp-hardening`; read-only manifest đã xác minh target thật và 15 bảng/bucket scope, không in keys.
- Real empty-schema pgTAP RED: 35 assertions, 30 fail đúng vì chưa có business tables/private bucket/publication. Baseline mới được tạo sau bước RED.
- Controller reproduction phát hiện HEAD count trên bảng chưa tồn tại trả 204/count null/error null; GET limit 0 trả PGRST205. Executor đã dùng GET limit 0 và regression bằng installed SDK, được scoped re-review duyệt trước reset.
- Guarded isolated-local reset hoàn tất lúc 2026-09-30T17:57:17Z: 15 business tables có 0 records, bucket `payment-images` private/0 objects; trước reset local chưa có business schema/bucket. Không có bằng chứng remote data đã bị xoá; remote chưa được reset.
- Database GREEN thực tế: `supabase test db tests/database/baseline.test.sql` có 276 assertions PASS trên PostgreSQL 17. Fresh unit suite 135/135 PASS, TypeScript và diff check exit 0.
- Source dead mocks và public demo đã được xoá khỏi working tree, có thể khôi phục từ Git history; canonical `docs/design-system.html` và test doubles được giữ. Runtime scan còn 12 occurrences thuộc B2/C/F/H, không claim zero-mock.
- B1 source được review độc lập và duyệt; native anonymous Home redirect -> login đã xác minh, `/api/me` 401/no-store. Real login/reload/logout/archived HTTP journeys vẫn pending genuine Auth0 sessions. Docs auth được sửa theo subject-only provisioning, không email migration fallback.
- B2 authoring chia ownership SQL/RLS và token/client; controller giữ config/types/docs/env/Git/infra. Không triển khai feature package C-G trước khi auth/RLS/command gates đạt.
- Native QA phát hiện Google login button chữ tối trên nền cobalt, contrast normal khoảng 3.03:1 (14px), chưa đạt 4.5:1. Đã ghi H1 để sửa shared primary-button style và kiểm tra đầy đủ states; chưa claim fix.
- A3 preflight follow-up RED5/6 -> GREEN6/6: actual CLI/installed SDK regression chặn HEAD missing-table false-PASS, invalid/null/negative counts; scoped independent review duyệt. Latest combined unit suite136/136PASS,0skip.
- Theo yêu cầu BOSS, dừng riêng `ols-front-webserver` để giải phóng3000; không xoá container/volume, không dừng Docker daemon hoặc container khác. Next preview chuyển3000 theo APP_BASE_URL có sẵn; callback Auth0 thật và hardreload thành công, localDB có1activeprofile không trùng. Port3100 callback mismatch không được khắc phục bằng mock hay tenantchange.
- Checkpoint A `cc282f2`, B1 `44a2a4f`, chưa push. Native logout qua sidebar và Home về login đã xác minh. B1 lint0errors/4pre-existingwarnings Home/Meeting; giữ nguyên để owning feature tasks xử lý.
- B2 chia3ownership: SQL/RLS, token/client, profile provisioning prerequisite. Source B1 luôn UPSERT ở `/api/me` tạo risk vòng users-update -> realtime-refresh -> UPSERT; bổ sung read-first/no-write khi identity không đổi và explicit lookup error. Chưa claim risk này đã xảy ra ở runtime hoặc đã được fix.

## 5. Scope ảnh hưởng

Latest 2026-10-01 bounded M1-SQL: only migration20260930000002_auth_rls.sql and authorization.test.sql, identitydefiner/admininvoker with fixedschema/ACL, no tablegrants/policies. Actual RED64/17fail->GREEN212PASS; postrollback1activegenuineprofile,0testusers/rooms. Independent Challenger spec/qualityPASS. M2endpoint adds route/helper/unit scopedfiles; actualRED39/1fail38skip->GREEN39PASS, fullunit2030skip,tsc/lint0; anonymousHTTP401/crossOrigin403no-store; endpointreview stillpending. NotfullB2/notMVPcompletion; whiteUI unchanged/no newdeps. Two disjointwriters approved; temporaryAstra6Mediumendpointwriter explicitly permitted after actualthreadlimit, permanentmodelconfigunchanged.

- Auth, RLS, migrations, server commands, repositories, realtime hooks, notifications, Storage và feature modules.
- Unit/integration/RLS/realtime/E2E/accessibility/responsive tests.
- Shared UI primitives và route presentation chỉ khi cần sửa functional state, contrast hoặc accessibility.
- Không bao gồm production data reset và không thay đổi lại visual direction Cobalt Commons.

## 6. Lợi ích

- Loại bỏ khoảng cách giữa UI demo và sản phẩm dùng dữ liệu thật.
- Giảm rủi ro data leak, rejected mutation, duplicate financial effect và inconsistent concurrent state.
- Có feature inventory, realtime matrix, conflict rules và acceptance gates rõ ràng cho MVP.
- Cho phép triển khai theo package nhỏ, review được và có rollback boundary rõ ràng.
