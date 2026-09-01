import { createFileRoute } from "@tanstack/react-router";
import { NotFoundView } from "@/components/layout/NotFoundView";

export const Route = createFileRoute("/404")({ component: NotFoundView });
