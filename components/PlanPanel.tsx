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
          {access.plan === "free"
            ? "100 companies each month · Overview and news included."
            : access.source === "complimentary"
              ? "Complimentary access · subscribe anytime."
              : "Your membership and billing, in one place."}
        </p>
      </div>
      <Link className="button" href="/plans">
        Membership
      </Link>
    </section>
  );
}
