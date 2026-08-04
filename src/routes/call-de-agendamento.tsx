import { createFileRoute } from "@tanstack/react-router";
import { SchedulingPage } from "@/features/scheduling/pages/scheduling-page";

export const Route = createFileRoute("/call-de-agendamento")({
  component: SchedulingPage,
});

