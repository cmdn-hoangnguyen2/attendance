import type { ReactNode } from "react";

export interface PageHeaderProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ id, title, description, action }: PageHeaderProps) {
  const descriptionContent = description ? (
    <p className="PageHeader__description max-w-2xl text-pretty text-sm leading-6 text-text-secondary">
      {description}
    </p>
  ) : null;
  const actionContent = action ? (
    <div className="PageHeader__action w-full sm:w-auto">{action}</div>
  ) : null;

  return (
    <header
      className="PageHeader flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      aria-labelledby={id}
    >
      <div className="PageHeader__content flex min-w-0 flex-col gap-2">
        <h1
          className="PageHeader__title text-balance text-2xl font-bold leading-8 text-text-primary md:text-[32px] md:leading-10"
          id={id}
        >
          {title}
        </h1>
        {descriptionContent}
      </div>
      {actionContent}
    </header>
  );
}
