import { useEffect, useState } from "react";
import "./home.css";
import "./rewards.css";

import RewardOfferCard from "../components/RewardOfferCard";
import Skeleton from "../components/Skeleton";
import rewardsData from "../data/rewardsData";

function Rewards() {
  const [isLoading, setIsLoading] = useState(true);

  const [offers, setOffers] = useState(() => {
    const savedOffers = localStorage.getItem("rewardsOffers");

    if (!savedOffers) {
      return rewardsData;
    }

    try {
      const parsedSavedOffers = JSON.parse(savedOffers);

      const mergedOffers = rewardsData.map((defaultOffer) => {
        const savedOffer = parsedSavedOffers.find(
          (offer) => offer.id === defaultOffer.id
        );

        return savedOffer
          ? { ...defaultOffer, activated: savedOffer.activated }
          : defaultOffer;
      });

      return mergedOffers;
    } catch (error) {
      console.error("Failed to read saved rewards offers:", error);
      return rewardsData;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("rewardsOffers", JSON.stringify(offers));
  }, [offers]);

  function handleToggleActivate(id) {
    setOffers((currentOffers) =>
      currentOffers.map((offer) =>
        offer.id === id
          ? { ...offer, activated: !offer.activated }
          : offer
      )
    );
  }

  const activeOffersCount = offers.filter((offer) => offer.activated).length;

  if (isLoading) {
    return (
      <main className="home-page rewards-page">
        <header className="dashboard-header">
          <h1>Rewards</h1>
          <p>Activate offers and keep track of your available rewards.</p>
        </header>

        <div
          className="selected-account-card rewards-hero-card"
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        >
          <Skeleton width="140px" height="0.9rem" />
          <Skeleton width="220px" height="1.6rem" style={{ marginTop: "0.8rem" }} />
          <Skeleton width="280px" height="0.9rem" style={{ marginTop: "0.75rem" }} />
        </div>

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <article key={index} className="summary-card">
              <Skeleton width="110px" height="0.9rem" />
              <Skeleton width="90px" height="1.6rem" style={{ marginTop: "0.8rem" }} />
            </article>
          ))}
        </section>

        <section className="rewards-offers-grid">
          {[...Array(7)].map((_, index) => (
            <article key={index} className="reward-offer-card reward-offer-card-loading">
              <div className="reward-offer-image-wrap">
                <Skeleton width="100%" height="100%" />
              </div>

              <div className="reward-offer-content">
                <Skeleton width="90px" height="1.6rem" />
                <Skeleton width="70%" height="1.2rem" />
                <Skeleton width="100%" height="0.95rem" />
                <Skeleton width="85%" height="0.95rem" />
                <Skeleton width="120px" height="0.95rem" />
                <Skeleton width="100%" height="2.8rem" style={{ marginTop: "0.5rem" }} />
              </div>
            </article>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="home-page rewards-page">
      <header className="dashboard-header">
        <h1>Rewards</h1>
        <p>Activate offers and keep track of your available rewards.</p>
      </header>

      <section className="selected-account-card rewards-hero-card">
        <div className="selected-account-card-top">
          <span className="selected-account-label">Available Rewards</span>
          <span className="selected-account-type">
            {activeOffersCount} Active
          </span>
        </div>

        <h2 className="selected-account-name">Offers just for you</h2>
        <p className="rewards-hero-text">
          Browse your available offers and activate the ones you want to use.
        </p>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <h3>Total Offers</h3>
          <p>{offers.length}</p>
        </article>

        <article className="summary-card">
          <h3>Activated</h3>
          <p>{activeOffersCount}</p>
        </article>

        <article className="summary-card">
          <h3>Available</h3>
          <p>{offers.length - activeOffersCount}</p>
        </article>
      </section>

      <section className="rewards-offers-grid">
        {offers.map((offer) => (
          <RewardOfferCard
            key={offer.id}
            title={offer.title}
            description={offer.description}
            category={offer.category}
            cashback={offer.cashback}
            expiry={offer.expiry}
            image={offer.image}
            activated={offer.activated}
            onToggleActivate={() => handleToggleActivate(offer.id)}
          />
        ))}
      </section>
    </main>
  );
}

export default Rewards;