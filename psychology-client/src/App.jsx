import { useEffect } from "react";
import { Compass, UserRound } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { EmptyState, Loader } from "./components/ui";
import Home from "./pages/Home";
import CatalogPage from "./pages/Catalog";
import TestsPage from "./pages/Tests";
import QuestionsPage from "./pages/Questions";
import ProfilePage from "./pages/Profile";
import AdminPage from "./pages/Admin";
import AuthPage from "./pages/Auth";
import HelpPage from "./pages/Help";
import { navigate, useRoute } from "./router";
import { useAuth } from "./auth/context";

const PAGES = {
  home: { component: Home, title: "Психологическая поддержка онлайн" },
  faq: { component: Home, title: "Частые вопросы" },
  consultations: { component: CatalogPage, title: "Консультации" },
  tests: { component: TestsPage, title: "Психологические тесты" },
  ask: { component: QuestionsPage, title: "Анонимный вопрос психологу" },
  help: { component: HelpPage, title: "Самопомощь" },
  profile: { component: ProfilePage, title: "Личный кабинет", private: true },
  admin: { component: AdminPage, title: "Панель психолога", private: true },
  auth: { component: AuthPage, title: "Вход" },
};

function NotFound() {
  return (
    <section className="page">
      <EmptyState icon={Compass} title="Страница не найдена" text="Возможно, ссылка устарела или в ней опечатка.">
        <button className="btn btn-primary" onClick={() => navigate("")}>
          На главную
        </button>
      </EmptyState>
    </section>
  );
}

export default function App() {
  const route = useRoute();
  const { user, checking } = useAuth();
  const entry = PAGES[route.page];

  useEffect(() => {
    document.title = entry ? `${entry.title} — MindCare` : "Страница не найдена — MindCare";
  }, [entry]);

  let content;
  if (!entry) {
    content = <NotFound />;
  } else if (checking) {
    content = <Loader />;
  } else if (entry.private && !user) {
    content = <AuthPage query={{ next: route.page }} />;
  } else if (route.page === "auth" && user) {
    content = (
      <section className="page">
        <EmptyState icon={UserRound} title={`Вы вошли как ${user.nickname}`} text="Можно перейти в личный кабинет или продолжить с того места, где остановились.">
          <button className="btn btn-primary" onClick={() => navigate(route.query.next || "profile")}>
            {route.query.next ? "Продолжить" : "Личный кабинет"}
          </button>
        </EmptyState>
      </section>
    );
  } else {
    const Page = entry.component;
    content = <Page param={route.param} query={route.query} page={route.page} />;
  }

  return (
    <div className="app">
      <Header currentPage={route.page} />
      <main className="main-content" id="main">
        <div className="container">{content}</div>
      </main>
      <Footer />
    </div>
  );
}
