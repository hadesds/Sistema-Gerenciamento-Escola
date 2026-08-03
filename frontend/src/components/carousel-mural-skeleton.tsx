export function CarouselMuralSkeleton() {
  return (
    <div className="mural-skeleton">
      <div className="mural-skeleton__card">
        <div className="mural-skeleton__image" />
        <div className="mural-skeleton__body">
          <div className="mural-skeleton__line" style={{ height: "1.4rem", width: "8rem" }} />
          <div className="mural-skeleton__line" style={{ height: "2rem", width: "70%" }} />
          <div className="mural-skeleton__line" style={{ height: "1.2rem", width: "100%" }} />
          <div className="mural-skeleton__line" style={{ height: "1.2rem", width: "60%" }} />
        </div>
      </div>

      <div className="mural-skeleton__dots">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mural-skeleton__dot" />
        ))}
      </div>
    </div>
  );
}
