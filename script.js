const h = React.createElement;
const { useEffect, useMemo, useRef, useState } = React;

const TYPE_META = {
  PH: { label: "قوة جسدية", multiplier: 2.0 },
  IQ: { label: "ذكاء وتعلّم", multiplier: 1.7 },
  SP: { label: "انضباط وروحانية", multiplier: 1.5 },
};

const RANKS = [
  { key: "E", days: 0, label: "E" },
  { key: "D", days: 7, label: "D" },
  { key: "C", days: 30, label: "C" },
  { key: "B", days: 90, label: "B" },
  { key: "A", days: 180, label: "A" },
  { key: "S", days: 365, label: "S Elite" },
];

const QUOTES = [
  "أنت لا تبحث عن الحماس… أنت تبني الانضباط.",
  "اليوم ليس اختبارًا لقوتك… بل لالتزامك.",
  "خطوة واحدة يوميًا تُصنع منها الأساطير.",
  "كل مهمة تُنجزها = مستوى جديد في شخصيتك.",
  "لا تُفاوض على عاداتك الأساسية.",
  "النتائج لا تأتي بسرعة… لكنّها تأتي بثبات.",
  "الفارق بينك وبين هدفك: يوم واحد من الالتزام.",
  "الضعف لحظة… والاستسلام قرار.",
  "خفّف الضوضاء. زد التنفيذ.",
  "إذا بدأت اليوم، ستشكر نفسك بعد أسبوع.",
  "إلتزم عندما لا تشعر بالرغبة—هنا تتغير الشخصية.",
  "كل مرة تقول (لاحقًا) أنت تسرق من مستقبلك.",
  "لا تنتظر المزاج. المزاج يتبع الحركة.",
  "أنت تبني (نظام)… وليس (قائمة مهام).",
  "الضغط جزء من التطور. لا تهرب منه.",
];

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function pct(n){ return Math.round(n * 100); }
function format2(n){ return (Math.round(n * 100) / 100).toFixed(2); }

function todayKeyLocal(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function randomQuote(seed){
  let hh = 0;
  for(let i=0;i<seed.length;i++) hh = (hh*31 + seed.charCodeAt(i)) >>> 0;
  return QUOTES[hh % QUOTES.length];
}

function expToLevel(totalExp){
  const a = 120;
  let level = 1;
  let expForNext = a;
  let remaining = totalExp;
  while(remaining >= expForNext){
    remaining -= expForNext;
    level += 1;
    expForNext = Math.round(a * Math.pow(level, 1.15));
    if(level > 200) break;
  }
  return { level, expIntoLevel: remaining, expForNext };
}

function rankFromStreak(days){
  let cur = RANKS[0];
  for(const r of RANKS) if(days >= r.days) cur = r;
  return cur;
}

function msToMidnight(){
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24,0,0,0);
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms){
  const total = Math.max(0, ms);
  const s = Math.floor(total/1000);
  const hh = Math.floor(s/3600);
  const mm = Math.floor((s%3600)/60);
  const ss = s%60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}

