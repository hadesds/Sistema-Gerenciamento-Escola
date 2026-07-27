import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { mockCarouselItems } from "@/data/mock-carousel";
import { CATEGORY_META, getRandomItems, getVisibleCarouselItems, isPublished } from "@/lib/carousel-lib";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Pré-gera as páginas dos artigos do mock em build time.
export function generateStaticParams() {
  return mockCarouselItems.map((item) => ({ slug: item.slug }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// SEO por artigo: título, descrição e preview de link (WhatsApp/Facebook/etc)
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = mockCarouselItems.find((i) => i.slug === slug);
  if (!item || !isPublished(item)) return {};

  return {
    title: item.title,
    description: item.text,
    openGraph: {
      title: item.title,
      description: item.text,
      images: [{ url: item.imageUrl, alt: item.imageAlt }],
      type: "article",
      publishedTime: item.publishAt,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const item = mockCarouselItems.find((i) => i.slug === slug);

  // Agendamento: se ainda não chegou a data de publicação, trata como
  // se a página não existisse.
  if (!item || !isPublished(item)) notFound();

  const otherPublished = getVisibleCarouselItems(mockCarouselItems).filter(
    (i) => i.slug !== item.slug
  );
  const related = getRandomItems(otherPublished, 3);

  return (
    <main className="article-page">
      <article className="article">
        <Link href="/#mural" className="article__back-link">
          ← Voltar para o mural
        </Link>

        <div className="article__meta">
          <span className={`mural-badge ${CATEGORY_META[item.category].badgeClassName}`}>
            {CATEGORY_META[item.category].label}
          </span>
          <p className="article__date">{formatDate(item.publishAt)}</p>
        </div>

        <h1 className="article__title">{item.title}</h1>

        <div className="article__cover">
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 700px"
            priority
          />
        </div>

        <div className="article__body">
          {item.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="article__related">
          <div className="article__related-inner">
            <h2 className="article__related-title">Outras novidades</h2>
            <div className="article__related-grid">
              {related.map((r) => (
                <Link key={r.slug} href={`/novidades/${r.slug}`} className="article__related-card">
                  <div className="article__related-image">
                    <Image src={r.imageUrl} alt={r.imageAlt} fill sizes="200px" />
                  </div>
                  <p className="article__related-card-title">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
