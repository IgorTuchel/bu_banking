import { useEffect, useMemo, useState } from "react";
import "./requestPayment.css";

import AccountDropdown from "../components/AccountDropdown";
import Button from "../components/Button";
import SummaryCard from "../components/SummaryCard";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";

import { getCurrentUser } from "../services/userService";
import { getAccountsForUser } from "../services/accountService";
import {
  createRequestPayment,
  getRequestPaymentsForAccount,
  updateRequestPaymentStatus,
} from "../services/requestPaymentsService";
import { getAmountValue } from "../utils/transactionUtils";

const REQUEST_STATUS_FILTERS = ["All", "Pending", "Paid", "Cancelled", "Expired"];

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

function RequestPaymentPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("All");

  const [requestMethod, setRequestMethod] = useState("bank");
  const [formData, setFormData] = useState({
    accountKey: "",
    payerName: "",
    payerEmail: "",
    payerPhone: "",
    amount: "",
    reason: "",
    dueDate: "",
    note: "",
  });

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
          setFormData((current) => ({
            ...current,
            accountKey: userAccounts[0].key,
          }));
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load request payment details.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const accountOptions = useMemo(() => {
    return accounts.map((account) => ({
      value: account.key,
      label: `${account.name} • ${account.type}`,
    }));
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.key === selectedAccountKey) ?? null;
  }, [accounts, selectedAccountKey]);

  useEffect(() => {
    async function loadRequests() {
      if (!selectedAccount) {
        setRequests([]);
        return;
      }

      try {
        setIsRequestsLoading(true);
        setErrorMessage("");

        const data = await getRequestPaymentsForAccount(selectedAccount.id);
        setRequests(data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load payment requests.");
      } finally {
        setIsRequestsLoading(false);
      }
    }

    loadRequests();
  }, [selectedAccount]);

  const filteredRequests = useMemo(() => {
    if (requestStatusFilter === "All") {
      return requests;
    }

    return requests.filter(
      (request) =>
        request.status.toLowerCase() === requestStatusFilter.toLowerCase()
    );
  }, [requests, requestStatusFilter]);

  const summaryCards = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }

    const availableValue =
      selectedAccount.type === "credit"
        ? selectedAccount.availableCredit
        : selectedAccount.currentBalance;

    const pendingRequests = requests.filter((request) => request.status === "pending");
    const pendingTotal = pendingRequests.reduce((sum, request) => {
      return sum + Math.abs(getAmountValue(request.amount));
    }, 0);

    const paidCount = requests.filter((request) => request.status === "paid").length;

    return [
      {
        id: "deposit-account",
        title: "Receiving Account",
        value: selectedAccount.name,
        note: "Where the payment will be received",
      },
      {
        id: "pending-requests",
        title: "Pending Requests",
        value: formatMoney(pendingTotal, selectedAccount.currency),
        note:
          pendingRequests.length > 0
            ? `${pendingRequests.length} requests awaiting payment`
            : "No pending requests",
      },
      {
        id: "paid-requests",
        title: "Paid Requests",
        value: `${paidCount}`,
        note: "Completed requests",
      },
      {
        id: "available-balance",
        title:
          selectedAccount.type === "credit"
            ? "Available Credit"
            : "Current Balance",
        value: formatMoney(availableValue, selectedAccount.currency),
        note: "Current account position",
      },
    ];
  }, [selectedAccount, requests]);

  function handleAccountChange(accountKey) {
    setSelectedAccountKey(accountKey);
    setFormData((current) => ({
      ...current,
      accountKey,
    }));
    setSuccessMessage("");
    setErrorMessage("");
    setRequestStatusFilter("All");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  function validateForm() {
    if (!formData.accountKey) {
      return "Please choose a receiving account.";
    }

    if (!formData.payerName.trim()) {
      return "Please enter who you are requesting payment from.";
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      return "Please enter a valid amount.";
    }

    if (!formData.reason.trim()) {
      return "Please enter a reason for the payment request.";
    }

    if (requestMethod === "email" && !formData.payerEmail.trim()) {
      return "Please enter an email address.";
    }

    if (requestMethod === "sms" && !formData.payerPhone.trim()) {
      return "Please enter a mobile number.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    try {
      setErrorMessage("");

      const createdRequest = await createRequestPayment({
        accountId: selectedAccount.id,
        payerName: formData.payerName,
        payerEmail: formData.payerEmail,
        payerPhone: formData.payerPhone,
        requestMethod,
        amount: formData.amount.startsWith("£")
          ? formData.amount
          : `£${formData.amount}`,
        reason: formData.reason,
        note: formData.note,
        dueDate: formData.dueDate,
      });

      if (createdRequest.accountId === selectedAccount.id) {
        setRequests((current) => [createdRequest, ...current]);
      }

      setSuccessMessage("Payment request created successfully.");

      setFormData((current) => ({
        ...current,
        payerName: "",
        payerEmail: "",
        payerPhone: "",
        amount: "",
        reason: "",
        dueDate: "",
        note: "",
      }));
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to create payment request.");
      setSuccessMessage("");
    }
  }

  async function handleMarkPaid(requestId) {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await updateRequestPaymentStatus(requestId, "paid");

      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request))
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to update payment request.");
    }
  }

  async function handleCancelRequest(requestId) {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await updateRequestPaymentStatus(requestId, "cancelled");

      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request))
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to cancel payment request.");
    }
  }

  if (isLoading) {
    return (
      <main className="request-payment-page">
        <header className="dashboard-header">
          <h1>Request Payment</h1>
          <p>Send a payment request and choose where incoming funds should go.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="request-payment-summary-grid">
          {[...Array(4)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="request-payment-grid">
          <section className="request-payment-panel">
            <Skeleton width="180px" height="1.4rem" />
            <Skeleton width="100%" height="3rem" style={{ marginTop: "1rem" }} />
            <Skeleton width="100%" height="18rem" style={{ marginTop: "1rem" }} />
          </section>

          <aside className="request-payment-side-panel">
            <Skeleton width="140px" height="1.4rem" />
            <Skeleton width="100%" height="10rem" style={{ marginTop: "1rem" }} />
          </aside>
        </section>
      </main>
    );
  }

  if (errorMessage && !accounts.length) {
    return (
      <main className="request-payment-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="request-payment-page">
      <header className="dashboard-header">
        <h1>Request Payment</h1>
        <p>Send a payment request and choose where incoming funds should go.</p>
      </header>

      <AccountDropdown
        label="Receive into"
        value={selectedAccountKey}
        onChange={handleAccountChange}
        options={accountOptions}
      />

      <section className="request-payment-summary-grid">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.id}
            title={card.title}
            value={card.value}
            note={card.note}
          />
        ))}
      </section>

      {errorMessage ? (
        <section className="status-card error-card">
          <h2>Request unavailable</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {successMessage ? (
        <section className="status-card success-card">
          <h2>Done</h2>
          <p>{successMessage}</p>
        </section>
      ) : null}

      <section className="request-payment-grid">
        <section className="request-payment-panel">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Request Details</h2>
              <p className="request-payment-subtext">
                Create a payment request to share with someone else.
              </p>
            </div>
          </div>

          <div className="request-method-toggle">
            <Button
              variant="pill"
              active={requestMethod === "bank"}
              onClick={() => setRequestMethod("bank")}
            >
              Bank Request
            </Button>
            <Button
              variant="pill"
              active={requestMethod === "email"}
              onClick={() => setRequestMethod("email")}
            >
              Email
            </Button>
            <Button
              variant="pill"
              active={requestMethod === "sms"}
              onClick={() => setRequestMethod("sms")}
            >
              SMS
            </Button>
          </div>

          <form className="request-payment-form" onSubmit={handleSubmit}>
            <div className="request-payment-form-group">
              <label htmlFor="payerName">Requested from</label>
              <input
                id="payerName"
                name="payerName"
                type="text"
                value={formData.payerName}
                onChange={handleChange}
                placeholder="Enter payer name"
              />
            </div>

            {requestMethod === "email" ? (
              <div className="request-payment-form-group">
                <label htmlFor="payerEmail">Email address</label>
                <input
                  id="payerEmail"
                  name="payerEmail"
                  type="email"
                  value={formData.payerEmail}
                  onChange={handleChange}
                  placeholder="name@example.com"
                />
              </div>
            ) : null}

            {requestMethod === "sms" ? (
              <div className="request-payment-form-group">
                <label htmlFor="payerPhone">Mobile number</label>
                <input
                  id="payerPhone"
                  name="payerPhone"
                  type="text"
                  value={formData.payerPhone}
                  onChange={handleChange}
                  placeholder="07..."
                />
              </div>
            ) : null}

            <div className="request-payment-form-row">
              <div className="request-payment-form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="request-payment-form-group">
                <label htmlFor="dueDate">Due date</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="request-payment-form-group">
              <label htmlFor="reason">Reason</label>
              <input
                id="reason"
                name="reason"
                type="text"
                value={formData.reason}
                onChange={handleChange}
                placeholder="What is this request for?"
              />
            </div>

            <div className="request-payment-form-group">
              <label htmlFor="note">Optional note</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Add any extra context"
                rows="4"
              />
            </div>

            <div className="request-payment-form-actions">
              <Button variant="pill" icon="＋">
                Create Request
              </Button>
            </div>
          </form>
        </section>

        <aside className="request-payment-side-panel">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Recent Requests</h2>
              <p className="request-payment-subtext">
                Filter and manage your payment requests.
              </p>
            </div>
          </div>

          <div className="request-status-filters segmented">
            <div
              className="segmented-indicator request-status-indicator"
              style={{
                transform: `translateX(${REQUEST_STATUS_FILTERS.indexOf(requestStatusFilter) * 100}%)`,
              }}
            />

            {REQUEST_STATUS_FILTERS.map((filter) => (
              <Button
                key={filter}
                variant="pill"
                active={requestStatusFilter === filter}
                onClick={() => setRequestStatusFilter(filter)}
                className="segmented-btn request-status-btn"
              >
                {filter}
              </Button>
            ))}
          </div>

          {isRequestsLoading ? (
            <div className="status-card loading-card">
              <h2>Loading requests</h2>
              <p>Please wait while your requests are loaded.</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="request-history-list">
              {filteredRequests.map((request) => (
                <article key={request.id} className="request-history-card">
                  <div className="request-history-top">
                    <h3>{request.payerName}</h3>
                    <span
                      className={`request-history-status request-history-status-${request.status}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="request-history-amount">
                    {formatMoney(getAmountValue(request.amount), selectedAccount?.currency)}
                  </p>

                  <p className="request-history-meta">
                    {request.reason} • Due {formatDate(request.dueDate)}
                  </p>

                  <div className="request-history-actions">
                    {request.status === "pending" ? (
                      <>
                        <Button
                          variant="pill"
                          icon="✓"
                          onClick={() => handleMarkPaid(request.id)}
                        >
                          Mark paid
                        </Button>
                        <Button
                          variant="pill"
                          icon="✕"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="request-help-card">
              <h3>No matching requests</h3>
              <p>Try a different status filter or create a new request.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default RequestPaymentPage;