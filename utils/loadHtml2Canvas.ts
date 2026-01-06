/**
 * Dynamically load html2canvas from CDN
 * This allows us to use html2canvas without installing it as a dependency
 */

let html2canvasLoaded = false;
let html2canvasPromise: Promise<any> | null = null;

export const loadHtml2Canvas = (): Promise<any> => {
  if (html2canvasLoaded && (window as any).html2canvas) {
    return Promise.resolve((window as any).html2canvas);
  }
  
  if (html2canvasPromise) {
    return html2canvasPromise;
  }
  
  html2canvasPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).html2canvas) {
      html2canvasLoaded = true;
      resolve((window as any).html2canvas);
      return;
    }
    
    // Load from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    
    script.onload = () => {
      html2canvasLoaded = true;
      resolve((window as any).html2canvas);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load html2canvas'));
    };
    
    document.head.appendChild(script);
  });
  
  return html2canvasPromise;
};
