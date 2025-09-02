import React from "react";
import { ChatAttachment } from "../../types/chat";

interface MsgAttachmentsProps {
  attachments: ChatAttachment[];
  fileBaseUrl: string; // example: import.meta.env.VITE_FILE_URL
}

const MsgAttachments: React.FC<MsgAttachmentsProps> = ({
  attachments,
  fileBaseUrl,
}) => {
  if (!attachments || attachments.length === 0) return null;

  /** Get file extension */
  const getFileName = (path: string) => path.split("/").pop() || "file";

  /** Render different file types */
  return (
    <div className="flex flex-col gap-3">
      {attachments.map((attachment) => {
        const fileUrl = `${fileBaseUrl}${attachment.file_url}`;
        const fileType = attachment.file_type;

        // Image
        if (fileType.startsWith("image/")) {
          return (
            <img
              key={attachment.id}
              className="object-cover rounded-lg max-w-xs shadow"
              src={fileUrl}
              alt={getFileName(attachment.file_url)}
            />
          );
        }

        // Video
        if (fileType.startsWith("video/")) {
          return (
            <video
              key={attachment.id}
              className="rounded-lg max-w-xs shadow"
              muted
              loop
              controls
              src={fileUrl}
            />
          );
        }

        // Documents (pdf, csv, word, excel, etc.)
        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 bg-green-100 border rounded-lg p-3 max-w-xs shadow"
          >
            {/* File Icon */}
            <div className="bg-brand-500 text-white w-10 h-10 flex items-center justify-center rounded-lg text-lg">
              📄
            </div>

            {/* File Info */}
            <div className="flex-1 w-1/2">
              <p className="text-sm w-full font-semibold text-green-800 truncate">
                {getFileName(attachment.file)}
              </p>
              <p className="text-xs text-gray-500">{fileType}</p>
            </div>

            {/* Download Button */}
            <a
              href={fileUrl}
              download
              className="bg-brand-500 text-white text-xs px-3 py-1 rounded hover:bg-brand-600 transition"
            >
              Download
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(MsgAttachments);
