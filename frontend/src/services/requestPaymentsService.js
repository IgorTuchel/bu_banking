import { requestPaymentsData } from "../data/requestPaymentsData";

let requestPaymentsStore = [...requestPaymentsData];

function cloneRequestPayment(requestPayment) {
  return { ...requestPayment };
}

export async function getRequestPaymentsForAccount(accountId) {
  return requestPaymentsStore
    .filter((requestPayment) => requestPayment.accountId === accountId)
    .map(cloneRequestPayment)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getRequestPaymentById(requestPaymentId) {
  const requestPayment = requestPaymentsStore.find(
    (item) => item.id === requestPaymentId
  );

  return requestPayment ? cloneRequestPayment(requestPayment) : null;
}

export async function createRequestPayment(requestPaymentData) {
  const newRequestPayment = {
    id: `req-${String(Date.now()).slice(-6)}`,
    status: "pending",
    createdAt: new Date().toISOString().slice(0, 10),
    paidAt: null,
    payerEmail: requestPaymentData.payerEmail ?? "",
    payerPhone: requestPaymentData.payerPhone ?? "",
    note: requestPaymentData.note ?? "",
    ...requestPaymentData,
  };

  requestPaymentsStore = [newRequestPayment, ...requestPaymentsStore];

  return cloneRequestPayment(newRequestPayment);
}

export async function updateRequestPaymentStatus(requestPaymentId, status) {
  const validStatuses = ["pending", "paid", "cancelled", "expired"];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid request payment status: ${status}`);
  }

  const requestPaymentIndex = requestPaymentsStore.findIndex(
    (requestPayment) => requestPayment.id === requestPaymentId
  );

  if (requestPaymentIndex === -1) {
    throw new Error("Request payment not found.");
  }

  const existing = requestPaymentsStore[requestPaymentIndex];

  const updatedRequestPayment = {
    ...existing,
    status,
    paidAt: status === "paid" ? new Date().toISOString().slice(0, 10) : null,
  };

  requestPaymentsStore[requestPaymentIndex] = updatedRequestPayment;

  return cloneRequestPayment(updatedRequestPayment);
}

export async function resetRequestPaymentsStore() {
  requestPaymentsStore = [...requestPaymentsData];
  return requestPaymentsStore.map(cloneRequestPayment);
}