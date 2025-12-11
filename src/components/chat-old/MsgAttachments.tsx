import React from "react";
import { ChatAttachment } from "../../types/chat";
import { FaFile } from "react-icons/fa6";

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
            <div className="bg-brand-500 text-white w-10 h-10 flex items-center justify-center rounded-lg text-xl">
              <FaFile />
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
            >
              <div className="group relative">
                <button className="bg-cowberry-green-500 w-10 h-10 flex justify-center items-center rounded-lg hover:text-green-200 hover:translate-y-1 hover:duration-300">
                  <svg className="w-6 h-6" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(MsgAttachments);
