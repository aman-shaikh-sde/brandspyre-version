import moment from 'moment-timezone';

// Get the current time in IST
const nowIST = moment().tz("Asia/Kolkata");

// Format as railway time (24-hour format)
export const todayDate = nowIST.format("YYYY-MM-DD");
export const todayTime = nowIST.format("HH:mm:ss"); // 24-hour format
export const todayDateTime = nowIST.format("YYYY-MM-DD HH:mm:ss"); // Full timestamp
