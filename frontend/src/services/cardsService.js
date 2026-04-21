import { cardsData } from "../data/cardsData";

let cardsStore = [...cardsData];

function cloneCard(card) {
  return { ...card };
}

export async function getCardsForAccount(accountId) {
  return cardsStore
    .filter((card) => card.accountId === accountId)
    .map(cloneCard);
}

export async function updateCard(cardId, updates) {
  const index = cardsStore.findIndex((card) => card.id === cardId);

  if (index === -1) {
    throw new Error("Card not found.");
  }

  const updatedCard = {
    ...cardsStore[index],
    ...updates,
  };

  cardsStore[index] = updatedCard;

  return cloneCard(updatedCard);
}