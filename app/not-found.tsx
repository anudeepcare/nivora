import Link from "next/link";
export default function NotFound() {
  return (
    <main className="session-state">
      <h1>That view is not available.</h1>
      <Link className="button" href="/research">
        Open research
      </Link>
    </main>
  );
}
