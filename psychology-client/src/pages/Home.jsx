import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Clock,
  HeartHandshake,
  Lock,
  MessageCircle,
  NotebookPen,
  Quote,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { errorMessage, fetchConsultations, fetchLatestReviews, saveMood } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import { MoodPicker, Stars } from "../components/ui";
import ConsultationCard from "../components/ConsultationCard";
import Breathing from "../components/Breathing";
import { localDateKey } from "../labels";

const TOPICS = [
  { tag: "тревога", label: "Тревога и паника" },
  { tag: "стресс", label: "Стресс" },
  { tag: "выгорание", label: "Выгорание" },
  { tag: "депрессия", label: "Подавленное настроение" },
  { tag: "отношения", label: "Отношения и семья" },
  { tag: "сон", label: "Проблемы со сном" },
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "Разберитесь в состоянии",
    text: "Короткий тест или дневник настроения помогут понять, что происходит, и сформулировать запрос.",
  },
  {
    icon: MessageCircle,
    title: "Задайте вопрос анонимно",
    text: "Опишите ситуацию — психолог ответит в личной переписке. Он видит только ваш псевдоним.",
  },
  {
    icon: CalendarCheck,
    title: "Запишитесь на встречу",
    text: "Выберите специалиста, удобный день и формат: чат, звонок или видео. Первая встреча — бесплатно.",
  },
];

const FEATURES = [
  { icon: Lock, title: "Анонимность", text: "Email не передаётся психологу. Только псевдоним, который вы выбрали сами." },
  { icon: ShieldCheck, title: "Проверенные специалисты", text: "Психологи с профильным образованием и опытом практики от 3 лет." },
  { icon: Clock, title: "Без дороги и очередей", text: "Онлайн-встречи в удобное время из любого места, где вам спокойно." },
  { icon: NotebookPen, title: "Забота между встречами", text: "Дневник настроения, тесты и упражнения самопомощи всегда под рукой." },
];

const FAQ = [
  {
    q: "Это действительно анонимно?",
    a: "Да. Для входа нужен только email, но психолог его не видит — в записях и переписке отображается лишь псевдоним. Настоящее имя указывать не нужно.",
  },
  {
    q: "Сколько стоит консультация?",
    a: "Первичная консультация (30 минут) бесплатна — на ней можно сформулировать запрос и подобрать специалиста. Стоимость остальных указана в карточке консультации.",
  },
  {
    q: "Как проходит онлайн-встреча?",
    a: "Вы выбираете формат при записи: текстовый чат, аудиозвонок или видеосвязь. Ссылку и детали психолог присылает после подтверждения записи.",
  },
  {
    q: "Можно ли отменить или перенести запись?",
    a: "Да, отменить запись можно в личном кабинете в любой момент до начала встречи, а затем выбрать новое время.",
  },
  {
    q: "Результаты тестов — это диагноз?",
    a: "Нет. Тесты — скрининговые опросники, они помогают заметить проблему и понять, стоит ли обратиться к специалисту. Диагноз ставит только врач.",
  },
  {
    q: "Что делать, если мне очень плохо прямо сейчас?",
    a: "Если есть угроза жизни — звоните 112 или 103. В разделе «Самопомощь» собраны упражнения, которые помогают пережить острый момент.",
  },
];

