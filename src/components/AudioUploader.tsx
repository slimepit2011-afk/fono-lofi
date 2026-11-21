import React, { useRef, useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';

export interface AudioUploaderProps {
  onSuccess?: (count: number) => void;
  className?: string;
  compact?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onSuccess,
  className = '',
  compact = false
}) => {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    tactile.click('snap');
    setIsProcessing(true);
    setUploadStatus(`Uploading & analyzing ${files.length} audio file(s)...`);

    try {
      const added = await storeActions.uploadLocalAudioFiles(files);
      setUploadStatus(`Success! Added ${added.length} track(s) to your personal library.`);
      if (onSuccess) onSuccess(added.length);
      setTimeout(() => setUploadStatus(null), 3500);
    } catch (err: any) {
      setUploadStatus(`Upload error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  if (compact) {
    return (
      <div className={`inline-block ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
          multiple
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <button
          type="button"
          className="btn btn--primary btn--sm flex items-center gap-2"
          onClick={() => {
            tactile.click('click');
            fileInputRef.current?.click();
          }}
          disabled={isProcessing}
        >
          <Icon name="plus" size="xs" />
          <span>{isProcessing ? 'Uploading...' : 'Upload Audio Files'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`card card--padded uploader-box ${isDragging ? 'is-dragging' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--line-2)'}`,
        background: isDragging ? 'var(--card-2)' : 'var(--card)',
        textAlign: 'center',
        padding: '32px 24px',
        borderRadius: 'var(--r-lg)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onClick={() => {
        tactile.click('click');
        fileInputRef.current?.click();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center justify-center gap-2">
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px'
          }}
        >
          <Icon name="music" size="md" />
        </div>

        <h3 className="title title--sm m-0">Upload Your Own Music Files</h3>
        <p className="text-xs muted-ink m-0" style={{ maxWidth: '420px' }}>
          Drag & drop your personal audio files (<strong>.mp3</strong>, <strong>.wav</strong>, <strong>.m4a</strong>, <strong>.flac</strong>) here or click to browse.
        </p>

        <button
          type="button"
          className="btn btn--primary btn--sm mt-2 font-bold"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing files...' : 'Select Audio Files from Computer'}
        </button>

        {uploadStatus && (
          <div className="text-xs font-semibold text-green-700 mt-2">
            ✓ {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
};
