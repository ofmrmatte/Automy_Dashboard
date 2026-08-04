export function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;

  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
