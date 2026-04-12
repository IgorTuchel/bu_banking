export function getAmountValue(amount) {
  return Number(amount.replace(/[^\d.-]/g, ""));
}

export function formatTransactionDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isPendingStatus(status) {
  return status.toLowerCase() === "pending";
}

export function getStartOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getDaysDifference(fromDate, toDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(
    (getStartOfDay(fromDate) - getStartOfDay(toDate)) / msPerDay
  );
}

export function getStartOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getGroupingLabel(timestamp, status) {
  if (isPendingStatus(status)) {
    return "Pending";
  }

  const now = new Date();
  const transactionDate = new Date(timestamp);
  const dayDifference = getDaysDifference(now, transactionDate);

  if (dayDifference === 0) {
    return "Today";
  }

  if (dayDifference === 1) {
    return "Yesterday";
  }

  const currentWeekStart = getStartOfWeek(now);
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const transactionDay = getStartOfDay(transactionDate);

  if (transactionDay >= currentWeekStart) {
    return "This Week";
  }

  if (transactionDay >= lastWeekStart && transactionDay < currentWeekStart) {
    return "Last Week";
  }

  return transactionDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function sortTransactions(transactions) {
  return [...transactions].sort((a, b) => {
    const aPending = isPendingStatus(a.status);
    const bPending = isPendingStatus(b.status);

    if (aPending && !bPending) {
      return -1;
    }

    if (!aPending && bPending) {
      return 1;
    }

    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

export function groupTransactions(transactions) {
  const sortedTransactions = sortTransactions(transactions);
  const groups = [];

  sortedTransactions.forEach((transaction) => {
    const label = getGroupingLabel(transaction.timestamp, transaction.status);
    const existingGroup = groups.find((group) => group.label === label);

    if (existingGroup) {
      existingGroup.items.push(transaction);
    } else {
      groups.push({
        label,
        items: [transaction],
      });
    }
  });

  return groups;
}