export default function CrisisNote({ strong = false }) {
  return (
    <div className={`crisis-note${strong ? " crisis-note-strong" : ""}`}>
      <div className="crisis-icon">🆘</div>
      <div>
        <strong>
          {strong
            ? "Если у вас появляются мысли причинить себе вред — вы не одни."
            : "Нужна срочная помощь?"}
        </strong>
        <p>
          Позвоните на единый номер экстренных служб <a href="tel:112">112</a>{" "}
          или в скорую помощь <a href="tel:103">103</a>. Вы также можете
          обратиться на телефон доверия вашего города — там круглосуточно и
          анонимно выслушают и помогут.
        </p>
      </div>
    </div>
  );
}
