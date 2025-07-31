// components/ChatUserList.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { AxiosGetUsers, axiosGetUsers } from "../../store/userStore";
import LastChatMsg from "./LastChatMsg";
import Avatar from "../ui/avatar/Avatar";
import { ActiveChatInfo } from "../../types/chat";

const LIMIT = 10;


interface Props{
  activeChatInfo: ActiveChatInfo;
  onSelectChat: (chatInfo:ActiveChatInfo) => void;
}

const ChatUserList: React.FC<Props> = ({ activeChatInfo, onSelectChat }) => {
  const [users, setUsers] = useState<AxiosGetUsers[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meUser = JSON.parse(localStorage.getItem("meUser")!);
  const meUserId = meUser?.id;

  const observer = useRef<IntersectionObserver | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const loadItems = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    controllerRef.current?.abort(); // cancel previous request
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const data = await axiosGetUsers(page, LIMIT, controller.signal);
      if(data){
        setUsers((prev) => [...prev, ...data]);
        setHasMore(data?.length === LIMIT);
        setPage((prev) => prev + 1);
      }
    } catch (err) {
      console.error(" /User get request error:", err);
      setError("Failed to load items. Try again.");
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  const lastItemObserver = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadItems();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadItems, loading, hasMore]
  );

  useEffect(() => {
    loadItems();

    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return (
    <div className="pb-26 lg:pb-10">
      {users?.map((item, index) => {
        const isLast = index === users?.length - 1;
        if (!item) return null; // Skip if item is undefined or null
        if (item?.id === meUserId) return null; // Skip if it's the current user
        return (
          <div
            key={item?.id}
            ref={isLast ? lastItemObserver : null}
            onClick={() => onSelectChat({chatId:item?.id, chatType:"personal", chatName:item?.username})}
            className={`flex lg:max-w-76 gap-2 mx-2 my-1 rounded-xl p-4 cursor-pointer text-white hover:opacity-75 ${(activeChatInfo?.chatType === "personal")&&(activeChatInfo?.chatId === item?.id) ? "bg-brand-500": "bg-cowberry-cream-500"}`}
            >
            <span className="mr-3">
              <Avatar src="/images/user/user-01.jpg" size="large" />
            </span>
            <div className="truncate">
              <h3 className="font-semibold" title={item?.username}>{item?.username}</h3>
              <div className="text-sm text-dashboard-brown-200">
                <LastChatMsg groupId={item?.id} />
              </div>
            </div>
          </div>
        );
      })}

      

      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 h-8 rounded mb-2"
          ></div>
        ))}

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
          <button
            onClick={() => loadItems()}
            className="ml-4 px-2 py-1 bg-red-100 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {!hasMore && !loading && (
        <p className="text-center text-gray-400 mt-4">No more items to load.</p>
      )}
    </div>
  );
};

export default ChatUserList;
