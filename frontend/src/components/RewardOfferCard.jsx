import { useState } from "react";

function RewardOfferCard({
  title,
  description,
  category,
  cashback,
  expiry,
  image,
  activated,
  onToggleActivate,
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  function handleClick() {
    setIsAnimating(true);
    onToggleActivate();

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }

  return (
    <article
      className={`reward-offer-card ${
        activated ? "reward-offer-card-active" : ""
      } ${isAnimating ? "reward-offer-card-animating" : ""}`}
    >
      <div className="reward-offer-image-wrap">
        {image && (
          <div className="reward-card-image">
            <img src={image} alt={title} />
            <span className="reward-card-image-badge">{category}</span>
          </div>
        )}
      </div>

      <div className="reward-offer-content">
  <h3>{title}</h3>
  <p>{description}</p>

  <div className="reward-offer-meta">
    <span className="reward-offer-cashback">{cashback}</span>
    <span className="reward-offer-expiry">{expiry}</span>
  </div>

  <button
    type="button"
    className={`reward-offer-button ${
      activated ? "reward-offer-button-active" : ""
    }`}
    onClick={handleClick}
  >
    {activated ? "✓ Activated" : "Activate"}
  </button>
</div>
    </article>
  );
}

export default RewardOfferCard;