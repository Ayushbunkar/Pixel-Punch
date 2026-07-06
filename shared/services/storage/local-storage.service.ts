import { StorageService } from './storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'local-storage');

export class LocalStorageService implements StorageService {
  constructor() {
    this.ensureStorageDirExists();
  }

  private async ensureStorageDirExists() {
    try {
      await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error ensuring local storage directory exists:', error);
    }
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(LOCAL_STORAGE_DIR, uniqueFileName);

    try {
      await fs.writeFile(filePath, file);
      return `local://${uniqueFileName}`;
    } catch (error) {
      console.error(`Error uploading file ${fileName} to local storage:`, error);
      throw new Error('Failed to upload file to local storage.');
    }
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const localPath = path.join(LOCAL_STORAGE_DIR, path.basename(filePath));
    try {
      const fileContent = await fs.readFile(localPath);
      return fileContent;
    } catch (error) {
      console.error(`Error downloading file from local storage: ${filePath}`, error);
      throw new Error('Failed to download file from local storage.');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const localPath = path.join(LOCAL_STORAGE_DIR, path.basename(filePath));
    try {
      await fs.unlink(localPath);
    } catch (error) {
      console.error(`Error deleting file from local storage: ${filePath}`, error);
      throw new Error('Failed to delete file from local storage.');
    }
  }
}
