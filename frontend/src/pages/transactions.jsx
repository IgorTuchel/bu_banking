import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import "./home.css";
import "./transactions.css";

import AccountDropdown from "../components/AccountDropdown";
import SearchInput from "../components/SearchInput";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";
import SkeletonTransactionsList from "../components/SkeletonTransactionsList";

import { getCurrentUser } from "../services/userService";
import {
  getAccountsForUser,
  getAccountByKeyForUser,
} from "../services/accountService";
import { getTransactionsForAccount } from "../services/transactionService";

import {
  filterTransactionsByDateRange,
  formatTransactionDate,
  getAmountValue,
  getDateRangeLabel,
  groupTransactions,
  addRunningBalance,
} from "../utils/transactionUtils";
import { getAccountSummaryCards } from "../utils/accountSummaryUtils";

import { TRANSACTIONS_CONFIG } from "../constants/transactions";

const { INITIAL_VISIBLE_COUNT, LOAD_MORE_COUNT } = TRANSACTIONS_CONFIG;
const GEOCODE_CACHE = new Map();
const GEOCODE_PENDING = new Map();

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const dateRangeOptions = [
  { value: "thisMonth", label: "This month" },
  { value: "last30Days", label: "Last 30 days" },
  { value: "last90Days", label: "Last 90 days" },
  { value: "allTime", label: "All time" },
];

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function normalizeLocationValue(value) {
  return String(value ?? "").trim();
}

function shouldUseLocationText(value) {
  const normalized = normalizeLocationValue(value).toLowerCase();

  if (!normalized) {
    return false;
  }

  return ![
    "card terminal",
    "online",
    "online banking",
    "not provided",
  ].some((term) => normalized.includes(term));
}

function getCountryName(value) {
  const normalized = String(value ?? "").trim().toUpperCase();

  const countryMap = {
    GB: "United Kingdom",
    UK: "United Kingdom",
    US: "United States",
    USA: "United States",
    NL: "Netherlands",
    FR: "France",
    DE: "Germany",
    ES: "Spain",
    IT: "Italy",
    IE: "Ireland",
    PT: "Portugal",
    BE: "Belgium",
    CH: "Switzerland",
    AT: "Austria",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    PL: "Poland",
    CZ: "Czech Republic",
  };

  return countryMap[normalized] ?? value;
}

function getCountryCode(transaction) {
  const merchant = transaction.merchant ?? {};

  const value = firstDefined(
    transaction.country,
    transaction.countryCode,
    merchant.country,
    merchant.countryCode
  );

  const normalized = String(value ?? "").trim().toUpperCase();

  return normalized || null;
}

function getLocationLabel(transaction) {
  const merchant = transaction.merchant ?? {};

  const city = firstDefined(
    transaction.city,
    transaction.cityName,
    transaction.town,
    transaction.locationCity,
    merchant.city,
    merchant.cityName,
    merchant.town
  );

  const country = firstDefined(
    transaction.country,
    transaction.countryName,
    merchant.country,
    merchant.countryName
  );

  const readableCountry = getCountryName(country);

  return firstDefined(
    merchant.location,
    transaction.location,
    city && readableCountry ? `${city}, ${readableCountry}` : null,
    city
  );
}

function getGeocodeQuery(transaction) {
  const merchant = transaction.merchant ?? {};

  const city = firstDefined(
    transaction.city,
    transaction.cityName,
    transaction.town,
    transaction.locationCity,
    merchant.city,
    merchant.cityName,
    merchant.town
  );

  const country = firstDefined(
    transaction.country,
    transaction.countryName,
    merchant.country,
    merchant.countryName
  );

  const readableCountry = getCountryName(country);

  if (city && readableCountry) {
    return normalizeLocationValue(`${city}, ${readableCountry}`);
  }

  if (city) {
    return normalizeLocationValue(city);
  }

  const fallbackLocation = firstDefined(
    typeof transaction.location === "string" ? transaction.location : null,
    transaction.locationName,
    transaction.place,
    typeof merchant.location === "string" ? merchant.location : null
  );

  return shouldUseLocationText(fallbackLocation)
    ? normalizeLocationValue(fallbackLocation)
    : null;
}

