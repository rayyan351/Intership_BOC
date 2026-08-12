import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div>
        <p style={{ color: "#8a8a8a", textTransform: "uppercase", letterSpacing: ".12em" }}>404</p>
        <h1>That page is not on the menu.</h1>
        <p>Return to the Burger O'Clock storefront and continue browsing.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 20, padding: "13px 22px", borderRadius: 999, background: "#ffc400", fontWeight: 800 }}>Back to home</Link>
      </div>
    </main>
  );
}
