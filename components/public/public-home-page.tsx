"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Calculator, FileText, Landmark, LockKeyhole, Plane } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { PublicServicePost } from "@/lib/types";

type PublicHomePageProps = {
  posts: PublicServicePost[];
};

type ServiceCategory = {
  key: string;
  labelKey: string;
  explainKey: string;
};

const serviceCards = [
  {
    titleKey: "home.card.immigration.title",
    descriptionKey: "home.card.immigration.description",
    icon: Plane,
    categories: [
      category("refugeeSponsorship"),
      category("familySponsorship"),
      category("visitorVisa"),
      category("studyPermit"),
      category("workPermit"),
      category("expressEntry"),
      category("prCitizenship")
    ]
  },
  {
    titleKey: "home.card.accounting.title",
    descriptionKey: "home.card.accounting.description",
    icon: Calculator,
    categories: [
      category("personalTax"),
      category("selfEmployed"),
      category("businessCorporation"),
      category("income"),
      category("expenses"),
      category("workersPayments"),
      category("payrollReview")
    ]
  },
  {
    titleKey: "home.card.business.title",
    descriptionKey: "home.card.business.description",
    icon: BriefcaseBusiness,
    categories: [
      category("bookkeeping"),
      category("gst"),
      category("payroll"),
      category("yearEndPackage"),
      category("businessRecords")
    ]
  }
];

const howSteps = ["step1", "step2", "step3", "step4", "step5", "step6"];

function category(key: string): ServiceCategory {
  return {
    key,
    labelKey: `home.category.${key}`,
    explainKey: `home.explain.${key}`
  };
}

function postCategoryKey(categoryName: string) {
  return `home.postCategory.${categoryName.toLowerCase()}`;
}

function postGroupKey(post: PublicServicePost) {
  return post.translation_key || post.id;
}

export function PublicHomePage({ posts }: PublicHomePageProps) {
  const { language, t } = useT();
  const [selected, setSelected] = useState<ServiceCategory>(serviceCards[0].categories[0]);
  const visiblePosts = useMemo(() => {
    if (language === "en") {
      return posts.filter((post) => post.language === "en").slice(0, 6);
    }

    const byGroup = new Map<string, PublicServicePost>();

    for (const post of posts) {
      if (post.language === "en") {
        byGroup.set(postGroupKey(post), post);
      }
    }

    for (const post of posts) {
      if (post.language === language) {
        byGroup.set(postGroupKey(post), post);
      }
    }

    return Array.from(byGroup.values()).slice(0, 6);
  }, [language, posts]);

  return (
    <>
      <section className="bg-exodus-light py-10 sm:py-14 lg:py-20">
        <div className="section-shell grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div>
            <p className="text-base font-black text-exodus-gold">{t("home.hero.tagline")}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-exodus-navy sm:text-5xl lg:text-6xl">
              {t("brand.name")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-exodus-slate">{t("home.hero.explanation")}</p>
            <div className="mt-8 grid gap-3 sm:flex">
              <HomeButton href="/signup" icon={FileText}>{t("home.hero.startHere")}</HomeButton>
              <HomeButton href="/login" icon={LockKeyhole} variant="light">{t("home.hero.clientLogin")}</HomeButton>
              <HomeButton href="/contact?consultation=1" icon={Landmark} variant="outline">{t("home.hero.bookConsultation")}</HomeButton>
            </div>
          </div>
          <div className="rounded-md border border-exodus-blue/15 bg-white p-5 shadow-soft">
            <div className="grid gap-3">
              {serviceCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.titleKey} className="rounded-md bg-exodus-light p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-md bg-exodus-navy text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-lg font-black text-exodus-navy">{t(card.titleKey)}</h2>
                        <p className="text-sm font-semibold text-exodus-slate">{t(card.descriptionKey)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="section-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">{t("home.main.title")}</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy sm:text-4xl">{t("home.main.subtitle")}</h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {serviceCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.titleKey} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="h-7 w-7 text-exodus-gold" aria-hidden="true" />
                  <h3 className="mt-4 text-2xl font-black text-exodus-navy">{t(card.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-6 text-exodus-slate">{t(card.descriptionKey)}</p>
                  <div className="mt-5 grid gap-2">
                    {card.categories.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelected(item)}
                        className="focus-ring flex min-h-12 items-center justify-between rounded-md bg-exodus-light px-4 text-left text-sm font-black text-exodus-navy transition hover:bg-blue-50"
                      >
                        {t(item.labelKey)}
                        <ArrowRight className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-md border border-exodus-gold/40 bg-exodus-light p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-exodus-gold">{t(selected.labelKey)}</p>
            <h3 className="mt-2 text-2xl font-black text-exodus-navy">{t(selected.labelKey)}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-exodus-slate">{t(selected.explainKey)}</p>
            <div className="mt-5 grid gap-3 sm:flex">
              <HomeButton href="/signup" icon={FileText}>{t("common.createAccount")}</HomeButton>
              <HomeButton href="/login" icon={LockKeyhole} variant="light">{t("nav.clientLogin")}</HomeButton>
              <HomeButton href="/contact" icon={Landmark} variant="outline">{t("common.contactUs")}</HomeButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-exodus-light py-14">
        <div className="section-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">{t("home.how.title")}</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy sm:text-4xl">{t("home.how.subtitle")}</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {howSteps.map((step, index) => (
              <article key={step} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-exodus-navy text-sm font-black text-white">{index + 1}</span>
                <h3 className="mt-4 text-xl font-black text-exodus-navy">{t(`home.how.${step}.title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-exodus-slate">{t(`home.how.${step}.text`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="section-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">{t("home.posts.title")}</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy sm:text-4xl">{t("home.posts.subtitle")}</h2>
          </div>
          {visiblePosts.length > 0 ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {visiblePosts.map((post) => (
                <article key={post.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-exodus-gold">{t(postCategoryKey(post.category))} | {post.service_type}</p>
                  <h3 className="mt-3 text-xl font-black text-exodus-navy">{post.title}</h3>
                  <p className="mt-3 line-clamp-5 text-sm leading-6 text-exodus-slate">{post.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-md border border-dashed border-slate-300 bg-exodus-light p-6 text-sm font-bold text-exodus-navy">
              {t("home.posts.empty")}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function HomeButton({
  href,
  icon: Icon,
  variant = "dark",
  children
}: {
  href: string;
  icon: LucideIcon;
  variant?: "dark" | "light" | "outline";
  children: React.ReactNode;
}) {
  const className =
    variant === "dark"
      ? "bg-exodus-navy text-white hover:bg-exodus-blue"
      : variant === "light"
        ? "bg-white text-exodus-navy hover:bg-blue-50"
        : "border border-exodus-blue/20 bg-transparent text-exodus-navy hover:bg-white";

  return (
    <Link href={href} className={`focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-md px-5 text-base font-black shadow-sm transition ${className}`}>
      <Icon className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
      {children}
    </Link>
  );
}
