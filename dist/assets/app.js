const state={data:null,period:"1",action:"all",expanded:null};
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const money=v=>{const n=Number(v||0),a=Math.abs(n),t=a>=1e8?`${(a/1e8).toFixed(2)} 億`:a>=1e4?`${(a/1e4).toFixed(1)} 萬`:Math.round(a).toLocaleString();return `${n>=0?"+":"−"}${t}`};
const lots=v=>`${(Math.abs(Number(v||0))/1000).toLocaleString("zh-TW",{maximumFractionDigits:1})} 張`;
const pct=v=>`${(Number(v||0)*100).toFixed(0)}%`,cls=v=>Number(v)>=0?"up":"down";
const signedPct=v=>v==null?"尚無資料":`${Number(v)>=0?"+":""}${(Number(v)*100).toFixed(1)}%`;
const date=v=>v?`${v.slice(0,4)}.${v.slice(4,6)}.${v.slice(6)}`:"—";

function renderSummary(){
  const rows=state.data.core_stocks,t=state.data.portfolio_totals||{},count=c=>rows.filter(r=>c.includes(r.action_code)).length;
  $("#summary").innerHTML=`<article><small>總可觀察庫存</small><strong>${Number(t.inventory_lots||0).toLocaleString("zh-TW",{maximumFractionDigits:1})}</strong><span>張 · ${t.stock_count||0} 檔</span></article><article><small>總庫存市值</small><strong class="up">${money(t.market_value).replace(/^[+−]/,"")}</strong><span>依最新收盤估算</span></article><article><small>近 20 日淨投入</small><strong class="${cls(t.rolling_20d_net_invested)}">${money(t.rolling_20d_net_invested)}</strong><span>宏遠 1260 資金流</span></article><article><small>核心觀察</small><strong>${rows.length}</strong><span>檔股票</span></article><article><small>新建／加碼</small><strong class="up">${count(["new","add"])}</strong><span>資金擴張</span></article><article><small>減碼／出清</small><strong class="down">${count(["trim","reduce","exit"])}</strong><span>留意退潮</span></article>`;
}

function eventRows(a){
  if(!a.events?.length)return `<p class="none">本輪尚無達到重大門檻的加減碼事件。</p>`;
  return a.events.slice().reverse().map(e=>`<article class="event ${e.side}"><div><b>${e.label}</b><small>${date(e.date)} · ${e.net_lots>=0?"+":"−"}${Math.abs(e.net_lots).toLocaleString("zh-TW",{maximumFractionDigits:1})} 張 · ${money(e.net_amount)}</small></div><div class="impact"><span>5D <b class="${cls(e.price_impact["5"])}">${signedPct(e.price_impact["5"])}</b></span><span>10D <b class="${cls(e.price_impact["10"])}">${signedPct(e.price_impact["10"])}</b></span><span>20D <b class="${cls(e.price_impact["20"])}">${signedPct(e.price_impact["20"])}</b></span></div></article>`).join("");
}

function stockCard(r,i){
  const a=r.position_analysis||{},open=state.expanded===r.stock_id,control=a.control_score==null?"樣本累積中":`${a.control_score} 分`;
  return `<article class="stock ${open?"expanded":""}"><button class="stock-toggle" data-stock="${r.stock_id}" aria-expanded="${open}"><div class="rank">${String(i+1).padStart(2,"0")}</div><div class="stock-main"><div class="stock-title"><div><b>${r.stock_name}</b><small>${r.stock_id}</small></div><span class="tag ${r.action_code}">${r.action_label}</span></div><div class="grid"><span><small>收盤</small><b>${Number(r.close).toLocaleString()}</b></span><span><small>今日淨額</small><b class="${cls(r.net_amount_1)}">${money(r.net_amount_1)}</b></span><span><small>5 日</small><b class="${cls(r.net_amount_5)}">${money(r.net_amount_5)}</b></span><span><small>10 日</small><b class="${cls(r.net_amount_10)}">${money(r.net_amount_10)}</b></span><span><small>20 日</small><b class="${cls(r.net_amount_20)}">${money(r.net_amount_20)}</b></span><span><small>庫存留存</small><b>${pct(r.inventory_retention)}</b></span></div><div class="bar"><i style="width:${Math.min(100,Number(r.core_score||0))}%"></i></div><p>可觀察庫存 ${lots(r.inventory)} · 市值 ${money(r.market_value).replace(/^[+−]/,"")} · 點擊${open?"收合":"查看操作影響"}</p></div></button>${open?`<div class="position-detail"><div class="detail-head"><span><small>本輪建倉日</small><b>${date(a.build_date)}</b></span><span><small>掌控力道</small><b>${control}</b><em>${a.control_samples||0} 個後續觀察窗</em></span></div><p>${a.build_note||""}</p><div class="events">${eventRows(a)}</div><p class="control-note">${a.control_note||""}。這是時間關聯，不代表分點交易造成股價變動。</p></div>`:""}</article>`;
}

function renderCore(){
  let rows=state.data.core_stocks;if(state.action!=="all")rows=rows.filter(r=>state.action.split(",").includes(r.action_code));
  $("#empty").hidden=rows.length>0;$("#core-list").innerHTML=rows.map(stockCard).join("");
  all("[data-stock]").forEach(b=>b.onclick=()=>{state.expanded=state.expanded===b.dataset.stock?null:b.dataset.stock;renderCore()});
}

function renderFlow(){
  const rows=state.data.flow_windows[state.period]||[],buy=rows.filter(r=>r.net_amount>0).sort((a,b)=>b.net_amount-a.net_amount).slice(0,12),sell=rows.filter(r=>r.net_amount<0).sort((a,b)=>a.net_amount-b.net_amount).slice(0,12),card=r=>`<article><div><b>${r.stock_name}</b><small>${r.stock_id} · ${lots(r.net_vol)}</small></div><strong class="${cls(r.net_amount)}">${money(r.net_amount)}</strong></article>`;
  $("#buyers").innerHTML=buy.map(card).join("")||"<p class='none'>本期無買超</p>";$("#sellers").innerHTML=sell.map(card).join("")||"<p class='none'>本期無賣超</p>";$("#period-label").textContent=state.period==="1"?"每日":`${state.period} 日`;
}

all("[data-action]").forEach(b=>b.onclick=()=>{state.action=b.dataset.action;state.expanded=null;all("[data-action]").forEach(x=>x.classList.toggle("active",x===b));renderCore()});
all("[data-period]").forEach(b=>b.onclick=()=>{state.period=b.dataset.period;all("[data-period]").forEach(x=>x.classList.toggle("active",x===b));renderFlow()});
fetch("./data/snapshot.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{state.data=d;$("#fresh").textContent=`資料日 ${date(d.as_of)}`;$("#threshold").textContent=`NT$ ${money(d.threshold).replace("+","")}`;$("#method").textContent=d.method_note;renderSummary();renderCore();renderFlow()}).catch(()=>{$("#fresh").textContent="資料讀取失敗";$("#core-list").innerHTML="<p class='none'>請先執行每日更新。</p>"});
