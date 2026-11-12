interface PolicyTableProps {
  headings: string[]
  rows: { id: string; cells: { heading: string; text: string; className: string }[] }[]
}

export function PolicyTable({ headings, rows }: PolicyTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="bg-muted/70 text-foreground border-b border-border/60">
            {headings.map((heading) => (
              <th key={heading} className="p-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 bg-card">
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell) => (
                <td key={cell.heading} className={cell.className}>
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
