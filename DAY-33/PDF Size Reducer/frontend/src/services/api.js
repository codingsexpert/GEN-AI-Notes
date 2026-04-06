export const API_BASE_URL = "http://localhost:5000/api";

export const compressionModes = [
  { value: "low", label: "Low Compression" },
  { value: "medium", label: "Medium Compression" },
  { value: "high", label: "High Compression" },
];

export const optimizationModes = [
  { value: "manual", label: "Manual Compression Level" },
  { value: "target-size", label: "Target File Size" },
];

const parseResponse = async (response) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};

export const uploadPdf = async (files) => {
  const formData = new FormData();

  if (files.length === 1) {
    formData.append("file", files[0]);
  } else {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
};

export const compressPdf = async ({ fileId, compressionLevel, targetSizeMb }) => {
  const response = await fetch(`${API_BASE_URL}/compress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileId,
      compressionLevel,
      targetSizeMb,
    }),
  });

  return parseResponse(response);
};

export const getDownloadUrl = (filename) => {
  return `${API_BASE_URL}/download/${encodeURIComponent(filename)}`;
};
