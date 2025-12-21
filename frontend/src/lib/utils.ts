// Helper function to format date to local time with relative time support
export const formatLocalTime = (dateString?: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }

    // Get dates at midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate difference in days
    const diffInMs = today.getTime() - messageDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Format time without seconds (HH:MM format, 24-hour)
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const timeString = date.toLocaleTimeString("en-US", timeOptions);

    // Format date for older messages
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    };
    const dateStringFormatted = date.toLocaleDateString("en-US", dateOptions);

    // Determine relative time
    if (diffInDays === 0) {
      // Today
      return `Today at ${timeString}`;
    } else if (diffInDays === 1) {
      // Yesterday
      return `Yesterday at ${timeString}`;
    } else if (diffInDays < 7) {
      // This week - show day name
      const dayOptions: Intl.DateTimeFormatOptions = { weekday: "long" };
      const dayName = date.toLocaleDateString("en-US", dayOptions);
      return `${dayName} ${timeString}`;
    } else if (diffInDays < 365) {
      // This year - show date without year
      return dateStringFormatted;
    } else {
      // Older than a year - show full date
      return dateStringFormatted;
    }
  } catch {
    return dateString;
  }
};
