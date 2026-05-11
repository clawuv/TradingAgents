// 设计提醒：交易控制台采用“深色指挥舱 + 霓虹行情脉冲”语言，数据必须服务于高密度决策场景。
export type OrderStatus = '已完成' | '部分成交' | '已取消'
export type Direction = '买' | '卖'

export interface Order {
  id: string
  pair: 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT'
  direction: Direction
  price: number
  quantity: number
  status: OrderStatus
  time: string
}

export interface Asset {
  coin: string
  available: number
  frozen: number
  valuation: number
}

export interface Trade {
  id: string
  time: string
  pair: 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT'
  direction: Direction
  price: number
  quantity: number
  fee: number
}

export const mockStats = {
  totalAssets: 1289450.72,
  todayPnl: 18425.31,
  totalVolume: 8923400.16,
  activeOrders: 18,
}

export const mockVolumeData = [
  { date: '05-05', volume: 920000, orders: 128 },
  { date: '05-06', volume: 1180000, orders: 166 },
  { date: '05-07', volume: 970000, orders: 141 },
  { date: '05-08', volume: 1460000, orders: 202 },
  { date: '05-09', volume: 1390000, orders: 188 },
  { date: '05-10', volume: 1720000, orders: 231 },
  { date: '05-11', volume: 1280000, orders: 176 },
]

export const mockOrders: Order[] = [
  { id: 'ORD-20260511-001', pair: 'BTC/USDT', direction: '买', price: 64210.34, quantity: 0.42, status: '部分成交', time: '2026-05-11 09:42:18' },
  { id: 'ORD-20260511-002', pair: 'ETH/USDT', direction: '卖', price: 3128.56, quantity: 8.5, status: '已完成', time: '2026-05-11 09:37:04' },
  { id: 'ORD-20260511-003', pair: 'SOL/USDT', direction: '买', price: 152.77, quantity: 120, status: '已取消', time: '2026-05-11 09:21:55' },
  { id: 'ORD-20260510-004', pair: 'BTC/USDT', direction: '卖', price: 63890.18, quantity: 0.31, status: '已完成', time: '2026-05-10 22:14:31' },
  { id: 'ORD-20260510-005', pair: 'ETH/USDT', direction: '买', price: 3094.62, quantity: 5.2, status: '部分成交', time: '2026-05-10 21:48:09' },
  { id: 'ORD-20260510-006', pair: 'SOL/USDT', direction: '卖', price: 156.13, quantity: 88, status: '已完成', time: '2026-05-10 20:33:46' },
  { id: 'ORD-20260510-007', pair: 'BTC/USDT', direction: '买', price: 63672.8, quantity: 0.18, status: '已完成', time: '2026-05-10 19:07:12' },
  { id: 'ORD-20260510-008', pair: 'ETH/USDT', direction: '卖', price: 3152.9, quantity: 3.8, status: '已取消', time: '2026-05-10 18:55:40' },
  { id: 'ORD-20260510-009', pair: 'SOL/USDT', direction: '买', price: 149.45, quantity: 210, status: '已完成', time: '2026-05-10 17:19:11' },
  { id: 'ORD-20260510-010', pair: 'BTC/USDT', direction: '卖', price: 64102.11, quantity: 0.26, status: '部分成交', time: '2026-05-10 16:38:27' },
  { id: 'ORD-20260509-011', pair: 'ETH/USDT', direction: '买', price: 3067.21, quantity: 6.1, status: '已完成', time: '2026-05-09 23:43:52' },
  { id: 'ORD-20260509-012', pair: 'SOL/USDT', direction: '卖', price: 158.7, quantity: 95, status: '已完成', time: '2026-05-09 22:20:16' },
  { id: 'ORD-20260509-013', pair: 'BTC/USDT', direction: '买', price: 62980.54, quantity: 0.52, status: '已取消', time: '2026-05-09 20:15:33' },
  { id: 'ORD-20260509-014', pair: 'ETH/USDT', direction: '卖', price: 3184.4, quantity: 2.4, status: '部分成交', time: '2026-05-09 18:46:04' },
  { id: 'ORD-20260509-015', pair: 'SOL/USDT', direction: '买', price: 151.08, quantity: 180, status: '已完成', time: '2026-05-09 16:29:45' },
  { id: 'ORD-20260508-016', pair: 'BTC/USDT', direction: '卖', price: 64688.31, quantity: 0.21, status: '已完成', time: '2026-05-08 21:09:14' },
  { id: 'ORD-20260508-017', pair: 'ETH/USDT', direction: '买', price: 3042.18, quantity: 7.7, status: '已完成', time: '2026-05-08 19:32:02' },
  { id: 'ORD-20260508-018', pair: 'SOL/USDT', direction: '卖', price: 160.25, quantity: 64, status: '已取消', time: '2026-05-08 15:51:39' },
  { id: 'ORD-20260508-019', pair: 'BTC/USDT', direction: '买', price: 63120.74, quantity: 0.37, status: '部分成交', time: '2026-05-08 12:27:20' },
  { id: 'ORD-20260508-020', pair: 'ETH/USDT', direction: '卖', price: 3117.83, quantity: 4.9, status: '已完成', time: '2026-05-08 10:02:11' },
  { id: 'ORD-20260507-021', pair: 'SOL/USDT', direction: '买', price: 147.9, quantity: 230, status: '已完成', time: '2026-05-07 22:18:57' },
  { id: 'ORD-20260507-022', pair: 'BTC/USDT', direction: '卖', price: 65020.12, quantity: 0.16, status: '已完成', time: '2026-05-07 18:36:43' },
]

