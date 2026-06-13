import { Cloud } from "lucide-react";

export default function RootPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-bounce shadow-lg shadow-primary/25">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground animate-pulse">
          Redirecting to SkyDrive...
        </span>
      </div>
    </div>
  );
}
