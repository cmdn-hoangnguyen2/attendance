# Project Agent Team Configuration

## 1. Thời gian

- Ngày: 2026-10-01 (Asia/Ho_Chi_Minh).
- BOSS đã duyệt thiết kế trong chat: bốn profiles, routing theo milestone,
  Challenger read-only; không thay application code hoặc global config.
- Trạng thái: đã ghi sáu files, static verification và independent scoped review PASS;
  runtime activation vẫn pending như mục dưới.

## 2. Feature

- Scout: gpt-5.6-sol/high; Architect: gpt-6-astra/high.
- Builder: gpt-6.1-sol/high; Challenger: gpt-6-astra/medium.
- Chỉ Builder sửa implementation; controller giữ Git/shared files/infrastructure.

## 3. Lý do change

- Tránh chạy lại reconnaissance/planning cho các task đã có contract được duyệt.
- Ngăn reviewer tự sửa code và writer conflicts.
- Child patch calls từng bị kẹt; cần artifacts, bounded handoff và pending-tool
  recovery thay vì coi trạng thái running là tiến độ.

## 4. Cách thức change

- Tạo standalone project profiles trong .codex/agents/, không đổi global defaults.
- Dùng docs/operations/agent-team.md làm workflow chung.
- Scope mỗi dispatch là một milestone; Scout/Architect chỉ chạy khi cần.
- Model IDs và effort được đối chiếu catalog bundled của Codex CLI 0.159.2.
- Challenger có spec/quality verdict; PASS không thay thế runtime acceptance.
- Không thêm nickname_candidates, dependency, secrets hoặc quyền vượt sandbox.
- Existing agents không được coi là đã đổi model; activation phải kiểm chứng riêng.

## 5. Scope ảnh hưởng

- .codex/agents/scout.toml
- .codex/agents/architect.toml
- .codex/agents/builder.toml
- .codex/agents/challenger.toml
- docs/operations/agent-team.md
- enhancement/2026-10-01-project-agent-team.md
- Không sửa UI, business handlers, repositories, tests, migrations hoặc .env.
- Các thay đổi B2-M1 profile provisioning đang có được giữ nguyên.

## 6. Lợi ích

- File ownership rõ; review độc lập; không planning lại A-H.
- Handoff nhỏ và có bằng chứng; không giả lập thành công khi thiếu runtime gates.
- Model/effort theo vai trò mà BOSS đã chọn, không ảnh hưởng project khác.

## Verification

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
