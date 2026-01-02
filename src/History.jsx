import React, { useEffect } from "react";
import { NewChatIcon } from "./assets/new-chat-icon.jsx";
import { useGlobal } from "./context/global-context.jsx";

export default function History() {
  const hook = useGlobal();

  useEffect(() => {
    const event = { type: "@load_messages" };
    hook.dispatch(event);
  }, []);

  const saveHistory = () => {
    const event = { type: "@save_history" };
    hook.dispatch(event);
    // Recargar sin timeout para mejor UX
    window.location.reload();
  };

  const loadChat = (chat) => {
    // Cargar un chat anterior
    const event = { type: "@load_chat", payload: chat.content };
    hook.dispatch(event);
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-900 text-white p-4 border-r border-gray-800">
      <div className="flex flex-col items-start">
        <span className="mb-4 text-xl font-bold">ChatGPT Clone</span>
        <div className="p-1 mt-4 w-full">
          <button
            className="flex items-center justify-center gap-2 p-2 bg-blue-600 rounded-lg w-full hover:bg-blue-700 cursor-pointer transition"
            onClick={saveHistory}
          >
            <NewChatIcon />
            Nuevo chat
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-4 mb-4">
        <h3 className="text-sm text-gray-400 mb-2">Historial</h3>
        <ul className="space-y-2 text-sm">
          {hook?.state?.messages?.map((msg) => (
            <li
              key={msg.id}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer truncate"
              onClick={() => loadChat(msg)}
            >
              {msg.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}