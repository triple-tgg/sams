export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-red-500 mt-1">{msg}</p>;
}