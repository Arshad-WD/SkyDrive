import api from "@/lib/axios";

export type ActivityType =
  | "UPLOAD"
  | "DOWNLOAD"
  | "DELETE"
  | "RESTORE"
  | "MOVE"
  | "SHARE"
  | "PERMANET_DELETE" // Backend spelling is PERMANET_DELETE
  | "VERSION_UPLOAD"
  | "VERSION_RESTORE"
  | "VIRUS_BLOCKED";

export interface ActivityLogResponse {
  activityType: ActivityType;
  description: string;
  createdAt: string;
}

export const ActivityService = {
  async getActivities(): Promise<ActivityLogResponse[]> {
    const response = await api.get<ActivityLogResponse[]>("/api/activity");
    return response.data;
  },
};

export default ActivityService;
