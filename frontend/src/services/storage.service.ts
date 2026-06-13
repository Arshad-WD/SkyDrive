import api from "@/lib/axios";

export interface StorageUsageResponse {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedPercentage: number;
}

export const StorageService = {
  async getUsage(): Promise<StorageUsageResponse> {
    const response = await api.get<StorageUsageResponse>("/api/storage/usage");
    return response.data;
  },
};

export default StorageService;
