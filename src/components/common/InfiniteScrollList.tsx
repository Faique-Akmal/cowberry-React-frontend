// components/InfiniteScrollList.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { AxiosGetUsers, axiosGetUsers } from "../../store/userStore";
import MemberSelect from "../form/MemberSelect";

const LIMIT = 10;

interface Option {
  value: number;
  name: string;
}

interface Props{
  selectedValues: string[];
  onChange?: (selected: string[]) => void;
}

const InfiniteScrollList: React.FC<Props> = ({ selectedValues, onChange }) => {
  const [users, setUsers] = useState<AxiosGetUsers[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<Option[]>([]);


  const observer = useRef<IntersectionObserver | null>(null);
  // const lastItemRef = useRef<HTMLDivElement | null>(null);

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
      if (users.length > 0) {
        const transformed = users.map<Option>(user => ({
          value: user?.id,
          name: user?.username,
        }));
        setUserOptions(transformed);
      }
  
    }, [users]);

  useEffect(() => {
    loadItems();

    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return (
    <div>
      {/* {users?.map((item, index) => {
        const isLast = index === users?.length - 1;
        return (
          <div
            key={item?.id}
            ref={isLast ? lastItemObserver : null}
            className="border p-3 mb-2 rounded shadow-sm"
          >
            {item?.username}
          </div>
        );
      })} */}

      <MemberSelect
        label="Multiple Select Options"
        options={userOptions}
        onChange={onChange}
        lastItemObserver={lastItemObserver}
      />
      <p className="sr-only">
        Selected Values: {selectedValues.join(", ")}
      </p>

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

export default InfiniteScrollList;