export const mockAssets: Asset[] = [
  { coin: 'BTC', available: 6.2842, frozen: 0.42, valuation: 430842.15 },
  { coin: 'ETH', available: 148.35, frozen: 8.5, valuation: 490982.44 },
  { coin: 'SOL', available: 2490.18, frozen: 120, valuation: 398116.89 },
  { coin: 'USDT', available: 184920.58, frozen: 24840, valuation: 209760.58 },
  { coin: 'BNB', available: 96.72, frozen: 0, valuation: 57840.42 },
]

export const mockTrades: Trade[] = [
  { id: 'TRD-001', time: '2026-05-11 09:40:02', pair: 'BTC/USDT', direction: '买', price: 64208.12, quantity: 0.18, fee: 5.78 },
  { id: 'TRD-002', time: '2026-05-11 09:33:18', pair: 'ETH/USDT', direction: '卖', price: 3128.56, quantity: 3.4, fee: 4.25 },
  { id: 'TRD-003', time: '2026-05-11 09:26:49', pair: 'BTC/USDT', direction: '买', price: 64218.74, quantity: 0.11, fee: 3.53 },
  { id: 'TRD-004', time: '2026-05-10 22:11:20', pair: 'SOL/USDT', direction: '卖', price: 156.13, quantity: 88, fee: 5.5 },
  { id: 'TRD-005', time: '2026-05-10 21:42:36', pair: 'ETH/USDT', direction: '买', price: 3094.62, quantity: 2.8, fee: 3.47 },
  { id: 'TRD-006', time: '2026-05-10 19:01:06', pair: 'BTC/USDT', direction: '买', price: 63672.8, quantity: 0.18, fee: 4.58 },
  { id: 'TRD-007', time: '2026-05-10 17:12:53', pair: 'SOL/USDT', direction: '买', price: 149.45, quantity: 110, fee: 6.57 },
  { id: 'TRD-008', time: '2026-05-10 16:30:19', pair: 'BTC/USDT', direction: '卖', price: 64102.11, quantity: 0.08, fee: 2.56 },
  { id: 'TRD-009', time: '2026-05-09 23:39:58', pair: 'ETH/USDT', direction: '买', price: 3067.21, quantity: 6.1, fee: 7.49 },
  { id: 'TRD-010', time: '2026-05-09 22:18:11', pair: 'SOL/USDT', direction: '卖', price: 158.7, quantity: 95, fee: 6.03 },
  { id: 'TRD-011', time: '2026-05-09 18:38:00', pair: 'ETH/USDT', direction: '卖', price: 3184.4, quantity: 1.1, fee: 1.4 },
  { id: 'TRD-012', time: '2026-05-09 16:26:29', pair: 'SOL/USDT', direction: '买', price: 151.08, quantity: 180, fee: 10.88 },
  { id: 'TRD-013', time: '2026-05-08 21:03:31', pair: 'BTC/USDT', direction: '卖', price: 64688.31, quantity: 0.21, fee: 5.43 },
  { id: 'TRD-014', time: '2026-05-08 19:27:04', pair: 'ETH/USDT', direction: '买', price: 3042.18, quantity: 7.7, fee: 9.37 },
  { id: 'TRD-015', time: '2026-05-08 12:20:42', pair: 'BTC/USDT', direction: '买', price: 63120.74, quantity: 0.19, fee: 4.8 },
  { id: 'TRD-016', time: '2026-05-08 09:45:13', pair: 'ETH/USDT', direction: '卖', price: 3117.83, quantity: 4.9, fee: 6.11 },
  { id: 'TRD-017', time: '2026-05-07 22:13:21', pair: 'SOL/USDT', direction: '买', price: 147.9, quantity: 230, fee: 13.61 },
]

