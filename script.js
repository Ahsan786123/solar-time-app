// Solar Time Calculator - Main JavaScript File

// Constants
const IST_MERIDIAN = 82.5; // Indian Standard Time meridian in degrees East
const MINUTES_PER_DEGREE = 4; // Time difference per degree of longitude

// Global variables
let userLocation = null;
let updateInterval = null;

// DOM Elements
const elements = {
    statusBar: document.getElementById('statusBar'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    mainContent: document.getElementById('mainContent'),
    errorMessage: document.getElementById('errorMessage'),
    latitude: document.getElementById('latitude'),
    longitude: document.getElementById('longitude'),
    longitudeDifference: document.getElementById('longitudeDifference'),
    currentIST: document.getElementById('currentIST'),
    localSolarTime: document.getElementById('localSolarTime'),
    solarNoon: document.getElementById('solarNoon'),
    timeDifference: document.getElementById('timeDifference'),
    zawaalStart: document.getElementById('zawaalStart'),
    zawaalEnd: document.getElementById('zawaalEnd'),
    calcLongDiff: document.getElementById('calcLongDiff'),
    calcTimeAdj: document.getElementById('calcTimeAdj'),
    calcDirection: document.getElementById('calcDirection')
};

/**
 * Initialize the application
 */
function init() {
    console.log('Solar Time Calculator initializing...');
    requestLocation();
}

/**
 * Request user's geolocation
 */
function requestLocation() {
    // Show loading indicator
    elements.statusBar.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
    elements.errorMessage.classList.add('hidden');

    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        options
    );
}

/**
 * Handle successful location detection
 * @param {GeolocationPosition} position - The geolocation position
 */
function handleLocationSuccess(position) {
    console.log('Location detected successfully');
    
    userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
    };

    // Hide loading and show main content
    elements.statusBar.classList.add('hidden');
    elements.mainContent.classList.remove('hidden');

    // Update UI with location data
    updateLocationDisplay();
    
    // Start real-time clock updates
    startClockUpdate();
    
    console.log(`Location: ${userLocation.latitude}, ${userLocation.longitude}`);
}

/**
 * Handle location detection errors
 * @param {GeolocationPositionError} error - The error object
 */
function handleLocationError(error) {
    console.error('Location detection failed:', error);
    
    let errorMessage = 'Unable to detect your location. ';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access and try again.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
        default:
            errorMessage += 'An unknown error occurred.';
            break;
    }

    showError(errorMessage);
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.statusBar.classList.add('hidden');
    elements.mainContent.classList.add('hidden');
    elements.errorMessage.classList.remove('hidden');
    
    // Update error message if needed
    const errorText = elements.errorMessage.querySelector('p');
    if (errorText && message !== 'Unable to detect your location. Please allow location access and try again.') {
        errorText.textContent = message;
    }
}

/**
 * Update location display with user's coordinates
 */
function updateLocationDisplay() {
    if (!userLocation) return;

    // Display coordinates
    elements.latitude.textContent = `${userLocation.latitude.toFixed(6)}°`;
    elements.longitude.textContent = `${userLocation.longitude.toFixed(6)}°`;

    // Calculate longitude difference from IST meridian
    const longitudeDiff = userLocation.longitude - IST_MERIDIAN;
    const timeDiffMinutes = longitudeDiff * MINUTES_PER_DEGREE;
    
    // Display longitude difference
    elements.longitudeDifference.textContent = `${Math.abs(longitudeDiff).toFixed(2)}° ${longitudeDiff >= 0 ? 'East' : 'West'}`;
    
    // Display time difference
    elements.timeDifference.textContent = `${Math.abs(timeDiffMinutes).toFixed(1)} minutes ${longitudeDiff >= 0 ? 'ahead' : 'behind'}`;

    // Update calculation details
    elements.calcLongDiff.textContent = Math.abs(longitudeDiff).toFixed(2);
    elements.calcTimeAdj.textContent = Math.abs(timeDiffMinutes).toFixed(1);
    elements.calcDirection.textContent = longitudeDiff >= 0 ? 'East of IST meridian (time ahead)' : 'West of IST meridian (time behind)';
}

