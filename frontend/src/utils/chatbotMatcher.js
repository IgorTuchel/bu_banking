import faqData from "../data/faqData";
import chatbotTrainingData from "../data/chatbotTrainingData";
import conversationData from "../data/conversationData";

function normaliseText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

function tokenize(text) {
  return normaliseText(text)
    .split(/\s+/)
    .filter(Boolean);
}

function calculateSimilarity(userMessage, trainingText) {
  const userWords = tokenize(userMessage);
  const trainingWords = tokenize(trainingText);

  if (userWords.length === 0 || trainingWords.length === 0) return 0;

  const matches = userWords.filter((word) => trainingWords.includes(word));

  return matches.length / Math.max(userWords.length, trainingWords.length);
}

function findBestMatch(userMessage, data) {
  let bestMatch = null;
  let bestScore = 0;

  data.forEach((item) => {
    const score = calculateSimilarity(userMessage, item.text);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  });

  return {
    match: bestMatch,
    score: bestScore,
  };
}

function findConversationResponse(userMessage) {
  const { match, score } = findBestMatch(userMessage, conversationData);

  if (match && score >= 0.6 && match.type !== "fallback") {
    return {
      type: "conversation",
      response: match.response,
      confidence: score,
    };
  }

  return null;
}

function findFaqResponse(userMessage) {
  const searchableFaqData = faqData.flatMap((faq) => [
    {
      text: faq.question,
      faqId: faq.id,
      source: "faq-question",
    },
    ...(faq.trainingPhrases || []).map((phrase) => ({
      text: phrase,
      faqId: faq.id,
      source: "faq-training-phrase",
    })),
    ...(faq.keywords || []).map((keyword) => ({
      text: keyword,
      faqId: faq.id,
      source: "faq-keyword",
    })),
  ]);

  const combinedTrainingData = [
    ...searchableFaqData,
    ...chatbotTrainingData,
  ];

  const { match, score } = findBestMatch(userMessage, combinedTrainingData);

  if (!match || score < 0.25) {
    return null;
  }

  const faq = faqData.find((item) => item.id === match.faqId);

  if (!faq) return null;

  return {
    type: "faq",
    question: faq.question,
    response: faq.answer,
    category: faq.category,
    confidence: score,
    matchedText: match.text,
    source: match.source,
  };
}

function getFallbackResponse() {
  const fallback = conversationData.find((item) => item.type === "fallback");

  return {
    type: "fallback",
    response:
      fallback?.response ||
      "I’m not sure about that yet. Please try rephrasing your question or contact support.",
    confidence: 0,
  };
}

export function getChatbotResponse(userMessage) {
  const cleanedMessage = normaliseText(userMessage);

  if (!cleanedMessage) {
    return {
      type: "empty",
      response: "Please enter a question so I can help.",
      confidence: 0,
    };
  }

  const conversationResponse = findConversationResponse(cleanedMessage);

  if (conversationResponse) {
    return conversationResponse;
  }

  const faqResponse = findFaqResponse(cleanedMessage);

  if (faqResponse) {
    return faqResponse;
  }

  return getFallbackResponse();
}