export type PositionSide = '多' | '空'
export type MarginMode = '全仓' | '逐仓'

export interface Position {
  id: string
  pair: 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT'
  side: PositionSide
  marginMode: MarginMode
  leverage: number
  size: number
  entryPrice: number
  markPrice: number
  margin: number
  liquidationPrice: number
  unrealizedPnl: number
  roe: number
  riskLevel: '低' | '中' | '高'
  openedAt: string
}

export const mockPositions: Position[] = [
  { id: 'POS-001', pair: 'BTC/USDT', side: '多', marginMode: '逐仓', leverage: 5, size: 0.42, entryPrice: 62480.25, markPrice: 64218.72, margin: 5248.34, liquidationPrice: 53880.4, unrealizedPnl: 730.16, roe: 13.91, riskLevel: '低', openedAt: '2026-05-10 14:22:18' },
  { id: 'POS-002', pair: 'ETH/USDT', side: '空', marginMode: '全仓', leverage: 3, size: 8.5, entryPrice: 3188.4, markPrice: 3128.56, margin: 9033.8, liquidationPrice: 3824.9, unrealizedPnl: 508.64, roe: 5.63, riskLevel: '低', openedAt: '2026-05-10 21:03:42' },
  { id: 'POS-003', pair: 'SOL/USDT', side: '多', marginMode: '逐仓', leverage: 10, size: 120, entryPrice: 148.32, markPrice: 152.77, margin: 1779.84, liquidationPrice: 134.2, unrealizedPnl: 534.0, roe: 30.0, riskLevel: '中', openedAt: '2026-05-11 08:17:06' },
  { id: 'POS-004', pair: 'BTC/USDT', side: '空', marginMode: '逐仓', leverage: 8, size: 0.18, entryPrice: 65120.5, markPrice: 64218.72, margin: 1465.21, liquidationPrice: 71890.2, unrealizedPnl: 162.32, roe: 11.08, riskLevel: '中', openedAt: '2026-05-09 19:45:33' },
  { id: 'POS-005', pair: 'ETH/USDT', side: '多', marginMode: '逐仓', leverage: 12, size: 4.2, entryPrice: 3056.72, markPrice: 3128.56, margin: 1069.85, liquidationPrice: 2844.6, unrealizedPnl: 301.73, roe: 28.20, riskLevel: '高', openedAt: '2026-05-11 09:08:51' },
]

export type ResearchCategory = '宏观策略' | '链上数据' | '技术分析' | '行业专题' | '风险提示'
export type ResearchRating = '看多' | '中性' | '谨慎'

export interface ResearchReport {
  id: string
  title: string
  category: ResearchCategory
  author: string
  rating: ResearchRating
  symbols: string[]
  publishedAt: string
  readTime: number
  summary: string
  confidence: number
  tags: string[]
  bookmarked: boolean
}

export const mockResearchReports: ResearchReport[] = [
  { id: 'RPT-20260511-001', title: 'BTC 突破震荡区间后的资金流与压力位观察', category: '技术分析', author: '策略研究组', rating: '看多', symbols: ['BTC/USDT'], publishedAt: '2026-05-11 09:30', readTime: 8, summary: 'BTC 在高位放量后维持强势结构，若能站稳 64,000 上方，短线资金可能继续测试前高压力。', confidence: 86, tags: ['BTC', '压力位', '资金流'], bookmarked: true },
  { id: 'RPT-20260511-002', title: 'ETH 质押收益回升对中期估值的影响', category: '行业专题', author: '资产研究组', rating: '中性', symbols: ['ETH/USDT'], publishedAt: '2026-05-11 08:45', readTime: 10, summary: 'ETH 质押收益改善提供估值支撑，但链上活跃度尚未同步走强，建议关注后续费用收入恢复。', confidence: 74, tags: ['ETH', '质押', '估值'], bookmarked: false },
  { id: 'RPT-20260510-003', title: 'SOL 生态交易活跃度与短线波动风险', category: '链上数据', author: '链上研究组', rating: '谨慎', symbols: ['SOL/USDT'], publishedAt: '2026-05-10 22:10', readTime: 7, summary: 'SOL 链上交易笔数维持高位，但短线杠杆资金偏拥挤，价格波动可能加大。', confidence: 79, tags: ['SOL', '链上活跃', '杠杆'], bookmarked: false },
  { id: 'RPT-20260510-004', title: '美元流动性边际变化与加密资产风险偏好', category: '宏观策略', author: '宏观研究组', rating: '中性', symbols: ['BTC/USDT', 'ETH/USDT'], publishedAt: '2026-05-10 18:20', readTime: 12, summary: '美元流动性指标尚未出现趋势性恶化，风险资产仍处于震荡偏强环境，但需关注利率预期扰动。', confidence: 81, tags: ['宏观', '流动性', '风险偏好'], bookmarked: true },
  { id: 'RPT-20260509-005', title: '高杠杆行情下的强平风险监控框架', category: '风险提示', author: '风控研究组', rating: '谨慎', symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], publishedAt: '2026-05-09 16:00', readTime: 9, summary: '多币种合约资金费率升温，需提高强平距离监控频率，并对高杠杆仓位设置动态止损。', confidence: 88, tags: ['风控', '强平', '杠杆'], bookmarked: false },
  { id: 'RPT-20260508-006', title: '主流币轮动节奏：从 BTC 到高 Beta 资产', category: '宏观策略', author: '策略研究组', rating: '看多', symbols: ['BTC/USDT', 'SOL/USDT'], publishedAt: '2026-05-08 11:35', readTime: 11, summary: '资金从 BTC 向高 Beta 资产扩散的迹象增强，若成交量继续放大，SOL 等资产可能获得更高弹性。', confidence: 77, tags: ['轮动', 'Beta', '成交量'], bookmarked: false },
]

