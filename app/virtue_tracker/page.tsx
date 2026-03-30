"use client";
import React, { useEffect, useMemo, useState } from "react";
import { virtues } from "../data/virtues";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Lock, Unlock, Loader2 } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type FailureLog = {
  date: string;
  virtue: string;
  note: string;
};

const toDateKey = (d: Date) => d.toLocaleDateString("en-CA");

export default function VirtueTracker() {
  const { user, isLoaded } = useUser();
  const [logs, setLogs] = useState<FailureLog[]>([]);
  const [weekStartKey, setWeekStartKey] = useState<string>(() => toDateKey(new Date()));
  
  // 权限控制状态
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const savedWeekStart = localStorage.getItem("franklin_week_start");
    if (savedWeekStart) setWeekStartKey(savedWeekStart);
  }, []);

  // 核心逻辑：当用户加载完成后，去数据库检查他是否拥有权限
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkAccessAndLoadData = async () => {
      // 1. 检查 user_access 表中是否有这个用户的记录
      const { data: accessData } = await supabase
        .from("user_access")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (accessData) {
        setIsAuthorized(true);
        // 2. 如果有权限，拉取该用户专属的云端复盘日志！
        const { data: logsData } = await supabase
          .from("failure_logs")
          .select("date, virtue, note")
          .eq("user_id", user.id);
        
        if (logsData) setLogs(logsData);
      } else {
        setIsAuthorized(false);
      }
    };

    checkAccessAndLoadData();
  }, [isLoaded, user]);

  const weeks = useMemo(() => {
    const start = new Date(weekStartKey);
    start.setHours(0,0,0,0);
    return Array.from({ length: 52 }).map((_, i) => {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const days = Array.from({ length: 7 }).map((_, j) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + j);
        return toDateKey(d);
      });
      return { weekNum: i + 1, dateStr: toDateKey(weekStart), virtue: virtues[i % 14], days };
    });
  }, [weekStartKey]);

  // 验证邀请码逻辑
  const handleVerifyCode = async () => {
    if (!inviteCode.trim() || !user) return;
    setIsVerifying(true);
    setAuthError("");

    const codeUpper = inviteCode.trim().toUpperCase();

    // 1. 在数据库查询这个验证码是否有效
    const { data: codeData, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", codeUpper)
      .single();

    if (!codeData || codeData.used_count >= codeData.max_uses) {
      setAuthError("Invalid or fully claimed access code.");
      setIsVerifying(false);
      return;
    }

    // 2. 增加验证码的使用次数
    await supabase
      .from("invite_codes")
      .update({ used_count: codeData.used_count + 1 })
      .eq("id", codeData.id);

    // 3. 将用户写入白名单，完成权限绑定
    await supabase
      .from("user_access")
      .insert({ user_id: user.id, code_used: codeUpper });

    setIsAuthorized(true);
    setIsVerifying(false);
  };

  // UI 渲染阶段 1：数据加载中
  if (!isLoaded || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#1B2B3A]">
        <Loader2 className="animate-spin text-[#7B1B1B] mr-3" size={24} /> 
        <span className="font-serif italic text-lg">Consulting the Ledger...</span>
      </div>
    );
  }

  // UI 渲染阶段 2：邀请码拦截墙 (未授权状态)
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-[#1B2B3A] selection:bg-[#7B1B1B] selection:text-white relative">
        <div className="absolute top-8 right-8"><UserButton /></div>
        <Link href="/" className="absolute top-8 left-8 inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#7B1B1B] transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Return
        </Link>

        <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl border border-slate-200 w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
            <Lock size={32} className="text-[#7B1B1B]" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight">Restricted Access</h2>
          <p className="text-sm text-slate-500 font-serif leading-relaxed mb-8">
            This Virtue Lab is currently in private beta. Please enter your exclusive access code to unlock the curriculum.
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
            className="w-full bg-[#1B2B3A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer"
          >
            {isVerifying ? <Loader2 className="animate-spin" size={16} /> : "Unlock the Lab"}
          </button>
        </div>
      </div>
    );
  }

  // UI 渲染阶段 3：完整的 52 周面板 (已授权状态)
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B2B3A] font-sans p-6 md:p-12 selection:bg-[#7B1B1B] selection:text-white animate-in fade-in duration-700">
      <div className="mx-auto" style={{ width: '90%', maxWidth: '1400px' }}>
        
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#7B1B1B] transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Return to Command Center
          </Link>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border-2 border-slate-200 shadow-sm" } }} />
        </div>
        
        <div className="flex items-center gap-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1B2B3A] tracking-tight">Virtue <span className="text-[#7B1B1B] italic">Lab</span></h1>
          <span className="bg-[#1B2B3A] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1"><Unlock size={10} /> Authorized</span>
        </div>

        <div className="bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] shadow-sm mb-16">
          <h2 className="text-3xl font-serif font-bold mb-10 text-[#1B2B3A] flex items-center border-b border-slate-100 pb-6">
            <Calendar size={28} className="mr-4 text-[#7B1B1B]" /> 52-Week Curriculum Map
          </h2>
          
          <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))' }}>
            {weeks.map(w => (
              <div key={w.weekNum} className="flex flex-col bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:border-[#7B1B1B]/50 hover:bg-white hover:shadow-md transition-all p-3 relative group min-h-[100px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">W{w.weekNum}</span>
                  <span className="text-2xl text-[#7B1B1B] leading-none">{w.virtue.guaXiang}</span>
                </div>
                <div className="text-[11px] font-bold text-[#1B2B3A] font-serif truncate w-full mb-1" title={w.virtue.name}>{w.virtue.chineseName}</div>
                <div className="text-[9px] text-slate-400 font-mono mb-1">{w.dateStr.slice(5)}</div>
                
                <div className="flex justify-between gap-[2px] mt-auto">
                  {w.days.map((dayDate) => {
                     const dayLogEntry = logs.find(log => log.date === dayDate && log.virtue === w.virtue.name);
                     const tooltipText = dayLogEntry ? `${dayDate}: Shortfall Logged - "${dayLogEntry.note.slice(0, 30)}..."` : `${dayDate}: Clear`;
                     return (
                       <div key={dayDate} className={`flex-1 aspect-square rounded-full transition-colors ${dayLogEntry ? 'bg-[#1B2B3A]' : 'bg-slate-200'}`} title={tooltipText}></div>
                     );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-serif font-bold mb-8 text-[#1B2B3A] flex items-center border-b border-slate-100 pb-6">
            <BookOpen size={28} className="mr-4 text-[#7B1B1B]" /> The 14 Virtues Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {virtues.map(v => (
              <div key={v.name} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col h-full">
                <div className="absolute -right-4 -bottom-6 text-7xl text-slate-50 opacity-[0.03] group-hover:opacity-10 transition-opacity font-serif pointer-events-none">{v.guaXiang}</div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#1B2B3A] tracking-tight">{v.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{v.guaName}</p>
                  </div>
                  <div className="text-4xl text-[#7B1B1B] leading-none">{v.guaXiang}</div>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-auto relative z-10">
                  <p className="text-xs text-slate-600 italic leading-relaxed font-serif">"{v.franklinDefinition}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}