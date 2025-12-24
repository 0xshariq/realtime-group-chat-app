import { useEffect, useRef, useState } from "react";
import { connectWS } from "./ws";

export default function App() {
  const timer = useRef(null);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, setTypers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("connect", () => {
      socket.current.on("roomNotice", (userName) => {
        console.log(`${userName} joined to group!`);
      });

      socket.current.on("chatMessage", (msg) => {
        // push to existing messages list
        console.log("msg", msg);
        setMessages((prev) => [...prev, msg]);
      });

      socket.current.on("typing", (userName) => {
        setTypers((prev) => {
          const isExist = prev.find((typer) => typer === userName);
          if (!isExist) {
            return [...prev, userName];
          }

          return prev;
        });
      });

      socket.current.on("stopTyping", (userName) => {
        setTypers((prev) => prev.filter((typer) => typer !== userName));
      });
    });

    return () => {
      socket.current.off("roomNotice");
      socket.current.off("chatMessage");
      socket.current.off("typing");
      socket.current.off("stopTyping");
    };
  }, []);

  useEffect(() => {
    if (text) {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 1000);

    return () => {
      clearTimeout(timer.current);
    };
  }, [text, userName]);

  // FORMAT TIMESTAMP TO HH:MM FOR MESSAGES
  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // SUBMIT NAME TO GET STARTED, OPEN CHAT WINDOW WITH INITIAL MESSAGE
  function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    // join room
    socket.current.emit("joinRoom", trimmed);

    setUserName(trimmed);
    setShowNamePopup(false);
  }

  // SEND MESSAGE FUNCTION
  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    // USER MESSAGE
    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);

    // emit
    socket.current.emit("chatMessage", msg);

    setText("");
  }

  // HANDLE ENTER KEY TO SEND MESSAGE
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 font-inter">
      {/* ENTER YOUR NAME TO START CHATTING */}
      {showNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold mb-4 shadow-lg">
                💬
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to Group Chat
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Enter your name to join the conversation
              </p>
            </div>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                autoFocus
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 placeholder-gray-400 transition-all"
                placeholder="Your name (e.g. John Doe)"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold cursor-pointer hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              >
                Start Chatting
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      {!showNamePopup && (
        <div className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* CHAT HEADER */}
          <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
              💬
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold">
                Realtime Group Chat
              </div>

              {typers.length > 0 ? (
                <div className="text-xs text-emerald-100 flex items-center gap-1 animate-pulse">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-200 rounded-full animate-bounce"></span>
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="ml-1">{typers.join(", ")} {typers.length > 1 ? 'are' : 'is'} typing</span>
                </div>
              ) : (
                <div className="text-xs text-emerald-100">Online now</div>
              )}
            </div>
            <div className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
              <span className="text-emerald-100">Signed in as</span>{" "}
              <span className="font-semibold capitalize">{userName}</span>
            </div>
          </div>

          {/* CHAT MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-5xl mb-3">💭</div>
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Be the first to say hello!</p>
                </div>
              </div>
            )}
            {messages.map((m) => {
              const mine = m.sender === userName;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-6 shadow-md ${
                      mine
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                    }`}
                  >
                    <div className="wrap-break-word whitespace-pre-wrap">
                      {m.text}
                    </div>
                    <div className="flex justify-between items-center mt-2 gap-4">
                      <div className={`text-[10px] font-semibold uppercase tracking-wide ${
                        mine ? "text-emerald-100" : "text-gray-500"
                      }`}>
                        {m.sender}
                      </div>
                      <div className={`text-[10px] text-right ${
                        mine ? "text-emerald-100" : "text-gray-400"
                      }`}>
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* CHAT TEXTAREA */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-3">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 resize-none px-4 py-3 text-sm outline-none border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all max-h-32"
                style={{
                  minHeight: '48px',
                  height: 'auto',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold cursor-pointer hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-teal-600 flex items-center gap-2"
              >
                <span>Send</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5} 
                  stroke="currentColor" 
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
