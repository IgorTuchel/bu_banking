import lifestyleImg from "../assets/rewards/Lifestyle.jpg";
import shoppingImg from "../assets/rewards/Shopping.jpg";
import entertainmentImg from "../assets/rewards/Entertainment.jpg";
import transportImg from "../assets/rewards/Transport.jpg";
import groceryImg from "../assets/rewards/Grocery.jpg";
import travelImg from "../assets/rewards/Travel.jpg";
import diningImg from "../assets/rewards/Dining.jpg";

const rewardsData = [
  {
    id: "dining-cashback",
    title: "Dining Cashback",
    description: "Earn cashback when you eat out at selected restaurants this month.",
    category: "Dining",
    cashback: "5% cashback",
    expiry: "Ends 18 May",
    image: diningImg,
    activated: false,
},
  {
    id: "travel-boost",
    title: "Travel Rewards Boost",
    description: "Get extra rewards on flights, hotels, and travel bookings.",
    category: "Travel",
    cashback: "2x points",
    expiry: "Ends 25 May",
    image: travelImg,
    activated: false,
  },
  {
    id: "grocery-offer",
    title: "Grocery Saver",
    description: "Unlock cashback on eligible grocery spending this week.",
    category: "Groceries",
    cashback: "3% cashback",
    expiry: "Ends 28 May",
    image: groceryImg,
    activated: false,
  },
  {
    id: "fuel-cashback",
    title: "Fuel Cashback",
    description: "Earn cashback when filling up at selected fuel stations.",
    category: "Transport",
    cashback: "4% cashback",
    expiry: "Ends 02 Jun",
    image: transportImg,
    activated: false,
  },
  {
    id: "entertainment-offer",
    title: "Entertainment Rewards",
    description: "Get rewards when spending on movies, streaming, and events.",
    category: "Entertainment",
    cashback: "6% cashback",
    expiry: "Ends 06 Jun",
    image: entertainmentImg,
    activated: false,
  },
  {
    id: "online-shopping",
    title: "Online Shopping Bonus",
    description: "Earn extra cashback when shopping with selected online retailers.",
    category: "Shopping",
    cashback: "7% cashback",
    expiry: "Ends 10 Jun",
    image: shoppingImg,
    activated: false,
  },
  {
    id: "fitness-offer",
    title: "Fitness & Wellness",
    description: "Get rewards on gym memberships and wellness services.",
    category: "Lifestyle",
    cashback: "5% cashback",
    expiry: "Ends 14 Jun",
    image: lifestyleImg,
    activated: false,
  },
];

export default rewardsData;