import moment from 'moment-timezone';

// Get the current time in IST
const nowIST = moment().tz("Asia/Kolkata");

// Format as railway time (24-hour format)
export const todayDate = nowIST.format("YYYY-MM-DD");
export const todayTime = nowIST.format("HH:mm:ss"); // 24-hour format
export const todayDateTime = nowIST.format("YYYY-MM-DD HH:mm:ss"); // Full timestamp

console.log("Date:", todayDate);            // e.g., 2025-05-23
console.log("Time (Railway):", todayTime);  // e.g., 18:25:00
console.log("Date & Time:", todayDateTime); // e.g., 2025-05-23 18:25:00
