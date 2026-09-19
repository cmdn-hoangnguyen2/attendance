"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Upload01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  QrCode01Icon,
} from "@hugeicons/core-free-icons";

export interface UploadPaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  currentImageUrl?: string | null;
  onUploadSuccess: (newUrl: string) => void;
  onDeleteSuccess: () => void;
  uploadHandler: (file: File) => Promise<{ storagePath: string; signedUrl: string }>;
  deleteHandler: () => Promise<void>;
}

export function UploadPaymentQrModal({
  isOpen,
  onClose,
  roomName,
  currentImageUrl,
  onUploadSuccess,
  onDeleteSuccess,
  uploadHandler,
  deleteHandler,
}: UploadPaymentQrModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    if (isUploading || isDeleting) return;
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setErrorMsg(null);
    setIsUploading(false);
    setIsDeleting(false);
    onClose();
  };

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading && !isDeleting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUploading, isDeleting, previewUrl]);

  // Clean up preview object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Định dạng không được hỗ trợ. Chỉ chấp nhận ảnh PNG, JPEG hoặc WebP.");
      return;
    }

    if (file.size > 5242880) {
      setErrorMsg("Dung lượng tệp vượt quá 5 MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      setErrorMsg("Vui lòng chọn một tệp ảnh QR trước khi lưu.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const result = await uploadHandler(selectedFile);
      onUploadSuccess(result.signedUrl);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải ảnh lên.";
      setErrorMsg(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã QR thanh toán của phòng họp này?")) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteHandler();
      onDeleteSuccess();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa ảnh QR.";
      setErrorMsg(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-qr-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#C9F2E3] bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header (24px padding internal) */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#05966B]">
              <HugeiconsIcon icon={QrCode01Icon} size={20} />
            </div>
            <div>
              <h2 id="upload-qr-title" className="text-base font-bold text-[#0B1F1A]">
                Mã QR Thanh Toán Phòng
              </h2>
              <p className="text-xs text-[#4B665D] line-clamp-1">{roomName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading || isDeleting}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-50"
            aria-label="Đóng cửa sổ"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Content Body (Gap 16px internal, margin 16px) */}
        <div className="mt-4 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current or Preview Image Section */}
          {(previewUrl || currentImageUrl) ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 text-center">
              <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
                <Image
                  src={previewUrl || currentImageUrl || ""}
                  alt="Mã QR thanh toán"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4B665D]">
                {previewUrl ? "Ảnh chuẩn bị tải lên" : "Mã QR hiện tại của phòng"}
              </p>
            </div>
          ) : null}

          {/* Upload input button area */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C9F2E3] bg-[#E8FBF4]/20 p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="qr-file-upload-input"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FBF4] text-[#05966B] mb-2">
              <HugeiconsIcon icon={Upload01Icon} size={24} />
            </div>

            <label
              htmlFor="qr-file-upload-input"
              className="cursor-pointer rounded-xl bg-[#05966B] px-4 py-2 text-xs font-bold text-white hover:bg-[#047a55] transition-colors shadow-2xs"
            >
              {previewUrl || currentImageUrl ? "Chọn ảnh khác" : "Chọn ảnh QR từ máy"}
            </label>

            <p className="mt-2 text-[11px] text-[#4B665D]">
              Định dạng PNG, JPEG, WebP. Dung lượng tối đa 5 MB.
            </p>
          </div>
        </div>

        {/* Action Footer (Margin top 24px) */}
        <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
          <div>
            {currentImageUrl && !previewUrl && (
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={isDeleting || isUploading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                <span>{isDeleting ? "Đang xóa..." : "Xóa mã QR"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading || isDeleting}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Đóng
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading || isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#05966B] px-4 py-2 text-xs font-bold text-white hover:bg-[#047a55] transition-colors shadow-2xs disabled:opacity-50"
              >
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                <span>{isUploading ? "Đang tải lên..." : "Lưu mã QR"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
