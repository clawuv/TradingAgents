// 设计提醒：图表区域使用深色盘面，柱线组合突出交易量和订单动能，避免默认白底图表感。
import { Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type VolumeChartProps = {
  data: { date: string; volume: number; orders: number }[]
}

export default function VolumeChart({ data }: VolumeChartProps) {
  return (
    <div className="h-80 rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-slate-950/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">最近 7 天交易量</h3>
          <p className="text-sm text-slate-400">柱状图表示成交额，折线表示订单动能</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-cyan-400/20">Volume Live</span>
      </div>
      <ResponsiveContainer width="100%" height="78%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <YAxis yAxisId="right" orientation="right" stroke="#22d3ee" fontSize={12} />
          <Tooltip
            contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 14, color: '#e2e8f0' }}
            formatter={(value, name) => [name === 'volume' ? Number(value).toLocaleString() : value, name === 'volume' ? '交易量' : '订单数']}
          />
          <Bar yAxisId="left" dataKey="volume" fill="#06b6d4" radius={[8, 8, 0, 0]} opacity={0.82} />
          <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
