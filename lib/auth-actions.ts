export async function completeSignOut(
  revoke: () => Promise<{ error: { message: string } | null }>,
  clear: () => void,
  replace: (path: string) => void,
) {
  const { error } = await revoke();
  if (error) throw new Error(error.message);
  clear();
  replace("/login");
}
