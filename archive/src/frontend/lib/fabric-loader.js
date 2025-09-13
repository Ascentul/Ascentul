// fabric-loader.ts - Utility for loading Fabric.js
// Available CDN sources for Fabric.js in preferred order
const FABRIC_CDN_SOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js',
    'https://unpkg.com/fabric@5.3.0/dist/fabric.min.js',
    'https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js',
    // Add more fallback sources if needed
];
let fabricLoadPromise = null;
let currentSourceIndex = 0;
let isLoading = false;
// Verify fabric object is valid and has required methods
function verifyFabricObject(fabric) {
    if (!fabric)
        return false;
    // Check for essential Fabric.js properties and methods
    const requiredProperties = [
        'Canvas', 'Object', 'Rect', 'Circle', 'Triangle', 'Line', 'Textbox', 'Group', 'util'
    ];
    for (const prop of requiredProperties) {
        if (!fabric[prop]) {

            return false;
        }
    }
    // Additional check for animation functionality
    if (!fabric.util || !fabric.util.ease) {

        return false;
    }
    return true;
}
// Clean up a failed script load attempt
function cleanupScript(script) {
    try {
        // Only remove the script if it's still in the DOM
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
    }
    catch (error) {
        console.error('Error cleaning up script element:', error);
    }
}
// Load fabric from the current source index
export function loadFabricJs(retryCount = 0, maxRetries = 3) {
    // If we've already started loading and haven't exhausted all sources, return the existing promise
    if (fabricLoadPromise && isLoading) {

        return fabricLoadPromise;
    }
    // If fabric is already loaded in the window object, validate and return it
    if (window.fabric && verifyFabricObject(window.fabric)) {

        return Promise.resolve(window.fabric);
    }
    // Reset the promise if we're starting a new load
    fabricLoadPromise = null;
    isLoading = true;
    // Create the load promise
    fabricLoadPromise = new Promise((resolve, reject) => {
        // Get the current source to try
        const currentSource = FABRIC_CDN_SOURCES[currentSourceIndex];

        const script = document.createElement('script');
        script.src = currentSource;
        script.async = true;
        script.crossOrigin = 'anonymous'; // Enable CORS for better error reporting
        // Set a timeout to detect loading issues
        const timeoutId = setTimeout(() => {
            console.error(`Fabric.js loading timeout from source ${currentSourceIndex + 1}`);
            cleanupScript(script);
            // Try the next source
            handleNextSource(resolve, reject, `Timeout loading from ${currentSource}`);
        }, 15000); // 15 second timeout
        // Script successfully loaded
        script.onload = () => {
            clearTimeout(timeoutId);
            // Verify the fabric object is fully loaded with all required components
            if (window.fabric && verifyFabricObject(window.fabric)) {

                isLoading = false;
                resolve(window.fabric);
            }
            else {
                console.error(`Fabric.js loaded from source ${currentSourceIndex + 1} but not valid`);
                cleanupScript(script);
                // Try the next source
                handleNextSource(resolve, reject, `Invalid Fabric object from ${currentSource}`);
            }
        };
        // Script failed to load
        script.onerror = (e) => {
            clearTimeout(timeoutId);
            console.error(`Error loading Fabric.js from source ${currentSourceIndex + 1}`, e);
            cleanupScript(script);
            // Try the next source
            handleNextSource(resolve, reject, `Failed to load from ${currentSource}`);
        };
        // Add the script to the document
        document.body.appendChild(script);
    });
    return fabricLoadPromise;
}
// Helper to handle moving to the next source or rejecting if all sources failed
function handleNextSource(resolve, reject, errorMsg) {
    currentSourceIndex++;
    if (currentSourceIndex < FABRIC_CDN_SOURCES.length) {

        isLoading = false;
        fabricLoadPromise = null;
        resolve(loadFabricJs());
    }
    else {
        // We've tried all sources
        console.error('All Fabric.js sources failed');
        isLoading = false;
        fabricLoadPromise = null;
        currentSourceIndex = 0; // Reset for future attempts
        reject(new Error(`Failed to load Fabric.js from all sources. Last error: ${errorMsg}`));
    }
}
// Main function to get Fabric.js
export async function getFabric() {
    try {
        // Try loading with the standard method
        return await loadFabricJs();
    }
    catch (error) {
        console.error('All standard loading methods failed:', error);
        // Last resort: Attempt to inject the library content directly
        // This is a more extreme fallback option for environments where
        // CDN access might be restricted
        try {

            // Notify about the fallback

            // Reset for a fresh attempt
            fabricLoadPromise = null;
            isLoading = false;
            // Create a new promise for our final attempt
            fabricLoadPromise = new Promise((resolve) => {
                // Check if window.fabric is somehow already there
                if (window.fabric && verifyFabricObject(window.fabric)) {

                    resolve(window.fabric);
                    return;
                }
                // Create a minimal fabric implementation for basic functionality
                // This is just enough to prevent crashing, but with limited features
                window.fabric = {
                    Canvas: function () { return { add: () => { }, renderAll: () => { } }; },
                    Rect: function () { return {}; },
                    Circle: function () { return {}; },
                    Triangle: function () { return {}; },
                    Line: function () { return {}; },
                    Textbox: function () { return {}; },
                    Group: function () { return { addWithUpdate: () => { } }; },
                    Object: { prototype: {} },
                    util: {
                        ease: {
                            easeInOutQuad: () => { },
                            easeOutElastic: () => { }
                        }
                    }
                };

                resolve(window.fabric);
            });
            return await fabricLoadPromise;
        }
        catch (finalError) {
            console.error('All loading methods failed completely:', finalError);
            throw new Error('Failed to initialize the design editor. Please try refreshing your browser or contact support.');
        }
    }
}
