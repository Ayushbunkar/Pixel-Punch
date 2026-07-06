export interface StorageService {
  uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string>;
  downloadFile(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<void>;
}