import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/uiStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useSse() {
  const queryClient = useQueryClient();
  const { currentFolderId } = useUIStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("skydrive_token");
    if (!token) return;

    const url = `${API_URL}/api/files/sse/subscribe?token=${token}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("FILE_SCAN_COMPLETE", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("File scan complete notification received:", data);
        
        // Invalidate all query states for files listing and storage usage
        queryClient.invalidateQueries({ queryKey: ["files"] });
        queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      } catch (err) {
        console.error("Failed to parse SSE scan result event", err);
      }
    });

    eventSource.addEventListener("INIT", (event) => {
      console.log("SSE subscription successfully established:", event.data);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error occurred. Reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, currentFolderId]);
}
