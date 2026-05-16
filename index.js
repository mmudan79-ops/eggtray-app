const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = express();
const DB_FILE = path.join(os.homedir(), 'eggtray-app', 'data.json');

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch(e) { return { settings: defaultSettings(), records: {} }; }
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
function defaultSettings() {
  return { sell_price:180, paper_price:150, paper_per_1k:8, elec_price:210,
    qual_rate:95, worker_wage:2500000, mgmt_wage:800000,
    depreciation:300000, rent:500000, other_fixed:200000 };
}

app.use(express.json());

app.get('/api/settings', (req, res) => res.json(readDB().settings));
app.post('/api/settings', (req, res) => {
  const db = readDB(); db.settings = { ...db.settings, ...req.body }; writeDB(db); res.json({ok:true});
});
app.get('/api/records', (req, res) => {
  const db = readDB(); const { ym } = req.query;
  const all = Object.entries(db.records).map(([date,v]) => ({date,...v})).sort((a,b)=>b.date.localeCompare(a.date));
  res.json(ym ? all.filter(r => r.date.startsWith(ym)) : all.slice(0,100));
});
app.post('/api/records', (req, res) => {
  const db = readDB(); const r = req.body;
  db.records[r.date] = { qty:r.qty, paper_kg:r.paper_kg, kwh:r.kwh, sold:r.sold, other_cost:r.other_cost||0, note:r.note||'' };
  writeDB(db); res.json({ok:true});
});
app.delete('/api/records/:date', (req, res) => {
  const db = readDB(); delete db.records[req.params.date]; writeDB(db); res.json({ok:true});
});

