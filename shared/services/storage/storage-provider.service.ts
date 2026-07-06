
// shared/services/storage/storage-provider.service.ts

import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { GoogleCloudStorageService } from './google-cloud-storage.service';

export function getStorageService(): StorageService {
  const storageProvider = process.env.STORAGE_PROVIDER;

  if (storageProvider === 'gcs') {
    return new GoogleCloudStorageService(process.env.GCS_BUCKET_NAME || 'pixelpunch-audit-files');
  } else if (storageProvider === 'local') {
    return new LocalStorageService();
  } else {
    throw new Error('Invalid or missing STORAGE_PROVIDER environment variable. Please set it to "local" or "gcs".');
  }
}
