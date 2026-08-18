import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "../server/routers";

export const trpc = createTRPCReact<AppRouter>();

let tokenRef: (() => string | null) | null = null;

/** Register a token accessor (set once in the app shell after the session loads). */
export function setAuthTokenAccessor(accessor: () => string | null) {
  tokenRef = accessor;
}

function readToken(): string | null {
  if (!tokenRef) return null;
  try {
    return tokenRef();
  } catch {
    return null;
  }
}

export function makeTrpcLinks() {
  return [
    httpBatchLink({
      url: "/api/trpc",
      headers() {
        const token = readToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ];
}
