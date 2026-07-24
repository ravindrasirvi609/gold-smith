import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSession, hasPermission } from "@/lib/auth";
import { getProductById } from "@/lib/admin-manufacturing";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Product detail page with a QR code the front-of-house team can scan to
 * pull the product record. The QR encodes the public URL to this page so
 * scanning always resolves to the current status of the product.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PRODUCT_VIEW"))
    redirect("/dashboard/products");
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const jewelCode = String(product.jewelCode ?? "");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const productUrl = `${baseUrl}/dashboard/products/${id}`;

  // Render QR as an SVG data URI. Server-generated, no client dependency.
  const qrSvg = await QRCode.toString(productUrl, {
    type: "svg",
    margin: 1,
    width: 240,
    color: { dark: "#111", light: "#fff" },
  });
  const qrDataUri = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Products", href: "/dashboard/products" },
            { label: jewelCode },
          ]}
          className="mb-4"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Product</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {String(product.productName ?? "Unnamed")}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {jewelCode}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <a
              href={qrDataUri}
              download={`${jewelCode || "product"}-qr.svg`}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm shadow-sm hover:bg-muted"
            >
              Download QR
            </a>
            <Link href="/dashboard/products">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status" value={String(product.status ?? "")} />
              <Field label="Location" value={String(product.currentLocation ?? "")} />
              <Field label="Category" value={String(product.category ?? "")} />
              <Field label="Sub-category" value={String(product.subCategory ?? "")} />
              <Field label="Purity" value={String(product.purity ?? "")} />
              <Field label="Gross weight" value={String(product.grossWeight ?? "")} />
              <Field label="Net weight" value={String(product.netWeight ?? "")} />
              <Field label="Wastage" value={String(product.wastage ?? "")} />
              <Field label="Making charge" value={String(product.makingCharge ?? "")} />
              <Field label="Selling price" value={String(product.sellingPrice ?? "")} />
            </div>
            {product.image ? (
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Photo
                </p>
                <div className="mt-3">
                  <Image
                    src={String(product.image)}
                    alt=""
                    width={320}
                    height={320}
                    unoptimized
                    className="rounded-lg object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Scan to view
              </p>
              <div
                className="mx-auto mt-3 flex size-56 items-center justify-center rounded-md bg-white p-2"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                {jewelCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value || "—"}</p>
    </div>
  );
}
