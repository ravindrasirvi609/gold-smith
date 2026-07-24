import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Convenience wrapper around the shadcn breadcrumb primitives.
 *
 * Pass a list of items — every item except the last renders as a link, the
 * last renders as the current-page label. Skips items with an empty label.
 */

export type BreadcrumbCrumb = { label: string; href?: string };

export function PageBreadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbCrumb[];
  className?: string;
}) {
  const visible = items.filter((i) => i.label);
  if (!visible.length) return null;
  const lastIndex = visible.length - 1;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {visible.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="contents">
            <BreadcrumbItem>
              {index === lastIndex || !crumb.href ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < lastIndex ? <BreadcrumbSeparator /> : null}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