app.get('*', (req, res) => res.send(`<!DOCTYPE html>
<html lang="zh"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="蛋托厂">
<title>蛋托厂管理系统</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--pr:#2563eb;--su:#16a34a;--da:#dc2626;--bg:#f1f5f9;--card:#fff;--bd:#e2e8f0;--tx:#1e293b;--mu:#64748b;--li:#f8fafc}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--tx);padding-bottom:80px}
.topbar{background:var(--pr);color:#fff;padding:14px 16px 12px;position:sticky;top:0;z-index:100}
.topbar h1{font-size:17px;font-weight:700}.topbar p{font-size:12px;opacity:.8;margin-top:2px}
.bottomnav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--bd);display:flex;z-index:100;padding-bottom:env(safe-area-inset-bottom)}
.bn{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 4px;cursor:pointer;border:none;background:none;color:var(--mu);font-size:10px;gap:3px}
.bn.active{color:var(--pr)}.bn .ic{font-size:22px}
.page{display:none;padding:16px}.page.active{display:block}
.card{background:var(--card);border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px #0001}
.card h3{font-size:14px;font-weight:600;margin-bottom:12px}
.mg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.mc{background:var(--li);border-radius:10px;padding:12px;border:1px solid var(--bd)}
.mc .lb{font-size:11px;color:var(--mu);margin-bottom:4px}.mc .lm{font-size:10px;color:#94a3b8}
.mc .vl{font-size:20px;font-weight:700}
.vl.gr{color:var(--su)}.vl.rd{color:var(--da)}.vl.bl{color:var(--pr)}
.field{margin-bottom:14px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
.field .mn{font-size:11px;color:var(--mu);font-weight:400}
.field input,.field select{width:100%;padding:12px 14px;border:1.5px solid var(--bd);border-radius:10px;font-size:16px;background:#fff;color:var(--tx)}
.field input:focus,.field select:focus{outline:none;border-color:var(--pr)}
.yw{background:#fefce8!important;border-color:#fbbf24!important}
.btn{width:100%;padding:14px;border-radius:12px;border:none;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:10px}
.btn:active{opacity:.85}.bp{background:var(--pr);color:#fff}.bs{background:#e2e8f0;color:var(--tx)}
.tbl-wrap{overflow-x:auto;border-radius:10px;border:1px solid var(--bd)}
table{width:100%;border-collapse:collapse;font-size:12px;min-width:480px}
th{background:#f1f5f9;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;border-bottom:1px solid var(--bd)}
td{padding:8px 10px;border-bottom:1px solid var(--bd)}.nm{text-align:right}
.gr{color:var(--su);font-weight:600}.rd{color:var(--da);font-weight:600}
.al{padding:12px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;border:1px solid}
.aw{background:#fefce8;border-color:#fde68a;color:#92400e}
.ai{background:#eff6ff;border-color:#93c5fd;color:#1e40af}
.ri{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--bd);font-size:13px}
.ri:last-child{border-bottom:none}.ri .lb{color:var(--mu)}.ri .vl{font-weight:600}
.empty{text-align:center;padding:40px 20px;color:var(--mu)}
#toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;opacity:0;transition:.3s;z-index:999;white-space:nowrap;pointer-events:none}
#toast.show{opacity:1}
</style></head><body>
<div class="topbar"><h1>🥚 蛋托厂管理系统</h1><p id="tsub">Өндөгний тавиурын үйлдвэр</p></div>

<div class="page active" id="pg-today"><div id="today-c"></div></div>

<div class="page" id="pg-input">
<div class="card"><h3>✏️ 每日录入 · Өдрийн бүртгэл</h3>
<div class="al ai">填写黄色输入框后点保存 / Шар нүдийг бөглөөд хадгална</div>
<div class="field"><label>日期 · Огноо</label><input type="date" id="fd"></div>
<div class="field"><label>★ 生产总量（个）<span class="mn">· Нийт үйлдвэрлэл</span></label><input class="yw" type="number" id="fq" placeholder="例:5000" inputmode="numeric"></div>
<div class="field"><label>★ 废纸用量（kg）<span class="mn">· Хуучин цаас</span></label><input class="yw" type="number" id="fp" placeholder="例:40" inputmode="decimal"></div>
<div class="field"><label>★ 耗电量（度）<span class="mn">· Цахилгаан</span></label><input class="yw" type="number" id="fk" placeholder="例:120" inputmode="decimal"></div>
<div class="field"><label>★ 实际销售量（个）<span class="mn">· Борлуулалт</span></label><input class="yw" type="number" id="fs" placeholder="例:4800" inputmode="numeric"></div>
<div class="field"><label>其他支出（₮）<span class="mn">· Бусад зардал</span></label><input class="yw" type="number" id="fo" placeholder="运费/杂费" inputmode="numeric"></div>
<div class="field"><label>备注 <span class="mn">· Тэмдэглэл</span></label><input type="text" id="fn" placeholder="可不填"></div>
<button class="btn bp" onclick="saveRec()">💾 保存 · Хадгалах</button>
<button class="btn bs" onclick="preview()">🔢 预览计算 · Урьдчилсан тооцоо</button>
<div id="prev-box"></div></div></div>

<div class="page" id="pg-report">
<div class="card"><h3>📊 月度报表 · Сарын тайлан</h3>
<div class="field"><label>选择月份 · Сар сонгох</label><select id="rm" onchange="loadRep()"></select></div></div>
<div id="rep-c"></div></div>

<div class="page" id="pg-detail">
<div class="card"><h3>📅 每日明细 · Өдрийн дэлгэрэнгүй</h3>
<div class="field"><label>选择月份 · Сар сонгох</label><select id="dm" onchange="loadDet()"></select></div></div>
<div id="det-c"></div></div>

<div class="page" id="pg-settings">
<div class="card"><h3>⚙️ 参数设置 · Тохиргоо</h3>
<div class="al aw">修改后点保存，全部计算自动更新 / Тохиргоо өөрчилсний дараа хадгална</div>
<div id="sf"></div>
<button class="btn bp" onclick="saveSets()">💾 保存设置 · Хадгалах</button></div></div>

<div class="bottomnav">
<button class="bn active" onclick="go('today',this)"><span class="ic">🏠</span>今日</button>
<button class="bn" onclick="go('input',this)"><span class="ic">✏️</span>录入</button>
<button class="bn" onclick="go('report',this)"><span class="ic">📊</span>报表</button>
<button class="bn" onclick="go('detail',this)"><span class="ic">📅</span>明细</button>
<button class="bn" onclick="go('settings',this)"><span class="ic">⚙️</span>设置</button>
</div>
<div id="toast"></div>
<script>
let S={};
const f=n=>Math.round(n||0).toLocaleString();
const fd=n=>(n||0).toFixed(1);
const td=()=>new Date().toISOString().slice(0,10);
const ym=d=>d.slice(0,7);
const MN=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
const mn=y=>y.slice(0,4)+'年'+MN[parseInt(y.slice(5))-1]+'月';
function toast(m,d=2200){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),d);}
function go(p,el){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.bn').forEach(x=>x.classList.remove('active'));
  document.getElementById('pg-'+p).classList.add('active');
  if(el)el.classList.add('active');
  if(p==='today')loadToday();
  if(p==='report')initSel('rm',loadRep);
  if(p==='detail')initSel('dm',loadDet);
  if(p==='settings')loadSets();
}
async function api(method,url,body){
  const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  return r.json();
}
function calc(r){
  const rev=r.sold*S.sell_price, pc=r.paper_kg*S.paper_price, ec=r.kwh*S.elec_price;
  const fix=(S.worker_wage+S.mgmt_wage+S.depreciation+S.rent+S.other_fixed)/26;
  const tc=pc+ec+(r.other_cost||0)+fix;
  return{rev,pc,ec,fix,tc,profit:rev-tc};
}
async function loadToday(){
  S=await api('GET','/api/settings');
  const today=td(), rows=await api('GET','/api/records?ym='+ym(today));
  const rec=rows.find(r=>r.date===today);
  const d=new Date();
  document.getElementById('tsub').textContent=d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';
  let ms=null;
  if(rows.length){
    ms={days:rows.length,qty:0,sold:0,rev:0,tc:0,profit:0};
    rows.forEach(r=>{const c=calc(r);ms.qty+=r.qty;ms.sold+=r.sold;ms.rev+=c.rev;ms.tc+=c.tc;ms.profit+=c.profit;});
    ms.margin=ms.rev>0?ms.profit/ms.rev*100:0;
  }
  let th='';
  if(rec){const c=calc(rec);th=\`
  <div class="mg">
    <div class="mc"><div class="lb">今日产量<div class="lm">Үйлдвэрлэл</div></div><div class="vl bl">\${f(rec.qty)}个</div></div>
    <div class="mc"><div class="lb">今日销售<div class="lm">Борлуулалт</div></div><div class="vl">\${f(rec.sold)}个</div></div>
    <div class="mc"><div class="lb">今日收入<div class="lm">Орлого</div></div><div class="vl gr">₮\${f(c.rev)}</div></div>
    <div class="mc"><div class="lb">今日利润<div class="lm">Ашиг</div></div><div class="vl \${c.profit>=0?'gr':'rd'}">₮\${f(c.profit)}</div></div>
  </div>
  <div style="font-size:12px;color:var(--mu)">废纸:\${rec.paper_kg}kg · 用电:\${rec.kwh}度\${rec.note?' · '+rec.note:''}</div>\`;}
  else th=\`<div class="al aw">⚠ 今天还未录入数据<br><button class="btn bp" style="margin-top:10px;width:auto;padding:10px 20px;display:inline-block" onclick="go('input',document.querySelectorAll('.bn')[1])">立即录入</button></div>\`;
  const mh=ms?\`<div class="mg">
    <div class="mc"><div class="lb">本月产量<div class="lm">Сарын үйлдвэрлэл</div></div><div class="vl bl">\${f(ms.qty)}个</div></div>
    <div class="mc"><div class="lb">本月收入<div class="lm">Орлого</div></div><div class="vl gr">₮\${f(ms.rev)}</div></div>
    <div class="mc"><div class="lb">本月成本<div class="lm">Зардал</div></div><div class="vl rd">₮\${f(ms.tc)}</div></div>
    <div class="mc"><div class="lb">本月利润<div class="lm">Ашиг</div></div><div class="vl \${ms.profit>=0?'gr':'rd'}">₮\${f(ms.profit)}</div></div>
  </div>
  <div style="font-size:12px;color:var(--mu)">利润率:\${fd(ms.margin)}% · 已录\${ms.days}天 · 日均\${f(ms.qty/ms.days)}个</div>\`
  :\`<div class="al ai">本月暂无数据，请先录入。</div>\`;
  document.getElementById('today-c').innerHTML=\`
  <div class="card"><h3>📅 今日 · Өнөөдөр</h3>\${th}</div>
  <div class="card"><h3>📈 本月汇总 · Сарын нэгтгэл</h3>\${mh}</div>\`;
}
async function saveRec(){
  const date=document.getElementById('fd').value;
  const qty=parseFloat(document.getElementById('fq').value)||0;
  if(!qty){toast('⚠ 请填写生产总量');return;}
  await api('POST','/api/records',{date,qty,
    paper_kg:parseFloat(document.getElementById('fp').value)||0,
    kwh:parseFloat(document.getElementById('fk').value)||0,
    sold:parseFloat(document.getElementById('fs').value)||0,
    other_cost:parseFloat(document.getElementById('fo').value)||0,
    note:document.getElementById('fn').value.trim()});
  toast('✅ '+date+' 数据已保存');preview();
}
function preview(){
  const qty=parseFloat(document.getElementById('fq').value)||0;
  const c=calc({qty,paper_kg:parseFloat(document.getElementById('fp').value)||0,
    kwh:parseFloat(document.getElementById('fk').value)||0,
    sold:parseFloat(document.getElementById('fs').value)||0,
    other_cost:parseFloat(document.getElementById('fo').value)||0});
  document.getElementById('prev-box').innerHTML=\`
  <div style="background:var(--li);border-radius:10px;padding:14px;margin-top:8px;border:1px solid var(--bd)">
    <div style="font-size:12px;font-weight:600;color:var(--mu);margin-bottom:10px">计算预览 · Урьдчилсан тооцоо</div>
    <div class="ri"><span class="lb">销售收入</span><span class="vl gr">₮\${f(c.rev)}</span></div>
    <div class="ri"><span class="lb">废纸成本</span><span class="vl">₮\${f(c.pc)}</span></div>
    <div class="ri"><span class="lb">电费</span><span class="vl">₮\${f(c.ec)}</span></div>
    <div class="ri"><span class="lb">固定成本分摊</span><span class="vl">₮\${f(c.fix)}</span></div>
    <div class="ri"><span class="lb">当日总成本</span><span class="vl rd">₮\${f(c.tc)}</span></div>
    <div style="margin-top:10px;font-size:16px;font-weight:700;color:\${c.profit>=0?'var(--su)':'var(--da)'}">当日利润: ₮\${f(c.profit)}</div>
  </div>\`;
}
async function initSel(id,cb){
  S=await api('GET','/api/settings');
  const rows=await api('GET','/api/records');
  const yms=[...new Set(rows.map(r=>r.date.slice(0,7)))].sort().reverse();
  const cur=td().slice(0,7); if(!yms.includes(cur))yms.unshift(cur);
  document.getElementById(id).innerHTML=yms.map(m=>\`<option value="\${m}">\${mn(m)}</option>\`).join('');
  cb();
}
async function loadRep(){
  const ymv=document.getElementById('rm').value;
  const rows=await api('GET','/api/records?ym='+ymv);
  const el=document.getElementById('rep-c');
  if(!rows.length){el.innerHTML=\`<div class="card"><div class="empty">📭<p style="margin-top:12px">本月暂无数据</p></div></div>\`;return;}
  let ms={days:rows.length,qty:0,sold:0,rev:0,pc:0,ec:0,oc:0,tc:0,profit:0};
  rows.forEach(r=>{const c=calc(r);ms.qty+=r.qty;ms.sold+=r.sold;ms.rev+=c.rev;ms.pc+=c.pc;ms.ec+=c.ec;ms.oc+=(r.other_cost||0);ms.tc+=c.tc;ms.profit+=c.profit;});
  ms.margin=ms.rev>0?ms.profit/ms.rev*100:0;
  const fix=S.worker_wage+S.mgmt_wage+S.depreciation+S.rent+S.other_fixed;
  const mc=ms.profit>=0?'gr':'rd';
  el.innerHTML=\`
  <div class="card"><h3>💰 财务汇总 · Санхүүгийн нэгтгэл</h3>
  <div class="mg">
    <div class="mc"><div class="lb">月产量<div class="lm">Үйлдвэрлэл</div></div><div class="vl bl">\${f(ms.qty)}个</div></div>
    <div class="mc"><div class="lb">月销量<div class="lm">Борлуулалт</div></div><div class="vl">\${f(ms.sold)}个</div></div>
    <div class="mc"><div class="lb">月收入<div class="lm">Орлого</div></div><div class="vl gr">₮\${f(ms.rev)}</div></div>
    <div class="mc"><div class="lb">月净利润<div class="lm">Ашиг</div></div><div class="vl \${mc}">₮\${f(ms.profit)}</div></div>
  </div>
  <div class="ri"><span class="lb">废纸原料成本</span><span>₮\${f(ms.pc)}</span></div>
  <div class="ri"><span class="lb">电费</span><span>₮\${f(ms.ec)}</span></div>
  <div class="ri"><span class="lb">其他临时支出</span><span>₮\${f(ms.oc)}</span></div>
  <div class="ri"><span class="lb">固定成本（工资+折旧+租金）</span><span>₮\${f(fix)}</span></div>
  <div class="ri" style="font-weight:700"><span class="lb">月总成本</span><span class="rd">₮\${f(ms.tc)}</span></div>
  <div class="ri" style="font-weight:700"><span>月净利润</span><span class="\${mc}">₮\${f(ms.profit)} (\${fd(ms.margin)}%)</span></div></div>
  <div class="card"><h3>📋 经营指标 · Үзүүлэлт</h3>
  <div class="ri"><span class="lb">有记录天数</span><span class="vl">\${ms.days}天</span></div>
  <div class="ri"><span class="lb">日均产量</span><span class="vl">\${f(ms.qty/ms.days)}个/天</span></div>
  <div class="ri"><span class="lb">单位成本</span><span class="vl">₮\${fd(ms.tc/ms.qty)}/个</span></div>
  <div class="ri"><span class="lb">利润率</span><span class="vl \${mc}">\${fd(ms.margin)}%</span></div></div>\`;
}
async function loadDet(){
  const ymv=document.getElementById('dm').value;
  const rows=await api('GET','/api/records?ym='+ymv);
  const el=document.getElementById('det-c');
  if(!rows.length){el.innerHTML=\`<div class="card"><div class="empty">📭<p style="margin-top:12px">本月暂无数据</p></div></div>\`;return;}
  let html=\`<div class="card"><div class="tbl-wrap"><table>
  <tr><th>日期</th><th>产量</th><th>销售</th><th>收入</th><th>利润</th><th></th></tr>\`;
  rows.forEach(r=>{const c=calc(r);html+=\`<tr>
    <td>\${r.date.slice(5)}</td><td class="nm">\${f(r.qty)}</td><td class="nm">\${f(r.sold)}</td>
    <td class="nm gr">₮\${f(c.rev)}</td><td class="nm \${c.profit>=0?'gr':'rd'}">₮\${f(c.profit)}</td>
    <td><button style="border:none;background:#fee2e2;color:#b91c1c;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer" onclick="delRec('\${r.date}')">删除</button></td>
  </tr>\`;});
  el.innerHTML=html+\`</table></div></div>\`;
}
async function delRec(date){
  if(!confirm('删除 '+date+' 的数据？'))return;
  await api('DELETE','/api/records/'+date);toast('已删除');loadDet();
}
const SD=[
  {k:'sell_price',cn:'销售单价',mn:'Борлуулалтын үнэ',u:'₮/个'},
  {k:'paper_price',cn:'废纸单价',mn:'Хуучин цаасны үнэ',u:'₮/kg'},
  {k:'paper_per_1k',cn:'每千个耗纸量',mn:'1000нэгжид цаас',u:'kg/千'},
  {k:'elec_price',cn:'电价',mn:'Цахилгааны тариф',u:'₮/度'},
  {k:'qual_rate',cn:'产品合格率',mn:'Чанарын хувь',u:'%'},
  {k:'worker_wage',cn:'月工人工资',mn:'Ажилчдын цалин',u:'₮/月'},
  {k:'mgmt_wage',cn:'月管理工资',mn:'Удирдлагын цалин',u:'₮/月'},
  {k:'depreciation',cn:'设备月折旧',mn:'Тоног элэгдэл',u:'₮/月'},
  {k:'rent',cn:'月租金',mn:'Түрээс',u:'₮/月'},
  {k:'other_fixed',cn:'月其他固定费用',mn:'Бусад тогтмол',u:'₮/月'},
];
async function loadSets(){
  S=await api('GET','/api/settings');
  document.getElementById('sf').innerHTML=SD.map(d=>\`
  <div class="field"><label>\${d.cn} <span class="mn">· \${d.mn} (\${d.u})</span></label>
  <input type="number" id="s-\${d.k}" value="\${S[d.k]}" inputmode="decimal"></div>\`).join('');
}
async function saveSets(){
  const b={};SD.forEach(d=>{b[d.k]=parseFloat(document.getElementById('s-'+d.k).value)||0;});
  await api('POST','/api/settings',b);S=b;toast('✅ 参数已保存');
}
document.getElementById('fd').value=td();
api('GET','/api/settings').then(s=>{S=s;loadToday();});
</script></body></html>`));

const PORT=3000;
app.listen(PORT,'0.0.0.0',()=>{
  const nets=os.networkInterfaces(); let ip='localhost';
  for(const n of Object.keys(nets)) for(const i of nets[n]) if(i.family==='IPv4'&&!i.internal){ip=i.address;break;}
  console.log('\n✅ 蛋托厂管理系统已启动！');
  console.log('📱 手机访问: http://'+ip+':'+PORT);
  console.log('💻 电脑访问: http://localhost:'+PORT);
  console.log('⚠️  手机和电脑须连同一WiFi');
  console.log('🛑 关闭: 按 Ctrl+C\n');
});
