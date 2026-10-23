"use client";
import Link from "next/link";
import { useAccess } from "./Access";
export default function PlanPanel() {
  const { access } = useAccess();
  return (
    <section className="plan-account-row">
      <div>
        <strong>
          {access.owner
            ? "Owner · Full access"
            : access.plan === "pro"
              ? "AURYN Pro"
              : "AURYN Free"}
        </strong>
        <p>
          {access.sampleOnly
            ? "Sample beta access."
            : "Manage your membership in one place."}
        </p>
      </div>
      <Link className="button" href="/plans">
        View plans
      </Link>
    </section>
  );
}
