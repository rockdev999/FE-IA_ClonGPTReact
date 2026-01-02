import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendHorizontal } from "lucide-react";
import { useGlobal } from "./context/global-context";
import useOllamaHook from "./api/useOllamaHook.js";

const messageSchema = z.object({
  text: z
    .string()
    .min(3, "El mensaje debe tener al menos 3 caracteres")
    .max(200, "El mensaje es demasiado largo"),
});

// Función para limpiar las etiquetas <think>
function cleanThinkTags(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export default function App() {
  const hook = useGlobal();
  const ollamaHook = useOllamaHook();
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Cargar el chat actual al inicio
  useEffect(() => {
    if (hook.state.currentChat?.length > 0) {
      setMessages(hook.state.currentChat);
    }
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(messageSchema),
  });

  const onSubmit = (data) => {
    // 1. Agregar mensaje del usuario
    setMessages((prev) => [...prev, { text: data.text, sender: "user" }]);
    
    // 2. Agregar un mensaje vacío del bot INMEDIATAMENTE
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
    
    setIsWaitingForResponse(true);
    reset();
    
    // 3. Llamar a Ollama
    ollamaHook.handleSubmit(data.text);
  };

  // Actualiza SOLO el último mensaje del bot con el streaming
  useEffect(() => {
    if (!ollamaHook.response || !isWaitingForResponse) return;

    const cleanedResponse = cleanThinkTags(ollamaHook.response);

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      
      // Buscar el último mensaje que sea del bot
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        if (updatedMessages[i].sender === "bot") {
          updatedMessages[i] = {
            ...updatedMessages[i],
            text: cleanedResponse,
          };
          break;
        }
      }
      
      return updatedMessages;
    });
  }, [ollamaHook.response, isWaitingForResponse]);

  // Detectar cuando termina la respuesta
  useEffect(() => {
    if (!ollamaHook.loading && isWaitingForResponse && ollamaHook.response) {
      setIsWaitingForResponse(false);
    }
  }, [ollamaHook.loading]);

  // Actualiza el contexto global cuando cambia el historial
  useEffect(() => {
    if (!messages.length) return;
    const event = { type: "@current_chat", payload: messages };
    hook.dispatch(event);
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white justify-end">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`px-4 py-2 rounded-lg max-w-[80%] ${
              msg.sender === "user"
                ? "bg-blue-600 self-end"
                : "bg-gray-700 self-start mt-2"
            }`}
          >
            {msg.text || (
              <span className="animate-pulse">Escribiendo...</span>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 flex flex-col bg-gray-800 space-y-2"
      >
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none"
            {...register("text")}
            disabled={ollamaHook.loading}
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={ollamaHook.loading}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
        {errors.text && (
          <span className="text-red-400 text-sm">{errors.text.message}</span>
        )}
      </form>
    </div>
  );
}