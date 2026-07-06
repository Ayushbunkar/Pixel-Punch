import { StorageService } from './storage.service';
import { Storage } from '@google-cloud/storage';

export class GoogleCloudStorageService implements StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(bucketName: string) {
    this.storage = new Storage();
    this.bucketName = bucketName;
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error(`Error uploading file ${fileName} to GCS:`, err);
        reject(new Error('Failed to upload file to Google Cloud Storage.'));
      });

      blobStream.on('finish', () => {
        const publicUrl = `gs://${this.bucketName}/${blob.name}`;
        resolve(publicUrl);
      });

      blobStream.end(file);
    });
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileName = filePath.replace(`gs://${this.bucketName}/`, '');
    const file = bucket.file(fileName);

    try {
      const [content] = await file.download();
      return content;
    } catch (error) {
      console.error(`Error downloading file from GCS: ${filePath}`, error);
      throw new Error('Failed to download file from Google Cloud Storage.');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileName = filePath.replace(`gs://${this.bucketName}/`, '');
    const file = bucket.file(fileName);

    try {
      await file.delete();
    } catch (error) {
      console.error(`Error deleting file from GCS: ${filePath}`, error);
      throw new Error('Failed to delete file from Google Cloud Storage.');
    }
  }
}
