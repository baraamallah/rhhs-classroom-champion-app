const fs=require('fs'),ts=require('typescript');
const files=['components/features/evaluations/submission-tracking.tsx'];
for(const file of files){let s=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[],extras=[];for(const fn of sf.statements){if(!ts.isFunctionDeclaration(fn)||!fn.body||!fn.name)continue;const name=fn.name.text;if(name.startsWith('use'))continue;const controller=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===`use${name}Controller`);if(!controller)continue;
 const locals=new Set(),params=new Set();function bind(n,set){if(ts.isIdentifier(n))set.add(n.text);else if(ts.isBindingPattern(n))n.elements.forEach(e=>e.name&&bind(e.name,set))}
 fn.parameters.forEach(p=>bind(p.name,params));for(const st of fn.body.statements)if(ts.isVariableStatement(st))st.declarationList.declarations.forEach(d=>bind(d.name,locals));
 let count=0;function visit(n){if(ts.isFunctionLike(n))return;const lines=sf.getLineAndCharacterOfPosition(n.end).line-sf.getLineAndCharacterOfPosition(n.getStart(sf)).line;
 if((ts.isJsxElement(n)||ts.isJsxFragment(n))&&lines>=65&&lines<=230){
  const needed=new Set();function refs(x){if(ts.isIdentifier(x)&&(locals.has(x.text)||params.has(x.text)))needed.add(x.text);ts.forEachChild(x,refs)}refs(n);
  const keys=[...needed].sort(),local=keys.filter(x=>locals.has(x)),param=keys.filter(x=>params.has(x));
  const typeParts=[];if(local.length)typeParts.push(`Pick<ReturnType<typeof use${name}Controller>, ${local.map(x=>JSON.stringify(x)).join(' | ')}>`);if(param.length)typeParts.push(`Pick<NonNullable<Parameters<typeof use${name}Controller>[0]>, ${param.map(x=>JSON.stringify(x)).join(' | ')}>`);
  const part=`${name}Section${++count}`;extras.push(`\nfunction ${part}({ ${keys.join(', ')} }: ${typeParts.join(' & ')||'Record<string, never>'}) {\n  return (${n.getText(sf)})\n}\n`);edits.push({start:n.getStart(sf),end:n.end,text:`<${part}${keys.map(x=>` ${x}={${x}}`).join('')} />`});return;
 }ts.forEachChild(n,visit)}
 for(const st of fn.body.statements)visit(st);
 if(count)console.log(file,count);
 }
 edits.sort((a,b)=>b.start-a.start);for(const e of edits)s=s.slice(0,e.start)+e.text+s.slice(e.end);if(edits.length)fs.writeFileSync(file,s+'\n'+extras.join('\n'));
}