const STORAGE_KEY = "RISE_SYSTEM_CODEPEN_READY_V1";

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{
    return null;
  }
}
function saveState(s){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function polygon(ctx, cx, cy, r, sides, rot){
  ctx.beginPath();
  for(let i=0;i<sides;i++){
    const a = rot + i*(2*Math.PI/sides);
    const x = cx + Math.cos(a)*r;
    const y = cy + Math.sin(a)*r;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
}

function RadarCanvas(props){
  const ref = useRef(null);

  useEffect(()=>{
    const canvas = ref.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");

    const vals = props.values || {PH:0, IQ:0, SP:0};

    const w = canvas.width, hhh = canvas.height;
    ctx.clearRect(0,0,w,hhh);

    const cx = w/2, cy = hhh/2 + 10;
    const radius = Math.min(w, hhh) * 0.33;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;

    for(let r=1;r<=4;r++){
      polygon(ctx, cx, cy, radius*(r/4), 3, -Math.PI/2);
      ctx.stroke();
    }

    const labels = ["PH","IQ","SP"];
    const angles = [
      -Math.PI/2,
      -Math.PI/2 + (2*Math.PI/3),
      -Math.PI/2 + (4*Math.PI/3),
    ];

    labels.forEach((lab,i)=>{
      const a = angles[i];
      const x = cx + Math.cos(a)*radius;
      const y = cy + Math.sin(a)*radius;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(x,y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.font = "16px IBM Plex Sans Arabic, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lab, cx + Math.cos(a)*(radius+26), cy + Math.sin(a)*(radius+18));
    });

    const pPH = (vals.PH||0)/100, pIQ = (vals.IQ||0)/100, pSP = (vals.SP||0)/100;
    const arr = [pPH,pIQ,pSP].map((v,i)=>{
      const a = angles[i];
      return { x: cx + Math.cos(a)*radius*v, y: cy + Math.sin(a)*radius*v };
    });

    ctx.beginPath();
    ctx.moveTo(arr[0].x, arr[0].y);
    ctx.lineTo(arr[1].x, arr[1].y);
    ctx.lineTo(arr[2].x, arr[2].y);
    ctx.closePath();

    ctx.fillStyle = "rgba(0,229,255,0.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,229,255,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(0,229,255,0.9)";
    arr.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x,p.y,4,0,Math.PI*2);
      ctx.fill();
    });

    ctx.restore();
  }, [props.values]);

  return h("div", {className:"radar-wrap"},
    h("canvas", {ref, width:520, height:420})
  );
}

