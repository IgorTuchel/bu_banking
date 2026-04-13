export const transactionsData = (() => {
  const data = [];

  const currentMerchants = [
    "Tesco",
    "Sainsbury's",
    "Amazon",
    "Uber",
    "McDonald's",
    "Starbucks",
    "Shell",
    "Deliveroo",
    "Trainline",
    "ASOS",
    "Apple",
    "Argos",
    "Costa",
    "Greggs",
    "Co-op",
    "Lidl",
  ];

  const currentSubscriptions = [
    { name: "Spotify", amount: 9.99 },
    { name: "Netflix", amount: 10.99 },
    { name: "Apple Music", amount: 10.99 },
  ];

  const creditMerchants = [
    "Amazon",
    "Apple Store",
    "Currys",
    "Argos",
    "John Lewis",
    "Nike",
    "Zara",
    "H&M",
    "Booking.com",
    "Airbnb",
    "B&Q",
    "Halfords",
    "Very",
    "eBay",
  ];

  let idCounter = 1;

  function add(txn) {
    data.push({
      id: `txn-${String(idCounter++).padStart(4, "0")}`,
      ...txn,
    });
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomTime(date, hourMin = 7, hourMax = 22) {
    const d = new Date(date);
    d.setHours(randInt(hourMin, hourMax), randInt(0, 59), 0, 0);
    return d.toISOString();
  }

  const today = new Date();

  // =====================================
  // CURRENT ACCOUNT (acc-001)
  // =====================================
  for (let i = 0; i < 900; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    if (date.getDate() === 1 || date.getDate() === 2) {
      add({
        accountId: "acc-001",
        name: "Salary Payment",
        category: "Income",
        amount: `+£${(2600 + rand(-150, 200)).toFixed(2)}`,
        timestamp: randomTime(date, 7, 9),
        status: "Completed",
      });
      continue;
    }

    if (date.getDate() === 5) {
      currentSubscriptions.forEach((sub) => {
        add({
          accountId: "acc-001",
          name: sub.name,
          category: "Subscription",
          amount: `-£${sub.amount.toFixed(2)}`,
          timestamp: randomTime(date, 1, 7),
          status: "Completed",
        });
      });
    }

    const isRecent = i < 30;
    const activityChance = isRecent ? 0.8 : 0.55;

    if (Math.random() > activityChance) continue;

    const count =
      Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;

    for (let j = 0; j < count; j++) {
      const merchant = pick(currentMerchants);

      let category = "Shopping";
      if (
        merchant === "Tesco" ||
        merchant === "Sainsbury's" ||
        merchant === "Lidl" ||
        merchant === "Co-op"
      ) {
        category = "Groceries";
      } else if (merchant === "Uber" || merchant === "Trainline") {
        category = "Transport";
      } else if (
        merchant === "Starbucks" ||
        merchant === "Costa" ||
        merchant === "Greggs" ||
        merchant === "McDonald's" ||
        merchant === "Deliveroo"
      ) {
        category = "Food";
      } else if (merchant === "Shell") {
        category = "Fuel";
      }

      const amount = rand(3, 120);

      let status = "Completed";
      if (i < 3 && Math.random() < 0.4) status = "Pending";
      if (Math.random() < 0.03) status = "Declined";

      add({
        accountId: "acc-001",
        name: merchant,
        category,
        amount: `-£${amount.toFixed(2)}`,
        timestamp: randomTime(date),
        status,
      });
    }
  }

  // =====================================
  // SAVINGS ACCOUNT (acc-002)
  // =====================================
  for (let i = 0; i < 36; i++) {
    const baseDate = new Date();
    baseDate.setMonth(today.getMonth() - i);

    const depositDay = randInt(2, 8);
    const depositDate = new Date(baseDate);
    depositDate.setDate(depositDay);

    add({
      accountId: "acc-002",
      name: "Savings Deposit",
      category: "Transfer",
      amount: `+£${(200 + rand(50, 450)).toFixed(2)}`,
      timestamp: randomTime(depositDate, 8, 10),
      status: "Completed",
    });

    if (Math.random() < 0.75) {
      const interestDate = new Date(baseDate);
      interestDate.setDate(randInt(26, 28));

      add({
        accountId: "acc-002",
        name: "Interest Payment",
        category: "Interest",
        amount: `+£${(4 + rand(1, 18)).toFixed(2)}`,
        timestamp: randomTime(interestDate, 1, 5),
        status: "Completed",
      });
    }

    if (Math.random() < 0.28) {
      const withdrawalDate = new Date(baseDate);
      withdrawalDate.setDate(randInt(10, 24));

      add({
        accountId: "acc-002",
        name: "Transfer to Main Current Account",
        category: "Transfer",
        amount: `-£${(100 + rand(20, 350)).toFixed(2)}`,
        timestamp: randomTime(withdrawalDate, 9, 18),
        status: "Completed",
      });
    }
  }

  for (let i = 0; i < 6; i++) {
    const recentDate = new Date();
    recentDate.setDate(today.getDate() - randInt(0, 60));

    add({
      accountId: "acc-002",
      name: i % 2 === 0 ? "Round-up Transfer" : "Savings Deposit",
      category: "Transfer",
      amount: `+£${(15 + rand(5, 120)).toFixed(2)}`,
      timestamp: randomTime(recentDate, 8, 20),
      status: i === 0 ? "Pending" : "Completed",
    });
  }

  // =====================================
  // CREDIT ACCOUNT (acc-003)
  // =====================================
  for (let i = 0; i < 730; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const isRecent = i < 45;
    const activityChance = isRecent ? 0.42 : 0.2;

    if (Math.random() > activityChance) continue;

    const count =
      Math.random() < 0.72 ? 1 : Math.random() < 0.92 ? 2 : 3;

    for (let j = 0; j < count; j++) {
      const merchant = pick(creditMerchants);

      let category = "Shopping";
      if (merchant === "Booking.com" || merchant === "Airbnb") {
        category = "Travel";
      } else if (merchant === "B&Q" || merchant === "Halfords") {
        category = "Home";
      }

      let amount = rand(18, 260);
      if (merchant === "Apple Store" || merchant === "Currys") {
        amount = rand(120, 1400);
      }

      let status = "Completed";
      if (i < 5 && Math.random() < 0.35) status = "Pending";
      if (Math.random() < 0.045) status = "Declined";

      add({
        accountId: "acc-003",
        name: merchant,
        category,
        amount: `-£${amount.toFixed(2)}`,
        timestamp: randomTime(date, 9, 22),
        status,
      });
    }

    if (date.getDate() === 12 || date.getDate() === 13) {
      add({
        accountId: "acc-003",
        name: "Credit Card Payment",
        category: "Payment",
        amount: `+£${(180 + rand(80, 650)).toFixed(2)}`,
        timestamp: randomTime(date, 7, 9),
        status: "Completed",
      });
    }
  }

  data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return data;
})();