/**
 * Start the real-time clock update
 */
function startClockUpdate() {
    // Update immediately
    updateTimeDisplays();
    
    // Update every second
    updateInterval = setInterval(updateTimeDisplays, 1000);
}

/**
 * Update all time displays
 */
function updateTimeDisplays() {
    if (!userLocation) return;

    const now = new Date();
    
    // Calculate current IST
    const istTime = getCurrentIST(now);
    elements.currentIST.textContent = formatTime(istTime);

    // Calculate local solar time
    const solarTime = getLocalSolarTime(now, userLocation.longitude);
    elements.localSolarTime.textContent = formatTime(solarTime);

    // Calculate solar noon
    const solarNoonTime = getSolarNoon(userLocation.longitude);
    elements.solarNoon.textContent = formatTime(solarNoonTime);

    // Calculate Zawaal time (20 minutes before and after solar noon)
    const zawaalStart = new Date(solarNoonTime.getTime() - 20 * 60 * 1000);
    const zawaalEnd = new Date(solarNoonTime.getTime() + 20 * 60 * 1000);
    elements.zawaalStart.textContent = formatTime(zawaalStart);
    elements.zawaalEnd.textContent = formatTime(zawaalEnd);
}

/**
 * Get current IST time
 * @param {Date} utcDate - UTC date object
 * @returns {Date} - IST time
 */
function getCurrentIST(utcDate = new Date()) {
    // Get current time in IST timezone directly
    const now = new Date();
    
    // Get IST time using Intl.DateTimeFormat
    const istFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = istFormatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year').value);
    const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // JS months are 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day').value);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    const second = parseInt(parts.find(p => p.type === 'second').value);
    
    return new Date(year, month, day, hour, minute, second);
}

/**
 * Calculate local solar time based on longitude
 * @param {Date} utcDate - UTC date object
 * @param {number} longitude - User's longitude
 * @returns {Date} - Local solar time
 */
function getLocalSolarTime(utcDate, longitude) {
    // Start with IST
    const istTime = getCurrentIST(utcDate);
    
    // Calculate longitude difference from IST meridian
    const longitudeDiff = longitude - IST_MERIDIAN;
    
    // Convert longitude difference to time difference (4 minutes per degree)
    const timeDiffMinutes = longitudeDiff * MINUTES_PER_DEGREE;
    const timeDiffMs = timeDiffMinutes * 60 * 1000;
    
    // Apply the time difference to IST
    return new Date(istTime.getTime() + timeDiffMs);
}

/**
 * Calculate solar noon for the user's longitude
 * @param {number} longitude - User's longitude
 * @returns {Date} - Solar noon time
 */
function getSolarNoon(longitude) {
    // Solar noon occurs at 12:00 at the location's local solar time
    // Start with current IST time to get the correct date
    const currentIST = getCurrentIST();
    
    // Create a noon time for today in IST (12:00:00)
    const istNoon = new Date(currentIST);
    istNoon.setHours(12, 0, 0, 0);
    
    // Calculate longitude difference from IST meridian
    const longitudeDiff = longitude - IST_MERIDIAN;
    
    // Convert to time difference (4 minutes per degree)
    const timeDiffMinutes = longitudeDiff * MINUTES_PER_DEGREE;
    const timeDiffMs = timeDiffMinutes * 60 * 1000;
    
    // Apply the time difference to get solar noon at user's location
    return new Date(istNoon.getTime() + timeDiffMs);
}

/**
 * Format time to HH:MM:SS format
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted time string
 */
function formatTime(date) {
    if (!date || isNaN(date.getTime())) {
        return '--:--:--';
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Cleanup function to stop intervals
 */
function cleanup() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// Event Listeners
window.addEventListener('load', init);
window.addEventListener('beforeunload', cleanup);

// Handle page visibility changes to optimize performance
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        cleanup();
    } else if (userLocation) {
        startClockUpdate();
    }
});

// Utility function for retry button
function retryLocation() {
    requestLocation();
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentIST,
        getLocalSolarTime,
        getSolarNoon,
        formatTime
    };
}

console.log('Solar Time Calculator script loaded successfully');
