import React from "react";
import MsgDropdown from "./MsgDropdown";
import TimeZone from "../common/TimeZone";
import { useMessageStore } from "../../store/messageStore";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";
import MsgAttachments from "./MsgAttachments";
import { BsCheck2All } from "react-icons/bs";
import { FaMapLocationDot } from "react-icons/fa6";

interface Props {
  activeChatInfo?: ActiveChatInfo;
  meUserId: number;
  msgId: number;
  replyMsg: (msg: ChatMessage) => void;
}

const MsgCard: React.FC<Props> = React.memo(
  ({ meUserId, msgId, replyMsg }) => {
    const { getMessageById } = useMessageStore();
    const msg = getMessageById(msgId!)!;
    const parentMessage = getMessageById(msg.parent!);

    const isMe = meUserId === msg?.sender;

    return (
      <div
        className={`max-w-xs flex flex-col gap-1 p-2 rounded-lg ${isMe
          ? "bg-brand-500 text-white self-end ml-auto rounded-br-none"
          : "bg-green-800 text-white self-start rounded-bl-none"
          }`}
      >
        {/* Header */}
        {msg?.is_deleted ? (
          <div className="relative flex justify-between gap-2">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {isMe ? "" : msg?.sender_username}
            </h4>
          </div>
        ) : (
          <div className="relative flex justify-between gap-2">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {isMe ? `${msg?.sender_username} (You)` : msg?.sender_username}
            </h4>
            <MsgDropdown
              msgId={msg?.id}
              meUserId={meUserId}
              replyMsg={replyMsg}
            />
          </div>
        )}

        {/* Parent (Reply) */}
        {!msg?.is_deleted && !!msg?.parent && (
          <div>
            <div className="w-full bg-green-600 p-2 rounded-lg border-l-5 border-cowberry-cream-500">
              <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
                {parentMessage?.sender_username}
              </h4>
              <p>{parentMessage?.content}</p>
            </div>
          </div>
        )}

        <div className="gap-2 flex flex-col">
          {/* Deleted Msg */}
          {msg.is_deleted ? (
            <div className="flex gap-2 items-center text-gray-200">
              <div title="delete icon">
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    preserveAspectRatio="xMidYMid meet"
                    className=""
                    fill="none"
                  >
                    <title>recalled</title>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.75897 6.43054C8.93584 5.533 10.4057 5 12 5C15.866 5 19 8.13401 19 12C19 13.5943 18.467 15.0642 17.5695 16.241L7.75897 6.43054ZM6.35707 7.85707C5.50399 9.01706 5 10.4497 5 12C5 15.866 8.13401 19 12 19C13.5503 19 14.9829 18.496 16.1429 17.6429L6.35707 7.85707ZM12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
              </div>
              <div>
                <em>This message was deleted</em>
              </div>
            </div>
          ) : (
            <div className="break-words">
              {/* Attachments */}
              {msg.attachments!.length > 0 && (
                <MsgAttachments
                  attachments={msg.attachments || []}
                  fileBaseUrl={import.meta.env.VITE_FILE_URL}
                />
              )}

              {/* 📍 Location Preview */}
              {msg.message_type === "location" &&
                msg.latitude &&
                msg.longitude && (
                  <div className="bg-green-900 text-white rounded-lg overflow-hidden">
                    {/* Static Map Preview (OpenStreetMap → no API key) */}
                    <a
                      href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-none"
                    >
                      <img
                        src={`https://static-maps.yandex.ru/1.x/?ll=${msg.longitude},${msg.latitude}&size=450,250&z=15&l=map&pt=${msg.longitude},${msg.latitude},pm2rdm`}
                        alt="Location Preview"
                        className="w-full h-40 object-cover rounded-tl rounded-tr"
                      />

                    </a>
                    <div className="p-2 flex flex-col items-center gap-2">
                      <p className="flex items-center text-sm self-start font-semibold">
                        <FaMapLocationDot className="text-lg" />&nbsp;&nbsp;{msg.content || "Location shared"}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="mx-auto overflow-hidden relative w-32 h-8 bg-brand-500 text-white border-none rounded-md text-sm font-bold cursor-pointer z-10 group">
                          Open map
                          <span className="absolute w-36 h-32 -top-8 -left-2 bg-white rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-left" />
                          <span className="absolute w-36 h-32 -top-8 -left-2 bg-green-400 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-left" />
                          <span className="absolute w-36 h-32 -top-8 -left-2 bg-green-600 rotate-12 transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-left" />
                          <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.5 left-9 z-10">Explore!</span>
                        </button>
                      </a>
                    </div>
                  </div>
                )}

              {/* Text Content */}
              {msg.message_type !== "location" && (
                <p className="mt-2 px-2">{msg?.content}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <small className="flex gap-2 text-xs items-center justify-end text-gray-200">
            {!msg?.is_deleted && !!msg?.is_edited && <span>Edited</span>}
            <TimeZone utcDateStr={msg?.sent_at} />
            {!msg?.is_deleted && isMe && <span className={`text-xl ${msg.is_read ? "text-[#00CAFF]" : "text-gray-300"}`} title={msg.is_read ? "Read" : "Delivered"}>
              <BsCheck2All />
            </span>}
          </small>
        </div>
      </div>
    );
  }
);

export default MsgCard;
