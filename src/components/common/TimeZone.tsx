import { useEffect, useState } from "react";

interface Props {
  utcDateStr: string;
}

function TimeZone({ utcDateStr }: Props) {
  const [istDateStr, setIstDateStr] = useState<string>("");

  useEffect(() => {
    const utcDate = new Date(utcDateStr);

    // Format in IST using toLocaleString with timeZone
    const NewIstDateStr = utcDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true, // Optional: for AM/PM format
    });

    setIstDateStr(NewIstDateStr);
  }, [utcDateStr])

  return (
    <span>{istDateStr}</span>
  )
}

export default TimeZone;