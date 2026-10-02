# Project Agent Team Configuration

## 1. Thời gian

- Ngày: 2026-10-01 (Asia/Ho_Chi_Minh).
- Update cost-optimized đã được BOSS duyệt ngày 2026-10-01: ordinary Sol Medium,
  risk-specific effort/review và explicit logged availability fallback.
- BOSS đã duyệt thiết kế trong chat: bốn profiles, routing theo milestone,
  Challenger read-only; cập nhật mới: ba Sol writers và một reviewer-coordinator.
  Không thay application code hoặc global config.
- Trạng thái ban đầu: sáu files, static verification và independent scoped review PASS.
  Update trước đã có static verification/review riêng. Update cost-optimized cần
  static verification/review mới; runtime activation vẫn pending, không claim
  existing agents đã đổi model hoặc effort.

## 2. Feature

- Scout: gpt-5.6-sol/high; Architect: gpt-6-astra/high.
- Builder ordinary: gpt-6.1-sol/medium; Challenger ordinary: gpt-6.1-sol/medium.
- Auth/RLS/financial/races: explicit Builder Sol High, independent Astra Medium
  review khi available. Nếu Astra usage unavailable, controller fresh-dispatch
  independent Sol High review và log task ID/reason/actual model/effort.
- Ba code writers dùng Builder theo risk routing, chỉ chạy song song khi disjoint
  files và load-bearing dependencies đã được chấp nhận.
- Một Challenger theo risk routing review độc lập và đề xuất phân phối task:
  task ID, writer, owned files, dependencies, checks, stop point và blockers.
  Controller xác nhận/dispatch; giữ Git/shared files/infrastructure.
- Harness hiện tại chỉ cho ba active children cộng controller: authoring batch tối
  đa ba writers; handoff nhường slot cho reviewer, hoặc hai writers + reviewer.
  Không claim bốn workers đồng thời và không đổi global cap để vượt runtime limit.
- Ngoại lệ Astra Medium endpoint writer trước đây được BOSS cho phép sau actual
  thread limit nay hết hiệu lực cho task mới. Giữ nguyên lịch sử model/report;
  không đổi existing agent bằng follow-up hoặc fallback Astra khi Sol không tạo được.

## 3. Lý do change

- Tránh chạy lại reconnaissance/planning cho các task đã có contract được duyệt.
- Ngăn reviewer tự sửa code và writer conflicts.
- Child patch calls từng bị kẹt; cần artifacts, bounded handoff và pending-tool
  recovery thay vì coi trạng thái running là tiến độ.
- BOSS chọn giảm effort mặc định cho ordinary slices, giữ effort/review cao hơn
  cho security, financial và concurrency risk; không có formal cost estimate.

## 4. Cách thức change

- Tạo standalone project profiles trong .codex/agents/, không đổi global defaults.
- Dùng docs/operations/agent-team.md làm workflow chung.
- Scope mỗi dispatch là một milestone; Scout/Architect chỉ chạy khi cần.
- Reviewer ưu tiên frozen diff/fix round trước task queue mới; không tự sửa code,
  spawn worker hoặc mở rộng approved plan. Writers dùng chung một Builder profile.
- Model IDs và effort được đối chiếu catalog bundled của Codex CLI 0.159.2.
- Challenger có spec/quality verdict; PASS không thay thế runtime acceptance.
- Không thêm nickname_candidates, dependency, secrets hoặc quyền vượt sandbox.
- Existing agents không được coi là đã đổi model; activation phải kiểm chứng riêng.
- Checkpoint/artifact ít nhất mỗi ba phút khi tools permit; reuse bounded worker
  cho related slices khi ownership và independence phù hợp. Model/effort change
  bắt buộc fresh supported dispatch; không chạy lại full suite unchanged vô cớ.

## 5. Scope ảnh hưởng

- .codex/agents/scout.toml
- .codex/agents/architect.toml
- .codex/agents/builder.toml
- .codex/agents/challenger.toml
- docs/operations/agent-team.md
- enhancement/2026-10-01-project-agent-team.md
- Không sửa UI, business handlers, repositories, tests, migrations hoặc .env.
- Update hiện tại đồng bộ thêm routing trong master plan và ignored B execution ledger.
- Giữ nguyên tất cả application checkpoints đã có, bao gồm endpoint 138dda5.
- Cost-optimized update chỉ sửa builder/challenger profiles, workflow, role paragraph
  trong docs/superpowers/plans/2026-09-30-mvp-hardening.md và tài liệu này;
  Scout/Architect profiles giữ nguyên. Controller cập nhật ignored ledger riêng.

## 6. Lợi ích

- File ownership rõ; review độc lập; không planning lại A-H.
- Handoff nhỏ và có bằng chứng; không giả lập thành công khi thiếu runtime gates.
- Mục tiêu giảm chờ authoring/review; chưa có benchmark chứng minh tăng tốc.
- Model/effort theo vai trò mà BOSS đã chọn, không ảnh hưởng project khác.
- Ordinary slices dùng effort thấp hơn theo phê duyệt; không claim measured savings,
  pricing hoặc benchmark. Giữ nguyên MVP/UI dependencies và security gates.

## Verification

### Cost-optimized update

- Pending: parse hai profiles, exact schema/model/effort/sandbox, scoped diff checks
  và independent review trên update mới. Historical PASS dưới đây chỉ áp dụng
  cho revision trước; không chứng minh cost-optimized revision đã verified.
- Pending: fresh compatible runtime dispatch/model assignment; không đổi old agents.

### Update ba writers + reviewer-coordinator

- PASS mới: tomllib parse bốn profiles; exact sáu fields, model/effort/sandbox mappings,
  nonempty instructions/common workflow link; mandatory Sol writer và read-only
  reviewer TASK_QUEUE/controller-dispatch assertions. Không thêm quyền hay config keys.
- PASS mới: git diff --check; root đọc scoped diff, chỉ năm tracked config/docs files.
- PASS mới: independent /root/challenger_b2_token SPEC_VERDICT/QUALITY_VERDICT/PASS
  cho năm files; không có concrete finding, không sửa file hoặc chạy lại app tests.
- Không dispatch task application trong update này. Live Sol allocation/TOML activation
  chưa được kiểm chứng mới; không thay model của agent cũ hoặc chứng minh tăng tốc.

### Cấu hình ban đầu (historical evidence)

- PASS: Python 3.13.7 tomllib parse cả bốn profiles; exact sáu fields, names,
  model/effort/sandbox mappings, nonempty instructions và common workflow references.
- PASS: Codex CLI 0.159.2 bundled model catalog có ba model IDs và các effort được chọn.
- PASS: git diff --check và git diff --no-index --check cho từng sáu file mới.
- PASS: independent scoped Challenger review (fresh explicit gpt-6-astra/medium
  dispatch) có SPEC_VERDICT/QUALITY_VERDICT PASS; không có BLOCKER/HIGH/MEDIUM.
  LOW stale-verification note đã được cập nhật tại đây. Reviewer không sửa files.
- Pending: runtime discovery/live model assignment in a compatible fresh session.
- Review dispatch trên dùng explicit model/effort + role prompt vì tool hiện tại
  không có agent_type; không phải bằng chứng auto-load TOML/sandbox của profile.
- Không chạy lại application unit/build vì scope chỉ là config/docs; không claim
  kiểm thử mới cho B2 hoặc hoàn thành MVP. Chưa push/deploy hoặc đổi old agents.
