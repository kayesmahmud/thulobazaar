/**
 * Format a timestamp into a relative time string
 * @param timestamp - ISO timestamp string or Date object
 * @returns Relative time string (e.g., "5m ago", "2h ago", "3d ago")
 */
export function getTimeAgo(timestamp: string | Date): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Get badge variant based on status string
 * @param status - Status string (e.g., "pending", "approved", "rejected")
 * @returns Badge variant type
 */
export function getStatusBadgeVariant(
  status: string
): 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary' {
  const lowercaseStatus = status.toLowerCase();

  if (lowercaseStatus.includes('approve') || lowercaseStatus.includes('active') || lowercaseStatus === 'resolved') {
    return 'success';
  }
  if (lowercaseStatus.includes('reject') || lowercaseStatus.includes('delete') || lowercaseStatus.includes('suspended')) {
    return 'danger';
  }
  if (lowercaseStatus.includes('pending') || lowercaseStatus.includes('flagged')) {
    return 'warning';
  }
  if (lowercaseStatus.includes('progress') || lowercaseStatus.includes('verification')) {
    return 'info';
  }

  return 'neutral';
}

/**
 * Get Tailwind CSS classes for badge colors
 * @param status - Status string
 * @returns Tailwind CSS classes for badge styling
 */
export function getBadgeClasses(status: string): string {
  const variant = getStatusBadgeVariant(status);

  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-teal-100 text-teal-800 border-teal-200',
  };

  return variantClasses[variant];
}

/**
 * Get priority badge classes
 * @param priority - Priority level (low, medium, high, urgent)
 * @returns Tailwind CSS classes for priority badge
 */
export function getPriorityBadgeClasses(priority: string): string {
  const badges: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
  };
  return badges[priority.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Format a number with thousand separators
 * @param num - Number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Truncate text to a specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
