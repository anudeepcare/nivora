"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X } from "lucide-react";
import s from "./DetailDialog.module.css";

let activeDialogs = 0;
let savedOverflow = "";

/** Additional detail lives outside the card layout, in an accessible modal. */
export default function DetailDialog({
  title,
  trigger,
  children,
  className,
  wide = false,
}: {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const returnFocus = opener.current;
    if (!element) return;
    if (activeDialogs === 0)
      savedOverflow = document.documentElement.style.overflow;
    activeDialogs += 1;
    document.documentElement.style.overflow = "hidden";
    if (!element.open) element.showModal();
    closeButton.current?.focus();
    return () => {
      activeDialogs -= 1;
      if (activeDialogs === 0)
        document.documentElement.style.overflow = savedOverflow;
      returnFocus?.focus({ preventScroll: true });
    };
  }, [open]);
  return (
    <>
      <button
        ref={opener}
        type="button"
        className={`${s.trigger}${className ? ` ${className}` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{trigger}</span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={s.dialog}
            data-wide={wide || undefined}
            aria-labelledby={id}
            onClose={() => setOpen(false)}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
              )
                event.currentTarget.close();
            }}
          >
            <header className={s.header}>
              <h2 id={id}>{title}</h2>
              <button
                ref={closeButton}
                type="button"
                aria-label={`Close ${title}`}
                onClick={() => dialog.current?.close()}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <div className={s.content}>{children}</div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
