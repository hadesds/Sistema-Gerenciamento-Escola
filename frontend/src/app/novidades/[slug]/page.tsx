import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchAvisoPublicoPorSlug, fetchAvisosPublicos } from "@/lib/avisos-api";
import { CATEGORY_META, getRandomItems, getVisibleCarouselItems } from "@/lib/carousel-lib";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
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
  const item = await fetchAvisoPublicoPorSlug(slug);
  if (!item) return {};

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
  const item = await fetchAvisoPublicoPorSlug(slug);

  // Agendamento/rascunho: se o backend não devolve o item, trata como
  // se a página não existisse.
  if (!item) notFound();

  const allPublished = getVisibleCarouselItems(await fetchAvisosPublicos());
  const related = getRandomItems(allPublished.filter((i) => i.slug !== item.slug), 3);

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

        <div className="article__body" dangerouslySetInnerHTML={{ __html: item.content }} />
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
