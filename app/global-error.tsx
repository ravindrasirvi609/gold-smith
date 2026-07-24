"use client";

/**
 * Root-level global error boundary. Rendered when the top-level layout
 * itself throws. Must define its own <html> / <body> because it replaces
 * the entire tree.
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              padding: "2rem",
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>
              Something went wrong
            </h1>
            <p
              style={{ margin: "0 0 1.5rem", color: "#666", fontSize: "0.9rem" }}
            >
              An unexpected error occurred. Please refresh the page.
            </p>
            {error.digest ? (
              <p
                style={{
                  margin: "0 0 1rem",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  color: "#888",
                }}
              >
                Reference: {error.digest}
              </p>
            ) : null}
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
