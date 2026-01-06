/**
 * Convert 24-hour time format (HH:mm) to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns Time in 12-hour format with AM/PM (e.g., "2:30 PM", "9:00 AM")
 */
export function formatTo12Hour(time24: string | null | undefined): string {
  if (!time24) return '';
  
  try {
    const [hours24, minutes] = time24.split(':').map(Number);
    
    if (isNaN(hours24) || isNaN(minutes)) {
      return time24; // Return original if invalid
    }
    
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time24; // Return original on error
  }
}

/**
 * Convert 12-hour time format with AM/PM to 24-hour format (HH:mm)
 * @param time12 - Time in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 * @returns Time in 24-hour format (e.g., "14:30", "09:00")
 */
export function formatTo24Hour(time12: string): string {
  if (!time12) return '';
  
  try {
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return time12; // Return original if format doesn't match
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting time:', error);
    return time12; // Return original on error
  }
}

/**
 * Get current time in Saudi Arabia timezone (Asia/Riyadh)
 * @returns Current time in HH:MM format in Saudi Arabia timezone
 */
export function getCurrentSaudiTime(): string {
  const now = new Date();
  
  // Convert to Saudi Arabia timezone (Asia/Riyadh, UTC+3)
  const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  
  const hours = saudiTime.getHours().toString().padStart(2, '0');
  const minutes = saudiTime.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Get current day of week in Saudi Arabia timezone (0 = Sunday, 5 = Friday)
 * @returns Day of week number (0-6)
 */
export function getCurrentSaudiDay(): number {
  const now = new Date();
  
  // Convert to Saudi Arabia timezone (Asia/Riyadh, UTC+3)
  const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  
  return saudiTime.getDay();
}

/**
 * Check if current time is within operating hours
 * Handles cases where closing time is after midnight (next day)
 * @param openTime - Opening time in HH:MM format
 * @param closeTime - Closing time in HH:MM format
 * @returns true if currently within operating hours
 */
export function isWithinOperatingHours(openTime: string, closeTime: string): boolean {
  // Get current time in Saudi Arabia timezone
  const currentTime = getCurrentSaudiTime();
  
  // If closing time is less than opening time, it means the branch closes after midnight
  if (closeTime < openTime) {
    // Branch is open if current time is >= opening time OR <= closing time
    return currentTime >= openTime || currentTime <= closeTime;
  } else {
    // Normal case: branch opens and closes on the same day
    return currentTime >= openTime && currentTime <= closeTime;
  }
}
