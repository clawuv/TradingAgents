// 设计提醒：统计卡片像交易终端的状态灯，强对比数字、微妙发光、 hover 反馈都要强化“实时资金面板”。
import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string
  icon: LucideIcon
  change?: string
  tone?: 'cyan' | 'emerald' | 'amber' | 'rose'
}

const toneMap = {
  cyan: 'from-cyan-400/20 to-sky-500/5 text-cyan-300 ring-cyan-400/20',
  emerald: 'from-emerald-400/20 to-teal-500/5 text-emerald-300 ring-emerald-400/20',
  amber: 'from-amber-400/20 to-orange-500/5 text-amber-300 ring-amber-400/20',
  rose: 'from-rose-400/20 to-pink-500/5 text-rose-300 ring-rose-400/20',
}

export default function StatCard({ title, value, icon: Icon, change, tone = 'cyan' }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-950/30">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${toneMap[tone]} blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
          {change && <p className="mt-2 text-xs font-medium text-emerald-300">{change}</p>}
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-3 ring-1 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
