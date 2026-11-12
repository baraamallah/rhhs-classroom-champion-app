const fs = require('fs'); const ts = require('typescript');
const cases = [['components/features/evaluations/submission-tracking.tsx','SubmissionTrackingContent']];
for (const [file,name] of cases) {
 const s=fs.readFileSync(file,'utf8'); const sf=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name); if(!fn?.body){console.log('SKIP',name);continue}
 const statements=[...fn.body.statements];const ret=statements.findLast(n=>ts.isReturnStatement(n));if(!ret)continue;
 const guards=statements.filter(n=>ts.isIfStatement(n)&&(()=>{let yes=false;function visit(x){if(ts.isReturnStatement(x))yes=true;if(!ts.isFunctionLike(x))ts.forEachChild(x,visit)}visit(n);return yes})());
 const localNames=new Set();function bind(n){if(ts.isIdentifier(n))localNames.add(n.text);else if(ts.isBindingPattern(n))n.elements.forEach(e=>{if(e.name)bind(e.name)})}
 for(const n of statements){if(ts.isVariableStatement(n))n.declarationList.declarations.forEach(d=>bind(d.name));else if(ts.isFunctionDeclaration(n)&&n.name)localNames.add(n.name.text)}
 const used=new Set();function refs(n){if(ts.isIdentifier(n)&&localNames.has(n.text))used.add(n.text);ts.forEachChild(n,refs)}refs(ret);guards.forEach(refs);
 const names=[...used].sort();
 const logic=statements.filter(n=>n!==ret&&!guards.includes(n)).map(n=>s.slice(n.getFullStart(),n.end)).join('');
 const paramText=fn.parameters.map(n=>n.getText(sf)).join(', ');
 const args=fn.parameters.map(p=>{if(ts.isIdentifier(p.name))return p.name.text;return '{ '+p.name.elements.map(e=>e.propertyName?`${e.propertyName.getText(sf)}: ${e.name.getText(sf)}`:e.name.getText(sf)).join(', ')+' }'}).join(', ');
 const exported=fn.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)?'export ':'';
 const render=guards.map(n=>s.slice(n.getFullStart(),n.end)).join('')+s.slice(ret.getFullStart(),ret.end);
 const replacement=`function use${name}Controller(${paramText}) {${logic}\n  return { ${names.join(', ')} }\n}\n\n${exported}function ${name}(${paramText}) {\n  const { ${names.join(', ')} } = use${name}Controller(${args})\n${render}\n}`;
 fs.writeFileSync(file,s.slice(0,fn.getStart(sf))+replacement+s.slice(fn.end));console.log('Separated',name,names.length);
}
