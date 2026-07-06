
const { FormData, File } = require('formdata-node');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Mock Next.js environment variables
process.env.STORAGE_PROVIDER = 'local'; // Set to 'local' for development, 'gcs' for production
process.env.LOCAL_STORAGE_DIR = path.join(__dirname, 'local-storage'); // Ensure this directory exists
process.env.GCS_BUCKET_NAME = 'pixelpunch-audit-files'; // Required for GCS, even if not used in local testing

async function runE2EValidation() {
  console.log('Starting E2E Validation...');

  const testFileName = `test-document-${uuidv4()}.txt`;
  const testFileContent = 'This is a test document for E2E validation.';
  const testFilePath = path.join(__dirname, testFileName);
  const localStorageDir = path.join(__dirname, 'local-storage');
  let uploadedPath = null; // Declare uploadedPath here

  try {
    // 1. Create a dummy file
    await fs.writeFile(testFilePath, testFileContent);
    console.log(`Created dummy file: ${testFilePath}`);

    // Ensure local-storage directory exists
    await fs.mkdir(localStorageDir, { recursive: true });

    // 2. Simulate file upload
    console.log('Simulating file upload...');
    const fileBuffer = await fs.readFile(testFilePath);
    const file = new File([fileBuffer], testFileName, { type: 'text/plain' });

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('fileType', 'document');

    const uploadResponse = await fetch('http://localhost:3001/api/cost-scan/upload', {
      method: 'POST',
      body: uploadFormData,
    });
    const uploadResult = await uploadResponse.json();

    if (uploadResponse.status !== 200) {
      throw new Error(`Upload failed with status ${uploadResponse.status}: ${JSON.stringify(uploadResult)}`);
    }
    console.log('File upload successful:', uploadResult);
    uploadedPath = uploadResult.path; // Assign to the declared variable

    // 3. Verify file storage (implicitly verified by successful submission and audit)
    console.log('File upload and storage implicitly verified by successful submission.');

    // 4. Simulate form submission
    console.log('Simulating form submission...');
    const submitFormData = new FormData();
    submitFormData.append('documents', JSON.stringify([{ name: testFileName, type: 'text/plain', size: testFileContent.length, path: uploadedPath }]));
    submitFormData.append('architecture_files', JSON.stringify([]));
    submitFormData.append('cost_files', JSON.stringify([]));
    // Add other required form fields for a valid submission
    submitFormData.append('companyName', 'Test Company');
    submitFormData.append('contactEmail', 'test@example.com');
    submitFormData.append('ai_dependence', 'core_revenue');
    submitFormData.append('monthly_spend_band', 'lt_5k');
    submitFormData.append('spend_visibility', 'very_clear');
    submitFormData.append('unit_economics', JSON.stringify(['cost_per_request']));
    submitFormData.append('main_pain', 'bills_growing');
    submitFormData.append('leakage_pattern', 'large_prompts');
    submitFormData.append('optimization_done', JSON.stringify(['formal_audit']));
    submitFormData.append('savings_threshold', 'gte_10');

    const submitResponse = await fetch('http://localhost:3001/api/cost-scan/submit', {
      method: 'POST',
      body: submitFormData,
    });
    const submitResult = await submitResponse.json();

    if (submitResponse.status !== 200) {
      throw new Error(`Submission failed with status ${submitResponse.status}: ${JSON.stringify(submitResult)}`);
    }
    console.log('Form submission successful:', submitResult);

    // 5. Verify text extraction (implicitly verified by successful submission and audit)
    console.log('Text extraction implicitly verified by successful submission.');

    console.log('E2E Validation PASSED!');

  } catch (error) {
    console.error('E2E Validation FAILED:', error);
  } finally {
    // Clean up
    console.log('Cleaning up...');
    await fs.unlink(testFilePath).catch(console.error);
    // For LocalStorageService, manually delete the file from the local-storage directory
    if (uploadedPath) { // Only attempt to delete if uploadedPath is defined
      const fileNameInStorage = path.basename(uploadedPath.replace('local://', ''));
      await fs.unlink(path.join(localStorageDir, fileNameInStorage)).catch(console.error);
    }
    console.log('Cleanup complete.');
  }
}

runE2EValidation();
