/**
 * Face detection service using Web Workers
 * This service manages communication with the face detection worker
 */

// Keep track of the worker instance
let worker: Worker | null = null;

// Keep track of pending requests
const pendingRequests = new Map<string, {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}>();

// Generate unique request IDs
let requestCounter = 0;
const generateRequestId = () => `req_${Date.now()}_${requestCounter++}`;

/**
 * Initialize the face detection worker
 */
export const initFaceDetectionWorker = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create worker only if supported
      if (typeof Worker === 'undefined') {
        reject(new Error('Web Workers not supported in this browser'));
        return;
      }
      
      // Create worker if not already created
      if (!worker) {
        // Create a new worker
        worker = new Worker(new URL('../workers/faceDetectionWorker.ts', import.meta.url), { type: 'module' });
        
        // Set up message handler
        worker.onmessage = (event) => {
          const { status, id, error } = event.data;
          
          // Handle worker initialization
          if (status === 'ready') {
            resolve();
            return;
          }
          
          // Handle worker errors without request ID
          if (status === 'error' && !id) {
            console.error('Worker error:', error);
            return;
          }
          
          // Handle request responses
          const request = pendingRequests.get(id);
          if (request) {
            if (status === 'error') {
              request.reject(new Error(error));
            } else {
              request.resolve(event.data);
            }
            pendingRequests.delete(id);
          }
        };
        
        // Handle worker errors
        worker.onerror = (error) => {
          console.error('Worker error:', error);
          reject(error);
        };
      } else {
        // Worker already initialized
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Load face detection models
 * @param modelUrl - URL to the face detection models
 */
export const loadFaceDetectionModels = async (modelUrl: string): Promise<void> => {
  if (!worker) {
    await initFaceDetectionWorker();
  }
  
  const id = generateRequestId();
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    
    worker!.postMessage({
      operation: 'loadModels',
      modelUrl,
      id
    });
  });
};

/**
 * Detect faces in an image
 * @param imageFile - Image file to process
 */
export const detectFaces = async (imageFile: File): Promise<any[]> => {
  if (!worker) {
    await initFaceDetectionWorker();
  }
  
  // Convert file to image data
  const imageData = await fileToImageData(imageFile);
  const id = generateRequestId();
  
  // Derive the correct base path even when the app is hosted under a sub-path
  const base: string = (import.meta as any)?.env?.BASE_URL ?? '/';
  const rel: string = base.endsWith('/') ? `${base}weights` : `${base}/weights`;
  const modelUrl: string = new URL(rel, window.location.origin).toString();
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, {
      resolve: (data) => resolve(data.detections || []),
      reject
    });
    
    worker!.postMessage({
      operation: 'detectFace',
      imageData: imageData.data,
      width: imageData.width,
      height: imageData.height,
      modelUrl,
      id
    });
  });
};

/**
 * Crop an image around a detected face
 * @param imageFile - Image file to crop
 * @param targetWidth - Width of the output image
 * @param targetHeight - Height of the output image
 */
import * as faceapi from 'face-api.js';

export const cropFace = async (
  imageFile: File,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  // Try worker first
  try {
    if (!worker) {
      await initFaceDetectionWorker();
    }
    
    // Convert file to image data
    const imageData = await fileToImageData(imageFile);
    const id = generateRequestId();
    
    // Derive the correct base path even when the app is hosted under a sub-path
    const base: string = (import.meta as any)?.env?.BASE_URL ?? '/';
    const rel: string = base.endsWith('/') ? `${base}weights` : `${base}/weights`;
    const modelUrl: string = new URL(rel, window.location.origin).toString();
    
    return await new Promise((resolve, reject) => {
      pendingRequests.set(id, {
        resolve: (data) => resolve(data.imageData as string),
        reject
      });
      
      worker!.postMessage({
        operation: 'cropFace',
        imageData: imageData.data,
        width: imageData.width,
        height: imageData.height,
        targetWidth,
        targetHeight,
        modelUrl,
        id
      });
    });
  } catch (err) {
    console.warn('[face-api] Worker crop failed, falling back to main thread:', err);
    // Fallback to main-thread face cropping
    return await cropFaceMainThread(imageFile, targetWidth, targetHeight);
  }
};

let mainModelsLoaded = false;
async function ensureMainModelsLoaded(modelUrl: string) {
  if (mainModelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
  ]);
  mainModelsLoaded = true;
}

export async function cropFaceMainThread(
  imageFile: File,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const base: string = (import.meta as any)?.env?.BASE_URL ?? '/';
  const rel: string = base.endsWith('/') ? `${base}weights` : `${base}/weights`;
  const modelUrl: string = new URL(rel, window.location.origin).toString();

  await ensureMainModelsLoaded(modelUrl);

  // Draw image to canvas
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Failed to load image'));
    i.src = URL.createObjectURL(imageFile);
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(img, 0, 0);

  // Detect faces
  const detections = await faceapi
    .detectAllFaces(canvas as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
    .withFaceLandmarks();

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = targetWidth;
  resultCanvas.height = targetHeight;
  const rctx = resultCanvas.getContext('2d');
  if (!rctx) throw new Error('Could not get result canvas context');

  if (!detections.length) {
    // Center crop fallback
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const ox = (targetWidth - sw) / 2;
    const oy = (targetHeight - sh) / 2;
    rctx.drawImage(img, ox, oy, sw, sh);
  } else {
    const best = detections.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height))[0];
    const box = best.detection.box;
    const targetFill = 0.5;
    const scale = Math.min((targetWidth * targetFill) / box.width, (targetHeight * targetFill) / box.height);
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const ox = targetWidth / 2 - faceCenterX * scale;
    const oy = targetHeight / 2 - faceCenterY * scale;
    rctx.imageSmoothingEnabled = true;
    rctx.drawImage(canvas, ox, oy, canvas.width * scale, canvas.height * scale);
  }

  const dataUrl = resultCanvas.toDataURL('image/jpeg', 0.95);
  return dataUrl;
}

/**
 * Convert a file to ImageData
 * @param file - Image file to convert
 */
const fileToImageData = async (file: File): Promise<{ data: ImageData; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({
        data: imageData,
        width: canvas.width,
        height: canvas.height
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

