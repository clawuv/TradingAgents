// 设计提醒：用户/权限页要同时展示用户列表、角色能力矩阵和当前角色菜单效果，突出 RBAC 控制逻辑。
import { ShieldCheck, UserPlus, UsersRound } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { mockRoles, mockUsers, permissionLabels, type PermissionKey, type RoleKey } from '@/mock/permission'

type UserRow = (typeof mockUsers)[number]

const permissionGroups: { title: string; keys: PermissionKey[] }[] = [
  { title: '菜单权限', keys: ['menu.dashboard', 'menu.orders', 'menu.assets', 'menu.trades', 'menu.users'] },
  { title: '订单权限', keys: ['orders.detail', 'orders.cancel'] },
  { title: '资产权限', keys: ['assets.view', 'assets.freeze'] },
  { title: '成交权限', keys: ['trades.export'] },
  { title: '用户权限', keys: ['users.view', 'users.create', 'users.edit', 'users.disable', 'roles.assign'] },
]

export default function Users() {
  const { currentRole, setCurrentRole, roleInfo, can } = useAuth()

  const columns: Column<UserRow>[] = [
    { key: 'id', title: '用户ID', render: (row) => <span className="font-mono text-xs text-slate-600">{row.id}</span> },
    { key: 'name', title: '姓名', render: (row) => <span className="font-semibold text-slate-950">{row.name}</span> },
    { key: 'email', title: '邮箱' },
    { key: 'role', title: '角色', render: (row) => <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">{row.role}</span> },
    { key: 'status', title: '状态', render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${row.status === '启用' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{row.status}</span> },
    { key: 'mfa', title: 'MFA', render: (row) => <span className={row.mfa === '已开启' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{row.mfa}</span> },
    { key: 'lastLogin', title: '最后登录' },
    { key: 'action', title: '操作', render: (row) => <div className="flex gap-2"><button disabled={!can('users.edit')} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => alert(`编辑用户：${row.id}`)}>编辑</button><button disabled={!can('users.disable')} className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => alert(`禁用用户：${row.id}`)}>禁用</button></div> },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <div className="mb-5 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300 ring-1 ring-cyan-400/20"><ShieldCheck className="h-7 w-7" /></div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RBAC Simulator</p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight">当前角色：{roleInfo.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{roleInfo.description}</p>
            <label className="mt-6 block space-y-2 text-sm font-medium text-slate-300">
              <span>切换当前登录角色</span>
              <select className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={currentRole} onChange={(e) => setCurrentRole(e.target.value as RoleKey)}>
                {mockRoles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}
              </select>
            </label>
            <p className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">侧边栏菜单会根据当前角色的 <span className="font-mono">menu.*</span> 权限实时过滤；无权限路由会自动回到仪表盘。</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">角色权限矩阵</h3>
              <p className="text-sm text-slate-500">用勾选状态展示不同角色拥有的菜单与操作权限</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{roleInfo.permissions.length} 项权限</span>
          </div>
          <div className="max-h-[360px] space-y-4 overflow-auto pr-2">
            {permissionGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {group.keys.map((key) => {
                    const enabled = can(key)
                    return <div key={key} className={`rounded-xl border px-3 py-2 text-sm ${enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>{enabled ? '✓' : '—'} {permissionLabels[key]}</div>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><UsersRound className="h-6 w-6" /></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">用户列表</h3>
              <p className="text-sm text-slate-500">按钮可用状态由 users.edit / users.disable 权限控制</p>
            </div>
          </div>
          <button disabled={!can('users.create')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => alert('新增用户')}><UserPlus className="h-4 w-4" />新增用户</button>
        </div>
        <DataTable columns={columns} data={mockUsers} showPagination={false} />
      </section>
    </div>
  )
}