function App(){
  const loaded = useMemo(()=>loadState(), []);
  const [state, setState] = useState(()=>{
    const base = {
      day: todayKeyLocal(),
      tasks: [
        { id:"t1", title:"صلاة", target:5, importance:5, type:"SP", done:0 },
        { id:"t2", title:"Push-ups", target:100, importance:4, type:"PH", done:0 },
        { id:"t3", title:"قراءة", target:30, importance:3, type:"IQ", done:0 },
      ],
      totalExp: 0,
      hp: 72,
      commitDays: 3,
      lastCommitDay: null,
      lockedUntil: null,
      lifetimeByType: { PH:0, IQ:0, SP:0 },
      lifetimePotentialByType: { PH:0, IQ:0, SP:0 },
      daysClosed: 0,
    };
    if(loaded && typeof loaded === "object") return Object.assign({}, base, loaded);
    return base;
  });

  const [countdownMs, setCountdownMs] = useState(msToMidnight());

  useEffect(()=>{ saveState(state); }, [state]);

  useEffect(()=>{
    const t = setInterval(()=> setCountdownMs(msToMidnight()), 1000);
    return ()=>clearInterval(t);
  }, []);

  function computeToday(tasks){
    const totals = {
      done: 0, target: 0, exp: 0,
      byType: {PH:0, IQ:0, SP:0},
      byTypePotential: {PH:0, IQ:0, SP:0},
    };
    for(const tt of tasks){
      const effDone = clamp(tt.done, 0, tt.target);
      totals.done += effDone;
      totals.target += tt.target;
      const mul = TYPE_META[tt.type].multiplier;
      const gain = effDone * tt.importance * mul;
      totals.exp += gain;
      totals.byType[tt.type] += gain;
      totals.byTypePotential[tt.type] += tt.target * tt.importance * mul;
    }
    const completion = totals.target > 0 ? totals.done/totals.target : 0;
    return Object.assign({}, totals, {completion});
  }

  const computed = useMemo(()=>computeToday(state.tasks), [state.tasks]);
  const quote = useMemo(()=>randomQuote(state.day), [state.day]);
  const level = useMemo(()=>expToLevel(state.totalExp), [state.totalExp]);
  const rank = useMemo(()=>rankFromStreak(state.commitDays), [state.commitDays]);

  const isLocked = useMemo(()=>{
    if(!state.lockedUntil) return false;
    return Date.now() < state.lockedUntil;
  }, [state.lockedUntil, countdownMs]);

  const lockRemaining = useMemo(()=>{
    if(!state.lockedUntil) return null;
    const ms = state.lockedUntil - Date.now();
    if(ms <= 0) return null;
    const hh = Math.floor(ms/(1000*60*60));
    const mm = Math.floor((ms%(1000*60*60))/(1000*60));
    return {hh, mm};
  }, [state.lockedUntil, countdownMs]);

  // Auto finalize when day changes (catchup)
  useEffect(()=>{
    const t = todayKeyLocal();
    if(state.day !== t) finalizeDay();
    // eslint-disable-next-line
  }, []);

  // Auto finalize at midnight
  useEffect(()=>{
    const ms = msToMidnight();
    const to = setTimeout(()=> finalizeDay(), ms + 80);
    return ()=>clearTimeout(to);
    // eslint-disable-next-line
  }, [state.tasks, state.hp, state.totalExp, state.commitDays, state.day]);

  function updateTask(id, patch){
    setState(prev => Object.assign({}, prev, {
      tasks: prev.tasks.map(t => t.id===id ? Object.assign({}, t, patch) : t)
    }));
  }

  function removeTask(id){
    setState(prev => Object.assign({}, prev, { tasks: prev.tasks.filter(t => t.id!==id) }));
  }

  function addTask(title, target, importance, type){
    const clean = String(title||"").trim();
    if(!clean) return;
    setState(prev => Object.assign({}, prev, {
      tasks: prev.tasks.concat([{
        id:`t${Math.random().toString(16).slice(2)}`,
        title: clean,
        target: clamp(Number(target)||1, 1, 9999),
        importance: Number(importance),
        type: type,
        done: 0
      }])
    }));
  }

  function finalizeDay(){
    setState(prev=>{
      const totals = computeToday(prev.tasks);
      const completion = totals.completion;
      const expGained = Math.round(totals.exp);

      const qualifies = completion >= 0.7;
      const failHard = completion < 0.5;

      const totalExp = prev.totalExp + expGained;

      const delta = qualifies ? 6 : (failHard ? -12 : -4);
      const hp = clamp(prev.hp + delta, 0, 100);
      const lockedUntil = hp === 0 ? (Date.now() + 24*60*60*1000) : null;

      const commitDays = qualifies ? (prev.commitDays + 1) : prev.commitDays;
      const lastCommitDay = qualifies ? prev.day : prev.lastCommitDay;

      const lifetimeByType = {
        PH: prev.lifetimeByType.PH + totals.byType.PH,
        IQ: prev.lifetimeByType.IQ + totals.byType.IQ,
        SP: prev.lifetimeByType.SP + totals.byType.SP
      };
      const lifetimePotentialByType = {
        PH: prev.lifetimePotentialByType.PH + totals.byTypePotential.PH,
        IQ: prev.lifetimePotentialByType.IQ + totals.byTypePotential.IQ,
        SP: prev.lifetimePotentialByType.SP + totals.byTypePotential.SP
      };

      const day = todayKeyLocal();
      const tasks = prev.tasks.map(t => Object.assign({}, t, {done:0}));

      return Object.assign({}, prev, {
        totalExp, hp, lockedUntil,
        commitDays, lastCommitDay,
        lifetimeByType, lifetimePotentialByType,
        daysClosed: (prev.daysClosed||0) + 1,
        day, tasks
      });
    });
  }

  const radarAllTime = useMemo(()=>{
    const g = state.lifetimeByType;
    const p = state.lifetimePotentialByType;
    const ph = p.PH>0 ? g.PH/p.PH : 0;
    const iq = p.IQ>0 ? g.IQ/p.IQ : 0;
    const sp = p.SP>0 ? g.SP/p.SP : 0;
    return { PH: Math.round(ph*100), IQ: Math.round(iq*100), SP: Math.round(sp*100) };
  }, [state.lifetimeByType, state.lifetimePotentialByType]);

  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(10);
  const [newImportance, setNewImportance] = useState(3);
  const [newType, setNewType] = useState("PH");

  return h("div", {className:"rise-bg"},
    h("div", {className:"wrap"},
      h("header", {className:"header"},
        h("div", {className:"hero-glow"}),
        h("div", {className:"top-row"},
          h("div", null,
            h("div", {className:"badge"},
              h("span", {className:"dot"}),
              h("span", {className:"brand-name"}, "RISE SYSTEM™"),
              h("span", {className:"brand-sub"}, "Personal Evolution")
            ),
            h("h1", {className:"title"}, "طوّر شخصيتك… مثل الأنمي"),
            h("p", {className:"subtitle"}, "مهام يومية، EXP عادلة، Radar بإحصائيات كلية، واليوم يغلق تلقائيًا عند 00:00."),
            h("div", {className:"chips"},
              h("div", {className:"chip"}, h("span", null, "اليوم:"), h("span", {className:"chip-mono"}, state.day)),
              state.lastCommitDay ? h("div", {className:"chip"}, h("span", null, "آخر يوم محسوب:"), h("span", {className:"chip-mono"}, state.lastCommitDay)) : null
            ),
            h("div", {className:"countdown"},
              h("div", {className:"muted"}, "الحفظ التلقائي بعد:"),
              h("div", {className:"mono"}, formatCountdown(countdownMs))
            )
          ),
          h("div", {className:"stats"},
            h("div", {className:"stat stat-hp"},
              h("div", {className:"stat-k"}, "HP"),
              h("div", {className:"stat-v"}, `${state.hp}/100`),
              h("div", {className:"stat-s"}, state.hp===0 ? "قفل 24 ساعة" : (state.hp>=70 ? "مستقر" : "خطر"))
            ),
            h("div", {className:"stat stat-level"},
              h("div", {className:"stat-k"}, "LEVEL"),
              h("div", {className:"stat-v"}, String(level.level)),
              h("div", {className:"stat-s"}, `${level.expIntoLevel}/${level.expForNext} EXP`)
            ),
            h("div", {className:"stat stat-rank"},
              h("div", {className:"stat-k"}, "RANK"),
              h("div", {className:"stat-v"}, rank.label),
              h("div", {className:"stat-s"}, `${state.commitDays} يوم التزام`)
            )
          )
        ),
        isLocked ? h("div", {className:"locked"},
          h("div", {className:"locked-row"},
            h("div", null, "تم قفل الدخول مؤقتًا بسبب HP = 0."),
            h("div", {className:"mono"}, lockRemaining ? `متبقي ${lockRemaining.hh}h ${lockRemaining.mm}m` : "...")
          )
        ) : null
      ),

      h("main", {className:"main"},
        h("section", {className:"left"},
          h("div", {className:"card"},
            h("div", {className:"card-row"},
              h("div", null,
                h("div", {className:"label"}, "QUOTE OF THE DAY"),
                h("div", {className:"quote"}, `“${quote}”`),
                h("div", {className:"muted", style:{marginTop:8}}, "لا يوجد زر تثبيت — اليوم يُغلق تلقائيًا عند 00:00.")
              ),
              h("button", {className:"btn btn-ghost", disabled:isLocked, onClick:()=>setState(p=>Object.assign({},p,{day:todayKeyLocal()}))}, "تحديث اليوم")
            )
          ),

          h("div", {className:"card"},
            h("div", {className:"progress-row"},
              h("div", null,
                h("div", {className:"label"}, "TODAY PROGRESS"),
                h("div", {className:"big"}, `${pct(computed.completion)}%`),
                h("div", {className:"muted"}, `EXP اليوم: +${Math.round(computed.exp)} • done × importance × multiplier`)
              ),
              h("div", {className:"progress-side"},
                h("div", {className:"bar"}, h("div", {className:"fill", style:{width:`${pct(computed.completion)}%`}})),
                h("div", {className:"tiny", style:{marginTop:8}},
                  h("span", null, "≥ 70% يزيد HP + يُحسب اليوم"),
                  h("span", null, "< 50% ينقص HP بقوة")
                )
              )
            ),

            h("div", {className:"task-list"},
              state.tasks.map(t=>{
                const meta = TYPE_META[t.type];
                const effDone = clamp(t.done, 0, t.target);
                const gain = effDone * t.importance * meta.multiplier;
                const itemPct = t.target>0 ? (effDone/t.target)*100 : 0;
                const typeClass = t.type==="PH" ? "ph" : (t.type==="IQ" ? "iq" : "sp");
                return h("div", {className:"task", key:t.id},
                  h("div", {className:"task-top"},
                    h("div", {style:{minWidth:0}},
                      h("div", {style:{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}},
                        h("span", {className:`tag ${typeClass}`}, t.type),
                        h("div", {className:"task-title", title:t.title}, t.title)
                      ),
                      h("div", {className:"task-meta"},
                        h("span", null, `Target: ${t.target}`),
                        h("span", null, `Importance: ${t.importance}/5`),
                        h("span", null, `× ${format2(meta.multiplier)}`),
                        h("span", {style:{opacity:.35}}, "|"),
                        h("span", null, `GAIN: ${Math.round(gain)} EXP`)
                      )
                    ),
                    h("div", {className:"task-controls"},
                      h("div", {className:"bar", style:{width:160}}, h("div", {className:"fill", style:{width:`${itemPct}%`}})),
                      h("input", {
                        className:"input small",
                        type:"number",
                        min:0,
                        step:1,
                        value:t.done,
                        disabled:isLocked,
                        onChange:(e)=>updateTask(t.id, {done: clamp(Number(e.target.value||0), 0, 999999)})
                      }),
                      h("button", {className:"btn", disabled:isLocked, onClick:()=>removeTask(t.id), title:"Remove"}, "✕")
                    )
                  )
                );
              })
            )
          ),

          h("div", {className:"card"},
            h("div", {className:"label"}, "ADD TASK"),
            h("div", {className:"section-title"}, "مهمة جديدة"),
            h("div", {className:"muted"}, "حدّد Target وImportance وType ثم ابدأ اللعب."),
            h("div", {className:"add-grid"},
              h("input", {className:"input", value:newTitle, disabled:isLocked, placeholder:"مثال: دراسة / قرآن / جري", onChange:(e)=>setNewTitle(e.target.value)}),
              h("input", {className:"input", type:"number", min:1, value:newTarget, disabled:isLocked, onChange:(e)=>setNewTarget(Number(e.target.value||1))}),
              h("select", {className:"input", value:String(newImportance), disabled:isLocked, onChange:(e)=>setNewImportance(Number(e.target.value))},
                [1,2,3,4,5].map(v=>h("option",{key:v,value:String(v)},String(v)))
              ),
              h("select", {className:"input", value:newType, disabled:isLocked, onChange:(e)=>setNewType(e.target.value)},
                ["PH","IQ","SP"].map(v=>h("option",{key:v,value:v},v))
              ),
              h("button", {className:"btn btn-green", disabled:isLocked, onClick:()=>{
                addTask(newTitle, newTarget, newImportance, newType);
                setNewTitle(""); setNewTarget(10); setNewImportance(3); setNewType("PH");
              }}, "+")
            ),
            h("div", {className:"tiny muted", style:{marginTop:10}}, "Multipliers: PH ×2.0 — IQ ×1.7 — SP ×1.5")
          )
        ),

        h("aside", {className:"right"},
          h("div", {className:"card"},
            h("div", {className:"label"}, "RADAR"),
            h("div", {className:"section-title"}, "إحصائياتك الكلية"),
            h("div", {className:"muted"}, "الرادار هنا يحسب على كامل الأيام (All-time)."),
            h(RadarCanvas, {values: radarAllTime}),
            h("div", {className:"mini-stats"},
              h("div", {className:"mini"},
                h("div", {className:"mini-v"}, radarAllTime.PH, h("span", null, "%")),
                h("div", {className:"mini-l"}, TYPE_META.PH.label)
              ),
              h("div", {className:"mini"},
                h("div", {className:"mini-v"}, radarAllTime.IQ, h("span", null, "%")),
                h("div", {className:"mini-l"}, TYPE_META.IQ.label)
              ),
              h("div", {className:"mini"},
                h("div", {className:"mini-v"}, radarAllTime.SP, h("span", null, "%")),
                h("div", {className:"mini-l"}, TYPE_META.SP.label)
              )
            ),
            h("div", {className:"muted", style:{marginTop:10}}, "أيام مغلقة: ", h("span", {className:"mono"}, String(state.daysClosed||0)))
          ),

          h("div", {className:"card"},
            h("div", {className:"label"}, "SYSTEM NOTES"),
            h("div", {className:"note"}, "الحفظ يتم تلقائيًا عند 00:00."),
            h("div", {className:"note"}, "EXP = done × importance × multiplier."),
            h("div", {className:"note"}, "اليوم يُحسب للـRANK فقط إذا وصلت ≥ 70%."),
            h("div", {className:"note"}, "إذا HP صار 0 → قفل 24 ساعة.")
          )
        )
      ),

      h("footer", {className:"footer"},
        h("div", null, "هذا نموذج — مع حفظ دائم (LocalStorage)."),
        h("div", null, "RISE SYSTEM™ — Solo Leveling vibes, لكن بالواقع.")
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
