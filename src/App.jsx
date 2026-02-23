import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./App.css";

const SUPABASE_URL = "https://gjxlxtgstjaejzopyabn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGx4dGdzdGphZWp6b3B5YWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY1NjYsImV4cCI6MjA4NzQzMjU2Nn0.2JUYuwhqGzQ4q2Oj5kyQTETHk-d4SmJ9ti45G5BE1k0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer", "Crypto"];
const CHART_COLORS = ["#6366f1","#f97316","#22c55e","#ec4899","#06b6d4","#eab308","#ef4444","#8b5cf6","#14b8a6","#a855f7"];

const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const groupByMonth = (txs) => {
  const map = {};
  txs.forEach((t) => {
    const key = t.date.substring(0,7);
    if(!map[key]) map[key]={month:key,income:0,expense:0};
    if(t.type==="income") map[key].income+=t.amount;
    else map[key].expense+=t.amount;
  });
  return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)).slice(-6);
};

const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{fontWeight:600,marginBottom:6}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color,fontSize:13}}>{p.name}: {fmt(p.value)}</div>)}
    </div>
  );
};

function AuthPage({onAuth}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const handle=async()=>{
    setLoading(true);setError("");
    try {
      if(mode==="login"){
        const {data,error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        onAuth(data.user);
      } else {
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(error) throw error;
        if(data.user) onAuth(data.user);
      }
    } catch(e){setError(e.message);}
    setLoading(false);
  };
  return (
    <div className="auth-page">
      <div className="glass auth-card">
        <div className="logo">💸 Spendly</div>
        <div className="logo-sub">Your intelligent expense companion</div>
        {mode==="signup"&&<div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="John Doe" value={name} onChange={e=>setName(e.target.value)}/></div>}
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
        {error&&<div style={{color:"var(--danger)",fontSize:13,marginBottom:16,background:"rgba(239,68,68,0.1)",padding:"10px 14px",borderRadius:8}}>{error}</div>}
        <button className="btn btn-primary" onClick={handle} disabled={loading} style={{marginBottom:16}}>
          {loading?<span className="typing"><span/><span/><span/></span>:mode==="login"?"Sign In":"Create Account"}
        </button>
        <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>
          {mode==="login"?"No account? ":"Have an account? "}
          <span style={{color:"#818cf8",cursor:"pointer",fontWeight:600}} onClick={()=>setMode(mode==="login"?"signup":"login")}>
            {mode==="login"?"Sign up free":"Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

function AddTxModal({onClose,onSave,categories,editTx}) {
  const [type,setType]=useState(editTx?.type||"expense");
  const [amount,setAmount]=useState(editTx?.amount||"");
  const [title,setTitle]=useState(editTx?.title||"");
  const [notes,setNotes]=useState(editTx?.notes||"");
  const [date,setDate]=useState(editTx?.date||new Date().toISOString().substring(0,10));
  const [catId,setCatId]=useState(editTx?.category_id||"");
  const [payment,setPayment]=useState(editTx?.payment_method||"Cash");
  const [saving,setSaving]=useState(false);
  const incomeNames=["Salary","Freelance","Investment"];
  const filtered=categories.filter(c=>type==="income"?incomeNames.includes(c.name):!incomeNames.includes(c.name));
  const save=async()=>{
    if(!title||!amount||!catId) return;
    setSaving(true);
    await onSave({type,amount:parseFloat(amount),title,notes,date,category_id:catId,payment_method:payment});
    setSaving(false);onClose();
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="glass modal">
        <div className="modal-title">{editTx?"Edit":"New"} Transaction</div>
        <div className="type-toggle">
          <button className={`btn btn-expense ${type==="expense"?"active":""}`} onClick={()=>setType("expense")}>💸 Expense</button>
          <button className={`btn btn-income ${type==="income"?"active":""}`} onClick={()=>setType("income")}>💰 Income</button>
        </div>
        <div className="row">
          <div className="form-group"><label className="form-label">Amount ($)</label><input className="form-input" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        </div>
        <div className="form-group"><label className="form-label">Title</label><input className="form-input" placeholder="Transaction name" value={title} onChange={e=>setTitle(e.target.value)}/></div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="cat-grid">
            {filtered.map(c=><div key={c.id} className={`cat-chip ${catId===c.id?"selected":""}`} onClick={()=>setCatId(c.id)}><span className="cat-chip-icon">{c.icon}</span><span>{c.name}</span></div>)}
          </div>
        </div>
        <div className="form-group" style={{marginTop:12}}><label className="form-label">Payment Method</label><select className="form-input" value={payment} onChange={e=>setPayment(e.target.value)}>{PAYMENT_METHODS.map(p=><option key={p}>{p}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Notes (optional)</label><input className="form-input" placeholder="Add notes..." value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        <div className="row" style={{marginTop:8}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving||!title||!amount||!catId}>{saving?"Saving...":"Save Transaction"}</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({transactions,categories,onAdd}) {
  const now=new Date();
  const thisMonth=transactions.filter(t=>t.date.startsWith(now.toISOString().substring(0,7)));
  const totalIncome=thisMonth.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=thisMonth.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance=totalIncome-totalExpense;
  const catSpend=useMemo(()=>{
    const map={};
    transactions.filter(t=>t.type==="expense").forEach(t=>{
      const c=categories.find(c=>c.id===t.category_id);
      const name=c?.name||"Other";const icon=c?.icon||"📦";
      if(!map[name]) map[name]={name,icon,value:0};
      map[name].value+=t.amount;
    });
    return Object.values(map).sort((a,b)=>b.value-a.value).slice(0,8);
  },[transactions,categories]);
  const monthlyData=useMemo(()=>groupByMonth(transactions),[transactions]);
  const recent=transactions.slice(0,8);
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Dashboard</div><div className="page-sub">{now.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div></div>
        <button className="btn btn-primary" style={{width:"auto"}} onClick={onAdd}>+ Add Transaction</button>
      </div>
      <div className="stats-grid">
        {[
          {label:"Net Balance",value:fmt(balance),cls:balance>=0?"positive":"negative",icon:"💎"},
          {label:"Total Income",value:fmt(totalIncome),cls:"positive",icon:"📈"},
          {label:"Total Expenses",value:fmt(totalExpense),cls:"negative",icon:"📉"},
          {label:"Transactions",value:thisMonth.length,icon:"📋"},
        ].map((s,i)=>(
          <div key={i} className="glass stat-card fade-in">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls||""}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="glass chart-card">
          <div className="chart-title">Income vs Expenses</div>
          <div className="chart-sub">Last 6 months overview</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="month" stroke="#475569" tick={{fontSize:11}}/>
              <YAxis stroke="#475569" tick={{fontSize:11}} tickFormatter={v=>`$${v>=1000?(v/1000).toFixed(1)+"k":v}`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" fill="url(#gIncome)" strokeWidth={2}/>
              <Area type="monotone" dataKey="expense" name="Expenses" stroke="#f97316" fill="url(#gExpense)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass chart-card">
          <div className="chart-title">By Category</div>
          <div className="chart-sub">All-time spending</div>
          {catSpend.length?(
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={catSpend} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{catSpend.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                {catSpend.slice(0,4).map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                    <span style={{width:10,height:10,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                    <span style={{flex:1,color:"var(--muted)"}}>{c.icon} {c.name}</span>
                    <span style={{fontWeight:600}}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ):<div className="empty"><div className="empty-icon">📊</div><div className="empty-sub">No data yet</div></div>}
        </div>
      </div>
      <div className="glass chart-card" style={{marginBottom:24}}>
        <div className="chart-title">Recent Transactions</div>
        <div className="chart-sub">Latest activity</div>
        {recent.length?(
          <div className="tx-list">
            {recent.map(t=>{
              const cat=categories.find(c=>c.id===t.category_id);
              return (
                <div key={t.id} className="tx-item">
                  <div className="tx-icon" style={{background:cat?.color?cat.color+"22":"rgba(99,102,241,0.1)"}}>{cat?.icon||"💰"}</div>
                  <div className="tx-details"><div className="tx-title">{t.title}</div><div className="tx-meta">{cat?.name} · {fmtDate(t.date)} · {t.payment_method}</div></div>
                  <div className={`tx-amount ${t.type==="income"?"positive":"negative"}`}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</div>
                </div>
              );
            })}
          </div>
        ):<div className="empty"><div className="empty-icon">💸</div><div className="empty-text">No transactions yet</div><div className="empty-sub">Add your first transaction above</div></div>}
      </div>
    </div>
  );
}

function TransactionsPage({transactions,categories,onAdd,onDelete,onEdit}) {
  const [search,setSearch]=useState("");
  const [filterType,setFilterType]=useState("all");
  const [filterMonth,setFilterMonth]=useState("all");
  const months=[...new Set(transactions.map(t=>t.date.substring(0,7)))].sort().reverse();
  const filtered=transactions.filter(t=>{
    if(filterType!=="all"&&t.type!==filterType) return false;
    if(filterMonth!=="all"&&!t.date.startsWith(filterMonth)) return false;
    if(search){const s=search.toLowerCase();const cat=categories.find(c=>c.id===t.category_id);return t.title.toLowerCase().includes(s)||(cat?.name||"").toLowerCase().includes(s)||(t.notes||"").toLowerCase().includes(s);}
    return true;
  });
  const totalFiltered=filtered.reduce((s,t)=>t.type==="income"?s+t.amount:s-t.amount,0);
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Transactions</div><div className="page-sub">{filtered.length} records · Net {fmt(totalFiltered)}</div></div>
        <button className="btn btn-primary" style={{width:"auto"}} onClick={onAdd}>+ Add</button>
      </div>
      <div className="filter-bar">
        <input className="form-input" style={{width:200,padding:"8px 14px",fontSize:13}} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {["all","expense","income"].map(f=><div key={f} className={`filter-chip ${filterType===f?"active":""}`} onClick={()=>setFilterType(f)}>{f==="all"?"All":f==="income"?"💰 Income":"💸 Expense"}</div>)}
        <select className="form-input" style={{width:140,padding:"8px 14px",fontSize:13}} value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
          <option value="all">All Months</option>
          {months.map(m=><option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("en-US",{month:"long",year:"numeric"})}</option>)}
        </select>
      </div>
      {filtered.length?(
        <div className="tx-list">
          {filtered.map(t=>{
            const cat=categories.find(c=>c.id===t.category_id);
            return (
              <div key={t.id} className="tx-item glass" style={{background:"none"}}>
                <div className="tx-icon" style={{background:cat?.color?cat.color+"22":"rgba(99,102,241,0.1)"}}>{cat?.icon||"💰"}</div>
                <div className="tx-details">
                  <div className="tx-title">{t.title}</div>
                  <div className="tx-meta">{cat?.name} · {fmtDate(t.date)} · {t.payment_method}</div>
                  {t.notes&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontStyle:"italic"}}>{t.notes}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                  <div className={`tx-amount ${t.type==="income"?"positive":"negative"}`}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</div>
                  <div style={{display:"flex",gap:6}}>
                    <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:11}} onClick={()=>onEdit(t)}>Edit</button>
                    <button className="btn btn-danger" style={{padding:"4px 10px",fontSize:11}} onClick={()=>onDelete(t.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ):<div className="glass empty"><div className="empty-icon">🔍</div><div className="empty-text">No transactions found</div><div className="empty-sub">Try changing your filters</div></div>}
    </div>
  );
}

function AnalyticsPage({transactions,categories}) {
  const [period,setPeriod]=useState("month");
  const now=new Date();
  const filtered=useMemo(()=>{
    if(period==="month") return transactions.filter(t=>t.date.startsWith(now.toISOString().substring(0,7)));
    if(period==="quarter"){const q=new Date(now.getFullYear(),Math.floor(now.getMonth()/3)*3,1);return transactions.filter(t=>new Date(t.date)>=q);}
    return transactions.filter(t=>t.date.startsWith(now.getFullYear().toString()));
  },[transactions,period]);
  const catData=useMemo(()=>{
    const map={};
    filtered.filter(t=>t.type==="expense").forEach(t=>{
      const c=categories.find(c=>c.id===t.category_id);
      const name=c?.name||"Other";const icon=c?.icon||"📦";const color=c?.color||"#6b7280";
      if(!map[name]) map[name]={name,icon,color,total:0,count:0};
      map[name].total+=t.amount;map[name].count++;
    });
    return Object.values(map).sort((a,b)=>b.total-a.total);
  },[filtered,categories]);
  const paymentData=useMemo(()=>{
    const map={};
    filtered.filter(t=>t.type==="expense").forEach(t=>{map[t.payment_method]=(map[t.payment_method]||0)+t.amount;});
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[filtered]);
  const totalExpense=filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Analytics</div><div className="page-sub">Spending insights & breakdowns</div></div>
        <div className="filter-bar" style={{margin:0}}>
          {["month","quarter","year"].map(p=><div key={p} className={`filter-chip ${period===p?"active":""}`} onClick={()=>setPeriod(p)}>{p.charAt(0).toUpperCase()+p.slice(1)}</div>)}
        </div>
      </div>
      <div className="charts-grid">
        <div className="glass chart-card">
          <div className="chart-title">Spending by Category</div><div className="chart-sub">Top expense categories</div>
          {catData.length?(
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={catData.slice(0,8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                <XAxis type="number" stroke="#475569" tick={{fontSize:11}} tickFormatter={v=>`$${v>=1000?(v/1000).toFixed(1)+"k":v}`}/>
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{fontSize:11}} width={90}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="total" name="Spent" radius={[0,6,6,0]}>{catData.map((c,i)=><Cell key={i} fill={c.color}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<div className="empty"><div className="empty-icon">📊</div><div className="empty-sub">No data</div></div>}
        </div>
        <div className="glass chart-card">
          <div className="chart-title">Payment Methods</div><div className="chart-sub">How you pay</div>
          {paymentData.length?(
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>{paymentData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
              </ResponsiveContainer>
              {paymentData.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,marginTop:6}}>
                  <span style={{width:10,height:10,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                  <span style={{flex:1,color:"var(--muted)"}}>{p.name}</span>
                  <span style={{fontWeight:600}}>{fmt(p.value)}</span>
                </div>
              ))}
            </>
          ):<div className="empty"><div className="empty-icon">💳</div><div className="empty-sub">No data</div></div>}
        </div>
      </div>
      <div className="glass chart-card">
        <div className="chart-title">Category Breakdown</div><div className="chart-sub">Detailed spending analysis</div>
        {catData.length?(
          <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:8}}>
            {catData.map((c,i)=>{
              const pct=totalExpense?(c.total/totalExpense*100).toFixed(1):0;
              return (
                <div key={i}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:20}}>{c.icon}</span>
                    <span style={{flex:1,fontSize:14,fontWeight:500}}>{c.name}</span>
                    <span style={{fontSize:12,color:"var(--muted)"}}>{c.count} txn</span>
                    <span style={{fontSize:14,fontWeight:700}}>{fmt(c.total)}</span>
                    <span style={{fontSize:12,color:"var(--muted)",width:40,textAlign:"right"}}>{pct}%</span>
                  </div>
                  <div className="budget-bar-bg"><div className="budget-bar" style={{width:`${pct}%`,background:c.color}}/></div>
                </div>
              );
            })}
          </div>
        ):<div className="empty"><div className="empty-icon">📈</div><div className="empty-sub">No expenses yet</div></div>}
      </div>
    </div>
  );
}

function BudgetsPage({transactions,categories,userId}) {
  const [budgets,setBudgets]=useState([]);
  const [showAdd,setShowAdd]=useState(false);
  const [newBudget,setNewBudget]=useState({category_id:"",amount:"",alert:80});
  const now=new Date();
  const thisMonth=now.getMonth()+1;const thisYear=now.getFullYear();
  const fetchBudgets=useCallback(async()=>{
    const {data}=await supabase.from("budgets").select("*, categories(*)").eq("user_id",userId).eq("month",thisMonth).eq("year",thisYear);
    setBudgets(data||[]);
  },[userId]);
  useEffect(()=>{fetchBudgets();},[fetchBudgets]);
  const thisMonthTxs=transactions.filter(t=>t.date.startsWith(now.toISOString().substring(0,7)));
  const saveBudget=async()=>{
    if(!newBudget.category_id||!newBudget.amount) return;
    await supabase.from("budgets").upsert({user_id:userId,category_id:newBudget.category_id,amount:parseFloat(newBudget.amount),month:thisMonth,year:thisYear,alert_threshold:parseFloat(newBudget.alert)},{onConflict:"user_id,category_id,month,year"});
    setNewBudget({category_id:"",amount:"",alert:80});setShowAdd(false);fetchBudgets();
  };
  const deleteBudget=async(id)=>{await supabase.from("budgets").delete().eq("id",id);fetchBudgets();};
  const expenseCategories=categories.filter(c=>!["Salary","Freelance","Investment"].includes(c.name));
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Budgets</div><div className="page-sub">{now.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div></div>
        <button className="btn btn-primary" style={{width:"auto"}} onClick={()=>setShowAdd(!showAdd)}>{showAdd?"Cancel":"+ New Budget"}</button>
      </div>
      {showAdd&&(
        <div className="glass" style={{padding:24,marginBottom:20}}>
          <div className="chart-title" style={{marginBottom:16}}>Set Budget Limit</div>
          <div className="row">
            <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={newBudget.category_id} onChange={e=>setNewBudget(p=>({...p,category_id:e.target.value}))}><option value="">Select category</option>{expenseCategories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Budget ($)</label><input className="form-input" type="number" placeholder="500" value={newBudget.amount} onChange={e=>setNewBudget(p=>({...p,amount:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Alert at (%)</label><input className="form-input" type="number" placeholder="80" value={newBudget.alert} onChange={e=>setNewBudget(p=>({...p,alert:e.target.value}))}/></div>
          </div>
          <button className="btn btn-primary" style={{width:"auto"}} onClick={saveBudget}>Save Budget</button>
        </div>
      )}
      {budgets.length?budgets.map(b=>{
        const spent=thisMonthTxs.filter(t=>t.type==="expense"&&t.category_id===b.category_id).reduce((s,t)=>s+t.amount,0);
        const pct=b.amount?(spent/b.amount*100):0;
        const isOver=pct>=100;const isAlert=pct>=b.alert_threshold&&!isOver;
        const color=isOver?"var(--danger)":isAlert?"var(--expense)":"var(--income)";
        const cat=categories.find(c=>c.id===b.category_id);
        return (
          <div key={b.id} className="glass budget-card" style={{borderLeft:`3px solid ${color}`}}>
            <div className="budget-header">
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{cat?.icon}</span>
                <div><div style={{fontWeight:600,fontSize:15}}>{cat?.name||b.categories?.name}</div><div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{fmt(spent)} of {fmt(b.amount)} spent</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {isOver&&<span className="tag tag-expense">⚠️ Over!</span>}
                {isAlert&&<span className="tag" style={{background:"rgba(249,115,22,0.1)",color:"var(--expense)"}}>🔔</span>}
                <span style={{fontWeight:700,fontSize:18,color}}>{pct.toFixed(0)}%</span>
                <button className="btn btn-danger" style={{padding:"4px 10px",fontSize:11}} onClick={()=>deleteBudget(b.id)}>Remove</button>
              </div>
            </div>
            <div className="budget-bar-bg"><div className="budget-bar" style={{width:`${Math.min(pct,100)}%`,background:color}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginTop:8}}>
              <span>Remaining: {fmt(Math.max(b.amount-spent,0))}</span>
              <span>Alert at {b.alert_threshold}%</span>
            </div>
          </div>
        );
      }):<div className="glass empty"><div className="empty-icon">🎯</div><div className="empty-text">No budgets set</div><div className="empty-sub">Create a budget to track spending limits</div></div>}
    </div>
  );
}

function InsightsPage({transactions,categories}) {
  const [insights,setInsights]=useState([]);
  const [loading,setLoading]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const generateInsights=async()=>{
    setLoading(true);
    try {
      const now=new Date();
      const thisMonth=transactions.filter(t=>t.date.startsWith(now.toISOString().substring(0,7)));
      const lastMonth=transactions.filter(t=>{const d=new Date(now.getFullYear(),now.getMonth()-1,1);return t.date.startsWith(d.toISOString().substring(0,7));});
      const totalExpense=thisMonth.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      const totalIncome=thisMonth.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
      const lastExpense=lastMonth.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      const catBreakdown={};
      thisMonth.filter(t=>t.type==="expense").forEach(t=>{const c=categories.find(c=>c.id===t.category_id);const name=c?.name||"Other";catBreakdown[name]=(catBreakdown[name]||0)+t.amount;});
      const summary=`Financial summary ${now.toLocaleDateString("en-US",{month:"long",year:"numeric"})}: Income $${totalIncome.toFixed(2)}, Expenses $${totalExpense.toFixed(2)}, Net $${(totalIncome-totalExpense).toFixed(2)}, Last month expenses $${lastExpense.toFixed(2)}, Change ${lastExpense?(((totalExpense-lastExpense)/lastExpense)*100).toFixed(1):"N/A"}%, Breakdown: ${JSON.stringify(catBreakdown)}, Transactions: ${thisMonth.length}`;
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are a smart personal finance advisor. Analyze spending data and provide 5 concise actionable insights. Return ONLY a JSON array: [{\"type\":\"warning|tip|praise|alert|suggestion\",\"title\":\"Short title\",\"text\":\"2-3 sentence insight\"}]",messages:[{role:"user",content:summary}]})});
      const data=await resp.json();
      const text=data.content?.[0]?.text||"[]";
      const clean=text.replace(/```json|```/g,"").trim();
      setInsights(JSON.parse(clean));setLoaded(true);
    } catch(e){
      setInsights([{type:"tip",title:"Analysis Ready",text:"Based on your spending patterns, consider reviewing top expense categories and setting monthly limits. Track spending daily for better financial awareness."}]);
      setLoaded(true);
    }
    setLoading(false);
  };
  const typeConfig={warning:{icon:"⚠️",color:"#f97316"},tip:{icon:"💡",color:"#6366f1"},praise:{icon:"🎉",color:"#22c55e"},alert:{icon:"🚨",color:"#ef4444"},suggestion:{icon:"🎯",color:"#06b6d4"}};
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">AI Insights</div><div className="page-sub">Powered by Claude AI</div></div>
        <button className="btn btn-primary" style={{width:"auto",background:"linear-gradient(135deg,#6366f1,#06b6d4)"}} onClick={generateInsights} disabled={loading}>
          {loading?<span className="typing"><span/><span/><span/></span>:loaded?"🔄 Refresh":"✨ Generate Insights"}
        </button>
      </div>
      {!loaded&&!loading&&(
        <div className="glass empty" style={{padding:80}}>
          <div className="empty-icon">🤖</div>
          <div className="empty-text">AI Financial Advisor</div>
          <div className="empty-sub" style={{maxWidth:360,margin:"8px auto 24px"}}>Click Generate Insights to get personalized analysis of your spending patterns powered by Claude AI.</div>
          <button className="btn btn-primary" style={{width:"auto",margin:"0 auto"}} onClick={generateInsights}>✨ Analyze My Finances</button>
        </div>
      )}
      {loading&&<div className="glass" style={{padding:40,textAlign:"center"}}><div style={{fontSize:40,marginBottom:16}}>🤖</div><div style={{color:"#818cf8",fontWeight:600,marginBottom:8}}>Analyzing your finances...</div><div className="loader"><div className="dot"/><div className="dot"/><div className="dot"/></div></div>}
      {loaded&&!loading&&insights.map((ins,i)=>{
        const cfg=typeConfig[ins.type]||typeConfig.tip;
        return (
          <div key={i} className="glass insight-card" style={{borderLeftColor:cfg.color}}>
            <div className="insight-label">{cfg.icon} {ins.type?.toUpperCase()}</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{ins.title}</div>
            <div className="insight-text">{ins.text}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("dashboard");
  const [transactions,setTransactions]=useState([]);
  const [categories,setCategories]=useState([]);
  const [showAddTx,setShowAddTx]=useState(false);
  const [editTx,setEditTx]=useState(null);
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setLoading(false);});
    const {data:listener}=supabase.auth.onAuthStateChange((_e,session)=>{setUser(session?.user||null);});
    return ()=>listener.subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(user) fetchData();},[user]);
  const fetchData=async()=>{
    const [txRes,catRes]=await Promise.all([
      supabase.from("transactions").select("*").eq("user_id",user?.id).order("date",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("categories").select("*").or(`user_id.eq.${user?.id},is_default.eq.true`).order("name")
    ]);
    setTransactions(txRes.data||[]);setCategories(catRes.data||[]);
  };
  const saveTx=async(tx)=>{
    if(editTx){await supabase.from("transactions").update({...tx,updated_at:new Date().toISOString()}).eq("id",editTx.id);}
    else{await supabase.from("transactions").insert({...tx,user_id:user.id});}
    setEditTx(null);fetchData();
  };
  const deleteTx=async(id)=>{if(window.confirm("Delete this transaction?")){await supabase.from("transactions").delete().eq("id",id);fetchData();}};
  const signOut=async()=>{await supabase.auth.signOut();setUser(null);};
  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div className="loader"><div className="dot"/><div className="dot"/><div className="dot"/></div></div>;
  if(!user) return <AuthPage onAuth={setUser}/>;
  const navItems=[{id:"dashboard",icon:"🏠",label:"Dashboard"},{id:"transactions",icon:"💸",label:"Transactions"},{id:"analytics",icon:"📊",label:"Analytics"},{id:"budgets",icon:"🎯",label:"Budgets"},{id:"insights",icon:"✨",label:"AI Insights"}];
  const initials=(user.user_metadata?.full_name||user.email||"U").split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();
  return (
    <div className="app">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <div className="main-layout">
        <div className="sidebar">
          <div className="sidebar-brand">💸 Spendly</div>
          {navItems.map(n=><button key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}><span className="nav-icon">{n.icon}</span> {n.label}</button>)}
          <div className="sidebar-footer">
            <div className="user-pill">
              <div className="user-avatar">{initials}</div>
              <div style={{flex:1,minWidth:0}}><div className="user-name">{user.user_metadata?.full_name||"User"}</div><div className="user-email">{user.email}</div></div>
            </div>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8,fontSize:13}} onClick={signOut}>Sign Out</button>
          </div>
        </div>
        <div className="content">
          {page==="dashboard"&&<Dashboard transactions={transactions} categories={categories} onAdd={()=>setShowAddTx(true)}/>}
          {page==="transactions"&&<TransactionsPage transactions={transactions} categories={categories} onAdd={()=>setShowAddTx(true)} onDelete={deleteTx} onEdit={tx=>{setEditTx(tx);setShowAddTx(true);}}/>}
          {page==="analytics"&&<AnalyticsPage transactions={transactions} categories={categories}/>}
          {page==="budgets"&&<BudgetsPage transactions={transactions} categories={categories} userId={user.id}/>}
          {page==="insights"&&<InsightsPage transactions={transactions} categories={categories}/>}
        </div>
      </div>
      <div className="mobile-nav">
        {navItems.map(n=><button key={n.id} className={`mobile-nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}><span>{n.icon}</span>{n.label}</button>)}
      </div>
      {showAddTx&&<AddTxModal onClose={()=>{setShowAddTx(false);setEditTx(null);}} onSave={saveTx} categories={categories} editTx={editTx}/>}
    </div>
  );
}
