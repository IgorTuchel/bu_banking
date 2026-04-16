import { transactionsData } from "../data/transactionsData";
import { merchantsData } from "../data/merchantsData";

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function sanitizeNameForMatching(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function getMerchantAliases(merchant) {
  const aliasField = merchant.aliases ?? merchant.alias ?? [];
  const aliases = Array.isArray(aliasField) ? aliasField : [aliasField];

  return [
    merchant.id,
    merchant.name,
    merchant.displayName,
    merchant.legalName,
    ...aliases,
  ]
    .map((value) => sanitizeNameForMatching(value))
    .filter(Boolean);
}

function getParsedTransferDetails(transaction) {
  const transactionName = String(transaction.name ?? "").trim();

  if (!/transfer/i.test(transactionName)) {
    return {};
  }

  const incomingMatch = transactionName.match(/transfer\s+from\s+(.+)/i);
  if (incomingMatch?.[1]) {
    return {
      payerName: transaction.payerName ?? incomingMatch[1].trim(),
    };
  }

  const outgoingMatch = transactionName.match(/transfer\s+to\s+(.+)/i);
  if (outgoingMatch?.[1]) {
    return {
      payeeName: transaction.payeeName ?? outgoingMatch[1].trim(),
    };
  }

  return {};
}

function getMerchantForTransaction(transaction) {
  const transactionMerchantId = normalize(transaction.merchantId);
  if (transactionMerchantId) {
    const byId = merchantsData.find(
      (merchant) => normalize(merchant.id) === transactionMerchantId
    );

    if (byId) return byId;
  }

  const transactionMerchantName = sanitizeNameForMatching(
    transaction.merchantName ?? transaction.name
  );

  if (!transactionMerchantName) return null;

  return merchantsData.find((merchant) =>
    getMerchantAliases(merchant).includes(transactionMerchantName)
  ) ?? null;
}

export async function getTransactionsForAccount(accountId) {
  await new Promise((resolve) => setTimeout(resolve, 150));

  return transactionsData.filter(
    (txn) => txn.accountId === accountId
  ).map((transaction) => {
    const merchant = getMerchantForTransaction(transaction);

    return {
      ...transaction,
      ...getParsedTransferDetails(transaction),
      merchant,
      paymentType: transaction.paymentType ?? merchant?.type,
      currency: transaction.currency ?? merchant?.currency,
      exchangeRate: transaction.exchangeRate ?? merchant?.exchangeRate,
    };
  });
}