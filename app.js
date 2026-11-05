(() => {
"use strict";

const STORAGE_KEY = "evidence_dovolene_v2";
const MONTHS = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const DAYS = ["Ne","Po","Út","St","Čt","Pá","So"];
const STATUS = {
  vacation:{label:"Dovolená",icon:"✓",cls:"status-vacation"},
  sick:{label:"Nemoc",icon:"N",cls:"status-sick"},
  business:{label:"Služební cesta",icon:"SC",cls:"status-business"},
  working:{label:"Práce",icon:"•",cls:"status-working"}
};

/* Česká sada státních a ostatních svátků. Výpočet Velkého pátku a Velikonočního pondělí je pohyblivý. */
function easterSunday(year){
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day);
}
function addDays(date,days){const d=new Date(date);d.setDate(d.getDate()+days);return d;}
function holidayMap(year){
  const map = {};
  const add=(date,name)=>map[`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`]=name;
  add(new Date(year,0,1),"Nový rok / Den obnovy samostatného českého státu");
  const easter=easterSunday(year);
  add(addDays(easter,-2),"Velký pátek");
  add(addDays(easter,1),"Velikonoční pondělí");
  add(new Date(year,4,1),"Svátek práce");
  add(new Date(year,4,8),"Den vítězství");
  add(new Date(year,6,5),"Den slovanských věrozvěstů Cyrila a Metoděje");
  add(new Date(year,6,6),"Den upálení mistra Jana Husa");
  add(new Date(year,8,28),"Den české státnosti");
  add(new Date(year,9,28),"Den vzniku samostatného československého státu");
  add(new Date(year,10,17),"Den boje za svobodu a demokracii a Mezinárodní den studentstva");
  add(new Date(year,11,24),"Štědrý den");
  add(new Date(year,11,25),"1. svátek vánoční");
  add(new Date(year,11,26),"2. svátek vánoční");
  return map;
}

let state=loadState();
let currentYear=new Date().getFullYear();
let currentMonth=new Date().getMonth();
let summaryYear=currentYear;

function defaultState(){
  const names=["Jan Novák","Petr Svoboda","Tomáš Dvořák","Martin Černý","Pavel Procházka","Lukáš Kučera","Michal Veselý","David Horák","Jakub Němec","Ondřej Pokorný"];
  return {version:2,employees:names.map((name,i)=>({id:(crypto.randomUUID?crypto.randomUUID():`emp-${Date.now()}-${i}`),name,allowance:25})),entries:{}};
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return defaultState();
    const p=JSON.parse(raw);
    if(!Array.isArray(p.employees)||typeof p.entries!=="object")return defaultState();
    return p;
  }catch{return defaultState();}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function pad(n){return String(n).padStart(2,"0")}
function keyFor(id,y,m,d){return `${id}_${y}-${pad(m+1)}-${pad(d)}`}
function getStatus(id,y,m,d){return state.entries[keyFor(id,y,m,d)]||""}
function setStatus(id,y,m,d,status){const k=keyFor(id,y,m,d);if(status)state.entries[k]=status;else delete state.entries[k];saveState()}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function isWeekend(d){return d.getDay()===0||d.getDay()===6}
function isToday(y,m,d){const t=new Date();return t.getFullYear()===y&&t.getMonth()===m&&t.getDate()===d}
function holidayName(y,m,d){return holidayMap(y)[`${y}-${pad(m+1)}-${pad(d)}`]||""}
function isWorkingDay(y,m,d){const date=new Date(y,m,d);return !isWeekend(date)&&!holidayName(y,m,d)}
function formatDate(y,m,d){return `${d}. ${m+1}. ${y}`}
function render(){renderHeader();renderCalendar();renderStats();renderSummary()}

function renderHeader(){
  document.getElementById("monthName").textContent=MONTHS[currentMonth];
  document.getElementById("yearName").textContent=currentYear;
  document.getElementById("summaryYear").textContent=summaryYear;
  document.getElementById("employeeCount").textContent=state.employees.length;
  document.getElementById("activeMonthLabel").textContent=`${MONTHS[currentMonth]} ${currentYear}`;
}

function renderCalendar(){
  const table=document.getElementById("calendarTable"),thead=table.querySelector("thead"),tbody=table.querySelector("tbody");
  thead.innerHTML="";tbody.innerHTML="";
  const total=daysInMonth(currentYear,currentMonth);
  const holidays=holidayMap(currentYear);
  const hr=document.createElement("tr");
  const nameTh=document.createElement("th");nameTh.className="name-col";nameTh.textContent="Zaměstnanec";hr.appendChild(nameTh);

  for(let day=1;day<=total;day++){
    const date=new Date(currentYear,currentMonth,day), th=document.createElement("th");
    const holiday=holidays[`${currentYear}-${pad(currentMonth+1)}-${pad(day)}`];
    if(isWeekend(date))th.classList.add("weekend-head");
    if(holiday)th.classList.add("holiday-head");
    if(isToday(currentYear,currentMonth,day))th.style.boxShadow=holiday?"inset 0 -3px 0 #c94b4b":"inset 0 -3px 0 #1f6f43";
    th.innerHTML=`<span class="day-number">${day}</span><span class="day-name">${DAYS[date.getDay()]}</span>${holiday?`<span class="holiday-label">SVÁTEK</span>`:""}`;
    th.title=holiday||"";
    hr.appendChild(th);
  }
  thead.appendChild(hr);

  state.employees.forEach(emp=>{
    const tr=document.createElement("tr");tr.className="employee-row";
    const th=document.createElement("th");
    const wrap=document.createElement("div");wrap.className="employee-name";
    const name=document.createElement("span");name.textContent=emp.name;wrap.appendChild(name);
    const actions=document.createElement("span");actions.className="employee-actions";
    const edit=document.createElement("button");edit.className="mini-btn";edit.title="Upravit";edit.textContent="✎";edit.onclick=e=>{e.stopPropagation();openEmployeeModal(emp)};
    const del=document.createElement("button");del.className="mini-btn delete";del.title="Smazat";del.textContent="×";del.onclick=e=>{e.stopPropagation();deleteEmployee(emp.id)};
    actions.append(edit,del);wrap.appendChild(actions);
    const meta=document.createElement("div");meta.className="employee-meta";meta.textContent=`Nárok ${emp.allowance} pracovních dnů`;
    th.append(wrap,meta);tr.appendChild(th);

    for(let day=1;day<=total;day++){
      const date=new Date(currentYear,currentMonth,day),td=document.createElement("td");
      td.className="day-cell";
      const holiday=holidays[`${currentYear}-${pad(currentMonth+1)}-${pad(day)}`];
      if(isWeekend(date))td.classList.add("weekend");
      if(holiday)td.classList.add("holiday");
      if(isToday(currentYear,currentMonth,day))td.classList.add("today");
      const status=getStatus(emp.id,currentYear,currentMonth,day);
      if(status&&STATUS[status]){
        const s=document.createElement("div");s.className=`status ${STATUS[status].cls}`;s.textContent=STATUS[status].icon;s.title=STATUS[status].label;
        td.appendChild(s);
      }
      td.title=holiday?`${formatDate(currentYear,currentMonth,day)} – ${holiday}`:`${emp.name} – ${formatDate(currentYear,currentMonth,day)}`;
      td.onclick=()=>openDayModal(emp,currentYear,currentMonth,day);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

function vacationDaysInRange(id,start,end){
  let count=0;
  const a=new Date(start),b=new Date(end);
  for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1)){
    if(isWorkingDay(d.getFullYear(),d.getMonth(),d.getDate())&&getStatus(id,d.getFullYear(),d.getMonth(),d.getDate())==="vacation")count++;
  }
  return count;
}
function countVacation(id,year){
  let c=0;
  for(let m=0;m<12;m++)for(let d=1;d<=daysInMonth(year,m);d++)if(isWorkingDay(year,m,d)&&getStatus(id,year,m,d)==="vacation")c++;
  return c;
}
function renderStats(){
  let month=0,today=0;
  for(const emp of state.employees)for(let d=1;d<=daysInMonth(currentYear,currentMonth);d++){
    if(isWorkingDay(currentYear,currentMonth,d)&&getStatus(emp.id,currentYear,currentMonth,d)==="vacation"){
      month++;if(isToday(currentYear,currentMonth,d))today++;
    }
  }
  document.getElementById("monthVacationCount").textContent=`${month} ${month===1?"den":month>=2&&month<=4?"dny":"dní"}`;
  document.getElementById("todayVacationCount").textContent=today;
}
function renderSummary(){
  const body=document.getElementById("summaryBody");body.innerHTML="";
  state.employees.forEach(emp=>{
    const used=countVacation(emp.id,summaryYear);
    const remaining=emp.allowance-used;
    const percent=emp.allowance>0?Math.min(100,Math.round(used/emp.allowance*100)):0;
    const tr=document.createElement("tr");
    tr.innerHTML=`<td><strong>${escapeHtml(emp.name)}</strong></td><td>${emp.allowance}</td><td>${used}</td><td>${used}</td><td class="${remaining<0?"remaining-negative":remaining===0?"remaining-zero":"remaining-good"}">${remaining}</td><td><div class="progress" title="${percent}%"><div style="width:${percent}%"></div></div></td>`;
    body.appendChild(tr);
  });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function openDayModal(emp,y,m,d){
  const modal=document.getElementById("dayModal"),content=document.getElementById("dayModalContent"),current=getStatus(emp.id,y,m,d),holiday=holidayName(y,m,d);
  content.innerHTML=`<div class="day-date">${formatDate(y,m,d)}${holiday?` · <strong>${escapeHtml(holiday)}</strong>`:""}</div>
  <div class="day-employee">${escapeHtml(emp.name)}</div>
  <div class="status-options">
  ${Object.entries(STATUS).map(([k,s])=>`<button class="status-option ${current===k?"active":""}" data-status="${k}">${s.icon} ${s.label}<span class="sub">${k==="vacation"?"Čerpání dovolené":k==="sick"?"Pracovní neschopnost":k==="business"?"Pracovní cesta":"Běžný pracovní den"}</span></button>`).join("")}
  <button class="status-option ${!current?"active":""}" data-status="">○ Bez záznamu<span class="sub">Odstranit označení</span></button></div>`;
  content.querySelectorAll("[data-status]").forEach(btn=>btn.onclick=()=>{setStatus(emp.id,y,m,d,btn.dataset.status);closeModal("dayModal");render()});
  modal.classList.remove("hidden");
}
function openEmployeeModal(emp=null){
  document.getElementById("employeeModalTitle").textContent=emp?"Upravit zaměstnance":"Přidat zaměstnance";
  document.getElementById("employeeId").value=emp?emp.id:"";
  document.getElementById("employeeName").value=emp?emp.name:"";
  document.getElementById("employeeAllowance").value=emp?emp.allowance:25;
  document.getElementById("employeeModal").classList.remove("hidden");
  setTimeout(()=>document.getElementById("employeeName").focus(),50);
}
function saveEmployee(e){
  e.preventDefault();
  const id=document.getElementById("employeeId").value,name=document.getElementById("employeeName").value.trim(),allowance=Number(document.getElementById("employeeAllowance").value);
  if(!name)return;
  if(id){const emp=state.employees.find(x=>x.id===id);if(emp){emp.name=name;emp.allowance=allowance}}
  else state.employees.push({id:crypto.randomUUID?crypto.randomUUID():`emp-${Date.now()}`,name,allowance});
  saveState();closeModal("employeeModal");render();
}
function deleteEmployee(id){
  const emp=state.employees.find(x=>x.id===id);if(!emp)return;
  if(!confirm(`Opravdu chcete smazat zaměstnance „${emp.name}“?`))return;
  state.employees=state.employees.filter(x=>x.id!==id);
  Object.keys(state.entries).forEach(k=>{if(k.startsWith(id+"_"))delete state.entries[k]});
  saveState();render();
}
function closeModal(id){document.getElementById(id).classList.add("hidden")}
function changeMonth(delta){
  currentMonth+=delta;if(currentMonth<0){currentMonth=11;currentYear--}if(currentMonth>11){currentMonth=0;currentYear++}render();
}
function goToday(){const d=new Date();currentYear=d.getFullYear();currentMonth=d.getMonth();summaryYear=d.getFullYear();render()}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`dovolena-zaloha-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
}
function importData(file){
  const r=new FileReader();r.onload=e=>{try{const p=JSON.parse(e.target.result);if(!Array.isArray(p.employees)||typeof p.entries!=="object")throw 0;state=p;saveState();render();closeModal("settingsModal");alert("Data byla úspěšně importována.")}catch{alert("Soubor není platná záloha této aplikace.")}};r.readAsText(file);
}

document.getElementById("prevMonth").onclick=()=>changeMonth(-1);
document.getElementById("nextMonth").onclick=()=>changeMonth(1);
document.getElementById("todayBtn").onclick=goToday;
document.getElementById("printBtn").onclick=()=>window.print();
document.getElementById("addEmployeeBtn").onclick=()=>openEmployeeModal();
document.getElementById("settingsBtn").onclick=()=>document.getElementById("settingsModal").classList.remove("hidden");
document.getElementById("employeeForm").addEventListener("submit",saveEmployee);
document.getElementById("prevYear").onclick=()=>{summaryYear--;renderSummary();document.getElementById("summaryYear").textContent=summaryYear};
document.getElementById("nextYear").onclick=()=>{summaryYear++;renderSummary();document.getElementById("summaryYear").textContent=summaryYear};
document.getElementById("exportBtn").onclick=exportData;
document.getElementById("importFile").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value=""};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Opravdu chcete smazat všechny záznamy a obnovit výchozí data?")){state=defaultState();saveState();goToday();closeModal("settingsModal")}};
document.querySelectorAll("[data-close]").forEach(el=>el.onclick=()=>closeModal(el.dataset.close));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal:not(.hidden)").forEach(m=>m.classList.add("hidden"));if(e.key==="ArrowLeft"&&!e.ctrlKey&&!e.altKey)changeMonth(-1);if(e.key==="ArrowRight"&&!e.ctrlKey&&!e.altKey)changeMonth(1)});
render();
})();
