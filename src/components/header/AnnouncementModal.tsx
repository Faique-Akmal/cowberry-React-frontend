// AnnouncementModal.tsx
import { Announcement } from "./NotificationDropdown";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

export default function AnnouncementModal({ isOpen, onClose, announcement }: AnnouncementModalProps) {
  if (!isOpen || !announcement) return null;

  // Function to format date for display
  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
 <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 p-4">
  {/* Backdrop with blur effect */}
  <div 
    className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
    onClick={onClose}
  ></div>

  {/* Modal with glassmorphism */}
  <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
    {/* Glassmorphism container */}
    <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl overflow-hidden">
      {/* Optional subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-gray-800/10 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {announcement.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${getPriorityColor(announcement.priority)} backdrop-blur-sm border border-white/30 dark:border-gray-700/30`}>
              {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-700/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
              {announcement.category}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="relative p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Metadata with glass effect */}
        <div className="mb-6 p-5 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posted by</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {announcement.createdBy.username}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {announcement.createdBy.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posted on</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatFullDate(announcement.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid from</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatFullDate(announcement.startDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid until</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatFullDate(announcement.endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Description
          </h4>
          <p className="text-gray-700 dark:text-gray-300 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm p-4 rounded-xl border border-white/30 dark:border-gray-700/30">
            {announcement.description}
          </p>
        </div>

        {/* Full Content */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="mr-2">📄</span>
            Details
          </h4>
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-white/30 dark:border-gray-700/30">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
              {announcement.content}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative flex justify-end gap-3 p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 hover:bg-white dark:hover:bg-gray-600 backdrop-blur-sm border border-white/50 dark:border-gray-600/50 rounded-xl hover:shadow-lg transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>
  );
}