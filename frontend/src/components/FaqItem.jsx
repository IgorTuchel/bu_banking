import { useState } from "react";

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className={`faq-item ${isOpen ? "faq-item-open" : ""}`}>
      <button
        type="button"
        className="faq-question-button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{question}</span>
        <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      ) : null}
    </article>
  );
}

export default FaqItem;