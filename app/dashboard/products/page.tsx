import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getProducts } from "@/lib/admin-manufacturing";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "PRODUCT_VIEW")) redirect("/dashboard");
  const products = await getProducts();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-10"><div className="w-full"><h1 className="text-3xl font-semibold">Products</h1><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Jewel Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{products.length ? products.map((product) => <tr key={String(product._id)} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{String(product.jewelCode ?? "")}</td><td className="px-4 py-4">{String(product.productName ?? "")}</td><td className="px-4 py-4">{String(product.category ?? "")}</td><td className="px-4 py-4">{String(product.netWeight ?? "")}</td><td className="px-4 py-4">{String(product.status ?? "")}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>No products found.</td></tr>}</tbody></table></div></div></div></main>;
}

