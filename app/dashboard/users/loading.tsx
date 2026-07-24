import { ListSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  return <ListSkeleton title="Users" columns={6} />;
}
