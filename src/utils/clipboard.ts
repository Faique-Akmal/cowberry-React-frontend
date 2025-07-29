import toast from "react-hot-toast"

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Message copied!");
  } catch (err) {
  console.error("Failed to copy: ", err);
  toast.error("Failed to copy");
  }
}
