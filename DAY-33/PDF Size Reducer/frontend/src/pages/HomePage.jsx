import { useState } from "react";

import Header from "../components/Header.jsx";
import UploadPanel from "../components/UploadPanel.jsx";
import { compressPdf, getDownloadUrl, uploadPdf } from "../services/api.js";

const formatFileSize = (sizeInBytes = 0) => {
  if (!sizeInBytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(sizeInBytes) / Math.log(1024)), units.length - 1);
  const value = sizeInBytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const buildBatchSummary = (results) => {
  const totals = results.reduce(
    (summary, result) => {
      summary.original += result.originalSizeInBytes || 0;
      summary.output += result.outputSizeInBytes || 0;
      return summary;
    },
    { original: 0, output: 0 }
  );

  const saved = Math.max(totals.original - totals.output, 0);
  const reductionPercentage =
    totals.original > 0 ? Math.round((saved / totals.original) * 100) : 0;

  return {
    fileCount: results.length,
    totalOriginalLabel: formatFileSize(totals.original),
    totalOutputLabel: formatFileSize(totals.output),
    totalSavedLabel: formatFileSize(saved),
    reductionPercentage,
  };
};

const HomePage = () => {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    currentFileName: "",
  });

  const handleOptimize = async ({ files, compressionLevel, mode, targetSizeMb }) => {
    setStatus("uploading");
    setErrorMessage("");
    setResults([]);
    setProgress({
      total: files.length,
      completed: 0,
      currentFileName: files[0]?.name || "",
    });

    try {
      const uploadResponse = await uploadPdf(files);
      setStatus("compressing");

      const uploadedFiles = uploadResponse.data.files || [];
      const optimizationResults = [];

      for (const uploadedFile of uploadedFiles) {
        setProgress((current) => ({
          ...current,
          currentFileName: uploadedFile.originalName,
        }));

        const compressionResponse = await compressPdf({
          fileId: uploadedFile.fileId,
          compressionLevel: mode === "manual" ? compressionLevel : undefined,
          targetSizeMb: mode === "target-size" ? Number(targetSizeMb) : undefined,
        });

        const compressionData = compressionResponse.data;
        const originalSize = compressionData.originalSizeInBytes;
        const outputSize = compressionData.outputSizeInBytes;
        const sizeSaved = Math.max(originalSize - outputSize, 0);
        const reductionPercentage =
          originalSize > 0 ? Math.round((sizeSaved / originalSize) * 100) : 0;

        optimizationResults.push({
          ...compressionData,
          originalName: uploadedFile.originalName,
          uploadAnalysis: uploadedFile.analysis,
          originalSizeLabel: formatFileSize(originalSize),
          outputSizeLabel: formatFileSize(outputSize),
          sizeSavedLabel: formatFileSize(sizeSaved),
          reductionPercentage,
          downloadUrl: getDownloadUrl(compressionData.outputFilename),
        });

        setProgress((current) => ({
          ...current,
          completed: current.completed + 1,
        }));
      }

      setResults(optimizationResults);
      setStatus("completed");
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong while optimizing the PDF.");
      setStatus("error");
    }
  };

  const batchSummary = results.length ? buildBatchSummary(results) : null;

  return (
    <main className="app-shell">
      <Header />
      <section className="hero-section">
        <div className="hero-copy-block">
          <p className="eyebrow">Hackathon Build</p>
          <h1>AI-powered PDF Optimizer</h1>
          <p className="hero-copy">
            Upload PDFs, choose a compression strategy, and compare size reduction with a
            smart optimization workflow.
          </p>
          <div className="hero-feature-grid">
            <article className="feature-card">
              <span>01</span>
              <h3>Analyze</h3>
              <p>Estimate whether a PDF is image-heavy, text-heavy, or mixed.</p>
            </article>
            <article className="feature-card">
              <span>02</span>
              <h3>Decide</h3>
              <p>Use manual compression or let a target-size workflow choose the level.</p>
            </article>
            <article className="feature-card">
              <span>03</span>
              <h3>Compare</h3>
              <p>Review file-by-file results and total batch savings in one dashboard.</p>
            </article>
          </div>
        </div>
        <UploadPanel
          status={status}
          errorMessage={errorMessage}
          results={results}
          progress={progress}
          batchSummary={batchSummary}
          onOptimize={handleOptimize}
        />
      </section>
    </main>
  );
};

export default HomePage;
