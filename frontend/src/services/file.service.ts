import api from "@/lib/axios";

export interface FileResponse {
  id: number;
  originalName: string;
  contentType: string;
  size: number;
}

export interface FileVersionResponse {
  id: number;
  versionNumber: number;
  size: number;
  contentType: string;
  createdAt: string;
}

export interface ShareLinkResponse {
  url: string;
}

export interface PresignedUrlResponse {
  url: string;
  expiresInMinutes: number;
}

export const FileService = {
  async getMyFiles(): Promise<FileResponse[]> {
    const response = await api.get<FileResponse[]>("/api/files");
    return response.data;
  },

  async getFilesByFolder(folderId: number): Promise<FileResponse[]> {
    const response = await api.get<FileResponse[]>(`/api/files/folder/${folderId}`);
    return response.data;
  },

  async uploadFile(
    file: File,
    folderId: number,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<FileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", folderId.toString());

    const response = await api.post<FileResponse>("/api/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  },

  async downloadFile(fileId: number, fileName: string): Promise<void> {
    const response = await api.get(`/api/files/${fileId}/download`, {
      responseType: "blob",
    });
    
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async moveFile(fileId: number, targetFolderId: number): Promise<FileResponse> {
    const response = await api.put<FileResponse>(`/api/files/${fileId}/move`, {
      targetFolderId,
    });
    return response.data;
  },

  async searchFiles(keyword: string): Promise<FileResponse[]> {
    const response = await api.get<FileResponse[]>(`/api/files/search`, {
      params: { keyword },
    });
    return response.data;
  },

  async moveToTrash(fileId: number): Promise<void> {
    await api.delete(`/api/files/${fileId}`);
  },

  async restoreFile(fileId: number): Promise<void> {
    await api.put(`/api/files/${fileId}/restore`);
  },

  async getTrashFiles(): Promise<FileResponse[]> {
    const response = await api.get<FileResponse[]>("/api/files/trash");
    return response.data;
  },

  async permanentlyDelete(fileId: number): Promise<void> {
    await api.delete(`/api/files/${fileId}/permanent`);
  },

  async shareLink(fileId: number): Promise<ShareLinkResponse> {
    const response = await api.post<ShareLinkResponse>(`/api/files/${fileId}/share`);
    return response.data;
  },

  async uploadVersion(fileId: number, file: File): Promise<FileVersionResponse> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post<FileVersionResponse>(`/api/files/${fileId}/versions`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getVersions(fileId: number): Promise<FileVersionResponse[]> {
    const response = await api.get<FileVersionResponse[]>(`/api/files/${fileId}/versions`);
    return response.data;
  },

  async downloadVersion(versionId: number, fileName: string): Promise<void> {
    // Note: Typo 'donwload' is matched here
    const response = await api.get(`/api/files/versions/${versionId}/donwload`, {
      responseType: "blob",
    });
    
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async restoreVersion(versionId: number): Promise<void> {
    await api.put(`/api/files/versions/${versionId}/restore`);
  },

  async generatePresignedUrl(fileId: number): Promise<PresignedUrlResponse> {
    const response = await api.get<PresignedUrlResponse>(`/api/files/${fileId}/presigned`);
    return response.data;
  },

  async updateShareSettings(fileId: number, settings: { isPublic: boolean; allowedEmails: string }): Promise<ShareLinkResponse> {
    const response = await api.put<ShareLinkResponse>(`/api/files/${fileId}/share-settings`, settings);
    return response.data;
  },

  async getSharedFileInfo(token: string): Promise<{
    originalName: string;
    size: number;
    contentType: string;
    ownerName: string;
    isPublic: boolean;
    authRequired: boolean;
    allowed: boolean;
  }> {
    const response = await api.get(`/share/${token}/info`);
    return response.data;
  },

  getSharedFileDownloadUrl(token: string, download = false): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${baseUrl}/share/${token}/download?download=${download}`;
  },

  async getFilePreviewBlobUrl(fileId: number): Promise<string> {
    const response = await api.get(`/api/files/${fileId}/preview`, {
      responseType: "blob",
    });
    return window.URL.createObjectURL(response.data);
  },
};

export default FileService;
