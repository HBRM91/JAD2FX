export default function SkeletonTable({ rows = 14 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-3 mb-4">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-8 w-24 rounded" />
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Devise', 'Unité', 'Acheteur', 'Vendeur', 'Var %', 'Var abs.', '7j', ''].map(col => (
              <th key={col} className="py-2 px-3 text-left">
                <div className="skeleton h-4 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr
              key={i}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-8 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                </div>
              </td>
              <td className="py-3 px-3"><div className="skeleton h-4 w-6 rounded ml-auto" /></td>
              <td className="py-3 px-3"><div className="skeleton h-4 w-20 rounded ml-auto" /></td>
              <td className="py-3 px-3"><div className="skeleton h-4 w-20 rounded ml-auto" /></td>
              <td className="py-3 px-3"><div className="skeleton h-4 w-16 rounded ml-auto" /></td>
              <td className="py-3 px-3"><div className="skeleton h-4 w-16 rounded ml-auto" /></td>
              <td className="py-3 px-3 hidden md:table-cell">
                <div className="skeleton h-6 w-16 rounded" />
              </td>
              <td className="py-3 px-3"><div className="skeleton h-4 w-4 rounded mx-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
