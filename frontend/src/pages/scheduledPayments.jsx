import { useEffect, useMemo, useState } from "react";
import "./scheduledPayments.css";

import Button from "../components/Button";
import SummaryCard from "../components/SummaryCard";
import AccountDropdown from "../components/AccountDropdown";
import SearchInput from "../components/SearchInput";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";

import { getCurrentUser } from "../services/userService";
import { getAccountsForUser } from "../services/accountService";
import {
  createScheduledPayment,
  getScheduledPaymentsForAccount,
  updateScheduledPaymentStatus,
} from "../services/scheduledPaymentsService";
import { getAmountValue } from "../utils/transactionUtils";

const PAYMENT_TYPE_OPTIONS = [
  { value: "standing-order", label: "Standing Order" },
  { value: "direct-debit", label: "Direct Debit" },
  { value: "subscription", label: "Subscription" },
  { value: "card-payment", label: "Card Payment" },
];

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-off", label: "One-off" },
];

const STATUS_FILTERS = ["All", "Active", "Paused", "Cancelled"];

function formatMoney(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(Number(value ?? 0));
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysUntil(dateString) {
  if (!dateString) {
    return null;
  }

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function ScheduledPayments() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [payments, setPayments] = useState([]);

  const [searchState, setSearchState] = useState({
    inputValue: "",
    tags: [],
  });
  const [activeFilter, setActiveFilter] = useState("All");

  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [formData, setFormData] = useState({
    accountId: "",
    type: "standing-order",
    name: "",
    category: "",
    amount: "",
    frequency: "monthly",
    dayOfMonth: "",
    nextPaymentDate: "",
    reference: "",
    destinationName: "",
    isVariableAmount: false,
  });

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser();
        const userAccounts = await getAccountsForUser(currentUser.id);

        setUser(currentUser);
        setAccounts(userAccounts);

        if (userAccounts.length > 0) {
          setSelectedAccountKey(userAccounts[0].key);
          setFormData((current) => ({
            ...current,
            accountId: userAccounts[0].id,
          }));
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load account information.");
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
    async function loadPayments() {
      if (!selectedAccount) {
        setPayments([]);
        return;
      }

      try {
        setIsPaymentsLoading(true);
        setActionError("");

        const data = await getScheduledPaymentsForAccount(selectedAccount.id);
        setPayments(data);
      } catch (error) {
        console.error(error);
        setActionError("Unable to load scheduled payments.");
      } finally {
        setIsPaymentsLoading(false);
      }
    }

    loadPayments();
  }, [selectedAccount]);

  const visiblePayments = useMemo(() => {
    const query = searchState.inputValue.trim().toLowerCase();

    return payments
      .filter((payment) => {
        if (activeFilter === "All") {
          return true;
        }

        return payment.status.toLowerCase() === activeFilter.toLowerCase();
      })
      .filter((payment) => {
        if (!query) {
          return true;
        }

        const searchable = [
          payment.name,
          payment.category,
          payment.type,
          payment.reference,
          payment.destinationName,
          payment.amount,
          payment.frequency,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
  }, [payments, activeFilter, searchState]);

  const summaryCards = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }

    const activePayments = payments.filter((payment) => payment.status === "active");

    const dueSoon = activePayments.filter((payment) => {
      const daysUntil = getDaysUntil(payment.nextPaymentDate);
      return daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
    });

    const dueSoonTotal = dueSoon.reduce((sum, payment) => {
      return sum + Math.abs(getAmountValue(payment.amount));
    }, 0);

    const nextPayment = [...activePayments].sort(
      (a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)
    )[0];

    const variableCount = activePayments.filter(
      (payment) => payment.isVariableAmount
    ).length;

    return [
      {
        id: "due-next-7-days",
        title: "Due Next 7 Days",
        value: formatMoney(dueSoonTotal, selectedAccount.currency),
        note:
          dueSoon.length > 0
            ? `${dueSoon.length} payments scheduled`
            : "No payments due soon",
      },
      {
        id: "next-payment",
        title: "Next Payment",
        value: nextPayment
          ? formatMoney(getAmountValue(nextPayment.amount), selectedAccount.currency)
          : formatMoney(0, selectedAccount.currency),
        note: nextPayment
          ? `${nextPayment.name} • ${formatDate(nextPayment.nextPaymentDate)}`
          : "No active upcoming payments",
      },
      {
        id: "variable-payments",
        title: "Variable Payments",
        value: `${variableCount}`,
        note: "Bills that may change each cycle",
      },
    ];
  }, [selectedAccount, payments]);

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleAccountChange(accountKey) {
    setSelectedAccountKey(accountKey);

    const account = accounts.find((item) => item.key === accountKey);

    if (account) {
      setFormData((current) => ({
        ...current,
        accountId: account.id,
      }));
    }
  }

  async function handleTogglePause(payment) {
    try {
      setActionError("");

      const nextStatus = payment.status === "active" ? "paused" : "active";
      const updated = await updateScheduledPaymentStatus(payment.id, nextStatus);

      setPayments((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      console.error(error);
      setActionError("Unable to update scheduled payment status.");
    }
  }

  async function handleCreatePayment(event) {
    event.preventDefault();

    try {
      setActionError("");

      const createdPayment = await createScheduledPayment({
        accountId: formData.accountId,
        type: formData.type,
        name: formData.name,
        category: formData.category,
        amount: formData.amount.startsWith("£")
          ? formData.amount
          : `£${formData.amount}`,
        frequency: formData.frequency,
        dayOfMonth: formData.dayOfMonth ? Number(formData.dayOfMonth) : null,
        nextPaymentDate: formData.nextPaymentDate,
        reference: formData.reference,
        destinationName: formData.destinationName,
        isVariableAmount: formData.isVariableAmount,
      });

      if (createdPayment.accountId === selectedAccount?.id) {
        setPayments((current) =>
          [...current, createdPayment].sort(
            (a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)
          )
        );
      }

      setFormData((current) => ({
        ...current,
        name: "",
        category: "",
        amount: "",
        dayOfMonth: "",
        nextPaymentDate: "",
        reference: "",
        destinationName: "",
        isVariableAmount: false,
      }));
    } catch (error) {
      console.error(error);
      setActionError("Unable to create scheduled payment.");
    }
  }

  if (isLoading) {
    return (
      <main className="upcoming-payments-page">
        <header className="dashboard-header">
          <h1>Scheduled Payments</h1>
          <p>Manage direct debits, standing orders, subscriptions, and card payments.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="upcoming-payments-grid">
          <section className="payments-panel">
            <Skeleton width="180px" height="1.4rem" />
            <Skeleton width="100%" height="3rem" style={{ marginTop: "1rem" }} />
            <Skeleton width="100%" height="7rem" style={{ marginTop: "1rem" }} />
            <Skeleton width="100%" height="7rem" style={{ marginTop: "1rem" }} />
          </section>

          <aside className="payment-setup-panel">
            <Skeleton width="160px" height="1.4rem" />
            <Skeleton width="100%" height="3rem" style={{ marginTop: "1rem" }} />
            <Skeleton width="100%" height="3rem" style={{ marginTop: "1rem" }} />
            <Skeleton width="100%" height="3rem" style={{ marginTop: "1rem" }} />
          </aside>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="upcoming-payments-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="upcoming-payments-page">
      <header className="dashboard-header">
        <h1>Scheduled Payments</h1>
        <p>Manage direct debits, standing orders, subscriptions, and card payments.</p>
      </header>

      <AccountDropdown
        label="Select account"
        value={selectedAccountKey}
        onChange={handleAccountChange}
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

      <section className="upcoming-payments-grid">
        <section className="payments-panel">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Scheduled Payments</h2>
              <p className="payments-subtext">
                {visiblePayments.length} matching payments for{" "}
                {selectedAccount?.name ?? "selected account"}
              </p>
            </div>
          </div>

          <div className="payments-toolbar">
            <div className="payments-search">
              <SearchInput
                value={searchState}
                onChange={setSearchState}
                placeholder="Search by payee, type, category or reference"
                ariaLabel="Search scheduled payments"
              />
            </div>

            <div className="payments-filters segmented">
              <div
                className="segmented-indicator"
                style={{
                  transform: `translateX(${STATUS_FILTERS.indexOf(activeFilter) * 100}%)`,
                }}
              />

              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter}
                  variant="pill"
                  active={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                  className="segmented-btn"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="payments-list">
            {isPaymentsLoading ? (
              <div className="status-card loading-card">
                <h2>Loading scheduled payments</h2>
                <p>Please wait while your payment arrangements are loaded.</p>
              </div>
            ) : visiblePayments.length > 0 ? (
              visiblePayments.map((payment) => {
                const daysUntil = getDaysUntil(payment.nextPaymentDate);

                return (
                  <article key={payment.id} className="payment-card">
                    <div className="payment-card-main">
                      <div className="payment-card-left">
                        <div className="payment-card-top">
                          <h3>{payment.name}</h3>
                          <span
                            className={`payment-status payment-status-${payment.status}`}
                          >
                            {payment.status}
                          </span>
                        </div>

                        <p className="payment-meta">
                          {payment.type.replace("-", " ")} • {payment.category}
                        </p>

                        <div className="payment-details-grid">
                          <p>
                            <span>Reference:</span> {payment.reference || "—"}
                          </p>
                          <p>
                            <span>Destination:</span>{" "}
                            {payment.destinationName || "—"}
                          </p>
                          <p>
                            <span>Frequency:</span> {payment.frequency}
                          </p>
                          <p>
                            <span>Next payment:</span>{" "}
                            {formatDate(payment.nextPaymentDate)}
                          </p>
                        </div>
                      </div>

                      <div className="payment-card-right">
                        <p className="payment-amount">
                          {formatMoney(
                            getAmountValue(payment.amount),
                            selectedAccount?.currency
                          )}
                        </p>
                        <p className="payment-days-until">
                          {daysUntil === null
                            ? "No due date"
                            : daysUntil < 0
                            ? "Past due"
                            : daysUntil === 0
                            ? "Due today"
                            : `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
                        </p>

                        <div className="payment-card-actions">
                          <Button variant="pill" icon="✏️">
                            Edit
                          </Button>
                          <Button
                            variant="pill"
                            icon={payment.status === "active" ? "⏸" : "▶"}
                            onClick={() => handleTogglePause(payment)}
                          >
                            {payment.status === "active" ? "Pause" : "Resume"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="status-card empty-card">
                <h2>No scheduled payments found</h2>
                <p>Try a different filter or set up a new payment.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="payment-setup-panel">
          <div className="section-header">
            <h2>Set Up Payment</h2>
          </div>

          <form className="payment-setup-form" onSubmit={handleCreatePayment}>
            <div className="payment-form-group">
              <label htmlFor="payment-account">From account</label>
              <select
                id="payment-account"
                name="accountId"
                value={formData.accountId}
                onChange={handleFormChange}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="payment-form-group">
              <label htmlFor="payment-type">Payment type</label>
              <select
                id="payment-type"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                {PAYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="payment-form-group">
              <label htmlFor="payment-name">Payee name</label>
              <input
                id="payment-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. British Gas"
                required
              />
            </div>

            <div className="payment-form-group">
              <label htmlFor="payment-category">Category</label>
              <input
                id="payment-category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleFormChange}
                placeholder="e.g. Utilities"
                required
              />
            </div>

            <div className="payment-form-row">
              <div className="payment-form-group">
                <label htmlFor="payment-amount">Amount</label>
                <input
                  id="payment-amount"
                  name="amount"
                  type="text"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="£0.00"
                  required
                />
              </div>

              <div className="payment-form-group">
                <label htmlFor="payment-frequency">Frequency</label>
                <select
                  id="payment-frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleFormChange}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="payment-form-row">
              <div className="payment-form-group">
                <label htmlFor="payment-day-of-month">Day of month</label>
                <input
                  id="payment-day-of-month"
                  name="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={handleFormChange}
                  placeholder="1"
                />
              </div>

              <div className="payment-form-group">
                <label htmlFor="payment-date">Next payment date</label>
                <input
                  id="payment-date"
                  name="nextPaymentDate"
                  type="date"
                  value={formData.nextPaymentDate}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="payment-form-group">
              <label htmlFor="payment-reference">Reference</label>
              <input
                id="payment-reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleFormChange}
                placeholder="Payment reference"
              />
            </div>

            <div className="payment-form-group">
              <label htmlFor="payment-destination">Destination</label>
              <input
                id="payment-destination"
                name="destinationName"
                type="text"
                value={formData.destinationName}
                onChange={handleFormChange}
                placeholder="Recipient or merchant name"
              />
            </div>

            <label className="payment-checkbox">
              <input
                type="checkbox"
                name="isVariableAmount"
                checked={formData.isVariableAmount}
                onChange={handleFormChange}
              />
              <span>Variable amount</span>
            </label>

            <div className="payment-form-actions">
              <Button variant="pill" icon="＋">
                Create payment
              </Button>
            </div>
          </form>
        </aside>
      </section>
    </main>
  );
}

export default ScheduledPayments;