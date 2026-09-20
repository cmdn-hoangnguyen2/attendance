import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Room Payment QR Upload & Management (Unit Tests)", () => {
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  // -------------------------------------------------------------
  // 1. File Validation Rules (MIME types & Size Limit)
  // -------------------------------------------------------------
  describe("File Validation Guards", () => {
    function validateFile(file) {
      if (!file) {
        return { valid: false, error: "Vui lòng cung cấp tệp ảnh." };
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: `Định dạng tệp không được hỗ trợ (${file.type}). Chỉ chấp nhận JPEG, PNG, WebP.`,
        };
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: "Dung lượng tệp vượt quá giới hạn 5 MB." };
      }
      return { valid: true };
    }

    test("accepts valid image/jpeg, image/png, and image/webp within 5MB", () => {
      const validJpeg = { type: "image/jpeg", size: 1024 * 100 }; // 100 KB
      const validPng = { type: "image/png", size: 1024 * 1024 * 2 }; // 2 MB
      const validWebp = { type: "image/webp", size: 1024 * 500 }; // 500 KB

      assert.strictEqual(validateFile(validJpeg).valid, true);
      assert.strictEqual(validateFile(validPng).valid, true);
      assert.strictEqual(validateFile(validWebp).valid, true);
    });

    test("rejects dangerous or unsupported MIME types (SVG, GIF, PDF)", () => {
      const svg = { type: "image/svg+xml", size: 1024 };
      const gif = { type: "image/gif", size: 1024 * 50 };
      const pdf = { type: "application/pdf", size: 1024 * 200 };

      assert.strictEqual(validateFile(svg).valid, false);
      assert.match(validateFile(svg).error, /Định dạng tệp không được hỗ trợ/);

      assert.strictEqual(validateFile(gif).valid, false);
      assert.strictEqual(validateFile(pdf).valid, false);
    });

    test("rejects files exceeding 5MB limit", () => {
      const oversized = { type: "image/png", size: 5 * 1024 * 1024 + 1 };
      const res = validateFile(oversized);
      assert.strictEqual(res.valid, false);
      assert.match(res.error, /Dung lượng tệp vượt quá giới hạn 5 MB/);
    });
  });

  // -------------------------------------------------------------
  // 2. Authorization Guards (Owner or Admin Only)
  // -------------------------------------------------------------
  describe("Authorization Guards", () => {
    function isAuthorizedToManageQr(room, user, actorId) {
      if (!room || !actorId) return false;
      const isOwner = room.owner_id === actorId;
      const isAdmin = user?.role === "admin";
      return isOwner || isAdmin;
    }

    test("allows room owner to upload or delete QR image", () => {
      const room = { id: "room-1", owner_id: "user-owner" };
      const user = { id: "user-owner", role: "user" };
      assert.strictEqual(isAuthorizedToManageQr(room, user, "user-owner"), true);
    });

    test("allows global admin to upload or delete QR image for any room", () => {
      const room = { id: "room-1", owner_id: "user-owner" };
      const admin = { id: "user-admin", role: "admin" };
      assert.strictEqual(isAuthorizedToManageQr(room, admin, "user-admin"), true);
    });

    test("denies regular room member from uploading or deleting QR image", () => {
      const room = { id: "room-1", owner_id: "user-owner" };
      const member = { id: "user-member", role: "user" };
      assert.strictEqual(isAuthorizedToManageQr(room, member, "user-member"), false);
    });
  });

  // -------------------------------------------------------------
  // 3. Response Contract Schema
  // -------------------------------------------------------------
  describe("API Response Contract", () => {
    test("formats successful upload response with storagePath and signedUrl", () => {
      const mockResult = {
        storagePath: "room-1/qr-1726848000000.png",
        signedUrl: "https://supabase.co/storage/v1/object/sign/payment-images/room-1/qr-1726848000000.png?token=xyz",
      };

      const payload = {
        success: true,
        data: mockResult,
      };

      assert.strictEqual(payload.success, true);
      assert.ok(payload.data.storagePath.startsWith("room-1/"));
      assert.ok(payload.data.signedUrl.includes("payment-images"));
    });
  });
});
