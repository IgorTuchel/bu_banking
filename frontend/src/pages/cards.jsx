import { useEffect, useMemo, useState } from "react";
import "./cards.css";

import AccountDropdown from "../components/AccountDropdown";
import SummaryCard from "../components/SummaryCard";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";

import { getCurrentUser } from "../services/userService";
import { getAccountsForUser } from "../services/accountService";
import { getCardsForAccount, updateCard } from "../services/cardsService";

function formatMoney(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(Number(value ?? 0));
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Cards() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCardsLoading, setIsCardsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser();
        const userAccounts = await getAccountsForUser(currentUser.id);

        setAccounts(userAccounts);

        if (userAccounts.length > 0) {
          setSelectedAccountKey(userAccounts[0].key);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load cards.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.key === selectedAccountKey) ?? null;
  }, [accounts, selectedAccountKey]);

  const accountOptions = useMemo(() => {
    return accounts.map((account) => ({
      value: account.key,
      label: `${account.name} • ${account.type}`,
    }));
  }, [accounts]);

  useEffect(() => {
    async function loadCards() {
      if (!selectedAccount) {
        setCards([]);
        setSelectedCardId("");
        return;
      }

      try {
        setIsCardsLoading(true);
        setActionError("");

        const data = await getCardsForAccount(selectedAccount.id);
        setCards(data);
        setSelectedCardId(data[0]?.id ?? "");
      } catch (error) {
        console.error(error);
        setActionError("Unable to load cards for this account.");
      } finally {
        setIsCardsLoading(false);
      }
    }

    loadCards();
  }, [selectedAccount]);

  const selectedCard = useMemo(() => {
    return cards.find((card) => card.id === selectedCardId) ?? null;
  }, [cards, selectedCardId]);

  const summaryCards = useMemo(() => {
    if (!selectedAccount || !selectedCard) {
      return [];
    }

    const balanceValue =
      selectedAccount.type === "credit"
        ? selectedAccount.availableCredit
        : selectedAccount.currentBalance;

    return [
      {
        id: "card-status",
        title: "Card Status",
        value: selectedCard.frozen ? "Frozen" : "Active",
        note: selectedCard.type,
      },
      {
        id: "available-balance",
        title:
          selectedAccount.type === "credit"
            ? "Available Credit"
            : "Available Balance",
        value: formatMoney(balanceValue, selectedAccount.currency),
        note: selectedAccount.name,
      },
      {
        id: "spending-limit",
        title: "Spending Limit",
        value: formatMoney(selectedCard.spendingLimit, selectedAccount.currency),
        note: `${selectedCard.spendingLimitPeriod} limit`,
      },
    ];
  }, [selectedAccount, selectedCard]);

  async function handleToggle(cardId, field) {
    try {
      setActionError("");

      const card = cards.find((item) => item.id === cardId);
      if (!card) return;

      const updated = await updateCard(cardId, {
        [field]: !card[field],
      });

      setCards((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      console.error(error);
      setActionError("Unable to update card settings.");
    }
  }

  async function handleFreezeToggle(cardId) {
    try {
      setActionError("");

      const card = cards.find((item) => item.id === cardId);
      if (!card) return;

      const updated = await updateCard(cardId, {
        frozen: !card.frozen,
      });

      setCards((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      console.error(error);
      setActionError("Unable to update card status.");
    }
  }

  if (isLoading) {
    return (
      <main className="cards-page">
        <header className="dashboard-header">
          <h1>Cards</h1>
          <p>Manage your debit and credit cards, controls, and limits.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="cards-grid">
          <section className="cards-panel">
            <Skeleton width="100%" height="220px" />
            <Skeleton width="100%" height="180px" style={{ marginTop: "1rem" }} />
          </section>

          <aside className="cards-side-panel">
            <Skeleton width="100%" height="260px" />
          </aside>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="cards-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="cards-page">
      <header className="dashboard-header">
        <h1>Cards</h1>
        <p>Manage your debit and credit cards, controls, and limits.</p>
      </header>

      <AccountDropdown
        label="Select account"
        value={selectedAccountKey}
        onChange={setSelectedAccountKey}
        options={accountOptions}
      />

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.id}
            title={card.title}
            value={card.value}
            note={card.note}
          />
        ))}
      </section>

      {actionError ? (
        <section className="status-card error-card">
          <h2>Action unavailable</h2>
          <p>{actionError}</p>
        </section>
      ) : null}

      <section className="cards-grid">
        <section className="cards-panel">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Your Cards</h2>
              <p className="cards-subtext">
                {cards.length} card{cards.length === 1 ? "" : "s"} linked to{" "}
                {selectedAccount?.name ?? "this account"}
              </p>
            </div>
          </div>

          {isCardsLoading ? (
            <div className="status-card loading-card">
              <h2>Loading cards</h2>
              <p>Please wait while your cards are loaded.</p>
            </div>
          ) : cards.length > 0 && selectedCard ? (
            <>
              <div className="card-switcher">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`card-switcher-button ${
                      selectedCardId === card.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedCardId(card.id)}
                  >
                    {card.name}
                  </button>
                ))}
              </div>

              <article
                className={`bank-card-preview bank-card-preview-${selectedCard.color}`}
              >
                <div className="bank-card-top">
                  <span className="bank-card-brand">Aurix</span>
                  <span className="bank-card-scheme">{selectedCard.scheme}</span>
                </div>

                <div className="bank-card-chip" />

                <p className="bank-card-number">{selectedCard.maskedNumber}</p>

                <div className="bank-card-bottom">
                  <div>
                    <span className="bank-card-label">Cardholder</span>
                    <p>{selectedCard.cardholderName}</p>
                  </div>

                  <div>
                    <span className="bank-card-label">Expires</span>
                    <p>{selectedCard.expiry}</p>
                  </div>
                </div>
              </article>

              <div className="cards-controls-grid">
                <div className="card-control-card">
                  <div className="card-control-top">
                    <div>
                      <h3>Freeze Card</h3>
                      <p>
                        Temporarily block all spending until you unfreeze it.
                      </p>
                    </div>

                    <Button
                      variant="pill"
                      icon={selectedCard.frozen ? "▶" : "❄"}
                      onClick={() => handleFreezeToggle(selectedCard.id)}
                    >
                      {selectedCard.frozen ? "Unfreeze" : "Freeze"}
                    </Button>
                  </div>
                </div>

                <div className="card-control-card">
                  <h3>Card Controls</h3>

                  <div className="card-toggle-list">
                    <label className="card-toggle-item">
                      <span>Contactless payments</span>
                      <input
                        type="checkbox"
                        checked={selectedCard.contactlessEnabled}
                        onChange={() =>
                          handleToggle(selectedCard.id, "contactlessEnabled")
                        }
                      />
                    </label>

                    <label className="card-toggle-item">
                      <span>Online payments</span>
                      <input
                        type="checkbox"
                        checked={selectedCard.onlinePaymentsEnabled}
                        onChange={() =>
                          handleToggle(selectedCard.id, "onlinePaymentsEnabled")
                        }
                      />
                    </label>

                    <label className="card-toggle-item">
                      <span>ATM withdrawals</span>
                      <input
                        type="checkbox"
                        checked={selectedCard.atmWithdrawalsEnabled}
                        onChange={() =>
                          handleToggle(selectedCard.id, "atmWithdrawalsEnabled")
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="card-control-card">
                  <h3>Spending Limit</h3>
                  <p className="card-limit-value">
                    {formatMoney(selectedCard.spendingLimit, selectedAccount?.currency)}
                  </p>
                  <p className="card-limit-note">
                    Current {selectedCard.spendingLimitPeriod} spending limit
                  </p>
                  <div className="card-limit-actions">
                    <Button variant="pill" icon="✏️">
                      Edit Limit
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="status-card empty-card">
              <h2>No cards available</h2>
              <p>There are no cards linked to this account yet.</p>
            </div>
          )}
        </section>

        <aside className="cards-side-panel">
          <div className="section-header">
            <h2>Card Details</h2>
          </div>

          {selectedCard ? (
            <div className="card-details-panel">
              <div className="card-details-row">
                <span>Card name</span>
                <strong>{selectedCard.name}</strong>
              </div>

              <div className="card-details-row">
                <span>Type</span>
                <strong>{selectedCard.type}</strong>
              </div>

              <div className="card-details-row">
                <span>Status</span>
                <strong>{selectedCard.frozen ? "Frozen" : "Active"}</strong>
              </div>

              <div className="card-details-row">
                <span>Last used</span>
                <strong>{formatDateTime(selectedCard.lastUsed)}</strong>
              </div>

              <div className="card-details-row">
                <span>Scheme</span>
                <strong>{selectedCard.scheme}</strong>
              </div>

              <div className="card-help-card">
                <h3>Need help?</h3>
                <p>
                  Freeze your card immediately if it is lost, or change card
                  controls to manage how it can be used.
                </p>
              </div>
            </div>
          ) : (
            <div className="card-help-card">
              <h3>No card selected</h3>
              <p>Select a card to view more details.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default Cards;