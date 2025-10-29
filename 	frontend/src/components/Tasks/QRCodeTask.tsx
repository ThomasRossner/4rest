import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import './TaskComponents.css';

interface QRCodeTaskProps {
  taskId: string;
  qrCode: string;
  onComplete?: () => void;
}

export function QRCodeTask({ taskId, qrCode, onComplete }: QRCodeTaskProps) {
  const [scannedCode, setScannedCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  const completeMutation = useMutation(
    () => api.completeTask(taskId, {}),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        onComplete?.();
      },
    }
  );

  // Simulate QR code scanning
  const handleScan = () => {
    setIsScanning(true);
    // In a real implementation, this would use a QR scanner library
    // For now, we'll simulate with the provided QR code
    setTimeout(() => {
      setScannedCode(qrCode);
      setIsScanning(false);
      // Auto-complete when QR code matches
      if (qrCode) {
        completeMutation.mutate();
      }
    }, 1000);
  };

  // Check if device has camera (for real QR scanning)
  const [hasCamera, setHasCamera] = useState(false);
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false));
  }, []);

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>QR Code Challenge</h2>
        <p>Scan the QR code at the location to complete this task</p>
      </div>

      <div className="qr-container">
        <div className="qr-scanner-area">
          {hasCamera ? (
            <div className="qr-scanner">
              <div className="scanner-overlay">
                <div className="scanner-frame"></div>
              </div>
              <button
                onClick={handleScan}
                disabled={isScanning || completeMutation.isLoading}
                className="scan-button"
              >
                {isScanning ? 'Scanning...' : 'Scan QR Code'}
              </button>
            </div>
          ) : (
            <div className="qr-manual">
              <p>Enter the QR code manually:</p>
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Enter QR code"
                className="qr-input"
              />
              <button
                onClick={() => {
                  if (scannedCode === qrCode) {
                    completeMutation.mutate();
                  } else {
                    alert('Invalid QR code');
                  }
                }}
                disabled={!scannedCode || completeMutation.isLoading}
                className="verify-button"
              >
                Verify & Complete
              </button>
            </div>
          )}
        </div>

        {completeMutation.isSuccess && (
          <div className="task-success">
            <span className="success-icon">✅</span>
            <p>Task completed successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}
