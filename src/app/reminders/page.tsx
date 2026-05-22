"use client";

import { Bell, CalendarDays, Check, CreditCard, RotateCcw, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useReminders } from "@/hooks/useReminders";
import { addDays } from "@/lib/reminders";
import type { ReminderItem, ReminderType } from "@/types/reminder";

const copy = {
  "zh-CN": {
    back: "返回",
    completed: "已完成 / 已忽略",
    done: "完成",
    detail: "查看详情",
    emptyToday: "今天没有提醒",
    emptyWeek: "本周没有提醒",
    future: "以后",
    ignored: "已忽略",
    later: "稍后查看",
    restore: "恢复",
    summaryDone: "已完成",
    summaryToday: "今日提醒",
    summaryWeek: "本周提醒",
    thisWeek: "本周",
    title: "提醒中心",
    tomorrow: "明天",
    today: "今天",
    typeLabels: { garbage: "垃圾", monthlyPayment: "缴费", holiday: "节日", residenceCard: "在留卡", custom: "日历备注" },
  },
  "zh-TW": {
    back: "返回",
    completed: "已完成 / 已忽略",
    done: "完成",
    detail: "查看詳情",
    emptyToday: "今天沒有提醒",
    emptyWeek: "本週沒有提醒",
    future: "以後",
    ignored: "已忽略",
    later: "稍後查看",
    restore: "恢復",
    summaryDone: "已完成",
    summaryToday: "今日提醒",
    summaryWeek: "本週提醒",
    thisWeek: "本週",
    title: "提醒中心",
    tomorrow: "明天",
    today: "今天",
    typeLabels: { garbage: "垃圾", monthlyPayment: "繳費", holiday: "節日", residenceCard: "在留卡", custom: "日曆備註" },
  },
  ja: {
    back: "戻る",
    completed: "完了 / 非表示",
    done: "完了",
    detail: "詳細を見る",
    emptyToday: "今日のリマインダーはありません",
    emptyWeek: "今週のリマインダーはありません",
    future: "今後",
    ignored: "非表示",
    later: "あとで見る",
    restore: "戻す",
    summaryDone: "完了",
    summaryToday: "今日",
    summaryWeek: "今週",
    thisWeek: "今週",
    title: "リマインダー",
    tomorrow: "明日",
    today: "今日",
    typeLabels: { garbage: "ごみ", monthlyPayment: "支払い", holiday: "祝日", residenceCard: "在留カード", custom: "カレンダーメモ" },
  },
} as const;

export default function RemindersPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { activeReminders, completedReminders, diffFromToday, dismissReminder, doneReminder, restoreReminder, today, todayCount, weekCount } = useReminders();

  const groups = useMemo(() => {
    const tomorrow = addDays(today, 1);
    return {
      today: activeReminders.filter((item) => item.date === today),
      tomorrow: activeReminders.filter((item) => item.date === tomorrow),
      week: activeReminders.filter((item) => {
        const diff = diffFromToday(item.date);
        return diff >= 2 && diff <= 7;
      }),
      future: activeReminders.filter((item) => diffFromToday(item.date) > 7),
    };
  }, [activeReminders, diffFromToday, today]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-5 shadow-2xl shadow-stone-300/40">
        <header className="mb-4 flex items-center justify-between">
          <BackButton label={text.back} />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </header>

        <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-[#DFF1FF] via-white to-[#F6FAFF] p-5 text-slate-950 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
            <Bell className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{text.title}</h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Summary label={text.summaryToday} value={todayCount} />
            <Summary label={text.summaryWeek} value={weekCount} />
            <Summary label={text.summaryDone} value={completedReminders.length} />
          </div>
        </section>

        <ReminderSection emptyText={text.emptyToday} items={groups.today} onDismiss={dismissReminder} onDone={doneReminder} onRestore={restoreReminder} text={text} title={text.today} />
        <ReminderSection emptyText={text.emptyToday} items={groups.tomorrow} onDismiss={dismissReminder} onDone={doneReminder} onRestore={restoreReminder} text={text} title={text.tomorrow} />
        <ReminderSection emptyText={text.emptyWeek} items={groups.week} onDismiss={dismissReminder} onDone={doneReminder} onRestore={restoreReminder} text={text} title={text.thisWeek} />
        <ReminderSection emptyText={text.emptyWeek} items={groups.future} onDismiss={dismissReminder} onDone={doneReminder} onRestore={restoreReminder} text={text} title={text.future} />
        <ReminderSection completed emptyText={text.emptyWeek} items={completedReminders} onDismiss={dismissReminder} onDone={doneReminder} onRestore={restoreReminder} text={text} title={text.completed} />
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
      <p className="text-[10px] font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#2563EB]">{value}</p>
    </div>
  );
}

