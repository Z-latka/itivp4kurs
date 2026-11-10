import { LifeBuoy } from "lucide-react";
import { navigate } from "../router";

export default function CrisisNote({ strong = false }) {
  return (
    <div className={`crisis-note${strong ? " strong" : ""}`} role={strong ? "alert" : undefined}>
      <LifeBuoy size={22} />
      <div>
        <strong>
          {strong
            ? "Если появляются мысли причинить себе вред — вы не одни, и помощь есть."
            : "Нужна срочная помощь?"}
        </strong>
        <p>
          Позвоните <a href="tel:112" className="phone-link">112</a> или{" "}
          <a href="tel:103" className="phone-link">103</a>, либо на телефон
          доверия вашего города — там круглосуточно и анонимно выслушают.{" "}
          <a
            href="#/help"
            onClick={(e) => {
              e.preventDefault();
              navigate("help");
            }}
          >
            Что можно сделать прямо сейчас →
          </a>
        </p>
      </div>
    </div>
  );
}
