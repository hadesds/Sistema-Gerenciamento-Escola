interface NotaBadgeProps {
  nota: number;
}

export default function NotaBadge({ nota }: NotaBadgeProps) {
  const classe = nota >= 4 ? 'alta' : nota >= 2.5 ? 'media' : 'baixa';
  return <span className={`nota-badge ${classe}`}>{nota.toFixed(2)}</span>;
}