function MoodCard() {
  const { user } = useAuth();
  const toast = useToast();
  const [mood, setMood] = useState(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    try {
      await saveMood({ date: localDateKey(), mood });
      setSaved(true);
      toast("Настроение отмечено в дневнике");
    } catch (err) {
      toast(errorMessage(err, "Не удалось сохранить"), "error");
    }
  };

  let answer = null;
  if (mood && mood <= 2) {
    answer = (
      <>
        <p>Жаль, что сейчас тяжело. Можно начать с минуты спокойного дыхания или анонимно написать психологу — это ни к чему не обязывает.</p>
        <div className="row">
          <button className="btn btn-primary btn-sm" onClick={() => navigate("help")}>Подышать вместе</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("ask")}>Написать психологу</button>
        </div>
      </>
    );
  } else if (mood === 3) {
    answer = (
      <>
        <p>Обычный день — хороший повод прислушаться к себе. Короткий тест поможет заметить усталость или тревогу заранее.</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate("tests")}>Выбрать тест</button>
      </>
    );
  } else if (mood) {
    answer = (
      <>
        <p>Здорово! Отмечайте хорошие дни в дневнике настроения — так проще замечать, что именно вам помогает.</p>
        {!user && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate("auth?mode=register")}>
            Завести дневник
          </button>
        )}
      </>
    );
  }

  return (
    <div className="mood-card">
      <div className="eyebrow"><Sparkles size={14} /> Минутка для себя</div>
      <h3>Как вы себя чувствуете сегодня?</h3>
      <p className="muted small mb-0">Выберите вариант — мы подскажем, с чего начать.</p>
      <MoodPicker
        value={mood}
        onChange={(v) => {
          setMood(v);
          setSaved(false);
        }}
      />
      {answer && (
        <div className="mood-answer">
          {answer}
          {user && !saved && (
            <button className="btn btn-ghost btn-sm mt-sm" onClick={save}>
              <NotebookPen size={15} /> Сохранить в дневник
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home({ page }) {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchConsultations()
      .then(({ data }) => {
        // Сначала бесплатная первичная консультация, затем самые оценённые
        const sorted = [...data].sort(
          (a, b) => (a.price === 0 ? -1 : 0) - (b.price === 0 ? -1 : 0) || (b.rating || 0) - (a.rating || 0),
        );
        setFeatured(sorted.slice(0, 3));
      })
      .catch(() => setFeatured([]));
    fetchLatestReviews(3)
      .then(({ data }) => setReviews(data))
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    if (page === "faq") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [page]);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <div className="eyebrow"><HeartHandshake size={15} /> Анонимно · онлайн · бережно</div>
          <h1>
            Поговорить с психологом — <em>проще, чем кажется</em>
          </h1>
          <p className="hero-subtitle">
            Анонимные консультации, психологические тесты и упражнения
            самопомощи. Без имён, без очередей и без осуждения.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate("consultations")}>
              Выбрать консультацию <ArrowRight size={18} />
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate("tests")}>
              Пройти тест
            </button>
          </div>
          <div className="trust-row">
            <span><UserRound size={16} /> Только псевдоним</span>
            <span><CalendarCheck size={16} /> Первая встреча бесплатно</span>
            <span><MessageCircle size={16} /> Ответ в течение суток</span>
          </div>
        </div>
        <MoodCard />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">С чем мы помогаем</div>
            <h2>Выберите, что вас беспокоит</h2>
          </div>
        </div>
        <div className="topics">
          {TOPICS.map((t) => (
            <button key={t.tag} className="topic-pill" onClick={() => navigate(`consultations?tag=${t.tag}`)}>
              {t.label} <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Как это работает</div>
            <h2>Три шага к поддержке</h2>
          </div>
        </div>
        <div className="grid-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="card step-card">
                <span className="step-number">{i + 1}</span>
                <div className="icon-tile"><Icon size={22} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Консультации</div>
              <h2>С чего можно начать</h2>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate("consultations")}>
              Все направления <ArrowRight size={16} />
            </button>
          </div>
          <ul className="cards-list">
            {featured.map((c) => (
              <ConsultationCard key={c.id} item={c} />
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="calm-banner">
          <Breathing small />
          <div>
            <div className="eyebrow">Помощь здесь и сейчас</div>
            <h2>Одна минута спокойного дыхания</h2>
            <p className="muted">
              Медленный выдох снижает напряжение и помогает пережить волну
              тревоги. Попробуйте прямо сейчас — следите за кругом.
            </p>
            <button className="btn btn-outline" onClick={() => navigate("help")}>
              Другие упражнения <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Отзывы</div>
              <h2>Что говорят клиенты</h2>
            </div>
          </div>
          <div className="grid-3">
            {reviews.map((r) => (
              <figure
                key={r.id}
                className="card review-card clickable"
                style={{ margin: 0 }}
                onClick={() => navigate(`consultations/${r.consultationId}`)}
              >
                <Quote className="quote-icon" size={26} />
                <blockquote>{r.comment}</blockquote>
                <figcaption className="row-between">
                  <span>
                    <strong>{r.nickname}</strong>
                    <span className="muted xsmall" style={{ display: "block" }}>{r.topic}</span>
                  </span>
                  <Stars value={r.rating} />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Почему MindCare</div>
            <h2>Бережно к вам и вашим данным</h2>
          </div>
        </div>
        <div className="grid-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card card-soft feature">
                <div className="icon-tile"><Icon size={22} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section" id="faq">
        <div className="section-head">
          <div>
            <div className="eyebrow">Частые вопросы</div>
            <h2>Отвечаем заранее</h2>
          </div>
        </div>
        <div className="faq card">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q} <ChevronDown size={18} />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-card">
          <h2>Сделайте первый шаг сегодня</h2>
          <p>
            Первая консультация бесплатна. Можно просто рассказать, что
            происходит, — психолог поможет разобраться, что делать дальше.
          </p>
          <button
            className="btn btn-lg"
            onClick={() => navigate(user ? "ask" : "auth?mode=register")}
          >
            {user ? "Задать вопрос психологу" : "Создать анонимный аккаунт"}
          </button>
        </div>
      </section>
    </div>
  );
}
