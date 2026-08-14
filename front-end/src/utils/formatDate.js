// front-end/src/utils/formatDate.js
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).fromNow(); // Output: "4 days ago", "a few seconds ago"
};