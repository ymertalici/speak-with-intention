"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{minHeight: "100vh"}}>
      <body>
        <div style={{ padding: 48, fontFamily: "system-ui, sans-serif" }}>
          <h1>Beklenmeyen bir hata oluştu.</h1>
          <p>Detay: {error.message}</p>
          <button onClick={() => reset()}>Tekrar dene</button>
        </div>
      </body>
    </main>
  );
}
