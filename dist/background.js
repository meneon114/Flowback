(function(){"use strict";const V={IDLE:["TASK_STARTED","WORKING"],TASK_STARTED:["WORKING","FINISHED","ARCHIVED"],WORKING:["FINISHED","ARCHIVED"],FINISHED:["NOTIFIED","USER_RETURNED","ARCHIVED"],NOTIFIED:["USER_RETURNED","ARCHIVED"],USER_RETURNED:["ARCHIVED"],ARCHIVED:[]};function q(e,o){if(e===o)return!0;const t=V[e];return t?t.includes(o):!1}function S(e,o){return q(e,o)?o:(console.warn(`Invalid state transition attempted: ${e} -> ${o}`),e)}const T="flowback_tasks";async function u(){return new Promise(e=>{chrome.storage.local.get([T],o=>{e(o[T]||[])})})}async function w(e){return new Promise(o=>{chrome.storage.local.set({[T]:e},()=>{o()})})}async function R(e,o){const t=await u(),a=t.find(i=>i.tabId===e&&i.platform===o&&i.state==="WORKING");if(a)return a;const n=Date.now(),s=`${e}_${o}_${n}`,r=t.map(i=>i.tabId===e&&i.platform===o&&i.state==="WORKING"?{...i,state:"ARCHIVED"}:i),c={id:s,tabId:e,platform:o,state:"WORKING",startedAt:n,notified:!1};return r.push(c),await w(r),c}async function A(e,o){const t=await u();let a=null,n=!1;const s=t.map(r=>{if(r.tabId===e&&r.platform===o&&r.state==="WORKING"){const c=Date.now();return c-r.startedAt<5e3?(n=!0,a={...r,state:"ARCHIVED",completedAt:c}):a={...r,state:S(r.state,"FINISHED"),completedAt:c},a}return r});return a&&await w(s),n?null:a}async function y(e,o){const t=await u();let a=null;const n=t.map(s=>s.id===e?(a={...s,state:S(s.state,o),notified:o==="NOTIFIED"?!0:s.notified},a):s);return a&&await w(n),a}async function W(e){const t=(await u()).map(a=>a.id===e?{...a,state:"ARCHIVED"}:a);await w(t)}async function N(){await w([])}function D(e,o){y(e.id,"NOTIFIED"),chrome.storage.local.get(["flowback_sound","flowback_volume","flowback_theme"],t=>{const a=t.flowback_sound||"chime",n=typeof t.flowback_volume=="number"?t.flowback_volume:.5,s=t.flowback_theme||"cyberpunk";chrome.tabs.query({active:!0,currentWindow:!0},r=>{const c=r[0];c&&c.id!==void 0&&c.url&&(c.url.startsWith("chrome://")||c.url.startsWith("chrome-extension://")||c.url.startsWith("edge://")||c.url.startsWith("about:")||(chrome.scripting.executeScript({target:{tabId:c.id},func:B,args:[a,n]},()=>{const l=chrome.runtime.lastError;l&&console.warn("[Flowback SW] Sound playback injection failed:",l.message)}),chrome.scripting.executeScript({target:{tabId:c.id},func:H,args:[s]},()=>{const l=chrome.runtime.lastError;l&&console.warn("[Flowback SW] Screen overlay injection failed:",l.message)})))})})}function B(e,o){try{const t=new(window.AudioContext||window.webkitAudioContext),a=(s,r,c,i="sine",l=1)=>{const d=t.createOscillator(),m=t.createGain();d.type=i,d.frequency.setValueAtTime(s,r);const x=.15*o*l;m.gain.setValueAtTime(0,r),m.gain.linearRampToValueAtTime(x,r+.04),m.gain.exponentialRampToValueAtTime(1e-4,r+c),d.connect(m),m.connect(t.destination),d.start(r),d.stop(r+c)},n=t.currentTime;if(e==="chime")a(523.25,n,.45),a(659.25,n+.08,.5),a(783.99,n+.16,.55),a(1046.5,n+.24,.65);else if(e==="retro")a(987.77,n,.08,"triangle"),a(1318.51,n+.08,.25,"square",.5);else if(e==="bell")a(440,n,1.5,"sine",1),a(880,n,1.2,"sine",.5),a(1320,n,.8,"sine",.2);else if(e==="success")a(523.25,n,.6,"sine",.5),a(659.25,n,.6,"sine",.5),a(783.99,n,.6,"sine",.5),a(1046.5,n+.1,.8,"sine",.5);else if(e==="breeze")a(659.25,n,.8,"sine",.5),a(880,n+.15,.8,"sine",.5),a(987.77,n+.3,.8,"sine",.5),a(1318.51,n+.45,1,"sine",.5);else if(e==="laser"){const s=t.createOscillator(),r=t.createGain();s.type="sawtooth",s.frequency.setValueAtTime(880,n),s.frequency.exponentialRampToValueAtTime(110,n+.35);const c=.12*o;r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(c,n+.02),r.gain.exponentialRampToValueAtTime(1e-4,n+.35),s.connect(r),r.connect(t.destination),s.start(n),s.stop(n+.35)}else if(e==="synthwave"){const s=(r,c=1)=>{const i=t.createOscillator(),l=t.createOscillator(),d=t.createGain();i.type="sawtooth",i.frequency.setValueAtTime(r-1.5,n),l.type="sawtooth",l.frequency.setValueAtTime(r+1.5,n);const m=.08*o*c;d.gain.setValueAtTime(0,n),d.gain.linearRampToValueAtTime(m,n+.1),d.gain.exponentialRampToValueAtTime(1e-4,n+1.2),i.connect(d),l.connect(d),d.connect(t.destination),i.start(n),l.start(n),i.stop(n+1.2),l.stop(n+1.2)};s(146.83,1),s(220,.8),s(261.63,.8),s(349.23,.7)}else e==="crystal"&&(a(1318.51,n,.35,"sine",.6),a(1567.98,n+.08,.35,"sine",.5),a(1975.53,n+.16,.35,"sine",.4),a(2637.02,n+.24,.5,"sine",.3))}catch(t){console.warn("[Flowback Chime] Sound playback failed:",t)}}function H(e){if(document.getElementById("flowback-overlay-host"))return;const o={cyberpunk:{bg:"#0f0b21",text:"#e9d5ff",border:"#4c1d95",cardBg:"#150d3c",accent:"#10b981",title:"#ffffff",shadow:"rgba(139, 92, 246, 0.35)"},indigo:{bg:"#0a0f1d",text:"#cbd5e1",border:"#1e3a8a",cardBg:"#111827",accent:"#06b6d4",title:"#38bdf8",shadow:"rgba(6, 182, 212, 0.35)"},emerald:{bg:"#061c15",text:"#d1fae5",border:"#064e3b",cardBg:"#062f21",accent:"#10b981",title:"#6ee7b7",shadow:"rgba(16, 185, 129, 0.35)"},sunset:{bg:"#1c0a10",text:"#fce7f3",border:"#881337",cardBg:"#31101d",accent:"#f59e0b",title:"#fda4af",shadow:"rgba(244, 63, 94, 0.35)"},terminal:{bg:"#000000",text:"#f97316",border:"#ea580c",cardBg:"#110b06",accent:"#f97316",title:"#fdba74",shadow:"rgba(234, 88, 12, 0.35)"},ocean:{bg:"#02182b",text:"#e2e8f0",border:"#004e64",cardBg:"#003547",accent:"#00b4d8",title:"#90e0ef",shadow:"rgba(0, 180, 216, 0.35)"},solarized:{bg:"#fdf6e3",text:"#657b83",border:"#93a1a1",cardBg:"#eee8d5",accent:"#b58900",title:"#586e75",shadow:"rgba(147, 161, 161, 0.35)"},dracula:{bg:"#282a36",text:"#f8f8f2",border:"#44475a",cardBg:"#1e1f29",accent:"#50fa7b",title:"#ff79c6",shadow:"rgba(255, 121, 198, 0.35)"}},t=o[e]||o.cyberpunk,a=document.createElement("div");a.id="flowback-overlay-host",document.body.appendChild(a);const n=a.attachShadow({mode:"closed"}),s=document.createElement("style");s.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

    .overlay-container {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(15, 11, 33, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 2147483647;
      font-family: 'Space Mono', monospace;
      animation: flowbackFadeIn 0.2s ease-out;
      color: ${t.text};
    }

    .modal-card {
      width: 300px;
      padding: 24px;
      background: ${t.bg};
      border: 2px solid ${t.border};
      box-shadow: 4px 4px 0px 0px ${t.shadow};
      text-align: center;
      animation: flowbackScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0 0 16px 0;
      color: ${t.title};
      border-bottom: 1px solid ${t.border};
      padding-bottom: 8px;
    }

    .subtitle {
      font-size: 9px;
      color: ${t.accent};
      text-transform: uppercase;
      margin-bottom: 16px;
      letter-spacing: 1.5px;
      font-weight: 700;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      max-height: 180px;
      overflow-y: auto;
    }

    .btn-link {
      display: block;
      width: 100%;
      padding: 9px 12px;
      background: ${t.cardBg};
      color: ${t.text};
      border: 1px solid ${t.border};
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
      text-align: left;
      transition: all 0.1s ease;
    }

    .btn-link:hover {
      background: ${t.accent};
      color: ${t.bg};
      border-color: ${t.accent};
    }

    .btn-dismiss-all {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      background: transparent;
      color: ${t.accent};
      border: none;
      cursor: pointer;
      text-decoration: underline;
      outline: none;
    }

    .btn-dismiss-all:hover {
      color: #f43f5e;
    }

    @keyframes flowbackFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes flowbackScaleIn {
      from { transform: scale(0.97); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,n.appendChild(s);const r=document.createElement("div");r.className="overlay-container";const c=document.createElement("div");c.className="modal-card";const i=document.createElement("div");i.className="title",i.textContent="Flowback",c.appendChild(i);const l=document.createElement("div");l.className="subtitle",l.textContent="Completed Streams",c.appendChild(l);const d=document.createElement("div");d.className="task-list",c.appendChild(d);const m=document.createElement("button");m.className="btn-dismiss-all",m.textContent="[ Dismiss All ]",c.appendChild(m),r.appendChild(c),n.appendChild(r);const x=h=>{d.innerHTML="",h.forEach(k=>{const g=document.createElement("button");g.className="btn-link",g.textContent=`• Return to ${k.platform.toUpperCase()}`,g.onclick=()=>{try{const p=chrome.runtime.sendMessage({type:"RETURN_TO_TAB",payload:{taskId:k.id}});p&&typeof p.catch=="function"&&p.catch(()=>{})}catch{}},d.appendChild(g)})},F=()=>{chrome.storage.local.get(["flowback_tasks"],h=>{const g=(h.flowback_tasks||[]).filter(p=>p.state==="FINISHED"||p.state==="NOTIFIED");if(g.length===0){K();return}x(g)})};m.onclick=()=>{chrome.storage.local.get(["flowback_tasks"],h=>{(h.flowback_tasks||[]).filter(p=>p.state==="FINISHED"||p.state==="NOTIFIED").forEach(p=>{try{const I=chrome.runtime.sendMessage({type:"DISMISS_TASK",payload:{taskId:p.id}});I&&typeof I.catch=="function"&&I.catch(()=>{})}catch{}})})};const O=(h,k)=>{k==="local"&&h.flowback_tasks&&F()},K=()=>{try{chrome.storage.onChanged.removeListener(O)}catch{}a.remove()};chrome.storage.onChanged.addListener(O),F()}async function U(e){return new Promise(o=>{chrome.tabs.get(e,t=>{if(chrome.runtime.lastError||!t){o(!1);return}if(!t.active){o(!1);return}chrome.windows.get(t.windowId,a=>{if(chrome.runtime.lastError||!a){o(!1);return}o(a.focused||!1)})})})}async function _(e,o){return o?!1:!await U(e)}async function f(){try{if((await new Promise(a=>{chrome.storage.local.get(["flowback_enabled"],n=>a(n))})).flowback_enabled===!1){chrome.action.setBadgeText({text:""});return}const t=(await u()).filter(a=>a.state==="FINISHED"||a.state==="NOTIFIED").length;t>0?(chrome.action.setBadgeText({text:t.toString()}),chrome.action.setBadgeBackgroundColor({color:"#8b5cf6"})):chrome.action.setBadgeText({text:""})}catch(e){console.error("[Flowback SW] Error updating badge:",e)}}async function b(e){try{const o=e||await u(),t=chrome.runtime.sendMessage({type:"TASKS_UPDATED",payload:o});t&&typeof t.catch=="function"&&t.catch(()=>{})}catch(o){console.error("[Flowback SW] Broadcast failed:",o)}}chrome.runtime.onMessage.addListener((e,o,t)=>{var n;const a=(n=o.tab)==null?void 0:n.id;if(e.type==="CHECK_ACTIVE_TASK")return a!==void 0?u().then(s=>{const r=s.some(c=>c.tabId===a&&c.state==="WORKING");t({hasActiveTask:r})}):t({hasActiveTask:!1}),!0;if(e.type==="TASK_STARTED")return a!==void 0&&R(a,e.payload.platform).then(async s=>{console.log("[Flowback SW] Task registered:",s.id),await f(),await b(),t({success:!0,taskId:s.id})}),!0;if(e.type==="TASK_FINISHED")return a!==void 0&&A(a,e.payload.platform).then(async s=>{s&&(console.log("[Flowback SW] Task finished:",s.id),await _(s.tabId,s.notified)?D(s):await y(s.id,"USER_RETURNED"),await f(),await b()),t({success:!0})}),!0;if(e.type==="GET_TASKS")return u().then(s=>{t(s)}),!0;if(e.type==="CLEAR_TASKS")return N().then(async()=>{await f(),await b(),t({success:!0})}),!0;if(e.type==="DISMISS_TASK")return W(e.payload.taskId).then(async()=>{await f(),await b(),t({success:!0})}),!0;if(e.type==="RETURN_TO_TAB")return u().then(s=>{const r=s.find(c=>c.id===e.payload.taskId);r?(chrome.tabs.update(r.tabId,{active:!0},c=>{if(chrome.runtime.lastError||!c){console.warn(`[Flowback SW] Tab ${r.tabId} not found.`);return}chrome.windows.update(c.windowId,{focused:!0})}),y(r.id,"USER_RETURNED").then(async()=>{await f(),await b(),t({success:!0})})):t({success:!1})}),!0}),chrome.tabs.onActivated.addListener(async e=>{const o=await u();let t=!1;const a=o.map(n=>n.tabId===e.tabId&&(n.state==="FINISHED"||n.state==="NOTIFIED")?(t=!0,{...n,state:"USER_RETURNED"}):n);t&&(await w(a),await f(),await b(a))}),chrome.windows.onFocusChanged.addListener(async e=>{e!==chrome.windows.WINDOW_ID_NONE&&chrome.tabs.query({active:!0,windowId:e},async o=>{const t=o[0];if(!t||t.id===void 0)return;const a=await u();let n=!1;const s=a.map(r=>r.tabId===t.id&&(r.state==="FINISHED"||r.state==="NOTIFIED")?(n=!0,{...r,state:"USER_RETURNED"}):r);n&&(await w(s),await f(),await b(s))})}),chrome.tabs.onRemoved.addListener(async e=>{const o=await u();let t=!1;const a=o.map(n=>n.tabId===e&&n.state!=="ARCHIVED"?(t=!0,{...n,state:"ARCHIVED"}):n);t&&(await w(a),await f(),await b(a))}),chrome.runtime.onInstalled.addListener(async()=>{console.log("[Flowback SW] Installed."),await f()}),chrome.storage.onChanged.addListener(async(e,o)=>{o==="local"&&e.flowback_enabled&&(e.flowback_enabled.newValue!==!1?await f():(chrome.action.setBadgeText({text:""}),await E({}),await N(),await b()))});async function C(){return new Promise(e=>{chrome.storage.local.get(["active_requests"],o=>{e(o.active_requests||{})})})}async function E(e){return new Promise(o=>{chrome.storage.local.set({active_requests:e},()=>{o()})})}function $(e){return e.includes("gemini.google.com")&&(e.includes("BardFrontendService")||e.includes("StreamGenerate"))?"Gemini":e.includes("claude.ai/api")&&e.includes("completion")?"Claude":e.includes("perplexity.ai/api/answer")||e.includes("perplexity.ai/api/query")?"Perplexity":e.includes("grok.com")&&(e.includes("responses")||e.includes("conversation"))?"Grok":null}chrome.webRequest.onBeforeRequest.addListener(e=>{if(e.tabId===-1||e.method!=="POST")return;const o=$(e.url);o&&chrome.storage.local.get(["flowback_enabled"],t=>{t.flowback_enabled!==!1&&(console.log(`[Flowback SW Network] Generation request started on tab ${e.tabId}. Request ID: ${e.requestId}`),R(e.tabId,o).then(async n=>{const s=await C();s[e.requestId]={taskId:n.id,tabId:e.tabId,platform:o,url:e.url},await E(s),await f(),await b(),chrome.tabs.sendMessage(e.tabId,{type:"BACKGROUND_TASK_STARTED",payload:{platform:o}},()=>{chrome.runtime.lastError})}))})},{urls:["<all_urls>"]}),chrome.webRequest.onCompleted.addListener(e=>{v(e.requestId)},{urls:["<all_urls>"]}),chrome.webRequest.onErrorOccurred.addListener(e=>{v(e.requestId)},{urls:["<all_urls>"]});async function v(e){const o=await C(),t=o[e];if(!t)return;delete o[e],await E(o),console.log(`[Flowback SW Network] Request ended for ${t.platform} on tab ${t.tabId}`);const a=await A(t.tabId,t.platform);a&&(console.log("[Flowback SW] Task completed via Network event:",a.id),await _(a.tabId,a.notified)?D(a):await y(a.id,"USER_RETURNED"),await f(),await b(),chrome.tabs.sendMessage(t.tabId,{type:"BACKGROUND_TASK_FINISHED",payload:{platform:t.platform}},()=>{chrome.runtime.lastError}))}})();
