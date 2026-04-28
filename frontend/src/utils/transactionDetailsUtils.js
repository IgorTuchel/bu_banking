import { formatTransactionDate } from "./transactionUtils";

/**
 * Build a list of detail rows for a transaction's expanded view.
 */
export function getTransactionDetails(
  transaction,
  accountType,
  currency = "GBP",
) {
  const rows = [];

  const push = (label, value) => {
    if (value !== null && value !== undefined && value !== "") {
      rows.push({ label, value });
    }
  };

  push("Payment Type", transaction.paymentType);
  push("Direction", transaction.transferDirection);
  push(
    "Date & Time",
    transaction.timestamp
      ? new Date(transaction.timestamp).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
  );
  push("Status", transaction.status);
  push("Reference", transaction.paymentReference);

  // Bank transfer details
  if (transaction.paymentType === "Bank Transfer") {
    push("Payer", transaction.payerName);
    push("Payee", transaction.payeeName);
    push("Bank", transaction.bankName);
    push("Sort Code", transaction.sortCodeMasked);
    push("Account Number", transaction.accountNumberMasked);
  }

  // Merchant details
  if (transaction.merchant) {
    const m = transaction.merchant;
    push("Merchant", m.name);
    push("Category", m.category);
    push("City", transaction.city || m.city);
    push("Country", transaction.country || m.country);
    push("Terminal ID", transaction.terminalId);
    push("Online", m.online ? "Yes" : "No");
  } else {
    push("City", transaction.city);
    push("Country", transaction.country);
  }

  // Description
  push("Description", transaction.cleanDescription || transaction.description);

  return rows;
}
