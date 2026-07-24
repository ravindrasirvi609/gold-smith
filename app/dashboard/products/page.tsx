import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getProducts } from "@/lib/admin-manufacturing";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { RowActionButton } from "@/components/ui/row-action-button";
import { parseListQuery } from "@/lib/list-query";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Approval", value: "APPROVAL" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Sold", value: "SOLD" },
  { label: "Repair", value: "REPAIR" },
  { label: "Returned", value: "RETURNED" },
  { label: "Scrapped", value: "SCRAPPED" },
];

export default async function ProductsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PRODUCT_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getProducts(query);
  const canDelete = hasPermission(session, "PRODUCT_DELETE");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <h1 className="text-3xl font-semibold">Products</h1>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by code, name, category, purity…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Jewel Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Status</th>
                {canDelete ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{product.jewelCode}</td>
                    <td className="px-4 py-4">{product.productName}</td>
                    <td className="px-4 py-4">{product.category}</td>
                    <td className="px-4 py-4">{product.netWeight}</td>
                    <td className="px-4 py-4">{product.status}</td>
                    {canDelete ? (
                      <td className="px-4 py-4">
                        {product.status === "AVAILABLE" ? (
                          <RowActionButton
                            url={`/api/products/${product.id}`}
                            method="DELETE"
                            confirm={`Delete product ${product.jewelCode}? This cannot be undone.`}
                            successMessage="Product deleted."
                            className="text-destructive"
                          >
                            Delete
                          </RowActionButton>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-muted-foreground"
                    colSpan={canDelete ? 7 : 6}
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
          />
        </div>
      </div>
    </main>
  );
}
