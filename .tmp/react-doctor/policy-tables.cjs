const fs=require('fs'),ts=require('typescript');
const component=`import type { ReactNode } from "react"

interface PolicyTableProps {
  headings: string[]
  rows: { id: string; cells: { heading: string; text: string; className: string }[] }[]
}

export function PolicyTable({ headings, rows }: PolicyTableProps) {
  return <div className="overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
    <table className="w-full text-left text-xs sm:text-sm border-collapse">
      <thead><tr className="bg-muted/70 text-foreground border-b border-border/60">
        {headings.map(heading => <th key={heading} className="p-3 font-semibold">{heading}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-border/50 bg-card">
        {rows.map(row => <tr key={row.id}>{row.cells.map(cell => <td key={cell.heading} className={cell.className}>{cell.text}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
}
`;
fs.writeFileSync('components/features/legal/policy-table.tsx',component.replace('import type { ReactNode } from "react"\n\n',''));
for(const file of ['app/cookies/page.tsx','components/features/legal/staff-policy-addendum.tsx']){let s=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];function tag(n,name){return ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)===name}function children(n,name){const result=[];function visit(x){if(tag(x,name))result.push(x);else ts.forEachChild(x,visit)}ts.forEachChild(n,visit);return result}function text(n){const all=n.children.map(x=>ts.isJsxText(x)?x.text:'').join(' ').replace(/\s+/g,' ').trim();if(n.children.some(x=>!ts.isJsxText(x)))throw new Error('rich text cell '+file);return all.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'")}
function visit(n){if(tag(n,'table')){const heads=children(n,'th').map(text),body=children(n,'tbody')[0];if(!body)return;const rows=children(body,'tr').map(row=>{const cells=children(row,'td').map((cell,i)=>{const attr=cell.openingElement.attributes.properties.find(x=>x.name?.getText(sf)==='className');return {heading:heads[i],text:text(cell),className:attr?.initializer?.text||''}});return {id:cells[0].text,cells}});const wrap=n.parent;if(!tag(wrap,'div'))throw new Error('missing wrapper');edits.push({start:wrap.getStart(sf),end:wrap.end,text:`<PolicyTable headings={${JSON.stringify(heads)}} rows={${JSON.stringify(rows)}} />`});return}ts.forEachChild(n,visit)}visit(sf);for(const e of edits.sort((a,b)=>b.start-a.start))s=s.slice(0,e.start)+e.text+s.slice(e.end);const i=s.indexOf('import ');s=s.slice(0,i)+'import { PolicyTable } from "@/components/features/legal/policy-table"\n'+s.slice(i);fs.writeFileSync(file,s)}