export type NewsCategory = '市场快讯' | '政策监管' | '项目动态' | '交易所公告' | '宏观财经'
export type NewsImpact = '高' | '中' | '低'

export interface NewsItem {
  id: string
  title: string
  category: NewsCategory
  impact: NewsImpact
  source: string
  publishedAt: string
  summary: string
  symbols: string[]
  read: boolean
  bookmarked: boolean
}

export const mockNewsItems: NewsItem[] = [
  { id: 'NEWS-001', title: 'BTC 短线突破 64,000 USDT，现货成交量同步放大', category: '市场快讯', impact: '高', source: 'Market Watch', publishedAt: '2026-05-11 10:18', summary: 'BTC 在亚洲交易时段突破关键整数位，主动买盘增强，短线波动率回升。', symbols: ['BTC/USDT'], read: false, bookmarked: true },
  { id: 'NEWS-002', title: '某主流交易所发布合约保证金阶梯调整公告', category: '交易所公告', impact: '中', source: 'Exchange Notice', publishedAt: '2026-05-11 09:50', summary: '公告涉及 BTC、ETH、SOL 多个合约交易对，部分高杠杆档位维持保证金上调。', symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], read: false, bookmarked: false },
  { id: 'NEWS-003', title: 'ETH 链上 Gas 费用回落，DeFi 交互活跃度小幅恢复', category: '项目动态', impact: '中', source: 'On-chain Daily', publishedAt: '2026-05-11 09:12', summary: '链上数据显示 DEX 交易和借贷协议交互次数回升，但整体资金流入仍偏温和。', symbols: ['ETH/USDT'], read: true, bookmarked: false },
  { id: 'NEWS-004', title: '多地监管机构提示高杠杆加密衍生品风险', category: '政策监管', impact: '高', source: 'Regulation Wire', publishedAt: '2026-05-10 22:30', summary: '监管提示强调投资者需关注保证金、强平机制与极端波动风险。', symbols: ['BTC/USDT', 'ETH/USDT'], read: true, bookmarked: true },
  { id: 'NEWS-005', title: '美元指数小幅走弱，风险资产情绪边际改善', category: '宏观财经', impact: '中', source: 'Macro Lens', publishedAt: '2026-05-10 20:05', summary: '美元指数回落带动市场风险偏好改善，加密资产与美股科技板块同步反弹。', symbols: ['BTC/USDT'], read: false, bookmarked: false },
  { id: 'NEWS-006', title: 'SOL 生态 Meme 交易热度回升，短线资金分歧加大', category: '市场快讯', impact: '低', source: 'Crypto Pulse', publishedAt: '2026-05-10 18:42', summary: 'SOL 链上交易活跃，但高频资金撤退速度也较快，需警惕短线回撤。', symbols: ['SOL/USDT'], read: false, bookmarked: false },
  { id: 'NEWS-007', title: '稳定币供应量连续三周增长，场内流动性维持改善', category: '宏观财经', impact: '高', source: 'Stablecoin Monitor', publishedAt: '2026-05-09 16:15', summary: '稳定币总供应持续增长，为加密市场风险偏好提供流动性基础。', symbols: ['BTC/USDT', 'ETH/USDT'], read: true, bookmarked: false },
]
