// src/components/MessageModal.tsx
import { useMessageModalStore } from '../../../store/messageModalStore'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSocketStore } from '../../../store/socketStore'

const MessageModal = () => {
  const { isOpen, mode, targetMessage, closeModal } = useMessageModalStore()
  const sendJson = useSocketStore((state) => state.sendJson);

  const [text, setText] = useState(targetMessage?.content || '')

  if (!isOpen || !targetMessage) return null;

  console.log(targetMessage || null)

  const handleSubmit = () => {
    if (mode === 'edit') {
      sendJson({ type: "edit_message", message_id: targetMessage?.id, is_edited: true, new_content: text });
      // editMessage(targetMessage.id, { content: text });
      toast.success('Message edited');
    } else {
      // const reply = {
      //   ...targetMessage,
      //   id: Date.now(), // temp ID
      //   content: text,
      //   parent: targetMessage?.id,
      //   replies: [],
      //   is_read: false,
      //   read_at: null,
      //   sent_at: new Date().toISOString(),
      //   is_deleted: false,
      // };

      sendJson({
        type: "send_message",
        content: text,
        group_id: parseInt("1"),
        receiver_id: null,
        parent_id: targetMessage?.id,
      });
      // addReply(targetMessage.id, reply);
      // sendJson({ type: "edit_message", message_id: targetMessage?.id, is_edited: true, new_content: text });
      toast.success('Reply sent');
    }

    closeModal();
  }

  return (
    <div className="fixed inset-0 bg-black/5 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-3">
          {mode === 'edit' ? 'Edit Message' : 'Reply to Message'}
        </h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded p-2"
          rows={4}
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={closeModal} className="text-gray-600 px-3 py-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            {mode === 'edit' ? 'Save' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageModal;
