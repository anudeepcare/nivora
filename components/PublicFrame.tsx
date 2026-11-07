import Link from "next/link";
import type { ReactNode } from "react";
import s from "./PublicFrame.module.css";
export default function PublicFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className={s.page}>
      <header className={s.header}>
        <Link href="/" className={s.brand}>
          <img src="/icon.svg" width="28" height="28" alt="" />
          AURYN
        </Link>
        <nav aria-label="Public navigation">
          <Link href="/about">How it works</Link>
          <Link href="/track-record">Pace & evidence</Link>
          <Link href="/portfolio-check">Portfolio check</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>
      <div className={s.intro}>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children}
      <footer className={s.footer}>
        <span>AURYN · Research with perspective</span>
        <Link href="/methodology">Methodology</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </main>
  );
}
