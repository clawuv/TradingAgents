import axios from 'axios'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8010'
const AUTH_TOKEN_KEY = 'backend_access_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type SignalType = 'BUY' | 'SELL' | 'HOLD'
export type SignalStatus = 'NEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED'
export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'FILLED' | 'CANCELLED' | 'REJECTED'

export interface AccountSummary {
  account_id: string
  cash_balance: number
  equity: number
  base_currency?: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'
  status: string
  mfa_enabled: boolean
  last_login_at: string | null
  created_at: string
}

export interface SignalIngestRequest {
  run_id: string
  symbol: string
  as_of_date: string
  signal: SignalType
  confidence: number
  suggested_position_pct: number
  time_horizon_days: number
  thesis: string
  risks: string[]
  invalidators: string[]
  evidence: Record<string, string>
}

export interface SignalResponse {
  id: number
  symbol: string
  signal: SignalType
  status: SignalStatus
}

export interface RiskEvaluationResponse {
  signal_id: number
  status: 'APPROVED' | 'REJECTED'
  reason: string
  applied_rules: Record<string, unknown>
}

export interface OrderSubmitResponse {
  order_id: number
  status: OrderStatus
  symbol: string
  qty: number
  signal_id: number
}

export interface OrderListItem {
  order_id: number
  signal_id: number
  account_id: string
  symbol: string
  side: 'BUY' | 'SELL'
  order_type: string
  qty: number
  status: OrderStatus
  limit_price: number | null
  fill_price: number | null
  fee: number | null
  submitted_at: string | null
  created_at: string
}

export interface PositionView {
  symbol: string
  qty: number
  avg_cost: number
  market_price: number
  market_value: number
}

export interface PortfolioResponse {
  account_id: string
  positions: PositionView[]
}

export interface SnapshotResponse {
  account_id: string
  cash: number
  equity: number
  gross_exposure: number
  net_exposure: number
  drawdown: number
  snapshot_at: string
}

export interface ApiErrorPayload {
  detail?: string
  error?: {
    code?: string
    message?: string
    details?: Record<string, unknown>
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
  role?: 'risk_manager' | 'finance_operator' | 'auditor'
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  user: AuthUser
}

export interface UserListItem extends AuthUser {}

export interface UserUpdateRequest {
  name?: string
  phone?: string
  role?: 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'
  mfa_enabled?: boolean
}

export interface UserCreateRequest {
  name: string
  email: string
  password: string
  phone?: string
  role: 'super_admin' | 'risk_manager' | 'finance_operator' | 'auditor'
  mfa_enabled?: boolean
}

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.detail ??
      error.message ??
      'Request failed'
    )
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown error'
}

export async function healthCheck() {
  const { data } = await apiClient.get<{ status: string }>('/health')
  return data
}

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<LoginResponse>('/v1/auth/login', payload)
  return data
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post<LoginResponse>('/v1/auth/register', payload)
  return data
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<AuthUser>('/v1/auth/me')
  return data
}

export async function logout() {
  const { data } = await apiClient.post<{ status: string; user_id: number }>('/v1/auth/logout', {})
  return data
}

export async function listUsers() {
  const { data } = await apiClient.get<UserListItem[]>('/v1/users')
  return data
}

export async function updateUser(userId: number, payload: UserUpdateRequest) {
  const { data } = await apiClient.patch<UserListItem>(`/v1/users/${userId}`, payload)
  return data
}

export async function disableUser(userId: number) {
  const { data } = await apiClient.post<UserListItem>(`/v1/users/${userId}/disable`, {})
  return data
}

export async function createUser(payload: UserCreateRequest) {
  const { data } = await apiClient.post<UserListItem>('/v1/users', payload)
  return data
}

export async function bootstrapDefaultAccount() {
  const { data } = await apiClient.post<AccountSummary>('/v1/accounts/bootstrap', {})
  return data
}

export async function getDefaultAccount() {
  const { data } = await apiClient.get<AccountSummary>('/v1/accounts/default')
  return data
}

export async function ingestSignal(payload: SignalIngestRequest) {
  const { data } = await apiClient.post<SignalResponse>('/v1/signals/ingest', payload)
  return data
}

export async function evaluateRisk(signalId: number) {
  const { data } = await apiClient.post<RiskEvaluationResponse>(`/v1/risk/evaluate/${signalId}`)
  return data
}

export async function submitOrder(signalId: number) {
  const { data } = await apiClient.post<OrderSubmitResponse>(`/v1/orders/submit/${signalId}`)
  return data
}

export async function listOrders() {
  const { data } = await apiClient.get<OrderListItem[]>('/v1/orders')
  return data
}

export async function getPortfolio() {
  const { data } = await apiClient.get<PortfolioResponse>('/v1/portfolio')
  return data
}

export async function createSnapshot() {
  const { data } = await apiClient.post<SnapshotResponse>('/v1/snapshots/create', {})
  return data
}

export async function getLatestSnapshot() {
  const { data } = await apiClient.get<SnapshotResponse>('/v1/snapshots/latest')
  return data
}
