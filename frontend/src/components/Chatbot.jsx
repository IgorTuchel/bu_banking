import { useState } from "react";
import { getChatbotResponse } from "../utils/chatbotMatcher";
import "./chatbot.css";

function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi, I’m the Aurix Assistant. Ask me a question about your account, cards, payments, rewards, or support.",
    },
  ]);

  const [input, setInput] = useState("");

  if (!isOpen) return null;

  function handleSendMessage(event) {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedInput,
    };

    const botResult = getChatbotResponse(trimmedInput);

    const botMessage = {
      id: Date.now() + 1,
      sender: "bot",
      text: botResult.response,
      meta: botResult,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
    setInput("");
  }

  return (
    <div className="chatbot-popup">
      <section className="chatbot-card">
        <div className="chatbot-header">
          <div>
            <h2>Aurix Assistant</h2>
            <p>FAQ-powered banking support</p>
          </div>

          <button
            type="button"
            className="chatbot-close-button"
            onClick={onClose}
            aria-label="Close chatbot"
          >
            ×
          </button>
        </div>

        <div className="chatbot-messages" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-message ${
                message.sender === "user"
                  ? "chatbot-message-user"
                  : "chatbot-message-bot"
              }`}
            >
              <p>{message.text}</p>

              {message.meta?.type === "faq" && (
                <span className="chatbot-meta">
                  Matched FAQ · {Math.round(message.meta.confidence * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>

        <form className="chatbot-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            placeholder="Ask a question..."
            onChange={(event) => setInput(event.target.value)}
            aria-label="Ask the chatbot a question"
          />

          <button type="submit">Send</button>
        </form>
      </section>
    </div>
  );
}

export default Chatbot;