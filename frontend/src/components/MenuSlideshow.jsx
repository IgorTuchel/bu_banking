import { useEffect, useMemo, useState } from "react";
import "./menuSlideshow.css";

// Automatically import all images in folder
const imageModules = import.meta.glob(
  "../assets/menu_slideshow/*.{jpg,jpeg,png,webp,avif}",
  {
    eager: true,
    import: "default",
  }
);

const IMAGES = Object.values(imageModules);

const MESSAGES = [
  {
    id: 1,
    kicker: "Insight",
    title: "A clearer view of your finances",
    text: "Track spending, review transactions, and explore smarter ways to stay in control.",
  },
  {
    id: 2,
    kicker: "Rewards",
    title: "Premium benefits, thoughtfully presented",
    text: "Access rewards, offers, and curated perks through a more refined banking experience.",
  },
  {
    id: 3,
    kicker: "Control",
    title: "Elegant tools for everyday banking",
    text: "Manage cards, monitor account activity, and navigate support with confidence.",
  },
];

function getRandomIndex(length, excludeIndex = null) {
  if (length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * length);

  while (nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * length);
  }

  return nextIndex;
}

function getAverageBrightness(imageSrc, callback) {
  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      callback("dark");
      return;
    }

    const sampleWidth = 40;
    const sampleHeight = 40;

    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    context.drawImage(img, 0, 0, sampleWidth, sampleHeight);

    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);

    let totalLuminance = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];

      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      totalLuminance += luminance;
      pixelCount += 1;
    }

    const averageBrightness = totalLuminance / pixelCount;
    callback(averageBrightness > 145 ? "light" : "dark");
  };

  img.onerror = () => {
    callback("dark");
  };
}

export default function MenuSlideshow() {
  const images = useMemo(() => IMAGES, []);
  const messages = useMemo(() => MESSAGES, []);

  const [activeImageIndex, setActiveImageIndex] = useState(() =>
    getRandomIndex(IMAGES.length)
  );
  const [activeMessageIndex, setActiveMessageIndex] = useState(() =>
    getRandomIndex(MESSAGES.length)
  );
  const [contrastMode, setContrastMode] = useState("dark");

  useEffect(() => {
    if (!images.length) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) =>
        getRandomIndex(images.length, current)
      );
      setActiveMessageIndex((current) =>
        getRandomIndex(messages.length, current)
      );
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [images.length, messages.length]);

  useEffect(() => {
    if (!images.length) {
      return;
    }

    const activeImage = images[activeImageIndex];
    getAverageBrightness(activeImage, setContrastMode);
  }, [activeImageIndex, images]);

  if (!images.length) {
    return null;
  }

  const activeImage = images[activeImageIndex];
  const activeMessage = messages[activeMessageIndex];

  return (
    <div className="navMenuSlideshow">
      <div className="navMenuSlideshowTrack">
        <div className="navMenuSlide active">
          <div
            className={`navMenuSlideMessage navMenuSlideMessage-${contrastMode}`}
          >
            <p className="navMenuSlideKicker">{activeMessage.kicker}</p>
            <h3 className="navMenuSlideTitle">{activeMessage.title}</h3>
            <p className="navMenuSlideText">{activeMessage.text}</p>
          </div>

          <div className="navMenuSlideImageWrap">
            <div
              className="navMenuSlideImage"
              style={{ backgroundImage: `url("${activeImage}")` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="navMenuSlideDots">
          {messages.map((message, index) => (
            <button
              key={message.id}
              type="button"
              className={`navMenuSlideDot ${
                index === activeMessageIndex ? "active" : ""
              }`}
              aria-label={`Show message ${index + 1}`}
              aria-pressed={index === activeMessageIndex}
              onClick={() => setActiveMessageIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}