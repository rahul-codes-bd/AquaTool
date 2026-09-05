/**
 * AquaTools - File Conversion Web Worker Lifecycle Manager
 * 
 * Spawns dynamic workers, tracks job progress, and terminates workers
 * after use to ensure zero main-thread blockage and clean memory release.
 */

export interface WorkerJob {
  id: string;
  type: 'CONVERT_TEXT' | 'TRANSCODE_IMAGE_OFFSCREEN';
  payload: any;
}

export interface WorkerResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  progress?: number;
}

export class FileConvWorkerManager {
  private activeWorkers: Map<string, Worker> = new Map();

  /**
   * Run a task in a dedicated Web Worker and automatically terminate it upon completion or cancel.
   */
  public runTask(
    jobId: string,
    workerScriptFn: () => void,
    messagePayload: any,
    onProgress?: (prog: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create inline blob worker for portable execution
      const blob = new Blob([`(${workerScriptFn.toString()})()`], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      this.activeWorkers.set(jobId, worker);

      worker.onmessage = (e: MessageEvent<WorkerResult>) => {
        const { success, data, error, progress } = e.data;
        if (progress !== undefined && onProgress) {
          onProgress(progress);
        }

        if (success !== undefined) {
          this.terminateWorker(jobId, workerUrl);
          if (success) {
            resolve(data);
          } else {
            reject(new Error(error || 'Worker task failed'));
          }
        }
      };

      worker.onerror = (err) => {
        this.terminateWorker(jobId, workerUrl);
        reject(new Error(`Worker error: ${err.message}`));
      };

      worker.postMessage(messagePayload);
    });
  }

  /**
   * Terminate active worker and clean up object URLs
   */
  public cancelTask(jobId: string) {
    const worker = this.activeWorkers.get(jobId);
    if (worker) {
      worker.terminate();
      this.activeWorkers.delete(jobId);
    }
  }

  private terminateWorker(jobId: string, workerUrl: string) {
    const worker = this.activeWorkers.get(jobId);
    if (worker) {
      worker.terminate();
      this.activeWorkers.delete(jobId);
    }
    URL.revokeObjectURL(workerUrl);
  }
}

export const fileConvWorkerManager = new FileConvWorkerManager();
