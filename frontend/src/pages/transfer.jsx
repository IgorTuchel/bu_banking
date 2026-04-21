import { useEffect, useMemo, useState } from "react";
import "./transfer.css";

import AccountDropdown from "../components/AccountDropdown";
import Button from "../components/Button";
import SummaryCard from "../components/SummaryCard";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";

import { getCurrentUser } from "../services/userService";
import { getAccountsForUser } from "../services/accountService";

function formatMoney(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(Number(value ?? 0));
}

function TransferPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [transferType, setTransferType] = useState("internal");

  const [formData, setFormData] = useState({
    fromAccountKey: "",
    toAccountKey: "",
    recipientName: "",
    sortCode: "",
    accountNumber: "",
    amount: "",
    reference: "",
    transferDate: "",
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
          setFormData((current) => ({
            ...current,
            fromAccountKey: userAccounts[0].key,
            toAccountKey: userAccounts[1]?.key ?? "",
          }));
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load transfer details.");
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

  const fromAccount = useMemo(() => {
    return accounts.find((account) => account.key === formData.fromAccountKey) ?? null;
  }, [accounts, formData.fromAccountKey]);

  const toAccountOptions = useMemo(() => {
    return accountOptions.filter(
      (account) => account.value !== formData.fromAccountKey
    );
  }, [accountOptions, formData.fromAccountKey]);

  const transferSummaryCards = useMemo(() => {
    if (!fromAccount) {
      return [];
    }

    const availableValue =
      fromAccount.type === "credit"
        ? fromAccount.availableCredit
        : fromAccount.currentBalance;

    const transferAmount = Number(formData.amount || 0);
    const remainingBalance =
      Number(availableValue ?? 0) - (Number.isFinite(transferAmount) ? transferAmount : 0);

    return [
      {
        id: "from-balance",
        title: fromAccount.type === "credit" ? "Available Credit" : "Available Balance",
        value: formatMoney(availableValue, fromAccount.currency),
        note: fromAccount.name,
      },
      {
        id: "transfer-amount",
        title: "Transfer Amount",
        value: formatMoney(formData.amount || 0, fromAccount.currency),
        note: formData.amount ? "Ready to send" : "Enter an amount",
      },
      {
        id: "remaining-balance",
        title: "Remaining After Transfer",
        value: formatMoney(remainingBalance, fromAccount.currency),
        note: "Estimated remaining balance",
      },
    ];
  }, [fromAccount, formData.amount]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleTransferTypeChange(type) {
    setTransferType(type);
    setSuccessMessage("");
    setErrorMessage("");

    setFormData((current) => ({
      ...current,
      toAccountKey:
        type === "internal"
          ? accounts.find((account) => account.key !== current.fromAccountKey)?.key ?? ""
          : "",
      recipientName: "",
      sortCode: "",
      accountNumber: "",
      reference: "",
    }));
  }

  function validateForm() {
    if (!formData.fromAccountKey) {
      return "Please choose an account to send from.";
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      return "Please enter a valid transfer amount.";
    }

    if (!formData.reference.trim()) {
      return "Please enter a payment reference.";
    }

    if (transferType === "internal") {
      if (!formData.toAccountKey) {
        return "Please choose an account to transfer to.";
      }

      if (formData.toAccountKey === formData.fromAccountKey) {
        return "You cannot transfer to the same account.";
      }
    }

    if (transferType === "external") {
      if (!formData.recipientName.trim()) {
        return "Please enter the recipient name.";
      }

      if (!formData.sortCode.trim()) {
        return "Please enter a sort code.";
      }

      if (!formData.accountNumber.trim()) {
        return "Please enter an account number.";
      }
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

      console.log("Create transfer:", {
        transferType,
        ...formData,
      });

      setSuccessMessage(
        transferType === "internal"
          ? "Transfer submitted successfully."
          : "Bank transfer submitted successfully."
      );

      setFormData((current) => ({
        ...current,
        amount: "",
        reference: "",
        recipientName: "",
        sortCode: "",
        accountNumber: "",
        transferDate: "",
      }));
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to submit transfer.");
      setSuccessMessage("");
    }
  }

  if (isLoading) {
    return (
      <main className="transfer-page">
        <header className="dashboard-header">
          <h1>Transfer Money</h1>
          <p>Move money between your accounts or send a bank transfer.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="transfer-grid">
          <section className="transfer-panel">
            <Skeleton width="180px" height="1.4rem" />
            <Skeleton width="100%" height="3rem" style={{ marginTop: "1rem" }} />
            <Skeleton width="100%" height="18rem" style={{ marginTop: "1rem" }} />
          </section>

          <aside className="transfer-side-panel">
            <Skeleton width="140px" height="1.4rem" />
            <Skeleton width="100%" height="10rem" style={{ marginTop: "1rem" }} />
          </aside>
        </section>
      </main>
    );
  }

  if (errorMessage && !accounts.length) {
    return (
      <main className="transfer-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="transfer-page">
      <header className="dashboard-header">
        <h1>Transfer Money</h1>
        <p>Move money between your accounts or send a bank transfer.</p>
      </header>

      <AccountDropdown
        label="Send from"
        value={formData.fromAccountKey}
        onChange={(value) =>
          setFormData((current) => ({
            ...current,
            fromAccountKey: value,
            toAccountKey:
              transferType === "internal"
                ? accounts.find((account) => account.key !== value)?.key ?? ""
                : current.toAccountKey,
          }))
        }
        options={accountOptions}
      />

      <section className="summary-grid">
        {transferSummaryCards.map((card) => (
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
          <h2>Transfer unavailable</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {successMessage ? (
        <section className="status-card success-card">
          <h2>Done</h2>
          <p>{successMessage}</p>
        </section>
      ) : null}

      <section className="transfer-grid">
        <section className="transfer-panel">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Payment Details</h2>
              <p className="transfer-subtext">
                Choose how you want to send money.
              </p>
            </div>
          </div>

          <div className="transfer-type-toggle">
            <Button
              variant="pill"
              active={transferType === "internal"}
              onClick={() => handleTransferTypeChange("internal")}
            >
              Between My Accounts
            </Button>
            <Button
              variant="pill"
              active={transferType === "external"}
              onClick={() => handleTransferTypeChange("external")}
            >
              Bank Transfer
            </Button>
          </div>

          <form className="transfer-form" onSubmit={handleSubmit}>
            {transferType === "internal" ? (
              <div className="transfer-form-group">
                <label htmlFor="toAccountKey">Transfer to</label>
                <select
                  id="toAccountKey"
                  name="toAccountKey"
                  value={formData.toAccountKey}
                  onChange={handleChange}
                >
                  <option value="">Select destination account</option>
                  {toAccountOptions.map((account) => (
                    <option key={account.value} value={account.value}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="transfer-form-group">
                  <label htmlFor="recipientName">Recipient name</label>
                  <input
                    id="recipientName"
                    name="recipientName"
                    type="text"
                    value={formData.recipientName}
                    onChange={handleChange}
                    placeholder="Enter recipient name"
                  />
                </div>

                <div className="transfer-form-row">
                  <div className="transfer-form-group">
                    <label htmlFor="sortCode">Sort code</label>
                    <input
                      id="sortCode"
                      name="sortCode"
                      type="text"
                      value={formData.sortCode}
                      onChange={handleChange}
                      placeholder="12-34-56"
                    />
                  </div>

                  <div className="transfer-form-group">
                    <label htmlFor="accountNumber">Account number</label>
                    <input
                      id="accountNumber"
                      name="accountNumber"
                      type="text"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="12345678"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="transfer-form-row">
              <div className="transfer-form-group">
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

              <div className="transfer-form-group">
                <label htmlFor="transferDate">Date</label>
                <input
                  id="transferDate"
                  name="transferDate"
                  type="date"
                  value={formData.transferDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="transfer-form-group">
              <label htmlFor="reference">Reference</label>
              <input
                id="reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleChange}
                placeholder="What is this for?"
              />
            </div>

            <div className="transfer-form-actions">
              <Button variant="pill" icon="→">
                Continue
              </Button>
            </div>
          </form>
        </section>

        <aside className="transfer-side-panel">
          <div className="section-header">
            <h2>Transfer Help</h2>
          </div>

          <div className="transfer-help-card">
            <h3>Before you send</h3>
            <ul className="transfer-help-list">
              <li>Double-check the recipient details before continuing.</li>
              <li>Internal transfers usually arrive immediately.</li>
              <li>Bank transfers may be subject to additional checks.</li>
              <li>Use a clear reference so the payment is easy to identify.</li>
            </ul>
          </div>

          <div className="transfer-help-card">
            <h3>From account</h3>
            <p>
              {fromAccount
                ? `${fromAccount.name} is selected for this transfer.`
                : "Select an account to begin."}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default TransferPage;