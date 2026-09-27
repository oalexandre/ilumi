import { preload } from "react-dom";

import { DownloadButton } from "@/components/download-button";
import { SceneVideo } from "@/components/scene-video";
import { Transcript } from "@/components/transcript";
import { content } from "@/lib/content";
import { CLIP_SIZE, CLIP_SIZES, mediaPath, posterSrcSet, transcript } from "@/lib/scenes";
import {
  AUTHOR_URL,
  DONATE_URL,
  LOCALE_PATH,
  PLUGINS_GUIDE_URL,
  REPO_URL,
  type Locale,
} from "@/lib/site";

function Wordmark() {
  return (
    <span className="wordmark" aria-hidden="true">
      <span className="wordmark-il">il</span>umi
    </span>
  );
}

export function Home({ locale }: { locale: Locale }) {
  const c = content[locale];
  const other: Locale = locale === "en" ? "pt" : "en";
  const heroPoster = mediaPath(locale, "groceries", "webp");
  // The hero poster is the largest paint; fetch it before the video element is parsed.
  preload(heroPoster, {
    as: "image",
    fetchPriority: "high",
    imageSrcSet: posterSrcSet(locale, "groceries"),
    imageSizes: CLIP_SIZES,
  });

  return (
    <>
      <a className="skip-link" href="#main">
        {c.nav.skip}
      </a>

      <header className="site-header">
        <a href={LOCALE_PATH[locale]} className="brand" aria-label="Ilumi">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={28} height={28} />
          <Wordmark />
        </a>
        <nav aria-label="Ilumi">
          <a href="#features">{c.nav.features}</a>
          <a href="#faq">{c.nav.faq}</a>
          <a href={REPO_URL}>GitHub</a>
          <a href={LOCALE_PATH[other]} hrefLang={other === "pt" ? "pt-BR" : "en"} lang={other === "pt" ? "pt-BR" : "en"} aria-label={`${c.nav.switchTo} · ${c.nav.switchLabel}`} className="lang-switch">
            {c.nav.switchTo}
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <h1>{c.hero.title}</h1>
            <p className="hero-lead">{c.hero.lead}</p>
            <DownloadButton copy={c.download} showMacNote />
          </div>
          <figure className="hero-note window">
            <SceneVideo
              webm={mediaPath(locale, "groceries", "webm")}
              mp4={mediaPath(locale, "groceries", "mp4")}
              poster={heroPoster}
              posterSrcSet={posterSrcSet(locale, "groceries")}
              sizes={CLIP_SIZES}
              alt={c.hero.alt}
              labels={c.media}
              priority
              {...CLIP_SIZE}
            />
            <figcaption>
              {c.hero.caption.split("{sum}").map((part, i) => (
                <span key={i}>
                  {i > 0 && <code className="caption-moment">sum</code>}
                  {part}
                </span>
              ))}
            </figcaption>
          </figure>
        </section>

        <div id="features" className="scenes">
          {c.scenes.map((scene, i) => (
            <section key={scene.id} className={`scene${i % 2 ? " is-flipped" : ""}`} aria-labelledby={`scene-${scene.id}`}>
              <div className="scene-copy">
                <h2 id={`scene-${scene.id}`}>{scene.title}</h2>
                <p>{scene.body}</p>
              </div>
              <div className="scene-clip window">
                <SceneVideo
                  webm={mediaPath(locale, scene.id, "webm")}
                  mp4={mediaPath(locale, scene.id, "mp4")}
                  poster={mediaPath(locale, scene.id, "webp")}
                  posterSrcSet={posterSrcSet(locale, scene.id)}
                  sizes={CLIP_SIZES}
                  alt={scene.alt}
                  labels={c.media}
                  {...CLIP_SIZE}
                />
              </div>
              <div className="scene-lines">
                <Transcript lines={transcript(locale, scene.id)} label={scene.title} moment={scene.moment} />
              </div>
            </section>
          ))}
        </div>

        <section className="toolkit" aria-labelledby="toolkit-title">
          <div className="toolkit-intro">
            <h2 id="toolkit-title">{c.toolkit.title}</h2>
            <p>{c.toolkit.lead}</p>
            <figure className="window theme-still">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaPath(locale, "light", "webp")}
                srcSet={posterSrcSet(locale, "light")}
                sizes="(max-width: 960px) 100vw, 460px"
                alt={c.toolkit.themeAlt}
                width={CLIP_SIZE.width}
                height={CLIP_SIZE.height}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{c.toolkit.themeCaption}</figcaption>
            </figure>
          </div>
          <ul className="toolkit-list">
            {c.toolkit.items.map((item) => (
              <li key={item.title}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                {item.example && <Transcript lines={item.example} label={item.title} compact />}
                {item.keys && (
                  <p className="keys">
                    {item.keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" className="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">{c.faq.title}</h2>
          <div className="faq-list">
            {c.faq.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="close" aria-labelledby="close-title">
          <h2 id="close-title">{c.close.title}</h2>
          <p>{c.close.lead}</p>
          <DownloadButton copy={c.download} />
          <p className="close-links">
            <a href={REPO_URL}>{c.close.github}</a>
            <a href={PLUGINS_GUIDE_URL}>{c.close.plugins}</a>
            <a href={DONATE_URL}>{c.close.donate}</a>
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          {c.footer.madeBy} <a href={AUTHOR_URL}>Alexandre</a> · {c.footer.license}
        </p>
      </footer>
    </>
  );
}
