import json,re,sys
P='/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/cm-role/project/'
OUT='/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/canvas.final.json'
NOTE_S4=sys.argv[1] if len(sys.argv)>1 else None
src=open(P+'canvas.json',encoding='utf-8').read()
def j(o): return json.dumps(o,ensure_ascii=False,separators=(',',':'))
def ser(c):
    B=c['boards']; notes=c['notes']
    L=['{"v":3,"createdOnFiles":'+j(c['createdOnFiles'])+',','"title":'+j(c['title'])+',"launch":'+j(c['launch'])+',','"pages":'+j(c['pages'])+',','"boards":{']
    bk=list(B.keys())
    for i,k in enumerate(bk): L.append(j(k)+':'+j(B[k])+(',' if i<len(bk)-1 else '},'))
    L.append('"order":'+j(c['order'])+','); L.append('"notes":{')
    nk=list(notes.keys())
    for i,k in enumerate(nk): L.append(j(k)+':'+j(notes[k])+(',' if i<len(nk)-1 else '},'))
    L.append('"designSystems":'+j(c['designSystems'])+'}')
    return '\n'.join(L)+'\n'
c0=json.loads(src)
print('serializer reproduces the current file exactly:', ser(c0)==src)
c=json.loads(src); B=c['boards']; notes=c['notes']
for f in c['order']:
    if f=='Main.dc.html': continue
    s=open(P+f,encoding='utf-8').read()
    B[f]['h']=int(re.search(r'hint-size="100%,(\d+)px"',s).group(1))
GAP=420
def reflow(page, notekeys):
    bs=[(f,B[f]) for f in c['order'] if B[f]['page']==page]
    ys=sorted(set(b['y'] for _,b in bs)); rs=[[(f,b) for f,b in bs if b['y']==y] for y in ys]
    y=0; out=[]
    for i,r in enumerate(rs):
        for f,b in r: b['y']=y
        if i<len(notekeys): notes[notekeys[i]]['y']=y-300
        m=max(b['h'] for _,b in r); out.append((y,m)); y+=m+GAP
    return out
for pg,nk in [('screens',['n-scr-0','n-scr-1']),('responsive',['n-resp-0','n-resp-1','n-resp-2']),('publication',['n-pub-0','n-pub-1']),('corrections',['n-cor-0','n-cor-1','n-cor-2','n-cor-3']),('lists',['n-lst-0','n-lst-1']),('shared',['n-xs-0','n-xs-1'])]:
    print(pg, reflow(pg,nk))
if NOTE_S4: notes['n-prev-s4']['text']=NOTE_S4
out=ser(c); json.loads(out)
open(OUT,'w',encoding='utf-8').write(out)
a=src.split('\n'); b=out.split('\n')
print('lines',len(a),len(b),'changed',sum(1 for x,y in zip(a,b) if x!=y))
