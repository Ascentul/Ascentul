// fabric-loader.ts - Utility for loading Fabric.js

interface FabricWindow {
  fabric?: any;
}

declare global {
  interface Window extends FabricWindow {}
}

let fabricLoadPromise: Promise<any> | null = null;

export function loadFabricJs(retryCount = 0, maxRetries = 3): Promise<any> {
  // If we've already started loading, return the existing promise
  if (fabricLoadPromise) {
    return fabricLoadPromise;
  }

  // If fabric is already loaded in the window object, resolve immediately
  if (window.fabric) {
    return Promise.resolve(window.fabric);
  }

  // Otherwise, load the script
  fabricLoadPromise = new Promise((resolve, reject) => {
    console.log('Loading Fabric.js...');
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
    script.async = true;
    
    // Set a timeout to detect loading issues
    const timeoutId = setTimeout(() => {
      console.error('Fabric.js loading timeout');
      if (retryCount < maxRetries) {
        console.log(`Retrying Fabric.js load (${retryCount + 1}/${maxRetries})...`);
        fabricLoadPromise = null;
        clearTimeout(timeoutId);
        document.body.removeChild(script);
        resolve(loadFabricJs(retryCount + 1, maxRetries));
      } else {
        reject(new Error('Fabric.js loading timed out after multiple attempts'));
      }
    }, 10000); // 10 second timeout
    
    script.onload = () => {
      clearTimeout(timeoutId);
      if (window.fabric) {
        console.log('Fabric.js loaded successfully');
        resolve(window.fabric);
      } else {
        console.error('Fabric.js loaded but not available in window');
        if (retryCount < maxRetries) {
          console.log(`Retrying Fabric.js load (${retryCount + 1}/${maxRetries})...`);
          fabricLoadPromise = null;
          document.body.removeChild(script);
          resolve(loadFabricJs(retryCount + 1, maxRetries));
        } else {
          reject(new Error('Fabric.js loaded but not available in window after multiple attempts'));
        }
      }
    };
    
    script.onerror = (e) => {
      clearTimeout(timeoutId);
      console.error('Error loading Fabric.js', e);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying Fabric.js load (${retryCount + 1}/${maxRetries})...`);
        fabricLoadPromise = null;
        document.body.removeChild(script);
        resolve(loadFabricJs(retryCount + 1, maxRetries));
      } else {
        reject(new Error('Failed to load Fabric.js after multiple attempts'));
      }
    };
    
    document.body.appendChild(script);
  });
  
  return fabricLoadPromise;
}

export async function getFabric(): Promise<any> {
  try {
    return await loadFabricJs();
  } catch (error) {
    console.error('Error in getFabric:', error);
    
    // Try loading from an alternative CDN if the main one fails
    try {
      // Reset the promise so we can try a different source
      fabricLoadPromise = null;
      
      // Create a custom promise with an alternative source
      fabricLoadPromise = new Promise((resolve, reject) => {
        console.log('Trying alternative Fabric.js source...');
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/fabric@5.3.0/dist/fabric.min.js';
        script.async = true;
        
        script.onload = () => {
          if (window.fabric) {
            console.log('Fabric.js loaded successfully from alternative source');
            resolve(window.fabric);
          } else {
            reject(new Error('Fabric.js loaded from alternative source but not available in window'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Fabric.js from alternative source'));
        };
        
        document.body.appendChild(script);
      });
      
      return await fabricLoadPromise;
    } catch (backupError) {
      console.error('Error loading Fabric.js from alternative source:', backupError);
      throw new Error('Failed to load Fabric.js from all sources. Please refresh the page and try again.');
    }
  }
}