async function geocodeFromOpenMeteo(query, signal, countryCode) {
  const params = new URLSearchParams({
    count: "1",
    name: query,
  });

  if (countryCode) {
    params.append("countryCode", countryCode.toLowerCase());
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Open-Meteo geocoding failed: ${response.status} ${response.statusText} | ${text}`
    );
  }

  const data = await response.json();
  const match = data?.results?.[0];
  const latitude = Number(match?.latitude);
  const longitude = Number(match?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return [latitude, longitude];
  }

  return null;
}

async function geocodeFromNominatim(query, signal, countryCode) {
  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    q: query,
  });

  if (countryCode) {
    params.append("countrycodes", countryCode.toLowerCase());
  }

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Nominatim geocoding failed: ${response.status} ${response.statusText} | ${text}`
    );
  }

  const data = await response.json();
  const firstMatch = data?.[0];
  const latitude = Number(firstMatch?.lat);
  const longitude = Number(firstMatch?.lon);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return [latitude, longitude];
  }

  return null;
}

async function geocodeLocationQuery(query, countryCode, signal) {
  if (!query) {
    return null;
  }

  const candidates = [...new Set([query].filter(Boolean))];

  for (const candidate of candidates) {
    try {
      const openMeteoResult = await geocodeFromOpenMeteo(
        candidate,
        signal,
        countryCode
      );

      if (openMeteoResult) {
        console.log("Geocoding success:", {
          provider: "Open-Meteo",
          candidate,
          countryCode,
          coordinates: openMeteoResult,
        });
        return openMeteoResult;
      }

      console.warn("Open-Meteo returned no result:", candidate, countryCode);
    } catch (error) {
      if (error?.name === "AbortError") {
        return null;
      }

      console.error(
        "Open-Meteo failed:",
        candidate,
        countryCode,
        error?.message ?? error
      );
    }

    try {
      const nominatimResult = await geocodeFromNominatim(
        candidate,
        signal,
        countryCode
      );

      if (nominatimResult) {
        console.log("Geocoding success:", {
          provider: "Nominatim",
          candidate,
          countryCode,
          coordinates: nominatimResult,
        });
        return nominatimResult;
      }

      console.warn("Nominatim returned no result:", candidate, countryCode);
    } catch (error) {
      if (error?.name === "AbortError") {
        return null;
      }

      console.error(
        "Nominatim failed:",
        candidate,
        countryCode,
        error?.message ?? error
      );
    }
  }

  return null;
}

