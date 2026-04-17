import { firstDefined, getLocationLabel } from "./transactionLocationUtils";

export function getCurrencyCode(transaction, accountCurrency) {
  return firstDefined(
    transaction.currency,
    transaction.transactionCurrency,
    transaction.originalCurrency,
    accountCurrency
  );
}

export function getTransferCounterparty(transaction) {
  return firstDefined(
    transaction.payerName,
    transaction.payeeName,
    transaction.counterpartyName,
    transaction.beneficiaryName
  );
}

export function getTransactionDetails(transaction, accountType, accountCurrency) {
  const merchant = transaction.merchant ?? {};
  const paymentType = firstDefined(transaction.paymentType, merchant.type);
  const normalizedType = String(paymentType).toLowerCase();

  const isTransfer =
    String(transaction.category ?? "").toLowerCase() === "transfer" ||
    normalizedType.includes("transfer");

  const shouldHideLocation = [
    "recurrent card",
    "recurring card",
    "direct debit",
    "standing order",
    "standing order payment",
  ].some((keyword) => normalizedType.includes(keyword));

  const baseDetails = [
    {
      label: "Transaction ID",
      value: transaction.id,
    },
    {
      label: "Category",
      value: firstDefined(transaction.category, merchant.category),
    },
    {
      label: "Type",
      value: paymentType,
    },
    {
      label: "Payment reference",
      value: firstDefined(
        transaction.paymentReference,
        transaction.reference,
        transaction.transferReference
      ),
    },
    {
      label: "Currency",
      value: getCurrencyCode(transaction, accountCurrency),
    },
    {
      label: "Exchange rate",
      value: firstDefined(
        transaction.exchangeRate,
        transaction.fxRate,
        transaction.forexRate
      ),
    },
  ];

  if (!isTransfer) {
    baseDetails.splice(1, 0, {
      label: "Merchant",
      value: firstDefined(merchant.name, transaction.merchantName, transaction.name),
    });
  }

  if (!isTransfer && !shouldHideLocation) {
    baseDetails.splice(4, 0, {
      label: "Location",
      value: getLocationLabel(transaction),
    });
  }

  if (isTransfer) {
    baseDetails.push(
      {
        label: "Payer / Payee",
        value: getTransferCounterparty(transaction),
      },
      {
        label: "Transfer reference",
        value: firstDefined(
          transaction.transferReference,
          transaction.reference,
          transaction.paymentReference
        ),
      }
    );
  }

  if (accountType === "savings") {
    baseDetails.push(
      {
        label: "Transfer method",
        value: transaction.transferMethod ?? transaction.transferType,
      },
      {
        label: "Counterparty",
        value: transaction.counterpartyName ?? transaction.beneficiaryName,
      }
    );
  }

  if (accountType === "credit") {
    baseDetails.push(
      {
        label: "Card last 4",
        value: transaction.cardLast4 ?? transaction.cardEnding,
      },
      {
        label: "Authorisation code",
        value: transaction.authCode ?? transaction.authorisationCode,
      }
    );
  }

  return baseDetails.filter((detail) => Boolean(detail.value));
}