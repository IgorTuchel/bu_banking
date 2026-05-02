const conversationData = [
  // Greetings
  {
    id: "greeting_1",
    type: "greeting",
    text: "hello",
    response: "Hi, I’m the Aurix Assistant. How can I help today?",
  },
  {
    id: "greeting_2",
    type: "greeting",
    text: "hi",
    response: "Hi, how can I help with your account today?",
  },
  {
    id: "greeting_3",
    type: "greeting",
    text: "hey",
    response: "Hey, what would you like help with?",
  },

  // Thanks
  {
    id: "thanks_1",
    type: "thanks",
    text: "thank you",
    response: "You’re welcome. Is there anything else I can help with?",
  },
  {
    id: "thanks_2",
    type: "thanks",
    text: "thanks",
    response: "No problem. Happy to help.",
  },

  // Goodbye
  {
    id: "goodbye_1",
    type: "goodbye",
    text: "bye",
    response: "Goodbye. Stay safe.",
  },
  {
    id: "goodbye_2",
    type: "goodbye",
    text: "goodbye",
    response: "Goodbye. Contact support again if you need anything else.",
  },

  // Bot identity
  {
    id: "identity_1",
    type: "identity",
    text: "who are you",
    response:
      "I’m the Aurix Assistant, here to help with common banking app questions.",
  },

  // Fallback
  {
    id: "fallback_1",
    type: "fallback",
    text: "fallback",
    response:
      "I’m not sure about that yet. You can try rephrasing your question or contact support for more help.",
  },
];

export default conversationData;