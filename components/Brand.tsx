"use client";

import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-link" aria-label="Speak with Intention ana sayfa">
      <span className="brand-mark">S</span>
      {!compact && (
        <span className="brand-name">
          Speak <em>with</em> Intention
        </span>
      )}
    </Link>
  );
}
