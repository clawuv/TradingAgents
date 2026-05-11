// 设计提醒：用户/权限页要同时展示真实用户列表与当前角色权限矩阵，突出 RBAC 控制逻辑。
import { useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck, UserPlus, UsersRound } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage, listUsers, type UserListItem } from '@/services/api'
import { permissionLabels, type PermissionKey } from '@/mock/permission'

const permissionGroups: { title: string; keys: PermissionKey[] }[] = [
  { title: '菜单权限', keys: ['menu.dashboard', 'menu.orders', 'menu.assets', 'menu.trades', 'menu.users'] },
  { title: '订单权限', keys: ['orders.detail', 'orders.cancel'] },
  { title: '资产权限', keys: ['assets.view', 'assets.freeze'] },
  { title: '成交权限', keys: ['trades.export'] },
  { title: '用户权限', keys: ['users.view', 'users.create', 'users.edit', 'users.disable', 'roles.assign'] },
]

const roleLabels: Record<string, string> = {
  super_admin: '超级管理员',
  risk_manager: '风控经理',
  finance_operator: '财务运营',
  auditor: '审计员',
}

export default function Users() {
  const { roleInfo, currentUser, can } = useAuth()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      setError(null)
      try {
        const data = await listUsers()
        if (cancelled) return
        setUsers(data)
      } catch (err) {
        if (cancelled) return
        setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [])

  const columns: Column<UserListItem>[] = [
    { key: 'id', title: '用户ID', render: (row) => <span className="font-mono text-xs text-slate-600">USR-{String(row.id).padStart(4, '0')}</span> },
    { key: 'name', title: '姓名', render: (row) => <span className="font-semibold text-slate-950">{row.name}</span> },
    { key: 'email', title: '邮箱' },
    {
      key: 'role',
      title: '角色',
      render: (row) => <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">{roleLabels[row.role] ?? row.role}</span>,
    },
    {
      key: 'status',
      title: '状态',
      render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${row.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{row.status === 'active' ? '启用' : '停用'}</span>,
    },
    {
      key: 'mfa_enabled',
      title: 'MFA',
      render: (row) => <span className={row.mfa_enabled ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{row.mfa_enabled ? '已开启' : '未开启'}</span>,
    },
    { key: 'last_login_at', title: '最后登录', render: (row) => row.last_login_at ? formatDateTime(row.last_login_at) : '尚未登录' },
    {
      key: 'action',
      title: '操作',
      render: (row) => (
        <div className="flex gap-2">
          <button disabled={!can('users.edit')} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => alert(`编辑用户：${row.id}`)}>编辑</button>
          <button disabled={!can('users.disable') || row.id === currentUser?.id} className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => alert(`禁用用户：${row.id}`)}>禁用</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <div className="mb-5 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300 ring-1 ring-cyan-400/20"><ShieldCheck className="h-7 w-7" /></div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RBAC Overview</p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight">当前角色：{roleInfo.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{roleInfo.description}</p>
            <p className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">当前登录用户是 {currentUser?.name ?? '未登录'}，菜单和按钮权限已由真实登录态接管，不再支持前端假切角色。</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">当前角色权限矩阵</h3>
              <p className="text-sm text-slate-500">基于当前登录角色展示可访问菜单与操作权限</p>
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
              <p className="text-sm text-slate-500">来自 backend 的真实注册用户和管理员账号</p>
            </div>
          </div>
          <button disabled={!can('users.create')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => alert('请使用注册页新增用户')}><UserPlus className="h-4 w-4" />新增用户</button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>用户数据加载失败：{error}</div>
          </div>
        )}

        <DataTable columns={columns} data={users} showPagination={false} />
        {loading && <div className="text-sm text-slate-500">正在加载用户数据...</div>}
      </section>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
