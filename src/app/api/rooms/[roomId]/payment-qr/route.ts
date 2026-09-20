import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupabaseRoomPaymentImageRepository } from "@/modules/funds/infrastructure/supabase-fund-repository";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ roomId: string }> }
) {
  try {
    const params = await props.params;
    const roomId = params?.roomId;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã định danh phòng họp." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const actorId = formData.get("actorId") as string | null;

    if (!file || !actorId) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp tệp ảnh và thông tin người dùng." },
        { status: 400 }
      );
    }

    // 1. Validate File MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Định dạng tệp không được hỗ trợ (${file.type}). Chỉ chấp nhận JPEG, PNG, WebP.`,
        },
        { status: 400 }
      );
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Dung lượng tệp vượt quá giới hạn 5 MB." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 3. Check Room Existence and Owner
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, owner_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy phòng họp tương ứng." },
        { status: 404 }
      );
    }

    // 4. Check Actor Role
    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", actorId)
      .single();

    const isOwner = room.owner_id === actorId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Chỉ Chủ phòng hoặc Quản trị viên mới có quyền cập nhật mã QR." },
        { status: 403 }
      );
    }

    // 5. Upload via Server Repository with service_role
    const repo = new SupabaseRoomPaymentImageRepository(supabase);
    const result = await repo.uploadAndLinkImage(
      roomId,
      file,
      file.type,
      file.size,
      actorId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Lỗi xử lý upload mã QR thanh toán:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ roomId: string }> }
) {
  try {
    const params = await props.params;
    const roomId = params?.roomId;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã định danh phòng họp." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get("actorId");

    if (!actorId) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin người thực hiện." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 1. Check Room Existence and Owner
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, owner_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy phòng họp tương ứng." },
        { status: 404 }
      );
    }

    // 2. Check Actor Role
    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", actorId)
      .single();

    const isOwner = room.owner_id === actorId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Chỉ Chủ phòng hoặc Quản trị viên mới có quyền xóa mã QR." },
        { status: 403 }
      );
    }

    // 3. Remove via Server Repository with service_role
    const repo = new SupabaseRoomPaymentImageRepository(supabase);
    await repo.remove(roomId, actorId);

    return NextResponse.json({
      success: true,
      message: "Đã xóa mã QR thanh toán thành công.",
    });
  } catch (error: unknown) {
    console.error("Lỗi xóa mã QR thanh toán:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
