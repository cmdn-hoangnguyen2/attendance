"use client";

import { formatVND } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

export interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  ownerName: string;
  amount?: number;
  reason?: string;
  paymentImageUrl?: string | null;
  isRoomArchived?: boolean;
}

export function PaymentInfoModal({
  isOpen, onClose, roomName, ownerName, amount, reason, paymentImageUrl, isRoomArchived,
}: PaymentInfoModalProps) {
  const hasAmount = Boolean(amount && amount > 0);
  const title = hasAmount ? "Thông tin nộp quỹ" : "Mã QR thanh toán phòng";
  const formattedAmount = formatVND(amount ?? 0);
  const qrAlt = `Mã QR thanh toán phòng ${roomName}`;
  const archivedNotice = isRoomArchived ? (
    <p className="PaymentInfoModal__archived rounded-md bg-warning-soft p-4 text-sm leading-6 text-warning">
      Phòng đã được lưu trữ. Khoản quỹ vẫn có thể được thanh toán và xác nhận bởi chủ phòng.
    </p>
  ) : null;
  const reasonContent = reason ? (
    <div className="PaymentInfoModal__detail flex flex-wrap justify-between gap-2">
      <dt className="PaymentInfoModal__label text-text-secondary">Lý do</dt>
      <dd className="PaymentInfoModal__value break-words font-medium">{reason}</dd>
    </div>
  ) : null;
  const amountContent = hasAmount ? (
    <dl className="PaymentInfoModal__details flex flex-col gap-4 rounded-lg bg-surface-subtle p-4 text-sm">
      <div className="PaymentInfoModal__detail flex flex-wrap items-center justify-between gap-2">
        <dt className="PaymentInfoModal__label text-text-secondary">Số tiền cần nộp</dt>
        <dd className="PaymentInfoModal__amount tabular-numbers text-xl font-semibold">{formattedAmount}</dd>
      </div>
      {reasonContent}
    </dl>
  ) : null;
  const paymentContent = paymentImageUrl ? (
    <figure className="PaymentInfoModal__qr flex min-w-0 flex-col items-center gap-4">
      {/* Private signed URLs retain their existing read path and are not proxied. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="PaymentInfoModal__qr-image aspect-square w-56 max-w-full object-contain" src={paymentImageUrl} alt={qrAlt} />
      <figcaption className="PaymentInfoModal__qr-caption text-center text-sm text-text-secondary">Quét mã QR để chuyển khoản trực tiếp</figcaption>
    </figure>
  ) : (
    <p className="PaymentInfoModal__qr-empty rounded-lg bg-surface-subtle p-4 text-sm leading-6 text-text-secondary">
      Phòng chưa có mã QR. Liên hệ chủ room: {ownerName} để nộp quỹ.
    </p>
  );
  const footer = <Button className="PaymentInfoModal__close w-full" size="touch" onClick={onClose}>Đã hiểu</Button>;
  return (
    <ResponsiveDialog isOpen={isOpen} onClose={onClose} labelledBy="payment-info-title" size="sm" footer={footer}>
      <div className="PaymentInfoModal ui-section-stack">
        <header className="PaymentInfoModal__header flex flex-col gap-2">
          <h2 className="PaymentInfoModal__title text-xl font-semibold" id="payment-info-title">{title}</h2>
          <p className="PaymentInfoModal__room break-words text-sm text-text-secondary">{roomName}</p>
          <p className="PaymentInfoModal__owner break-words text-sm text-text-secondary">Chủ phòng: {ownerName}</p>
        </header>
        {archivedNotice}
        {amountContent}
        {paymentContent}
      </div>
    </ResponsiveDialog>
  );
}