function ReminderSection({
  completed = false,
  emptyText,
  items,
  onDismiss,
  onDone,
  onRestore,
  text,
  title,
}: {
  completed?: boolean;
  emptyText: string;
  items: ReminderItem[];
  onDismiss: (id: string) => void;
  onDone: (id: string) => void;
  onRestore: (id: string) => void;
  text: (typeof copy)[keyof typeof copy];
  title: string;
}) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 px-1 text-lg font-black">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-[22px] bg-white p-4 text-sm font-bold text-stone-500 shadow-sm">{emptyText}</div>
      ) : (
        <div className="grid gap-2.5">
          {items.map((item) => (
          <ReminderCard completed={completed} item={item} key={item.id} onDismiss={onDismiss} onDone={onDone} onRestore={onRestore} text={text} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReminderCard({
  completed,
  item,
  onDismiss,
  onDone,
  onRestore,
  text,
}: {
  completed: boolean;
  item: ReminderItem;
  onDismiss: (id: string) => void;
  onDone: (id: string) => void;
  onRestore: (id: string) => void;
  text: (typeof copy)[keyof typeof copy];
}) {
  const Icon = getReminderIcon(item.type);
  return (
    <article className="rounded-[22px] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getReminderColor(item.type)}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-black text-stone-600">{text.typeLabels[item.type]}</span>
            <span className="text-[10px] font-black text-stone-400">{item.date}{item.time ? ` ${item.time}` : ""}</span>
          </div>
          <h3 className="mt-1 text-sm font-black leading-5">{item.title}</h3>
          {item.description && <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{item.description}</p>}
          {item.targetUrl && (
            <Link className="mt-2 inline-flex text-xs font-black text-emerald-800" href={item.targetUrl}>
              {text.detail}
            </Link>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {completed ? (
          <button className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800" onClick={() => onRestore(item.id)} type="button">
            <RotateCcw className="h-4 w-4" />
            {text.restore}
          </button>
        ) : (
          <>
            <button className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-3 py-2 text-xs font-black text-white" onClick={() => onDone(item.id)} type="button">
              <Check className="h-4 w-4" />
              {text.done}
            </button>
            <button className="flex items-center justify-center gap-2 rounded-2xl bg-stone-100 px-3 py-2 text-xs font-black text-stone-600" onClick={() => onDismiss(item.id)} type="button">
              <X className="h-4 w-4" />
              {text.later}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function getReminderIcon(type: ReminderType): LucideIcon {
  switch (type) {
    case "garbage":
      return Trash2;
    case "monthlyPayment":
      return CreditCard;
    case "holiday":
      return CalendarDays;
    case "residenceCard":
      return Bell;
    case "custom":
      return Bell;
  }
}

function getReminderColor(type: ReminderType) {
  switch (type) {
    case "garbage":
      return "bg-amber-50 text-amber-700";
    case "monthlyPayment":
      return "bg-sky-50 text-sky-700";
    case "holiday":
      return "bg-rose-50 text-rose-700";
    case "residenceCard":
      return "bg-violet-50 text-violet-700";
    case "custom":
      return "bg-emerald-50 text-emerald-700";
  }
}
