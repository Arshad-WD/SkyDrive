import api from "@/lib/axios";

export interface CreateFolderRequest {
  name: string;
  parentFolderId?: number | null;
}

export interface FolderResponse {
  id: number;
  name: string;
  parentFolderId: number | null;
  createdAt: string;
}

export interface FolderTreeResponse {
  id: number;
  name: string;
  children: FolderTreeResponse[];
}

export const FolderService = {
  async createFolder(data: CreateFolderRequest): Promise<FolderResponse> {
    const response = await api.post<FolderResponse>("/api/folders", data);
    return response.data;
  },

  async getFolderTree(): Promise<FolderTreeResponse[]> {
    const response = await api.get<FolderTreeResponse[]>("/api/folders/tree");
    return response.data;
  },
};

export default FolderService;
