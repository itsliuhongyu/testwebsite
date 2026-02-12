/**
 * Functions for managing race data in sessionStorage
 */

/**
 * Save race IDs and address to sessionStorage
 * @param {Object} raceIds - Object containing assembly, senate, and congress race IDs
 * @param {string} address - The searched address
 */
export function saveRacesToLocalStorage(raceIds, address) {
    if (typeof window !== 'undefined' && raceIds) {
        const racesData = {
            assembly: raceIds.assembly,
            senate: raceIds.senate,
            congress: raceIds.congress,
            address: address,
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('savedRaces', JSON.stringify(racesData));
        return racesData;
    }
    return null;
}

/**
 * Load saved races from sessionStorage
 * @returns {Object|null} Saved races data or null if not found
 */
export function loadRacesFromLocalStorage() {
    if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('savedRaces');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error loading saved races:', error);
                return null;
            }
        }
    }
    return null;
}

/**
 * Clear saved races from sessionStorage
 */
export function clearSavedRaces() {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('savedRaces');
    }
}

/**
 * Save the source race information when navigating to a candidate page
 * @param {string} raceType - Type of race ('senate', 'assembly', 'congress')
 * @param {string} raceId - The race ID (e.g., 'se-1', 'as-1', 'co-1')
 */
export function saveSourceRace(raceType, raceId) {
    if (typeof window !== 'undefined') {
        const sourceRaceData = {
            raceType,
            raceId,
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('sourceRace', JSON.stringify(sourceRaceData));
    }
}

/**
 * Load the source race information
 * @returns {Object|null} Source race data or null if not found
 */
export function loadSourceRace() {
    if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('sourceRace');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error loading source race:', error);
                return null;
            }
        }
    }
    return null;
}

/**
 * Clear the source race from sessionStorage
 */
export function clearSourceRace() {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sourceRace');
    }
}
