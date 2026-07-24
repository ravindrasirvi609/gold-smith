import { ListSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  return <ListSkeleton title="Audit Log" columns={5} rows={12} />;
}