function TransactionLocationMap({ transaction }) {
  const [center, setCenter] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const geocodeQuery = getGeocodeQuery(transaction);
  const countryCode = getCountryCode(transaction);
  const cacheKey = `${geocodeQuery ?? ""}::${countryCode ?? ""}`;
  const locationLabel = getLocationLabel(transaction) ?? geocodeQuery;

  useEffect(() => {
    if (!geocodeQuery) {
      setCenter(null);
      setIsResolving(false);
      return;
    }

    if (GEOCODE_CACHE.has(cacheKey)) {
      const cached = GEOCODE_CACHE.get(cacheKey);
      setCenter(cached);
      setIsResolving(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    async function geocodeLocation() {
      try {
        setIsResolving(true);

        if (GEOCODE_PENDING.has(cacheKey)) {
          const pendingCenter = await GEOCODE_PENDING.get(cacheKey);

          if (!isCancelled) {
            setCenter(pendingCenter);
          }

          return;
        }

        const requestPromise = geocodeLocationQuery(
          geocodeQuery,
          countryCode,
          controller.signal
        );

        GEOCODE_PENDING.set(cacheKey, requestPromise);

        const resolvedCoordinates = await requestPromise;
        GEOCODE_PENDING.delete(cacheKey);

        if (resolvedCoordinates) {
          GEOCODE_CACHE.set(cacheKey, resolvedCoordinates);
        }

        if (!isCancelled) {
          setCenter(resolvedCoordinates);
        }
      } catch (error) {
        GEOCODE_PENDING.delete(cacheKey);

        if (error?.name !== "AbortError") {
          console.error("Geocoding failed:", geocodeQuery, countryCode, error);
        }

        if (!isCancelled) {
          setCenter(null);
        }
      } finally {
        if (!isCancelled) {
          setIsResolving(false);
        }
      }
    }

    geocodeLocation();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [geocodeQuery, countryCode, cacheKey]);

  if (isResolving) {
    return (
      <div className="transaction-map transaction-map-status">
        Resolving map location{locationLabel ? ` for ${locationLabel}` : ""}…
      </div>
    );
  }

  if (!geocodeQuery) {
    return (
      <div className="transaction-map transaction-map-status">
        No city location stored for this transaction.
      </div>
    );
  }

  if (!center) {
    return (
      <div className="transaction-map transaction-map-status">
        Could not resolve map coordinates for {locationLabel ?? geocodeQuery}.
      </div>
    );
  }

  return (
    <div className="transaction-map">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}

function getCurrencyCode(transaction, accountCurrency) {
  return firstDefined(
    transaction.currency,
    transaction.transactionCurrency,
    transaction.originalCurrency,
    accountCurrency
  );
}

function getTransferCounterparty(transaction) {
  return firstDefined(
    transaction.payerName,
    transaction.payeeName,
    transaction.counterpartyName,
    transaction.beneficiaryName
  );
}

function getTransactionDetails(transaction, accountType, accountCurrency) {
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
      value: firstDefined(
        merchant.name,
        transaction.merchantName,
        transaction.name
      ),
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

export default function TransactionsPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);

  const [searchState, setSearchState] = useState({
    inputValue: "",
    tags: [],
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("thisMonth");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedTransactions, setExpandedTransactions] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const transactionsListRef = useRef(null);

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
        }
      } catch {
        setErrorMessage("Failed to load account data.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    async function loadTransactions() {
      if (!user || !selectedAccountKey) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const account = await getAccountByKeyForUser(user.id, selectedAccountKey);

        if (!account) {
          return;
        }

        const data = await getTransactionsForAccount(account.id);

        setTransactions(Array.isArray(data) ? data : []);
        setAvailableBalance(
          Number(account.currentBalance ?? account.availableCredit ?? 0)
        );
      } catch {
        setErrorMessage("Unable to load transactions.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, [user, selectedAccountKey]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setCollapsedGroups({});
    setExpandedTransactions({});
  }, [searchState, activeFilter, selectedDateRange, selectedAccountKey]);

  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.key,
      label: `${acc.name} • ${acc.type}`,
    }));
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.key === selectedAccountKey) ?? null;
  }, [accounts, selectedAccountKey]);

  const dateFilteredTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, selectedDateRange);
  }, [transactions, selectedDateRange]);

  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions.filter((transaction) => {
      const name = transaction.name ?? "";
      const category = transaction.category ?? "";
      const amount = transaction.amount ?? "";
      const status = transaction.status ?? "";
      const merchant = transaction.merchant ?? {};
      const merchantName = merchant.name ?? transaction.merchantName ?? "";
      const merchantCategory = merchant.category ?? "";
      const merchantType = merchant.type ?? "";
      const merchantLocation = merchant.location ?? "";

      const amountValue = getAmountValue(amount);
      const absoluteAmount = Math.abs(amountValue);

      const searchableText = [
        name,
        category,
        amount,
        merchantName,
        merchantCategory,
        merchantType,
        merchantLocation,
        absoluteAmount.toFixed(2),
        absoluteAmount.toString(),
      ]
        .join(" ")
        .toLowerCase();

      const inputTerm = searchState.inputValue.trim().toLowerCase();
      const tagTerms = searchState.tags.map((tag) => tag.toLowerCase());

      const matchesInput = !inputTerm || searchableText.includes(inputTerm);
      const matchesTags =
        tagTerms.length === 0 ||
        tagTerms.every((tag) => searchableText.includes(tag));

      const matchesSearch = matchesInput && matchesTags;

      if (activeFilter === "In") {
        return matchesSearch && amount.startsWith("+");
      }

      if (activeFilter === "Out") {
        return matchesSearch && amount.startsWith("-");
      }

      if (activeFilter === "Pending") {
        return matchesSearch && status === "Pending";
      }

      return matchesSearch;
    });
  }, [dateFilteredTransactions, searchState, activeFilter]);

  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const transactionsWithBalance = useMemo(() => {
    return addRunningBalance(visibleTransactions, availableBalance);
  }, [visibleTransactions, availableBalance]);

  const groupedTransactions = useMemo(() => {
    try {
      return groupTransactions(transactionsWithBalance);
    } catch (error) {
      console.error("Grouping error:", error);
      return [];
    }
  }, [transactionsWithBalance]);

  const hasMoreTransactions = visibleCount < filteredTransactions.length;
  const canCollapseVisible = visibleCount > INITIAL_VISIBLE_COUNT;
  const dateRangeLabel = getDateRangeLabel(selectedDateRange);

  const totals = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;

    dateFilteredTransactions.forEach((transaction) => {
      const amount = getAmountValue(transaction.amount ?? "0");

      if (amount > 0) {
        incoming += amount;
      } else {
        outgoing += Math.abs(amount);
      }
    });

    return {
      currentBalance: availableBalance.toFixed(2),
      incoming: incoming.toFixed(2),
      outgoing: outgoing.toFixed(2),
    };
  }, [dateFilteredTransactions, availableBalance]);

  const summaryCards = useMemo(() => {
    return getAccountSummaryCards({
      account: selectedAccount,
      incoming: Number(totals.incoming),
      outgoing: Number(totals.outgoing),
      dateRangeLabel,
    });
  }, [selectedAccount, totals.incoming, totals.outgoing, dateRangeLabel]);

  function scrollTransactionsToTop() {
    if (transactionsListRef.current) {
      transactionsListRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function toggleGroup(label) {
    setCollapsedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  function toggleTransaction(transactionId) {
    setExpandedTransactions((current) => ({
      ...current,
      [transactionId]: !current[transactionId],
    }));
  }

  if (isLoading) {
    return (
      <main className="home-page transactions-page">
        <header className="dashboard-header">
          <h1>Transactions</h1>
          <p>Review, search, and filter all account activity in one place.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="transactions-section transactions-page-section">
          <div className="transactions-toolbar">
            <Skeleton
              width="100%"
              height="3rem"
              style={{ flex: 1, minWidth: "240px" }}
            />
            <Skeleton width="190px" height="3rem" />
            <Skeleton width="340px" height="3rem" />
          </div>

          <div className="transactions-list">
            <SkeletonTransactionsList />
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="home-page transactions-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="home-page transactions-page">
      <header className="dashboard-header">
        <h1>Transactions</h1>
        <p>Review, search, and filter all account activity in one place.</p>
      </header>

      <AccountDropdown
        label="Select account"
        value={selectedAccountKey}
        onChange={setSelectedAccountKey}
        options={accountOptions}
      />

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <article
            key={card.id}
            className={`summary-card ${
              selectedAccount?.type === "credit" && card.id === "available-credit"
                ? "summary-balance"
                : selectedAccount?.type === "savings" &&
                  card.id === "savings-balance"
                ? "summary-balance"
                : card.id.includes("incoming") || card.id.includes("interest-earned")
                ? "summary-incoming"
                : card.id.includes("outgoing") ||
                  card.id.includes("interest-rate") ||
                  card.id.includes("minimum-payment")
                ? "summary-outgoing"
                : ""
            }`}
          >
            <h3>{card.title}</h3>
            <p>{card.value}</p>
            <small className="summary-card-note">{card.note}</small>
          </article>
        ))}
      </section>

      <section className="transactions-section transactions-page-section">
        <div className="section-header">
          <div>
            <h2>All Transactions</h2>
            <p className="transactions-subtext">
              Showing {Math.min(visibleCount, filteredTransactions.length)} of{" "}
              {filteredTransactions.length} transactions
            </p>
          </div>
        </div>

        <div className="transactions-toolbar">
          <SearchInput
            value={searchState}
            onChange={setSearchState}
            placeholder="Search by name, merchant, category or amount"
            ariaLabel="Search transactions"
          />

          <div className="transactions-date-range-popover">
            <AccountDropdown
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              options={dateRangeOptions}
            />
          </div>

          <div className="transactions-filters segmented">
            <div
              className="segmented-indicator"
              style={{
                transform: `translateX(${
                  ["All", "In", "Out", "Pending"].indexOf(activeFilter) * 100
                }%)`,
              }}
            />

            {["All", "In", "Out", "Pending"].map((filter) => (
              <Button
                key={filter}
                variant="pill"
                active={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
                icon={
                  filter === "In"
                    ? "↓"
                    : filter === "Out"
                    ? "↑"
                    : filter === "Pending"
                    ? "⏳"
                    : null
                }
                className="segmented-btn"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="transactions-list" ref={transactionsListRef}>
          {groupedTransactions.length > 0 ? (
            <>
              {groupedTransactions.map((group) => {
                const groupTotal = group.items.reduce(
                  (sum, transaction) =>
                    sum + getAmountValue(transaction.amount ?? "0"),
                  0
                );

                const isCollapsed = Boolean(collapsedGroups[group.label]);

                return (
                  <section key={group.label} className="transaction-group">
                    <button
                      type="button"
                      className="transaction-group-toggle"
                      onClick={() => toggleGroup(group.label)}
                      aria-expanded={!isCollapsed}
                    >
                      <span className="transaction-group-heading">
                        <span>{group.label}</span>
                        <span />
                        <span className="transaction-group-total">
                          <span className="transaction-group-total-label">
                            Total:
                          </span>
                          <span className="transaction-group-total-value">
                            {groupTotal.toLocaleString("en-GB", {
                              style: "currency",
                              currency: selectedAccount?.currency ?? "GBP",
                            })}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`transaction-group-symbol ${
                          isCollapsed ? "collapsed" : "expanded"
                        }`}
                      >
                        {isCollapsed ? "+" : "−"}
                      </span>
                    </button>

                    <div
                      className={`transaction-group-content ${
                        isCollapsed
                          ? "transaction-group-content-collapsed"
                          : "transaction-group-content-expanded"
                      }`}
                    >
                      <div className="transaction-group-content-inner">
                        {group.items.map((transaction) => {
                          const amount = transaction.amount ?? "£0.00";
                          const status = transaction.status ?? "Completed";
                          const timestamp = transaction.timestamp ?? new Date();
                          const isPositive = amount.startsWith("+");
                          const merchantName =
                            transaction.merchant?.name ??
                            transaction.merchantName ??
                            transaction.name;
                          const merchantCategory =
                            transaction.merchant?.category ??
                            transaction.category;
                          const detailRows = getTransactionDetails(
                            transaction,
                            selectedAccount?.type,
                            selectedAccount?.currency
                          );
                          const isExpanded = Boolean(
                            expandedTransactions[transaction.id]
                          );

                          return (
                            <div
                              key={transaction.id}
                              className={`transaction-row transaction-row-detailed transaction-row-expandable ${
                                isExpanded ? "transaction-row-open" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="transaction-row-toggle"
                                onClick={() => toggleTransaction(transaction.id)}
                                aria-expanded={isExpanded}
                              >
                                <div className="transaction-main">
                                  <p className="transaction-name">
                                    {merchantName}
                                  </p>
                                  <p className="transaction-date">
                                    {formatTransactionDate(timestamp)} •{" "}
                                    {merchantCategory}
                                  </p>
                                </div>

                                <div className="transaction-right">
                                  <div className="transaction-meta">
                                    <span
                                      className={`transaction-status ${
                                        status === "Pending"
                                          ? "transaction-status-pending"
                                          : status === "Declined"
                                          ? "transaction-status-declined"
                                          : "transaction-status-completed"
                                      }`}
                                    >
                                      {status}
                                    </span>

                                    <div className="transaction-amount-wrapper">
                                      <p
                                        className={`transaction-amount ${
                                          isPositive
                                            ? "transaction-positive"
                                            : "transaction-negative"
                                        }`}
                                      >
                                        {amount}
                                      </p>

                                      <p className="transaction-balance">
                                        £{transaction.runningBalance.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className={`transaction-expand-icon ${
                                      isExpanded ? "expanded" : ""
                                    }`}
                                    aria-hidden="true"
                                  >
                                    ▾
                                  </span>
                                </div>
                              </button>

                              <div
                                className={`transaction-extra-details ${
                                  isExpanded
                                    ? "transaction-extra-details-expanded"
                                    : "transaction-extra-details-collapsed"
                                }`}
                              >
                                <div className="transaction-extra-details-inner">
                                  {detailRows.map((detail) => (
                                    <p key={`${transaction.id}-${detail.label}`}>
                                      <span>{detail.label}:</span> {detail.value}
                                    </p>
                                  ))}
                                </div>

                                {isExpanded ? (
                                  <TransactionLocationMap
                                    transaction={transaction}
                                  />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}

              {(hasMoreTransactions || canCollapseVisible) && (
                <div className="transactions-load-more">
                  <div className="transactions-load-more-actions">
                    {canCollapseVisible && (
                      <Button
                        variant="pill"
                        onClick={() => {
                          setVisibleCount(INITIAL_VISIBLE_COUNT);
                          scrollTransactionsToTop();
                        }}
                        icon="↑"
                      >
                        Show less
                      </Button>
                    )}

                    {canCollapseVisible && (
                      <Button
                        variant="pill"
                        onClick={scrollTransactionsToTop}
                        icon="⇧"
                      >
                        Back to top
                      </Button>
                    )}
                  </div>

                  {hasMoreTransactions && (
                    <Button
                      variant="pill"
                      onClick={() =>
                        setVisibleCount((prev) => prev + LOAD_MORE_COUNT)
                      }
                      icon="↓"
                    >
                      Show more transactions
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="status-card empty-card">
              <h2>No transactions found</h2>
              <p>Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}