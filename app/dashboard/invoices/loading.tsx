import { ListSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  return <ListSkeleton title="Invoices" columns={6} />;
}
