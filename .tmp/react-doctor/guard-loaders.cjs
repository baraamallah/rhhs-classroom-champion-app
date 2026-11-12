const fs=require('fs'),ts=require('typescript');
const cases=[
['app/supervisor/page.tsx','loadData','[currentUser]'],
['app/supervisor/evaluate/page.tsx','loadDateOverview','[currentUser]'],
['components/features/evaluations/submission-tracking.tsx','fetchData','[date, viewType, customStartDate, customEndDate, toast]'],
['components/features/evaluations/supervisor-evaluations-history.tsx','fetchEvaluations','[supervisorId]'],
['components/features/evaluations/supervisor-evaluations-history.tsx','fetchUndoLogs','[supervisorId]'],
['components/features/evaluations/evaluations-list.tsx','loadUndoLogs','[]'],
['components/features/admin/global-system-controls.tsx','loadAllSettings','[onSettingsChange, toast]'],
['components/features/admin/default-month-settings.tsx','loadSettings','[]'],
['components/features/admin/checklist-manager.tsx','fetchItems','[toast]'],
['components/features/admin/classroom-management.tsx','loadClassrooms','[toast]'],
['components/features/admin/classroom-management.tsx','loadSupervisors','[]'],
['components/features/admin/data-management-panel.tsx','loadEvaluations','[toast]'],
['components/features/admin/data-management-panel.tsx','loadAdminSettings','[]'],
];
for(const [file,name,deps] of cases){let s=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let dec;function find(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text===name)dec=n;ts.forEachChild(n,find)}find(sf);if(!dec||!ts.isArrowFunction(dec.initializer)){console.log('SKIP',name);continue}const fn=dec.initializer;const edits=[];const params=fn.parameters.map(n=>n.getText(sf));params.push('signal?: AbortSignal');
function visit(n){if(ts.isAwaitExpression(n)){let st=n;while(st.parent&&!ts.isExpressionStatement(st)&&!ts.isVariableStatement(st))st=st.parent;if(st.end<=fn.body.end)edits.push({start:st.end,end:st.end,text:'\n      if (signal?.aborted) return'});return}ts.forEachChild(n,visit)}visit(fn.body);
let body=fn.body.getText(sf);for(const e of edits.sort((a,b)=>b.start-a.start)){const pos=e.start-fn.body.getStart(sf);body=body.slice(0,pos)+e.text+body.slice(pos)}
// Completion and error feedback must also belong to the current request.
body=body.replace(/(finally\s*\{\s*)(set(?:Loading|LoadingOverview|LoadingUndoLogs|Refreshing)\(false\))/g,'$1if (!signal?.aborted) $2');
body=body.replace(/(\} catch \([^)]*\) \{)/g,'$1\n      if (signal?.aborted) return');
s=s.slice(0,fn.getStart(sf))+`useCallback(async (${params.join(', ')}) => ${body}, ${deps})`+s.slice(fn.end);
s=s.replace(/import \{ ([^}]+) \} from "react"/,(_,x)=>`import { ${x.includes('useCallback')?x:x+', useCallback'} } from "react"`);fs.writeFileSync(file,s);
}
