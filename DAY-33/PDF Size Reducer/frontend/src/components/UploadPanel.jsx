import { useState } from "react";

import { compressionModes, optimizationModes } from "../services/api.js";

const statusMessageMap = {
  uploading: "Uploading PDF to the server...",
  compressing: "Compressing PDF with the selected quality profile...",
  completed: "Optimization complete. Your file is ready to download.",
  error: "Optimization failed. Review the error message below.",
};

const stepStates = {
  idle: 0,
  uploading: 1,
  compressing: 2,
  completed: 3,
  error: 2,
};

const UploadPanel = ({ status, errorMessage, results, progress, batchSummary, onOptimize }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [optimizationMode, setOptimizationMode] = useState("manual");
  const [targetSizeMb, setTargetSizeMb] = useState("5");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFiles.length) {
      return;
    }

    await onOptimize({
      files: selectedFiles,
      compressionLevel,
      mode: optimizationMode,
      targetSizeMb,
    });
  };

  const isBusy = status === "uploading" || status === "compressing";
  const activeStep = stepStates[status] ?? 0;
  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <section className="upload-panel">
      <h3>Optimization Controls</h3>
      <p className="panel-copy">
        Choose a PDF, select a compression level, and run the backend workflow from the UI.
      </p>

      <div className="workflow-steps">
        {["Select", "Upload", "Compress", "Download"].map((step, index) => (
          <div
            key={step}
            className={`workflow-step ${activeStep >= index ? "workflow-step-active" : ""}`}
          >
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="control-group">
          <label htmlFor="pdf-file">PDF files</label>
          <input
            id="pdf-file"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="optimization-mode">Optimization mode</label>
          <select
            id="optimization-mode"
            value={optimizationMode}
            onChange={(event) => setOptimizationMode(event.target.value)}
          >
            {optimizationModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {optimizationMode === "manual" ? (
          <div className="control-group">
            <label htmlFor="compression-level">Compression level</label>
            <select
              id="compression-level"
              value={compressionLevel}
              onChange={(event) => setCompressionLevel(event.target.value)}
            >
              {compressionModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="control-group">
            <label htmlFor="target-size">Target size (MB)</label>
            <input
              id="target-size"
              type="number"
              min="1"
              step="0.1"
              value={targetSizeMb}
              onChange={(event) => setTargetSizeMb(event.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={!selectedFiles.length || isBusy}
        >
          {isBusy ? "Processing..." : "Upload and Optimize"}
        </button>
      </form>

      {selectedFiles.length ? (
        <p className="file-meta">
          Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
        </p>
      ) : null}

      {status !== "idle" ? (
        <p className={`status-banner status-${status}`}>{statusMessageMap[status]}</p>
      ) : null}

      {isBusy ? (
        <section className="progress-card">
          <div className="progress-copy">
            <strong>
              {progress.completed}/{progress.total} files processed
            </strong>
            <span>{progress.currentFileName || "Preparing optimization..."}</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </section>
      ) : null}

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

      {batchSummary ? (
        <section className="batch-summary">
          <div className="summary-card">
            <span>Batch files</span>
            <strong>{batchSummary.fileCount}</strong>
          </div>
          <div className="summary-card">
            <span>Total original</span>
            <strong>{batchSummary.totalOriginalLabel}</strong>
          </div>
          <div className="summary-card">
            <span>Total output</span>
            <strong>{batchSummary.totalOutputLabel}</strong>
          </div>
          <div className="summary-card summary-card-accent">
            <span>Total saved</span>
            <strong>
              {batchSummary.totalSavedLabel} ({batchSummary.reductionPercentage}%)
            </strong>
          </div>
        </section>
      ) : null}

      {results.length ? (
        <section className="results-stack">
          {results.map((result) => (
            <section className="result-card" key={result.id}>
              <h4>{result.originalName}</h4>
              <p className="result-summary">
                Type: {result.analysis?.documentType || result.uploadAnalysis?.documentType || "mixed"}
                {" | "}Applied: {result.compressionLevel}
                {result.targetSizeMb ? ` | Target: ${result.targetSizeMb} MB` : ""}
              </p>
              <div className="result-grid">
                <div>
                  <span className="result-label">Original size</span>
                  <strong>{result.originalSizeLabel}</strong>
                </div>
                <div>
                  <span className="result-label">Compressed size</span>
                  <strong>{result.outputSizeLabel}</strong>
                </div>
                <div>
                  <span className="result-label">Saved</span>
                  <strong>{result.sizeSavedLabel}</strong>
                </div>
                <div>
                  <span className="result-label">Reduction</span>
                  <strong>{result.reductionPercentage}%</strong>
                </div>
              </div>

              <a className="secondary-button" href={result.downloadUrl}>
                Download Optimized PDF
              </a>
            </section>
          ))}
        </section>
      ) : null}
    </section>
  );
};

export default UploadPanel;
