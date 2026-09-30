"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  QrCode01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

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
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMsg(null);
    setIsUploading(false);
    setIsDeleting(false);
    onClose();
  };

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = event.target.files;
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
    setPreviewUrl(URL.createObjectURL(file));
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
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải ảnh lên.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã QR thanh toán của phòng họp này?")) return;

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteHandler();
      onDeleteSuccess();
      handleClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa ảnh QR.");
    } finally {
      setIsDeleting(false);
    }
  };

  const footer = (
    <div className="UploadPaymentQrModal__actions flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="UploadPaymentQrModal__delete-action">
        {currentImageUrl && !previewUrl ? (
          <Button variant="ghost" size="compact" onClick={handleDeleteImage} disabled={isDeleting || isUploading}>
            <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden />
            {isDeleting ? "Đang xóa..." : "Xóa mã QR"}
          </Button>
        ) : null}
      </div>
      <div className="UploadPaymentQrModal__primary-actions grid grid-cols-1 gap-2 sm:flex">
        <Button variant="secondary" size="touch" onClick={handleClose} disabled={isUploading || isDeleting}>Đóng</Button>
        {previewUrl ? (
          <Button size="touch" onClick={handleConfirmUpload} disabled={isUploading || isDeleting}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} aria-hidden />
            {isUploading ? "Đang tải lên..." : "Lưu mã QR"}
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="upload-qr-title"
      preventClose={isUploading || isDeleting}
      size="sm"
      footer={footer}
    >
      <div className="UploadPaymentQrModal ui-section-stack">
        <div className="UploadPaymentQrModal__heading flex items-start gap-4">
          <span className="UploadPaymentQrModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={QrCode01Icon} size={24} aria-hidden />
          </span>
          <div className="UploadPaymentQrModal__heading-copy min-w-0">
            <h2 id="upload-qr-title" className="UploadPaymentQrModal__title text-xl font-bold text-text-primary">Mã QR thanh toán phòng</h2>
            <p className="UploadPaymentQrModal__room-name mt-2 truncate text-sm text-text-secondary">{roomName}</p>
          </div>
          <Button className="UploadPaymentQrModal__close shrink-0 px-2" variant="ghost" autoFocus aria-label="Đóng cửa sổ" onClick={handleClose} disabled={isUploading || isDeleting}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </Button>
        </div>

        {errorMsg ? (
          <div className="UploadPaymentQrModal__error flex items-start gap-2 rounded-lg bg-danger-soft p-4 text-sm leading-6 text-danger" role="alert">
            <HugeiconsIcon className="UploadPaymentQrModal__error-icon mt-1 shrink-0" icon={AlertCircleIcon} size={16} aria-hidden />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {(previewUrl || currentImageUrl) ? (
          <div className="UploadPaymentQrModal__preview flex flex-col items-center bg-surface-subtle p-4 text-center">
            <div className="UploadPaymentQrModal__preview-image relative h-48 w-48 overflow-hidden rounded-md bg-surface">
              <Image src={previewUrl || currentImageUrl || ""} alt="Mã QR thanh toán" fill className="object-contain p-2" unoptimized />
            </div>
            <p className="UploadPaymentQrModal__preview-label mt-2 text-sm text-text-secondary">{previewUrl ? "Ảnh chuẩn bị tải lên" : "Mã QR hiện tại của phòng"}</p>
          </div>
        ) : null}

        <div className="UploadPaymentQrModal__upload flex flex-col items-center bg-surface-subtle p-6 text-center">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" id="qr-file-upload-input" />
          <span className="UploadPaymentQrModal__upload-icon flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={Upload01Icon} size={24} aria-hidden />
          </span>
          <label htmlFor="qr-file-upload-input" className="UploadPaymentQrModal__upload-trigger mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
            {previewUrl || currentImageUrl ? "Chọn ảnh khác" : "Chọn ảnh QR từ máy"}
          </label>
          <p className="UploadPaymentQrModal__upload-help mt-2 text-xs text-text-tertiary">PNG, JPEG hoặc WebP · tối đa 5 MB.</p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
