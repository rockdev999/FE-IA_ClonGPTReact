import * as React from "react";

const GlobalContext = React.createContext();

const storage = {
  messages: [],
  currentChat: [],
};

function globalReducer(state, action) {
  switch (action.type) {
    case "@save_history": {
      if (!state.currentChat?.length) return state;
      
      const prev = localStorage.getItem("history");
      const messages = prev ? JSON.parse(prev) : [];

      const newChat = {
        id: crypto.randomUUID(),
        title: state.currentChat[0].text,
        content: state.currentChat,
      };

      localStorage.setItem(
        "history",
        JSON.stringify([...messages, newChat])
      );

      return { ...state, currentChat: [] };
    }
    
    case "@load_messages": {
      const history = localStorage.getItem("history");
      if (!history) {
        return { ...state, messages: [] };
      }
      return { ...state, messages: JSON.parse(history) };
    }
    
    case "@current_chat": {
      return { ...state, currentChat: action.payload };
    }
    
    case "@load_chat": {
      // Cargar un chat anterior
      return { ...state, currentChat: action.payload };
    }
    
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function GlobalProvider({ children }) {
  const [state, dispatch] = React.useReducer(globalReducer, storage);
  const value = { state, dispatch };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

function useGlobal() {
  const context = React.useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}

export { GlobalProvider, useGlobal };