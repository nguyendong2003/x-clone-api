/**
 * Username không được phép là toàn số
 * Độ dài từ 4 đến 15 ký tự
 * Chỉ được phép chứa chữ cái, số và dấu gạch dưới
 */
export const REGEX_USERNAME = /^(?![0-9]+$)[A-Za-z0-9_]{4,15}$/
