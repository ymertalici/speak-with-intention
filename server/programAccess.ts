export function hasProgramAccess(role: "user" | "admin", enabled?: boolean) {
  return role === "admin" || enabled === true;
}

export function canManageProgram(role: "user" | "admin") {
  return role === "admin";
}
