import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { listReferenceRows } from "@/lib/admin-reference-data";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";
import { RowActionButton } from "@/components/ui/row-action-button";
import type { EditableKind } from "@/lib/reference-data";
import { ReferenceDataAddForm } from "./add-form";

/**
 * Reference-data admin: view every editable list (jewellery
 * sub-category, karigar specialization, sale type, approval purpose)
 * and add / delete options in-place.
 *
 * Requires SETTINGS_EDIT to mutate, SETTINGS_VIEW to view.
 */
export default async function ReferenceDataPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_VIEW")) {
    redirect("/dashboard");
  }
  const canEdit = hasPermission(session, "SETTINGS_EDIT");
  const rows = await listReferenceRows();

  const grouped = new Map<EditableKind, typeof rows>();
  for (const row of rows) {
    const bucket = grouped.get(row.kind) ?? [];
    bucket.push(row);
    grouped.set(row.kind, bucket);
  }

  const KIND_META: Record<
    EditableKind,
    { title: string; description: string }
  > = {
    "jewellery-subcategory": {
      title: "Jewellery sub-categories",
      description:
        "Sub-types of jewellery (e.g. Solitaire under Ring, Choker under Necklace). Used on the karigar receipt and product forms.",
    },
    "karigar-specialization": {
      title: "Karigar specializations",
      description:
        "Craft disciplines. Shown as options when creating or editing a karigar.",
    },
    "sale-type": {
      title: "Sale types",
      description:
        "How a sale is categorised (retail, wholesale, old gold exchange, etc.). Used on invoices.",
    },
    "approval-purpose": {
      title: "Approval purposes",
      description:
        "Reason a customer takes jewellery on approval (home trial, function, etc.).",
    },
  };

  const KINDS = Object.keys(KIND_META) as EditableKind[];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings", href: "/dashboard/settings" },
            { label: "Reference data" },
          ]}
          className="mb-4"
        />
        <div>
          <p className="text-sm text-muted-foreground">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Reference data
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The editable option lists used throughout the app. Values must be
            uppercase, without spaces (we auto-normalise). Labels are what your
            team sees in forms.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {KINDS.map((kind) => {
            const meta = KIND_META[kind];
            const kindRows = grouped.get(kind) ?? [];
            return (
              <section
                key={kind}
                className="overflow-hidden rounded-3xl border bg-card shadow-sm"
              >
                <header className="border-b bg-muted/40 px-6 py-4">
                  <h2 className="text-lg font-semibold">{meta.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {meta.description}
                  </p>
                </header>
                {canEdit ? (
                  <div className="border-b bg-muted/20 px-6 py-4">
                    <ReferenceDataAddForm kind={kind} />
                  </div>
                ) : null}
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium">Value</th>
                      <th className="px-6 py-3 font-medium">Label</th>
                      <th className="px-6 py-3 font-medium">Parent</th>
                      <th className="px-6 py-3 font-medium">Hint</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      {canEdit ? (
                        <th className="px-6 py-3 font-medium">Actions</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {kindRows.length ? (
                      kindRows.map((row) => (
                        <tr key={row.id} className="border-b last:border-b-0">
                          <td className="px-6 py-3 font-mono text-xs">
                            {row.value}
                          </td>
                          <td className="px-6 py-3">{row.label}</td>
                          <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                            {row.parent ?? "—"}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {row.hint ?? "—"}
                          </td>
                          <td className="px-6 py-3">
                            {row.isActive ? "Active" : "Inactive"}
                          </td>
                          {canEdit ? (
                            <td className="px-6 py-3">
                              <RowActionButton
                                url={`/api/reference-data/${row.id}`}
                                method="DELETE"
                                tone="danger"
                                confirmTitle={`Delete "${row.label}"?`}
                                confirmDescription="Existing records that reference this option will keep the raw value stored — only future forms will lose the option."
                                successMessage="Option deleted."
                              >
                                Delete
                              </RowActionButton>
                            </td>
                          ) : null}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={canEdit ? 6 : 5}
                          className="px-6 py-8 text-center text-muted-foreground"
                        >
                          No options yet — add one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
