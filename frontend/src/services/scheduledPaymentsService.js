import { scheduledPaymentsData } from "../data/scheduledPaymentsData";

let scheduledPaymentsStore = [...scheduledPaymentsData];

function clonePayment(payment) {
  return { ...payment };
}

export async function getScheduledPaymentsForAccount(accountId) {
  return scheduledPaymentsStore
    .filter((payment) => payment.accountId === accountId)
    .map(clonePayment);
}

export async function getScheduledPaymentById(paymentId) {
  const payment = scheduledPaymentsStore.find((item) => item.id === paymentId);
  return payment ? clonePayment(payment) : null;
}

export async function updateScheduledPaymentStatus(paymentId, status) {
  const validStatuses = ["active", "paused", "cancelled"];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid scheduled payment status: ${status}`);
  }

  const paymentIndex = scheduledPaymentsStore.findIndex(
    (payment) => payment.id === paymentId
  );

  if (paymentIndex === -1) {
    throw new Error("Scheduled payment not found.");
  }

  const updatedPayment = {
    ...scheduledPaymentsStore[paymentIndex],
    status,
  };

  scheduledPaymentsStore[paymentIndex] = updatedPayment;

  return clonePayment(updatedPayment);
}

export async function createScheduledPayment(paymentData) {
  const newPayment = {
    id: `sched-${String(Date.now()).slice(-6)}`,
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
    lastPaymentDate: null,
    merchantId: paymentData.merchantId ?? "",
    ...paymentData,
  };

  scheduledPaymentsStore = [newPayment, ...scheduledPaymentsStore];

  return clonePayment(newPayment);
}

export async function resetScheduledPaymentsStore() {
  scheduledPaymentsStore = [...scheduledPaymentsData];
  return scheduledPaymentsStore.map(clonePayment);
}