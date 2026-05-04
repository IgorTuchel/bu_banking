import { useEffect, useMemo, useRef, useState } from "react";
import "./cards.css";

import AccountDropdown from "../components/AccountDropdown";
import SummaryCard from "../components/SummaryCard";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";

import {
  AlertTriangle,
  CircleOff,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  Pause,
  Pencil,
  Play,
  Save,
  X,
} from "lucide-react";

import { getCurrentUser } from "../services/userService";
import { getAccountsForUser } from "../services/accountService";
import {
  cancelAndReplaceCard,
  getCardsForAccount,
  revealCvv,
  updateCard,
  updateRoundUpSettings,
} from "../services/cardsService";

function formatMoney(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(Number(value ?? 0));
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saveCardNotification({ title, message, detail, type = "update" }) {
  const existing = JSON.parse(localStorage.getItem("aurixCardNotifications") || "[]");

  const notification = {
    id: `card-${Date.now()}`,
    title,
    message,
    detail,
    type,
    date: new Date().toISOString(),
    accountName: "Card controls",
    reference: "Card status update",
    isRead: false,
  };

  localStorage.setItem(
    "aurixCardNotifications",
    JSON.stringify([notification, ...existing].slice(0, 20))
  );
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

  const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [cvvLoading, setCvvLoading] = useState(false);
  const [cvvSecondsLeft, setCvvSecondsLeft] = useState(0);

  const [showCardNumber, setShowCardNumber] = useState(false);
  const [cardNumberSecondsLeft, setCardNumberSecondsLeft] = useState(0);

  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitDraft, setLimitDraft] = useState(0);
  const [noLimitDraft, setNoLimitDraft] = useState(false);
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancellingCard, setIsCancellingCard] = useState(false);
  const [isSavingRoundUp, setIsSavingRoundUp] = useState(false);
  const [roundUpDraft, setRoundUpDraft] = useState("1.00");

  const cvvHideTimerRef = useRef(null);
  const cvvCountdownRef = useRef(null);
  const cardNumberHideTimerRef = useRef(null);
  const cardNumberCountdownRef = useRef(null);
  const cardRef = useRef(null);

  const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "1rem",
  };

  function clearCvvTimers() {
    if (cvvHideTimerRef.current) {
      clearTimeout(cvvHideTimerRef.current);
      cvvHideTimerRef.current = null;
    }

    if (cvvCountdownRef.current) {
      clearInterval(cvvCountdownRef.current);
      cvvCountdownRef.current = null;
    }
  }

  function clearCardNumberTimers() {
    if (cardNumberHideTimerRef.current) {
      clearTimeout(cardNumberHideTimerRef.current);
      cardNumberHideTimerRef.current = null;
    }

    if (cardNumberCountdownRef.current) {
      clearInterval(cardNumberCountdownRef.current);
      cardNumberCountdownRef.current = null;
    }
  }

  function clearRevealTimers() {
    clearCvvTimers();
    clearCardNumberTimers();
  }

  function hideCvv() {
    clearCvvTimers();
    setCvv("");
    setShowCvv(false);
    setCvvSecondsLeft(0);
  }

  function hideCardNumber() {
    clearCardNumberTimers();
    setShowCardNumber(false);
    setCardNumberSecondsLeft(0);
  }

  function hideAllSensitiveDetails() {
    hideCvv();
    hideCardNumber();
  }

  function handleCardTilt(event) {
    const card = cardRef.current;
    if (!card) return;

    const pointer = event.touches ? event.touches[0] : event;
    const rect = card.getBoundingClientRect();

    const x = pointer.clientX - rect.left;
    const y = pointer.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.setProperty("--card-glow-x", `${x}px`);
    card.style.setProperty("--card-glow-y", `${y}px`);
    card.style.setProperty("--chip-lift-x", `${rotateY * 0.4}px`);
    card.style.setProperty("--chip-lift-y", `${rotateX * -0.4}px`);
    card.style.setProperty("--text-lift-x", `${rotateY * 0.25}px`);
    card.style.setProperty("--text-lift-y", `${rotateX * -0.25}px`);

    card.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.025)
    `;
  }

  function resetCardTilt() {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--card-glow-x", "50%");
    card.style.setProperty("--card-glow-y", "50%");
    card.style.setProperty("--chip-lift-x", "0px");
    card.style.setProperty("--chip-lift-y", "0px");
    card.style.setProperty("--text-lift-x", "0px");
    card.style.setProperty("--text-lift-y", "0px");

    card.style.transform = `
      perspective(1000px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;
  }

  function openLimitEditor() {
    if (!selectedCard) return;

    const hasNoLimit =
      selectedCard.spendingLimit === null ||
      selectedCard.spendingLimit === undefined ||
      selectedCard.spendingLimit === "";

    setNoLimitDraft(hasNoLimit);
    setLimitDraft(hasNoLimit ? 0 : Number(selectedCard.spendingLimit));
    setIsEditingLimit(true);
  }

  function cancelLimitEditor() {
    setIsEditingLimit(false);
    setNoLimitDraft(false);
    setLimitDraft(0);
  }

  async function handleSaveLimit() {
    if (!selectedCard) return;

    try {
      setActionError("");
      setIsSavingLimit(true);

      const updated = await updateCard(selectedCard.id, {
        spendingLimit: noLimitDraft ? null : Number(limitDraft),
      });

      setCards((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );

      setIsEditingLimit(false);
    } catch (error) {
      console.error(error);
      setActionError("Unable to update spending limit.");
    } finally {
      setIsSavingLimit(false);
    }
  }

  async function handleCancelAndReplaceCard() {
    if (!selectedCard) return;

    try {
      setActionError("");
      setIsCancellingCard(true);
      hideAllSensitiveDetails();

      const data = await cancelAndReplaceCard(selectedCard.id);

      setCards((current) => {
        const withoutCancelled = current.filter(
          (card) => card.id !== data.cancelledCard.id
        );

        return [...withoutCancelled, data.replacementCard].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      setSelectedCardId(data.replacementCard.id);
      setShowCancelConfirm(false);
      setIsEditingLimit(false);
    } catch (error) {
      console.error(error);
      setActionError("Unable to cancel and replace this card.");
    } finally {
      setIsCancellingCard(false);
    }
  }

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

    return () => {
      clearRevealTimers();
    };
  }, []);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.key === selectedAccountKey) ?? null;
  }, [accounts, selectedAccountKey]);

  useEffect(() => {
    if (!selectedAccount) return;

    setRoundUpDraft(String(selectedAccount.roundUpIncrement ?? "1.00"));
  }, [selectedAccount?.id, selectedAccount?.roundUpIncrement]);

  const accountOptions = useMemo(() => {
    return accounts.map((account) => ({
      value: account.key,
      label: `${account.name} • ${account.type}`,
    }));
  }, [accounts]);

  useEffect(() => {
    let refreshTimer = null;
    let isMounted = true;

    async function loadCards({ silent = false } = {}) {
      if (!silent) {
        hideAllSensitiveDetails();
        resetCardTilt();
        setIsEditingLimit(false);
        setShowCancelConfirm(false);
      }

      if (!selectedAccount) {
        setCards([]);
        setSelectedCardId("");
        return;
      }

      try {
        if (!silent) {
          setIsCardsLoading(true);
        }

        setActionError("");

        const data = await getCardsForAccount(selectedAccount.id);

        if (!isMounted) return;

        setCards(data);

        setSelectedCardId((currentSelectedId) => {
          if (
            currentSelectedId &&
            data.some((card) => card.id === currentSelectedId)
          ) {
            return currentSelectedId;
          }

          return data[0]?.id ?? "";
        });
      } catch (error) {
        console.error(error);

        if (!silent) {
          setActionError("Unable to load cards for this account.");
        }
      } finally {
        if (isMounted && !silent) {
          setIsCardsLoading(false);
        }
      }
    }

    loadCards();

    refreshTimer = setInterval(() => {
      loadCards({ silent: true });
    }, 3000);

    return () => {
      isMounted = false;

      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [selectedAccount]);

  const selectedCard = useMemo(() => {
    return cards.find((card) => card.id === selectedCardId) ?? null;
  }, [cards, selectedCardId]);

  const summaryCards = useMemo(() => {
    if (!selectedAccount || !selectedCard) return [];

    const hasNetworkLinkedCards = cards.some((card) => card.isNetworkLinked);

    const liveAccountBalance = cards.reduce((total, card) => {
      if (
        !card.isNetworkLinked ||
        card.liveBalance === null ||
        card.liveBalance === undefined
      ) {
        return total;
      }

      return total + Number(card.liveBalance);
    }, 0);

    const balanceValue =
      hasNetworkLinkedCards && selectedAccount.type !== "credit"
        ? liveAccountBalance
        : selectedAccount.type === "credit"
          ? selectedAccount.availableCredit
          : selectedAccount.currentBalance;

    const spendingLimitValue =
      selectedCard.spendingLimit === null ||
      selectedCard.spendingLimit === undefined ||
      selectedCard.spendingLimit === ""
        ? "No limit"
        : formatMoney(selectedCard.spendingLimit, selectedAccount.currency);

    const liveBalanceValue =
      selectedCard.liveBalance !== undefined && selectedCard.liveBalance !== null
        ? formatMoney(selectedCard.liveBalance, selectedAccount.currency)
        : "Not linked";

    return [
      {
        id: "card-status",
        title: "Card Status",
        value: selectedCard.frozen ? "Frozen" : "Active",
        note: selectedCard.type,
      },
      {
        id: "live-card-balance",
        title: "Live Card Balance",
        value: liveBalanceValue,
        note: selectedCard.isNetworkLinked
          ? "v2 payment network"
          : "Local card only",
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
        value: spendingLimitValue,
        note: selectedCard.spendingLimitPeriod
          ? `${selectedCard.spendingLimitPeriod} limit`
          : "Card limit",
      },
    ];
  }, [selectedAccount, selectedCard, cards]);

  function handleRoundUpChange(increment) {
    setRoundUpDraft(increment);
  }

  async function handleRoundUpToggle() {
    if (!selectedAccount) return;

    try {
      setActionError("");
      setIsSavingRoundUp(true);

      const turningOn = !selectedAccount.roundUpEnabled;

      const updated = await updateRoundUpSettings(selectedAccount.id, {
        roundUpEnabled: turningOn,
        roundUpIncrement: roundUpDraft,
      });

      setAccounts((current) =>
        current.map((account) =>
          account.id === selectedAccount.id
            ? {
                ...account,
                roundUpEnabled: updated.roundUpEnabled,
                roundUpIncrement: updated.roundUpIncrement,
                roundUpPot: updated.roundUpPot,
              }
            : account
        )
      );
    } catch (error) {
      console.error(error);
      setActionError("Unable to update round-up settings.");
    } finally {
      setIsSavingRoundUp(false);
    }
  }

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
    hideAllSensitiveDetails();

    const card = cards.find((item) => item.id === cardId);
    if (!card) return;

    const willFreeze = !card.frozen;

    const updated = await updateCard(cardId, {
      frozen: willFreeze,
    });

    setCards((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );

    saveCardNotification({
      title: willFreeze ? "Card frozen" : "Card unfrozen",
      message: `${card.name} has been ${willFreeze ? "frozen" : "unfrozen"}.`,
      detail: willFreeze
        ? "Payments on this card are now blocked."
        : "Payments on this card are now enabled.",
      type: willFreeze ? "warning" : "success",
    });
  } catch (error) {
    console.error(error);
    setActionError("Unable to update card status.");
  }
}

  async function handleRevealCvv() {
    if (!selectedCard || selectedCard.frozen) return;

    try {
      setActionError("");
      setCvvLoading(true);
      hideCardNumber();
      clearCvvTimers();

      const data = await revealCvv(selectedCard.id);
      const seconds = Number(data.expiresInSeconds ?? 30);

      setCvv(data.cvv);
      setShowCvv(true);
      setCvvSecondsLeft(seconds);

      cvvCountdownRef.current = setInterval(() => {
        setCvvSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
      }, 1000);

      cvvHideTimerRef.current = setTimeout(() => {
        hideCvv();
      }, seconds * 1000);
    } catch (error) {
      console.error(error);
      setActionError("Unable to reveal CVV for this card.");
    } finally {
      setCvvLoading(false);
    }
  }

  function handleRevealCardNumber() {
    if (!selectedCard || selectedCard.frozen) return;

    hideCvv();
    clearCardNumberTimers();

    const seconds = 30;

    setShowCardNumber(true);
    setCardNumberSecondsLeft(seconds);

    cardNumberCountdownRef.current = setInterval(() => {
      setCardNumberSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    cardNumberHideTimerRef.current = setTimeout(() => {
      hideCardNumber();
    }, seconds * 1000);
  }

  if (isLoading) {
    return (
      <main className="cards-page">
        <header className="dashboard-header">
          <h1>Cards</h1>
          <p>Manage your debit and credit cards, controls, and limits.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="summary-grid cards-summary-grid-four" style={summaryGridStyle}>
          {[...Array(4)].map((_, index) => (
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

      <section className="summary-grid cards-summary-grid-four" style={summaryGridStyle}>
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
                ref={cardRef}
                className={`bank-card-preview ${
                  selectedCard.color
                    ? `bank-card-preview-${selectedCard.color}`
                    : selectedAccount?.type === "current"
                      ? "bank-card-preview-green-gold"
                      : selectedAccount?.type === "savings"
                        ? "bank-card-preview-green-gold"
                        : selectedAccount?.type === "credit"
                          ? "bank-card-preview-dark"
                          : "bank-card-preview-green-gold"
                }`}
                onMouseMove={handleCardTilt}
                onMouseLeave={resetCardTilt}
                onTouchMove={handleCardTilt}
                onTouchEnd={resetCardTilt}
              >
                <div className="bank-card-shine" />

                <div className="bank-card-top bank-card-layer">
                  <span className="bank-card-brand">Aurix</span>
                  <span className="bank-card-scheme">{selectedCard.scheme}</span>
                </div>

                <div className="bank-card-chip bank-card-chip-layer" />

                <div className="bank-card-number-row bank-card-layer">
                  <p className="bank-card-number">
                    {showCardNumber
                      ? selectedCard.networkCardNumber ?? selectedCard.maskedNumber
                      : selectedCard.maskedNumber}
                  </p>

                  <button
                    type="button"
                    className="card-reveal-button"
                    onClick={
                      showCardNumber ? hideCardNumber : handleRevealCardNumber
                    }
                    disabled={selectedCard.frozen}
                    aria-label={
                      showCardNumber ? "Hide card number" : "Reveal card number"
                    }
                  >
                    {showCardNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showCardNumber ? (
                      <span className="card-reveal-timer">
                        {cardNumberSecondsLeft}s
                      </span>
                    ) : null}
                  </button>
                </div>

                <div className="bank-card-bottom bank-card-layer">
                  <div>
                    <span className="bank-card-label">Cardholder</span>
                    <p>{selectedCard.cardholderName}</p>
                  </div>

                  <div>
                    <span className="bank-card-label">Expires</span>
                    <p>{selectedCard.expiry}</p>
                  </div>

                  <div>
                    <span className="bank-card-label">CVV</span>
                    <p className="bank-card-cvv">
                      <span className="bank-card-cvv-value">
                        {showCvv ? cvv : "•••"}
                      </span>

                      <button
                        type="button"
                        className="card-reveal-button card-reveal-button-small"
                        onClick={showCvv ? hideCvv : handleRevealCvv}
                        disabled={cvvLoading || selectedCard.frozen}
                        aria-label={showCvv ? "Hide CVV" : "Reveal CVV"}
                      >
                        {showCvv ? <EyeOff size={15} /> : <Eye size={15} />}
                        {cvvLoading ? (
                          <span className="card-reveal-timer">...</span>
                        ) : showCvv ? (
                          <span className="card-reveal-timer">
                            {cvvSecondsLeft}s
                          </span>
                        ) : null}
                      </button>
                    </p>
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
                      variant={`pill ${
                        selectedCard.frozen ? "btn-safe" : "btn-danger"
                      }`}
                      icon={
                        selectedCard.frozen ? (
                          <Play size={16} />
                        ) : (
                          <Pause size={16} />
                        )
                      }
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

                  {isEditingLimit ? (
                    <div className="spending-limit-editor">
                      <label className="spending-limit-checkbox">
                        <input
                          type="checkbox"
                          checked={noLimitDraft}
                          onChange={(event) =>
                            setNoLimitDraft(event.target.checked)
                          }
                        />
                        <span>No limit</span>
                      </label>

                      <div className="spending-limit-slider-row">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="50"
                          value={limitDraft}
                          disabled={noLimitDraft}
                          onChange={(event) =>
                            setLimitDraft(Number(event.target.value))
                          }
                        />

                        <strong className="spending-limit-slider-value">
                          {noLimitDraft
                            ? "No limit"
                            : formatMoney(limitDraft, selectedAccount?.currency)}
                        </strong>
                      </div>

                      <div className="card-limit-actions">
                        <Button
                          variant="pill btn-safe"
                          icon={<Save size={16} />}
                          onClick={handleSaveLimit}
                          disabled={isSavingLimit}
                        >
                          {isSavingLimit ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="pill btn-danger"
                          icon={<X size={16} />}
                          onClick={cancelLimitEditor}
                          disabled={isSavingLimit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="card-limit-value">
                        {selectedCard.spendingLimit === null ||
                        selectedCard.spendingLimit === undefined ||
                        selectedCard.spendingLimit === ""
                          ? "No limit"
                          : formatMoney(
                              selectedCard.spendingLimit,
                              selectedAccount?.currency
                            )}
                      </p>

                      <p className="card-limit-note">
                        Current {selectedCard.spendingLimitPeriod} spending limit
                      </p>

                      <div className="card-limit-actions">
                        <Button
                          variant="pill btn-safe"
                          icon={<Pencil size={16} />}
                          onClick={openLimitEditor}
                        >
                          Edit Limit
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="card-control-card cancel-card-control-card">
                  <div className="card-control-top">
                    <div>
                      <h3>Cancel & Replace Card</h3>
                      <p>
                        Permanently cancel this card and generate a replacement.
                      </p>
                    </div>

                    <Button
                      variant="pill btn-danger"
                      icon={<CircleOff size={16} />}
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={
                        isCancellingCard || selectedCard.status === "cancelled"
                      }
                    >
                      Cancel Card
                    </Button>
                  </div>

                  {showCancelConfirm ? (
                    <div className="cancel-card-confirm">
                      <div className="cancel-card-warning-icon">
                        <AlertTriangle size={20} />
                      </div>

                      <div className="cancel-card-confirm-content">
                        <h4>Are you sure?</h4>
                        <p>
                          This will freeze and cancel the current card, then
                          create a new replacement card with a new number and
                          expiry date.
                        </p>

                        <div className="cancel-card-actions">
                          <Button
                            variant="pill btn-danger"
                            icon={<CreditCard size={16} />}
                            onClick={handleCancelAndReplaceCard}
                            disabled={isCancellingCard}
                          >
                            {isCancellingCard
                              ? "Replacing..."
                              : "Confirm Replacement"}
                          </Button>

                          <Button
                            variant="pill btn-safe"
                            icon={<X size={16} />}
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={isCancellingCard}
                          >
                            Keep Card
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
                <span>Live balance</span>
                <strong>
                  {selectedCard.liveBalance !== undefined &&
                  selectedCard.liveBalance !== null
                    ? formatMoney(
                        selectedCard.liveBalance,
                        selectedAccount?.currency
                      )
                    : "Not linked"}
                </strong>
              </div>

              <div className="card-details-row">
                <span>Network card</span>
                <strong>
                  {selectedCard.isNetworkLinked ? "Linked" : "Local only"}
                </strong>
              </div>

              <div className="card-details-row">
                <span>Last used</span>
                <strong>{formatDateTime(selectedCard.lastUsed)}</strong>
              </div>

              <div className="card-details-row">
                <span>Scheme</span>
                <strong>{selectedCard.scheme}</strong>
              </div>

              <div className="round-up-card">
                <div className="round-up-card-header">
                  <div>
                    <h3>Round Up</h3>
                    <p>Automatically save spare change into your savings account.</p>
                  </div>
                  <Coins size={28} />
                </div>

                <div className="round-up-status-row">
                  <span>Status</span>
                  <strong>{selectedAccount?.roundUpEnabled ? "On" : "Off"}</strong>
                </div>

                <div className="round-up-status-row">
                  <span>Saved so far</span>
                  <strong>
                    {formatMoney(
                      selectedAccount?.roundUpPot,
                      selectedAccount?.currency
                    )}
                  </strong>
                </div>

                <div className="round-up-options">
                  {[
                    { label: "10p", value: "0.10" },
                    { label: "50p", value: "0.50" },
                    { label: "£1", value: "1.00" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`round-up-option ${
                        roundUpDraft === option.value ? "active" : ""
                      }`}
                      onClick={() => handleRoundUpChange(option.value)}
                      disabled={
                        isSavingRoundUp || selectedAccount?.type !== "current"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant={
                    selectedAccount?.roundUpEnabled
                      ? "pill btn-danger"
                      : "pill btn-safe"
                  }
                  onClick={handleRoundUpToggle}
                  disabled={isSavingRoundUp || selectedAccount?.type !== "current"}
                >
                  {isSavingRoundUp
                    ? "Saving..."
                    : selectedAccount?.roundUpEnabled
                      ? "Turn Off"
                      : "Turn On"}
                </Button>

                {selectedAccount?.type !== "current" ? (
                  <p className="round-up-disabled-note">
                    Round ups are available on current accounts.
                  </p>
                ) : null}
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