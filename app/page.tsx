"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 分别从独立文件引入数据
import { virtues } from './data/virtues'; 
import { quotes } from './data/quotes'; 

import { Sparkles, BookOpen, AlertCircle, Edit3, ArrowRight, MessageCircle, X, Send, Quote as QuoteIcon, Lock, Loader2 } from 'lucide-react';
import { Show, SignInButton, UserButton, useUser, useClerk } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

// --- 初始化 Supabase 客户端 ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 工具函数 ---
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateKey = (d: Date) => {
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDateKeyToLocalMidnight = (dateKey: string) => {
  if (!dateKey) return new Date();
  const parts = dateKey.split(/[-/]/).map(Number);
  if (parts.length === 3) {
    const out = new Date(parts[0], parts[1] - 1, parts[2]);
    out.setHours(0, 0, 0, 0);
    return out;
  }
  const fallback = new Date();
  fallback.setHours(0, 0, 0, 0);
  return fallback;
};

const addDaysLocal = (baseLocal: Date, days: number) => {
  const d = new Date(baseLocal);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
};

const modPositive = (n: number, m: number) => ((n % m) + m) % m;

const MAX_CHAT_LIMIT = 5;

export default function VirtueHome() {
  // 添加了 isLoaded，用来判断用户登录状态是否已经完全加载完成
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();

  const [failureLogs, setFailureLogs] = useState<any[]>([]);
  const [weekStartKey, setWeekStartKey] = useState<string>(() => toDateKey(new Date()));
  const [selectedVirtue, setSelectedVirtue] = useState<string>(virtues[0].name);
  const [note, setNote] = useState<string>("");
  
  const [auditModal, setAuditModal] = useState({ isOpen: false, virtue: '', dateKey: '', dateLabel: '', note: '' });
  const [todaysQuote, setTodaysQuote] = useState(quotes[0]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Greetings, my friend! I am Benjamin Franklin. How might I assist you in your pursuit of virtue today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatCount, setChatCount] = useState(0);

  // --- 权限与弹窗状态 ---
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY);
    setTodaysQuote(quotes[dayOfYear % quotes.length]);

    const storedWeekStart = localStorage.getItem('franklin_week_start');
    if (storedWeekStart) setWeekStartKey(storedWeekStart);

    const todayStr = toDateKey(new Date());
    const storedChatUsage = localStorage.getItem('franklin_chat_usage');
    if (storedChatUsage) {
      try {
        const usageData = JSON.parse(storedChatUsage);
        if (usageData.date === todayStr) setChatCount(usageData.count);
      } catch (e) { console.error(e); }
    }

    // --- 核心权限检查与拉取 ---
    const checkAccessAndFetch = async () => {
      // 必须等待 isLoaded 完成，避免出现刚刷新的闪烁状态
      if (!isLoaded) return; 

      if (isSignedIn && user) {
        const { data: accessData, error: accessError } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (accessData) {
          setIsAuthorized(true);
          const { data, error: logsError } = await supabase
            .from('failure_logs')
            .select('date, virtue, note')
            .eq('user_id', user.id);
            
          if (data) {
            setFailureLogs(data);
            localStorage.setItem("franklin_failures", JSON.stringify(data)); 
          }
          if (logsError) console.error("加载记录失败:", logsError);
        } else {
          setIsAuthorized(false);
          setShowInviteModal(true); // 如果登入了但是没权限，主动弹出验证码框
        }
      } else {
        const storedFailures = localStorage.getItem('franklin_failures');
        if (storedFailures) {
          try { setFailureLogs(JSON.parse(storedFailures)); } catch (e) { console.error(e); }
        }
      }
    };
    
    checkAccessAndFetch();
  }, [isSignedIn, user, isLoaded]);

  useEffect(() => { localStorage.setItem('franklin_week_start', weekStartKey); }, [weekStartKey]);

  const weekStartLocal = parseDateKeyToLocalMidnight(weekStartKey);
  const weekDayKeys = Array.from({ length: 7 }, (_, i) => toDateKey(addDaysLocal(weekStartLocal, i)));
  const weekDayLabels = weekDayKeys.map(key => {
    const d = parseDateKeyToLocalMidnight(key);
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d)[0].toUpperCase();
  });

  const todayLocalMidnight = new Date();
  todayLocalMidnight.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((todayLocalMidnight.getTime() - weekStartLocal.getTime()) / MS_PER_DAY);
  const currentVirtue = virtues[modPositive(Math.floor(diffDays / 7), virtues.length)];

  // --- 【已修复】严谨的权限拦截器 ---
  const requireAuth = () => {
    if (!isLoaded) {
      alert("正在加载您的信息，请稍候...");
      return false;
    }
    if (!isSignedIn) { 
      clerk.openSignIn(); 
      return false; 
    }
    if (isAuthorized === null) {
      alert("正在校验您的权限库，请稍候...");
      return false;
    }
    // 必须严格为 true 才能放行，否则全部拦截并弹窗
    if (isAuthorized !== true) {
      setShowInviteModal(true);
      return false;
    }
    return true;
  };

  // --- 验证邀请码的逻辑 ---
  const handleVerifyCode = async () => {
    if (!inviteCode.trim() || !user) return;
    setIsVerifying(true);
    setAuthError("");

    const codeUpper = inviteCode.trim().toUpperCase();
    const { data: codeData } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", codeUpper)
      .single();

    if (!codeData || codeData.used_count >= codeData.max_uses) {
      setAuthError("Invalid or fully claimed access code.");
      setIsVerifying(false);
      return;
    }

    await supabase.from("invite_codes").update({ used_count: codeData.used_count + 1 }).eq("id", codeData.id);
    await supabase.from("user_access").insert({ user_id: user.id, code_used: codeUpper });

    setIsAuthorized(true);
    setShowInviteModal(false);
    setIsVerifying(false);

    const { data } = await supabase.from('failure_logs').select('date, virtue, note').eq('user_id', user.id);
    if (data) setFailureLogs(data);
  };

  // --- 【已修复】增加保存时错误处理的复盘记录 ---
  const openAuditModal = (v: string, dKey: string, dLabel: string) => {
    if (!requireAuth()) return;
    setAuditModal({
      isOpen: true, 
      virtue: v, 
      dateKey: dKey, 
      dateLabel: dLabel,
      note: failureLogs.find(l => l.virtue === v && l.date === dKey)?.note || ''
    });
  };

  const saveAuditNote = async () => {
    const trimmed = auditModal.note.trim();
    if (!requireAuth() || !user) return;

    // 先在本地触发状态更新，让UI立即刷新
    const without = failureLogs.filter(l => !(l.virtue === auditModal.virtue && l.date === auditModal.dateKey));
    const next = trimmed ? [...without, { date: auditModal.dateKey, virtue: auditModal.virtue, note: trimmed }] : without;
    setFailureLogs(next);
    setAuditModal({ ...auditModal, isOpen: false });

    // 提交到云端，增加错误监测
    await supabase.from('failure_logs').delete().match({ user_id: user.id, date: auditModal.dateKey, virtue: auditModal.virtue });
    if (trimmed) {
      const { error } = await supabase.from('failure_logs').insert({ user_id: user.id, date: auditModal.dateKey, virtue: auditModal.virtue, note: trimmed });
      if (error) {
        console.error("Supabase Save Error:", error);
        alert(`保存云端失败，请检查 Supabase 表配置（如 RLS / user_id字段是否为text）\n错误详情: ${error.message}`);
      }
    }
  };

  const saveQuickFailure = async () => {
    if (!requireAuth()) return;
    if (!note.trim()) return;

    const todayStr = toDateKey(new Date());
    const trimmedNote = note.trim();

    // 先更新本地状态，确保表格立刻显示黑点
    const without = failureLogs.filter(l => !(l.virtue === selectedVirtue && l.date === todayStr));
    const next = [...without, { date: todayStr, virtue: selectedVirtue, note: trimmedNote }];
    setFailureLogs(next);
    setNote("");

    // 提交到云端，增加错误监测
    const { error: deleteError } = await supabase.from('failure_logs').delete().match({ user_id: user.id, date: todayStr, virtue: selectedVirtue });
    const { error: insertError } = await supabase.from('failure_logs').insert({ user_id: user.id, date: todayStr, virtue: selectedVirtue, note: trimmedNote });
    
    if (insertError || deleteError) {
      console.error("Supabase Save Error:", insertError || deleteError);
      alert(`保存失败！(数据不会同步到其他设备)。\n错误详情: ${(insertError || deleteError)?.message}\n请检查 Supabase 设置！`);
    } else {
      alert("Failure logged and synced to cloud successfully.");
    }
  };

  const handleSendMessage = async () => {
    if (!requireAuth()) return;
    if (!chatInput.trim()) return;
    if (chatCount >= MAX_CHAT_LIMIT) {
      setChatMessages(prev => [...prev, { role: 'user', content: chatInput }, { role: 'assistant', content: "My friend, our dialogue for today has reached its limit. Let us reflect and meet again tomorrow." }]);
      setChatInput("");
      return;
    }
    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages: [...chatMessages, userMsg] }) 
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      const newCount = chatCount + 1;
      setChatCount(newCount);
      localStorage.setItem('franklin_chat_usage', JSON.stringify({ date: toDateKey(new Date()), count: newCount }));
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Connection to Dr. Franklin failed." }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B2B3A] pb-20 relative font-sans">
      
      {/* 邀请码弹窗 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#1B2B3A]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-md text-center animate-in fade-in zoom-in-95 relative">
            
            {/* 只允许尚未登录的用户关掉弹窗随便看主页；如果你登入了但没码，不许关 */}
            {(!isSignedIn || isAuthorized !== false) && (
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="absolute top-6 right-6 text-slate-400 hover:text-[#1B2B3A] transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            )}

            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
              <Lock size={32} className="text-[#7B1B1B]" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight">Restricted Access</h2>
            <p className="text-sm text-slate-500 font-serif leading-relaxed mb-8">
              Please enter your exclusive access code to unlock the interactive features of the Lab.
            </p>
            
            <input 
              type="text" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              placeholder="e.g. MASTER-FRANKLIN"
              className="w-full text-center px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 font-mono uppercase tracking-widest text-sm outline-none focus:border-[#1B2B3A] transition-colors"
            />
            
            {authError && <p className="text-xs text-[#7B1B1B] font-bold mb-4 animate-pulse">{authError}</p>}
            
            <button 
              onClick={handleVerifyCode}
              disabled={isVerifying || !inviteCode}
              className="w-full bg-[#1B2B3A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer mb-3"
            >
              {isVerifying ? <Loader2 className="animate-spin" size={16} /> : "Unlock the Lab"}
            </button>
            
            {/* 假如不能关掉弹窗（登录了没权限），提供一个登出按钮让他能退出 */}
            {isSignedIn && isAuthorized === false && (
              <button onClick={() => clerk.signOut()} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Sign Out
              </button>
            )}

          </div>
        </div>
      )}

      {/* 复盘弹窗 */}
      {auditModal.isOpen && (
        <div className="fixed inset-0 bg-[#1B2B3A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-2xl font-serif font-bold mb-1">Audit: {auditModal.dateLabel}</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-6 font-bold">Reflecting on {auditModal.virtue}</p>
            <textarea 
              autoFocus 
              value={auditModal.note} 
              onChange={e => setAuditModal({...auditModal, note: e.target.value})} 
              placeholder="Record your shortfall..."
              className="w-full h-40 p-5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-[#7B1B1B] text-base font-serif leading-relaxed mb-8 resize-none" 
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setAuditModal({...auditModal, isOpen: false})} 
                className="px-6 py-3 font-bold text-sm text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={saveAuditNote} 
                className="px-8 py-3 font-bold text-sm text-white bg-[#1B2B3A] hover:bg-slate-800 rounded-full cursor-pointer"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto py-5 px-6 max-w-[1200px] flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
            Franklin's <span className="italic text-[#7B1B1B]">Virtue Tracker</span>
          </h1>
          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <SignInButton>
                <button className="px-6 py-2 bg-[#1B2B3A] text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border-2 border-slate-200 shadow-sm" } }} />
            </Show>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-12 px-6 max-w-[1200px]">
        {/* 每日名言 */}
        <div className="flex flex-col items-center mb-12 text-center px-4 animate-in fade-in duration-700">
          <QuoteIcon size={24} className="text-[#7B1B1B]/40 mb-4" />
          <p className="text-xl md:text-2xl font-serif italic text-slate-700 max-w-3xl leading-relaxed">"{todaysQuote.en}"</p>
          <p className="text-sm font-serif text-slate-500 mt-2">{todaysQuote.zh}</p>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7B1B1B] mt-6">— {todaysQuote.author} —</span>
        </div>

        {/* 美德展示卡片 */}
        <div className="bg-white border border-slate-200 shadow-md rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 mb-12 overflow-hidden">
          <div className="p-10 lg:p-14 flex flex-col bg-white">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 flex items-center gap-2">
              <Sparkles size={14} className="text-yellow-500" /> Weekly Focus
            </span>
            <div className="mb-10">
              <h1 className="text-5xl font-serif font-bold text-[#1B2B3A] tracking-tight mb-2">{currentVirtue?.name}</h1>
              <span className="text-2xl text-[#7B1B1B] font-serif">{currentVirtue?.chineseName}</span>
            </div>
            <div className="pl-6 border-l-2 border-slate-200 mb-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">The Definition</span>
              <p className="text-lg text-slate-600 italic font-serif">"{currentVirtue?.franklinDefinition}"</p>
            </div>
            <div className="mt-auto bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B1B1B] block mb-4">How to practice</span>
              <ul className="space-y-3">
                {currentVirtue?.actionableSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-700 font-serif leading-relaxed">
                    <span className="text-[#7B1B1B] font-bold">{idx + 1}.</span> {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="p-10 lg:p-14 flex flex-col bg-[#FDFBF7] border-t md:border-t-0 md:border-l border-slate-100">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 flex items-center gap-2">
              <BookOpen size={14} className="text-[#7B1B1B]" /> I-Ching Philosophy
            </span>
            <div className="mb-8">
              <div className="text-[#1B2B3A] font-light mb-4 text-6xl">{currentVirtue?.guaXiang}</div>
              <span className="text-2xl text-[#7B1B1B] font-serif">{currentVirtue?.guaName}</span>
            </div>
            <div className="pl-6 border-l-2 border-[#7B1B1B]/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B1B1B] block mb-3">彖辞 (Tuan Ci)</span>
              <p className="text-base text-slate-700 font-serif leading-relaxed text-justify">{currentVirtue?.tuanCi}</p>
            </div>
          </div>
        </div>

        {/* 记录与动态网格 */}
        <div className="bg-white border border-slate-200 shadow-md rounded-[2.5rem] grid grid-cols-1 lg:grid-cols-12 mb-12 overflow-hidden">
          <div className="lg:col-span-4 p-8 md:p-10 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100">
            <h2 className="text-2xl font-serif font-bold mb-8 flex items-center text-[#7B1B1B]">
              <AlertCircle size={22} className="mr-3" /> Log a Failure
            </h2>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-6 font-serif outline-none cursor-pointer" 
              value={selectedVirtue} 
              onChange={(e) => setSelectedVirtue(e.target.value)}
            >
              {virtues.map(v => <option key={v.name} value={v.name}>{v.name} - {v.chineseName}</option>)}
            </select>
            <textarea 
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 mb-8 resize-none outline-none font-serif min-h-[120px]" 
              placeholder="Explain the shortfall..." 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
            />
            <button 
              onClick={saveQuickFailure} 
              className="w-full bg-[#1B2B3A] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Submit to Audit
            </button>
          </div>
          
          <div className="lg:col-span-8 p-8 md:p-10 flex flex-col bg-[#FDFBF7]">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6">
              <h2 className="text-2xl font-serif font-bold flex items-center text-[#1B2B3A]">
                <Edit3 size={24} className="mr-3 text-[#7B1B1B]" /> Franklin's Grid
              </h2>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm" onClickCapture={(e) => { if (!requireAuth()) { e.preventDefault(); e.stopPropagation(); } }}>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-2">Week Start:</span>
                <input 
                  type="date" 
                  value={weekStartKey} 
                  onChange={(e) => setWeekStartKey(e.target.value)} 
                  className="px-2 py-1 text-xs rounded-lg bg-slate-50 text-[#1B2B3A] outline-none font-mono cursor-pointer" 
                />
              </div>
            </div>
            
            <div className="mb-8 bg-slate-100/60 p-6 rounded-2xl border border-slate-200 relative">
              <QuoteIcon size={16} className="absolute top-5 left-5 text-slate-300" />
              <p className="text-xs text-slate-600 italic font-serif leading-relaxed pl-8">
                "I form’d a little book, in which I allotted a page for each of the virtues... I might mark, by a little black spot, every fault I found upon examination to have been committed respecting that virtue upon that day."
              </p>
              <p className="text-[10px] text-right font-bold text-slate-400 mt-3">— The Autobiography of Benjamin Franklin</p>
            </div>
            
            <div className="flex-1 overflow-x-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="w-10 border-b-2 border-r-2 border-[#7B1B1B]/30 p-2"></th>
                    {weekDayLabels.map((label, i) => (
                      <th key={i} className="border-b-2 border-[#7B1B1B]/30 p-2 text-sm font-bold text-[#1B2B3A]">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {virtues.map((v) => (
                    <tr key={v.name} className="hover:bg-slate-50 transition-colors">
                      <td className="border-r-2 border-b border-[#7B1B1B]/30 p-2 text-xs font-bold text-[#7B1B1B]">{v.name[0]}</td>
                      {weekDayKeys.map((dayKey, idx) => {
                        const hasFailure = failureLogs.some(l => l.virtue === v.name && l.date === dayKey);
                        return (
                          <td 
                            key={`${v.name}-${dayKey}`} 
                            className="border-b border-[#7B1B1B]/10 p-1 cursor-pointer" 
                            onClick={() => openAuditModal(v.name, dayKey, weekDayLabels[idx])}
                          >
                            <div className="flex justify-center items-center h-8 w-8 mx-auto rounded-xl hover:bg-slate-200 transition-colors">
                              {hasFailure ? <div className="h-4 w-4 bg-[#1B2B3A] rounded-full"></div> : <div></div>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Link href="/virtue_tracker" className="w-full bg-[#1B2B3A] text-white rounded-[2rem] py-8 md:py-10 px-10 flex items-center justify-between hover:bg-slate-800 transition-all shadow-lg group block">
          <div className="flex flex-col text-left gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-300">Next Step</span>
            <span className="text-3xl md:text-4xl font-serif font-bold tracking-wide">Enter 52-Week Curriculum</span>
          </div>
          <ArrowRight size={36} className="text-white/50 group-hover:text-white group-hover:translate-x-4 transition-all" />
        </Link>
      </main>

      {/* AI 助手 */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-80 md:w-96 mb-6 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="bg-[#1B2B3A] text-white p-5 flex justify-between items-center">
              <div>
                <div className="font-serif font-bold text-lg leading-none">Dr. Franklin</div>
                <span className="text-[9px] uppercase tracking-widest text-slate-400">Virtue AI Advisor • {MAX_CHAT_LIMIT - chatCount} Left Today</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="opacity-60 hover:opacity-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="h-80 p-5 overflow-y-auto bg-slate-50 flex flex-col gap-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 text-sm font-serif rounded-2xl ${msg.role === 'assistant' ? 'bg-white border border-slate-200 self-start text-slate-700' : 'bg-[#7B1B1B] text-white self-end'}`}>
                  {msg.content}
                </div>
              ))}
              {isTyping && <div className="text-[10px] italic text-slate-400 ml-2">Franklin is thinking...</div>}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                placeholder={chatCount >= MAX_CHAT_LIMIT ? "Limit reached..." : "Ask for wisdom..."} 
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none font-serif" 
                disabled={chatCount >= MAX_CHAT_LIMIT} 
              />
              <button 
                onClick={handleSendMessage} 
                className="bg-[#1B2B3A] text-white p-2 rounded-xl disabled:opacity-50 cursor-pointer" 
                disabled={isTyping || chatCount >= MAX_CHAT_LIMIT}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
        <button 
          onClick={() => {
            if (!isChatOpen && !requireAuth()) return;
            setIsChatOpen(!isChatOpen);
          }} 
          className="bg-[#7B1B1B] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer"
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>
    </div>
  );
}