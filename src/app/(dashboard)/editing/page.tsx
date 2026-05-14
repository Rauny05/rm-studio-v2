import { Suspense } from "react";
import { EditKanban } from "@/components/editing/EditKanban";

export default function EditingPage() {
  return (
    <Suspense fallback={null}>
      <EditKanban />
    </Suspense>
  );
}
