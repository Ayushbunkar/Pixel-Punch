export async function uploadFile(file: File, apiEndpoint: string, fileType: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`File upload failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.path;
}
