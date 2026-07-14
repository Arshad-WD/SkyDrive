import api from "@/lib/axios";

export interface FileResponse {
  id: number;
  originalName: string;
  contentType: string;
  size: number;
  status?: "UPLOADING" | "PENDING_SCAN" | "CLEAN" | "VIRUS_DETECTED";
}

export interface FileVersionResponse {
  id: number;
  versionNumber: number;
  size: number;
  contentType: string;
  createdAt: string;
  status?: "UPLOADING" | "PENDING_SCAN" | "CLEAN" | "VIRUS_DETECTED";
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
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

    // 1. If file is small, use simple direct upload
    if (file.size <= CHUNK_SIZE) {
      const initiateResponse = await api.post<{ fileId: number; uploadUrl: string; storedName: string }>(
        "/api/files/upload/initiate",
        {
          fileName: file.name,
          folderId,
          size: file.size,
          contentType: file.type || "application/octet-stream"
        }
      );

      const { fileId, uploadUrl } = initiateResponse.data;

      const axios = (await import("axios")).default;
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        },
        onUploadProgress
      });

      const completeResponse = await api.post<FileResponse>(
        "/api/files/upload/complete",
        null,
        {
          params: { fileId }
        }
      );

      return completeResponse.data;
    }

    // 2. Otherwise, use chunked upload
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Initiate chunked upload
    const initiateResponse = await api.post<{ fileId: number; uploadUrls: string[]; storedName: string }>(
      "/api/files/upload/initiate-chunked",
      {
        fileName: file.name,
        folderId,
        size: file.size,
        contentType: file.type || "application/octet-stream",
        totalChunks
      }
    );

    const { fileId, uploadUrls } = initiateResponse.data;
    const axios = (await import("axios")).default;

    // Track progress of each chunk
    const loadedBytes = new Array(totalChunks).fill(0);
    const triggerProgress = (chunkIdx: number, loaded: number) => {
      loadedBytes[chunkIdx] = loaded;
      if (onUploadProgress) {
        const totalLoaded = loadedBytes.reduce((sum, val) => sum + val, 0);
        onUploadProgress({
          loaded: totalLoaded,
          total: file.size
        });
      }
    };

    // Upload chunks sequentially
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const uploadUrl = uploadUrls[i];

      await axios.put(uploadUrl, chunk, {
        headers: {
          "Content-Type": "application/octet-stream"
        },
        onUploadProgress: (progressEvent) => {
          triggerProgress(i, progressEvent.loaded);
        }
      });
    }

    // Complete chunked upload
    const completeResponse = await api.post<FileResponse>(
      "/api/files/upload/complete-chunked",
      null,
      {
        params: {
          fileId,
          totalChunks
        }
      }
    );

    return completeResponse.data;
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
    // 1. Initiate version upload
    const initiateResponse = await api.post<{ fileId: number; uploadUrl: string; storedName: string }>(
      "/api/files/versions/initiate",
      {
        fileName: file.name,
        fileId,
        size: file.size,
        contentType: file.type || "application/octet-stream"
      }
    );

    const { fileId: versionId, uploadUrl } = initiateResponse.data;

    // 2. Upload file directly to S3 / MinIO
    const axios = (await import("axios")).default;
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream"
      }
    });

    // 3. Complete version upload
    const completeResponse = await api.post<FileVersionResponse>(
      "/api/files/versions/complete",
      null,
      {
        params: { versionId }
      }
    );

    return completeResponse.data;
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
