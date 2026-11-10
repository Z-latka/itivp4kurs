import {
  ArrowRight,
  Droplets,
  Footprints,
  HeartHandshake,
  MessageCircle,
  Phone,
  Snowflake,
  Users,
} from "lucide-react";
import { navigate } from "../router";
import { PageHeader } from "../components/ui";
import Breathing from "../components/Breathing";
import Grounding from "../components/Grounding";

const QUICK = [
  { icon: Snowflake, title: "Холодная вода", text: "Умойтесь прохладной водой или подержите запястья под краном 30 секунд — это замедляет сердцебиение." },
  { icon: Droplets, title: "Глоток воды", text: "Медленно выпейте стакан воды, концентрируясь на ощущениях." },
  { icon: Footprints, title: "Почувствуйте опору", text: "Встаньте, почувствуйте стопы на полу, перенесите вес с пятки на носок несколько раз." },
  { icon: Users, title: "Не оставайтесь одни", text: "Позвоните или напишите близкому человеку. Можно просто сказать: «Мне сейчас тяжело»." },
];

const WHEN = [
  "тревога или подавленность держатся дольше двух недель;",
  "стало трудно работать, учиться или общаться с близкими;",
  "нарушились сон или аппетит;",
  "появилось желание отгородиться от всех или «ничего не чувствовать»;",
  "вы чаще обычного прибегаете к алкоголю или другим способам «отключиться».",
];

export default function HelpPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Самопомощь"
        title="Если тяжело прямо сейчас"
        subtitle="Простые упражнения, которые помогают пережить волну тревоги или паники. Они не заменяют помощь специалиста, но дают опору здесь и сейчас."
      />

      <section className="emergency">
        <div>
          <h2>Есть угроза жизни или здоровью?</h2>
          <p className="mb-0">
            Если вы думаете о том, чтобы причинить себе вред, или рядом
            человек в опасности — звоните сразу. Звонки бесплатные и
            работают круглосуточно. Также можно обратиться на телефон доверия
            вашего города.
          </p>
        </div>
        <div className="emergency-phones">
          <a href="tel:112" className="phone-card">
            <strong>112</strong>
            <span>экстренные службы</span>
          </a>
          <a href="tel:103" className="phone-card">
            <strong>103</strong>
            <span>скорая помощь</span>
          </a>
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <div className="card">
            <div className="eyebrow">Упражнение 1</div>
            <h2>Спокойное дыхание</h2>
            <p className="muted">
              Вдох на 4 счёта, пауза на 4, медленный выдох на 6. Длинный выдох
              включает «тормозную» систему организма. Сделайте 5–6 циклов.
            </p>
            <Breathing />
          </div>
          <div className="card">
            <div className="eyebrow">Упражнение 2</div>
            <h2>Заземление 5-4-3-2-1</h2>
            <p className="muted">
              Помогает, когда мысли несутся по кругу. Внимание переключается
              на то, что вы ощущаете прямо сейчас.
            </p>
            <div className="card card-soft mt">
              <Grounding />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Ещё способы</div>
            <h2>Что можно сделать за пару минут</h2>
          </div>
        </div>
        <div className="grid-4">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <div key={q.title} className="card card-soft feature">
                <div className="icon-tile"><Icon size={22} /></div>
                <h3>{q.title}</h3>
                <p>{q.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <div className="card">
            <div className="icon-tile warm"><HeartHandshake size={22} /></div>
            <h3>Когда стоит обратиться к специалисту</h3>
            <p className="muted">Если хотя бы один пункт про вас — разговор с психологом может помочь:</p>
            <ul className="muted" style={{ paddingLeft: "1.2rem", margin: 0 }}>
              {WHEN.map((w) => (
                <li key={w} style={{ marginBottom: "0.35rem" }}>{w}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="icon-tile"><MessageCircle size={22} /></div>
            <h3>Поговорить с психологом</h3>
            <p className="muted">
              Можно начать с анонимного вопроса — опишите ситуацию, и психолог
              ответит в течение суток. Или запишитесь на бесплатную первичную
              консультацию.
            </p>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={() => navigate("ask")}>
                Задать вопрос <ArrowRight size={16} />
              </button>
              <button className="btn btn-outline" onClick={() => navigate("consultations")}>
                Записаться
              </button>
            </div>
            <p className="hint mt">
              <Phone size={12} /> Психолог сервиса не оказывает экстренную помощь — в
              острой ситуации звоните 112 или 103.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
