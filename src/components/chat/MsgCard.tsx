import React from "react";
import MsgDropdown from "./MsgDropdown";
import TimeZone from "../common/TimeZone";
import { useMessageStore } from "../../store/messageStore";
import { ActiveChatInfo, ChatMessage } from "../../types/chat";
import MsgAttachments from "./MsgAttachments";

interface Props {
  activeChatInfo?: ActiveChatInfo;
  meUserId: number;
  msgId: number;
  replyMsg: (msg: ChatMessage) => void;
}

const MsgCard: React.FC<Props> = React.memo(({ meUserId, msgId, replyMsg }) => {
  const { getMessageById } = useMessageStore();
  const msg = getMessageById(msgId!)!;
  const parentMessage = getMessageById(msg.parent!);

  return (
    <div
      className={`max-w-xs flex flex-col gap-1 p-2 rounded-lg ${meUserId === msg?.sender
        ? "bg-brand-500 text-white self-end ml-auto rounded-br-none"
        : "bg-green-800 text-white self-start rounded-bl-none"
        }`}
    >
      {!msg?.is_deleted && (
        <div className="relative flex justify-between gap-2">
          <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
            {msg?.sender === meUserId ? `${msg?.sender_username} (You)` : msg?.sender_username}
          </h4>
          <MsgDropdown msgId={msg?.id} meUserId={meUserId} replyMsg={replyMsg} />
        </div>
      )}

      {!msg?.is_deleted && !!msg?.parent &&
        <div>
          <div className="w-full bg-green-600 p-2 rounded-lg border-l-5 border-cowberry-cream-500">
            <h4 className="text-xs capitalize font-bold text-cowberry-cream-500">
              {parentMessage?.sender_username}
            </h4>
            <p>
              {parentMessage?.content}
            </p>
          </div>
        </div>
      }
      <div className="gap-2 flex flex-col">
        {msg.is_deleted ?
          <div className="flex gap-2 items-center text-gray-200">
            <div title="delete icon">
              <span>
                <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" fill="none"><title>recalled</title><path fillRule="evenodd" clipRule="evenodd" d="M7.75897 6.43054C8.93584 5.533 10.4057 5 12 5C15.866 5 19 8.13401 19 12C19 13.5943 18.467 15.0642 17.5695 16.241L7.75897 6.43054ZM6.35707 7.85707C5.50399 9.01706 5 10.4497 5 12C5 15.866 8.13401 19 12 19C13.5503 19 14.9829 18.496 16.1429 17.6429L6.35707 7.85707ZM12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" fill="currentColor"></path></svg>
              </span>
            </div>
            <div>
              <em>
                This message was deleted
              </em>
            </div>
          </div> :
          <div className="break-words">
            {msg.attachments!.length > 0 && <MsgAttachments
              attachments={msg.attachments || []}
              fileBaseUrl={import.meta.env.VITE_FILE_URL}
            />}
            {!!msg?.latitude && <p className="mt-2 px-2 text-green-300">Lat: {msg?.latitude}</p>}
            {!!msg?.longitude && <p className="mt-2 px-2 text-green-300">Long: {msg?.longitude}</p>}
            <p className="mt-2 px-2">{msg?.content}</p>
          </div>}

        <small className="flex gap-2 text-xs justify-end text-gray-200">
          {!msg?.is_deleted && !!msg?.is_edited && <span>Edited</span>}
          <TimeZone utcDateStr={msg?.sent_at} />
        </small>
      </div>
    </div>
  )
});

export default MsgCard