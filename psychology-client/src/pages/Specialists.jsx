import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Award, BookOpen, GraduationCap, Users } from "lucide-react";
import { errorMessage, fetchPsychologist, fetchPsychologists } from "../api";
import { navigate } from "../router";
import { Avatar, EmptyState, Loader, PageHeader, Stars } from "../components/ui";
import ConsultationCard from "../components/ConsultationCard";
import { formatPrice, plural } from "../labels";

const experience = (years) =>
  years ? `Опыт ${years} ${plural(years, "год", "года", "лет")}` : null;

function SpecialistCard({ p }) {
  const open = () => navigate(`specialists/${p.id}`);
  return (
    <div
      className="card card-hover clickable specialist-card"
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      tabIndex={0}
      role="link"
    >
      <div className="row" style={{ gap: "0.9rem", flexWrap: "nowrap" }}>
        <Avatar name={p.fullName} large />
        <div style={{ minWidth: 0 }}>
          <h3 className="mb-0">{p.fullName}</h3>
          <span className="muted small">{p.title}</span>
        </div>
      </div>
      <div className="meta-row mt-sm">
        {p.experienceYears ? <span><Award size={14} /> {experience(p.experienceYears)}</span> : null}
        {p.rating ? (
          <span className="rating-line"><Stars value={p.rating} size={13} /> {p.rating}</span>
        ) : null}
      </div>
      {p.approach && <p className="small mt-sm mb-0"><strong>Подход:</strong> {p.approach}</p>}
      <p className="card-description mt-sm">{p.about}</p>
      {p.topics?.length > 0 && (
        <div className="chips">
          {p.topics.map((t) => <span key={t} className="chip chip-accent">#{t}</span>)}
        </div>
      )}
      <div className="card-footer">
        <span className="small muted">
          {p.consultations} {plural(p.consultations, "консультация", "консультации", "консультаций")}
          {p.minPrice !== undefined && ` · от ${formatPrice(p.minPrice)}`}
        </span>
        <span className="btn btn-soft btn-sm">Подробнее <ArrowRight size={15} /></span>
      </div>
    </div>
  );
}

function SpecialistsList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPsychologists()
      .then(({ data }) => setList(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Специалисты"
        title="Психологи MindCare"
        subtitle="Все специалисты имеют профильное образование и опыт практики. Выберите того, чей подход вам откликается, — или начните с бесплатной первичной встречи."
      />
      {loading && <Loader />}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && list.length === 0 && !error && (
        <EmptyState icon={Users} title="Специалисты скоро появятся" />
      )}
      <div className="grid-2">
        {list.map((p) => <SpecialistCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function SpecialistDetail({ id }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPsychologist(id)
      .then(({ data }) => setP(data))
      .catch((err) => setError(errorMessage(err, "Специалист не найден")));
  }, [id]);

  const back = (
    <a
      href="#/specialists"
      className="back-link"
      onClick={(e) => {
        e.preventDefault();
        navigate("specialists");
      }}
    >
      <ArrowLeft size={16} /> Все специалисты
    </a>
  );

  if (error) {
    return (
      <section className="page">
        {back}
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }
  if (!p) return <Loader />;

  return (
    <section className="page">
      {back}
      <div className="detail-grid">
        <div className="card">
          <div className="row" style={{ gap: "1.1rem", flexWrap: "nowrap", alignItems: "flex-start" }}>
            <span className="avatar xl">{p.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
            <div>
              <h1 style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.2rem)" }} className="mb-0">{p.fullName}</h1>
              <p className="muted mb-0">{p.title}</p>
              {p.rating && (
                <span className="rating-line mt-sm" style={{ display: "inline-flex" }}>
                  <Stars value={p.rating} /> {p.rating} · {p.reviewsCount}{" "}
                  {plural(p.reviewsCount, "отзыв", "отзыва", "отзывов")}
                </span>
              )}
            </div>
          </div>
          {p.about && <p className="mt" style={{ fontSize: "1.05rem" }}>{p.about}</p>}
          {p.topics?.length > 0 && (
            <div className="chips mb-0">
              {p.topics.map((t) => (
                <button key={t} className="chip chip-accent" onClick={() => navigate(`consultations?tag=${t}`)}>
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card side-card stack">
          {p.experienceYears ? (
            <div className="row"><div className="icon-tile sm"><Award size={18} /></div><span>{experience(p.experienceYears)}</span></div>
          ) : null}
          {p.approach && (
            <div className="row"><div className="icon-tile sm"><BookOpen size={18} /></div><span>{p.approach}</span></div>
          )}
          {p.education && (
            <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <div className="icon-tile sm"><GraduationCap size={18} /></div><span className="small">{p.education}</span>
            </div>
          )}
          <button className="btn btn-primary btn-full" onClick={() => document.getElementById("specialist-consultations")?.scrollIntoView({ behavior: "smooth" })}>
            Записаться
          </button>
        </div>
      </div>

      <section className="section" id="specialist-consultations" style={{ marginTop: "2.5rem" }}>
        <h2>Консультации специалиста</h2>
        {p.consultations.length === 0 ? (
          <p className="muted">Сейчас у специалиста нет открытых консультаций.</p>
        ) : (
          <ul className="cards-list mt">
            {p.consultations.map((c) => <ConsultationCard key={c.id} item={c} />)}
          </ul>
        )}
      </section>
    </section>
  );
}

export default function SpecialistsPage({ param }) {
  return param ? <SpecialistDetail key={param} id={param} /> : <SpecialistsList />;
}
