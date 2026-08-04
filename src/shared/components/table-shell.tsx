import { type ReactNode } from "react";
import { Card } from "@/shared/components/ui";

export function TableShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </Card>
  );
}
