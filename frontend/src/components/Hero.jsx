import React, { useState, useRef, useEffect } from "react";
import "./Hero.css";
import heroVideo from "../assets/hero-video.mp4";
import heroVideoPoster from "../assets/hero-video-poster.jpg";
import orientalBg from "../assets/hayati-luxury-hero-bg.jpg";
import ahmarBg from "../assets/xtr.jpeg";
import amberBg from "../assets/Hayati Elixirs Amber Stone Still Life.png";
import { useSmoothScroll } from "./SmoothScroll";

const HERO_FRAGRANCES = [
  {
    id: "oriental",
    name: "Oriental Oud",
    arabicName: "أورينتال عود • قصر الشرق",
    concentration: "Extrait de Parfum (50% Pure Oil)",
    badge: "Imperial Palace Edition",
    bgImage: orientalBg,
    alt: "Hayati Elixirs Oriental Oud luxury perfume bottle with 24k gold engraved Arabesque cap, amber flacon, glowing amber resins, and incense smoke in an Arabian palace",
    headlineLead: "The Sovereign Soul of",
    headlineMain: "Arabian Oud & Amber",
    headlineArabic: "نفحات شرقية ملكية تعانق الخلود",
    description:
      "Compounded with a rare 50% pure perfume oil concentration. Handcrafted between Paris and the UAE with 12-year aged wild Cambodian agarwood, smoldering amber resins, and noble spices for an eternal royal sillage.",
    notes: [
      { name: "Cambodian Oud", arabic: "عود كمبودي معتق", type: "Base" },
      { name: "Golden Amber", arabic: "عنبر ملكي دافئ", type: "Heart" },
      { name: "Taif Saffron", arabic: "زعفران طائفي", type: "Top" },
      { name: "Smoked Cedar", arabic: "خشب الأرز المدخن", type: "Base" },
    ],
    accents: ["12-Yr Aged Agarwood", "Smoky Velvet Sillage", "Palace Majlis Blend"],
    price: "₹2,499",
    sillage: 5,
    origin: "UAE & Paris",
  },
  {
    id: "ahmar",
    name: "Ahmar Rouge",
    arabicName: "أحمر روج • عود وعنبر أحمر",
    concentration: "Extrait de Parfum (50% Pure Oil)",
    badge: "Royal Oud & Amber Noir",
    bgImage: ahmarBg,
    alt: "Ahmar Rouge faceted ruby red perfume bottle with engraved gold cap on dark volcanic stone with raw agarwood bark and amber crystals",
    headlineLead: "Smoldering Passion of",
    headlineMain: "Ahmar Rouge Noir",
    headlineArabic: "سحر العود الأحمر وسلطان العنبر",
    description:
      "A dark, magnetic union of smoky Cambodian agarwood, glowing blood-amber crystals, and spicy frankincense. Bottled in faceted crimson crystal crowned with Arabesque geometric gold.",
    notes: [
      { name: "Wild Oud Resin", arabic: "دهن عود بري", type: "Base" },
      { name: "Warm Amber", arabic: "عنبر ملكي دافئ", type: "Heart" },
      { name: "Black Frankincense", arabic: "لبان عماني أسود", type: "Top" },
      { name: "Royal Musk", arabic: "مسك الحرير الصافي", type: "Base" },
    ],
    accents: ["Faceted Ruby Crystal", "Volcanic Slate Aged", "24H+ Radiance"],
    price: "₹2,499",
    sillage: 5,
    origin: "UAE & Paris",
  },
  {
    id: "amber",
    name: "Amber Royale",
    arabicName: "عنبر رويال • خلاصة الذهب",
    concentration: "Extrait de Parfum (50% Pure Oil)",
    badge: "Solar Amber Signature",
    bgImage: amberBg,
    alt: "Amber Royale crystal perfume bottle on warm limestone with white desert blossoms and golden sunbeams",
    headlineLead: "Luminous Majesty of",
    headlineMain: "Sunlit Amber Royale",
    headlineArabic: "إكسير العنبر النقي وأزهار غراس",
    description:
      "Pure golden Arabian amber kissed by delicate white Grasse blossoms, sun-drenched bergamot, and precious Bourbon vanilla. An aura of regal warmth and irresistible elegance.",
    notes: [
      { name: "Solar Amber", arabic: "عنبر شمسي نقي", type: "Base" },
      { name: "Arabian Jasmine", arabic: "ياسمين شرقي", type: "Heart" },
      { name: "Sunlit Bergamot", arabic: "برغموت مشرق", type: "Top" },
      { name: "Bourbon Vanilla", arabic: "فانيليا بوربون", type: "Base" },
    ],
    accents: ["Grasse & UAE Florals", "Silken Luminous Aura", "Sunlit Travertine"],
    price: "₹2,299",
    sillage: 4,
    origin: "UAE & Paris",
  },
];

