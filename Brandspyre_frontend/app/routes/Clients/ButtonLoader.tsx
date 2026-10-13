// app/routes/Clients/ButtonLoader.tsx
import { Loader2 } from "lucide-react";

export default function ButtonLoader() {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-white" />
    </div>
  );
}
