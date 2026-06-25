import { differenceInDays } from 'date-fns';

interface Comment {
  date: string;
  textFr: string;
  author: string;
  tags?: string[];
}

interface Props {
  comment: Comment | null;
}

export default function CommentStrip({ comment }: Props) {
  if (!comment || !comment.textFr) return null;

  // Hide if older than 7 days
  const daysOld = differenceInDays(new Date(), new Date(comment.date));
  if (daysOld > 7) return null;

  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4">
      <div
        className="p-4 rounded"
        style={{
          borderLeft: '3px solid #D4A017',
          backgroundColor: '#111827',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A017' }}>
            Analyse du jour
          </span>
          <span className="text-xs" style={{ color: '#64748B' }}>
            · {new Date(comment.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
          {comment.textFr}
        </p>
        <p className="text-xs mt-2" style={{ color: '#64748B' }}>
          — {comment.author}
        </p>
      </div>
    </section>
  );
}
