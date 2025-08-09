import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Cleanup orphaned interview stages from localStorage
 *
 * This function should be called to clean up interview stages that may be
 * orphaned in localStorage. These can happen when:
 * 1. Applications are deleted without cleaning up their interview stages
 * 2. Interview stages are created for applications that are then deleted
 * 3. Due to UI interactions that create duplicates or orphaned stages
 */
export function cleanupOrphanedInterviewStages() {
    console.log('Running interview stages cleanup...');
    // First get all application IDs from localStorage
    const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
    const validAppIds = new Set(mockApps.map((app) => app.id.toString()));
    console.log(`Found ${validAppIds.size} valid applications`);
    // Now scan localStorage for all interview stage keys
    const stagesToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key)
            continue;
        // Check for interview stage keys
        if (key.startsWith('mockStages_') || key.startsWith('mockInterviewStages_')) {
            // Extract application ID from the key
            let appId = null;
            if (key.startsWith('mockStages_')) {
                appId = key.replace('mockStages_', '');
            }
            else if (key.startsWith('mockInterviewStages_')) {
                appId = key.replace('mockInterviewStages_', '');
            }
            // If this app ID is not in our valid list, mark it for removal
            if (appId && !validAppIds.has(appId)) {
                stagesToRemove.push(key);
            }
        }
        // Also look for application data keys
        if (key.startsWith('application_') && key.endsWith('_data')) {
            const appId = key.replace('application_', '').replace('_data', '');
            if (!validAppIds.has(appId)) {
                stagesToRemove.push(key);
            }
        }
        // Also look for followup keys
        if (key.startsWith('mockFollowups_')) {
            const appId = key.replace('mockFollowups_', '');
            if (!validAppIds.has(appId)) {
                stagesToRemove.push(key);
            }
        }
    }
    // Remove all orphaned keys
    console.log(`Found ${stagesToRemove.length} orphaned keys to remove`);
    stagesToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
            console.log(`Removed orphaned key: ${key}`);
        }
        catch (e) {
            console.error(`Error removing key ${key}:`, e);
        }
    });
    // Clear interview count cache
    try {
        localStorage.removeItem('upcomingInterviewCount');
    }
    catch (e) {
        // Ignore localStorage errors
    }
    // Dispatch events to update UI
    try {
        window.dispatchEvent(new Event('interviewStageChange'));
        window.dispatchEvent(new Event('applicationStatusChange'));
    }
    catch (e) {
        console.error('Error dispatching update events:', e);
    }
    console.log('Interview stages cleanup complete');
}