function Hero({ lowStockProducts = [] }) {
  const [activeFragranceId, setActiveFragranceId] = useState("oriental");
  const [activeNoteTab, setActiveNoteTab] = useState(null);
  const videoRef = useRef(null);
  const lenisRef = useSmoothScroll();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Handled on first user touch below
        });
      }
    };

    tryPlay();

    const handleTouchUnlock = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    window.addEventListener("touchstart", handleTouchUnlock, { passive: true, once: true });
    window.addEventListener("click", handleTouchUnlock, { passive: true, once: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchUnlock);
      window.removeEventListener("click", handleTouchUnlock);
    };
  }, []);

  const activeFragrance =
    HERO_FRAGRANCES.find((item) => item.id === activeFragranceId) ||
    HERO_FRAGRANCES[0];

  const scrollToCollection = (e) => {
    e.preventDefault();
    const section = document.getElementById("collection");
    if (section) {
      if (lenisRef?.current) {
        lenisRef.current.scrollTo(section);
      } else {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const hasScarcity = lowStockProducts && lowStockProducts.length > 0;

  return (
    <section className="arabic-hero" aria-label="Arabic Luxury Fragrance Showcase">
      {/* ====================================================================
          LUXURY HERO VIDEO BACKGROUND THAT FILLS SCREEN PERFECTLY
          ==================================================================== */}
      <div className="arabic-hero-bg-wrapper" aria-hidden="true">
        <video
          ref={videoRef}
          className="arabic-hero-bg-video"
          src={heroVideo}
          poster={heroVideoPoster}
          autoPlay
          loop
          muted
          defaultMuted
          playsInline
          webkit-playsinline="true"
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Multi-layered cinematic luxury vignette overlay */}
        <div className="arabic-hero-bg-overlay" />
        <div className="arabic-hero-ambient-glow" />
      </div>

      {/* ====================================================================
          FRONT HOME HERO LIVE STOCK SCARCITY ALERT BAR
          ==================================================================== */}
      {hasScarcity && (
        <aside className="hero-stock-alert-bar" role="alert" aria-label="Royal Vault Stock Alert">
          <div className="hero-stock-alert-container">
            <div className="hero-stock-alert-left">
              <span className="hero-alert-flame-icon">🔥</span>
              <span className="hero-alert-badge">ROYAL VAULT SCARCITY</span>
              <span className="hero-alert-pulse-ring" />
            </div>

            <div className="hero-alert-content">
              <span className="hero-alert-text">
                Limited Artisanal Distillation: <strong>{lowStockProducts.length} rare elixirs</strong> near total exhaustion.
              </span>
              <div className="hero-alert-chips-row">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <span key={p.id} className="hero-alert-chip">
                    <span className="chip-bolt">⚡</span>
                    <span className="chip-name">{p.name}</span>:
                    <strong className="chip-stock"> {p.stock} left</strong>
                  </span>
                ))}
              </div>
            </div>

            <a
              href="#collection"
              onClick={scrollToCollection}
              className="hero-alert-action-btn"
            >
              <span>Secure Vault Bottle</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </aside>
      )}

      {/* ====================================================================
          FOREGROUND CONTENT GRID
          ==================================================================== */}
      <div className="arabic-hero-container">
        {/* LEFT COLUMN: ROYAL NARRATIVE & OLFACTORY DETAILS */}
        <div className="arabic-hero-narrative">
          {/* ROYAL CREST & ARABIC BADGE */}
          <div className="arabic-emblem-badge">
            <svg
              className="islamic-star-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 16.1l-4.8 2.5.9-5.3L4.3 9.6l5.3-.8L12 2z" />
            </svg>
            <span className="emblem-text-en">HAYATI ELIXIRS</span>
            <span className="emblem-divider">✦</span>
            <span className="emblem-text-ar" dir="rtl">
              إكسير الفخامة الملكية
            </span>
          </div>

          {/* HEADLINE */}
          <h1 className="arabic-hero-title">
            <span className="title-lead">{activeFragrance.headlineLead}</span>
            <span className="title-gold-gradient">{activeFragrance.headlineMain}</span>
            <span className="title-arabic-script" dir="rtl">
              {activeFragrance.headlineArabic}
            </span>
          </h1>

          {/* NARRATIVE STORY */}
          <p className="arabic-hero-description">
            {activeFragrance.description}
          </p>

          {/* OLFACTORY PYRAMID ACCORD PILLS */}
          <div className="olfactory-accords">
            <span className="accords-label">OLFACTORY PYRAMID & NOTES</span>
            <div className="accords-tags">
              {activeFragrance.notes.map((note, index) => (
                <button
                  type="button"
                  key={note.name}
                  className={`accord-tag ${activeNoteTab === index ? "active" : ""}`}
                  onClick={() =>
                    setActiveNoteTab(activeNoteTab === index ? null : index)
                  }
                  title={`Note Profile: ${note.name}`}
                >
                  <span className="accord-bullet">✦</span>
                  <span className="accord-en">{note.name}</span>
                  <span className="accord-ar" dir="rtl">
                    {note.arabic}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CALL TO ACTIONS */}
          <div className="arabic-hero-actions">
            <a
              href="#collection"
              onClick={scrollToCollection}
              className="btn-arabic-gold"
            >
              <span>Explore The Royal Collection</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="btn-arrow-icon"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>

            <a
              href="#collection"
              onClick={scrollToCollection}
              className="btn-arabic-outline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
                className="flacon-icon"
              >
                <path d="M9 3h6v3H9z" />
                <path d="M10 6v2m4-2v2" />
                <path d="M7 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
              </svg>
              <span>Discover All 6 Elixirs</span>
            </a>
          </div>

          {/* PRESTIGE TRUST METRICS */}
          <div className="arabic-prestige-metrics">
            <div className="metric-item">
              <span className="metric-val">50%</span>
              <span className="metric-name">Pure Oil Extrait</span>
              <span className="metric-sub">Maximum projection</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-val">100%</span>
              <span className="metric-name">Artisanal Oud</span>
              <span className="metric-sub">Wild & aged resins</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-val">24H+</span>
              <span className="metric-name">Royal Sillage</span>
              <span className="metric-sub">Enduring luxury trail</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING DOSSIER & BACKGROUND SCENE SELECTOR */}
        <div className="arabic-hero-stage">
          <div className="hero-stage-top-bar">
            {/* LUXURY FRAGRANCE SELECTOR TABS */}
            <div
              className="flacon-switcher"
              role="tablist"
              aria-label="Select Featured Fragrance Details"
            >
              {HERO_FRAGRANCES.map((fragrance) => (
                <button
                  key={fragrance.id}
                  role="tab"
                  aria-selected={activeFragranceId === fragrance.id}
                  className={`flacon-tab ${
                    activeFragranceId === fragrance.id ? "active" : ""
                  }`}
                  onClick={() => setActiveFragranceId(fragrance.id)}
                >
                  <span className="flacon-tab-name">{fragrance.name}</span>
                  <span className="flacon-tab-ar" dir="rtl">
                    {fragrance.id === "oriental"
                      ? "أورينتال عود"
                      : fragrance.id === "ahmar"
                      ? "أحمر روج"
                      : "عنبر ملكي"}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* FLOATING GLASS DOSSIER CARD COMPLEMENTING THE BACKGROUND PHOTO */}
          <aside
            className="flacon-floating-dossier"
            aria-label="Featured Flacon Details"
          >
            {/* TOP PRESTIGE BADGE */}
            <div className="dossier-top-badge">
              <span className="badge-sparkle">✦</span>
              <span>{activeFragrance.badge}</span>
              <span className="badge-concentration">50% EXTRAIT</span>
            </div>

            {/* CARD BODY */}
            <div className="dossier-header">
              <div>
                <h2 className="dossier-title">{activeFragrance.name}</h2>
                <p className="dossier-ar" dir="rtl">
                  {activeFragrance.arabicName}
                </p>
              </div>
              <div className="dossier-price">{activeFragrance.price}</div>
            </div>

            <div className="dossier-stats">
              <div className="stat-pill">
                <span className="stat-pill-label">Sillage</span>
                <div
                  className="stat-pill-dots"
                  aria-label={`${activeFragrance.sillage} of 5 intensity`}
                >
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <span
                      key={dot}
                      className={`dot ${
                        dot <= activeFragrance.sillage ? "filled" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-label">Origin</span>
                <span className="stat-pill-value">{activeFragrance.origin}</span>
              </div>
            </div>

            <div className="dossier-accents">
              {activeFragrance.accents.map((accent) => (
                <span key={accent} className="accent-tag">
                  {accent}
                </span>
              ))}
            </div>

            {/* DOSSIER STOCK RESERVE METER */}
            <div className="dossier-stock-card" aria-label="Current Vault Allocation Status">
              <div className="dossier-stock-header">
                <div className="dossier-stock-badge-tag">
                  <span className="dossier-stock-pulse-dot" />
                  <span>VAULT ALLOCATION</span>
                </div>
                <span className="dossier-stock-count-highlight">
                  ⚡ 2 Flacons In Reserve
                </span>
              </div>
              <div
                className="dossier-stock-track"
                role="progressbar"
                aria-valuenow="18"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div className="dossier-stock-fill" style={{ width: "18%" }} />
              </div>
              <p className="dossier-stock-note">
                Hand-numbered decanter • 18-month aging cycle
              </p>
            </div>

            <a
              href="#collection"
              onClick={scrollToCollection}
              className="dossier-cta-btn"
            >
              <span>View In Collection</span>
              <span className="dossier-cta-arrow">→</span>
            </a>
          </aside>
        </div>
      </div>

      {/* ====================================================================
          LUXURY ROYAL BANNER TICKER
          ==================================================================== */}
      <div className="arabic-royal-ticker" aria-hidden="true">
        <div className="ticker-track">
          {[1, 2].map((i) => (
            <div className="ticker-group" key={i}>
              <span className="ticker-item">
                <span className="ticker-star">✦</span> 100% PURE ARTISANAL OUD OILS
              </span>
              <span className="ticker-item">
                <span className="ticker-star">✦</span> عطور شرقية بتركيز ٥٠٪ دهن عطري
              </span>
              <span className="ticker-item">
                <span className="ticker-star">✦</span> DISTILLED IN UAE & PARIS
              </span>
              <span className="ticker-item">
                <span className="ticker-star">✦</span> COMPLIMENTARY ROYAL DISCOVERY SAMPLE
              </span>
              <span className="ticker-item">
                <span className="ticker-star">✦</span> خشب العود الطبيعي والعنبر الصافي
              </span>
              <span className="ticker-item">
                <span className="ticker-star">✦</span> EXPRESS COURIER ALL INDIA & GCC
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
