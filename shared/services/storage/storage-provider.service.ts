
// shared/services/storage/storage-provider.service.ts

import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { GoogleCloudStorageService } from './google-cloud-storage.service';

export function getStorageService(): StorageService {
  if (process.env.NODE_ENV === 'production') {
    // In a real application, the bucket name would come from environment variables or a config file.
    // For this example, we'll use a placeholder.
    return new GoogleCloudStorageService(process.env.GCS_BUCKET_NAME || 'pixelpunch-audit-files');
  } else {
    return new LocalStorageService();
  }
}
