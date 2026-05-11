# frontend

`frontend` 是本仓库中自动交易系统的前端目录，用于承载交易系统管理界面、研究结果展示界面和后续审批工作台。

当前目录已经包含一套基于以下技术栈的前端模板：

- React 18
- Vite
- TypeScript
- TailwindCSS
- Recharts
- lucide-react

## 前端定位

`frontend` 未来建议负责以下功能：

- 交易系统仪表盘
- 账户资产与组合展示
- 订单与成交记录页面
- 风控状态与审批页面
- 研究信号展示页面
- `tradingagents` 研究结果与 `backend` 执行结果的联动展示

## 与后端的职责边界

前端不直接承担任何交易逻辑，只负责展示、交互和审批流程。

职责划分如下：

- `tradingagents/`
  负责研究、分析、信号生成
- `backend/`
  负责交易系统后端、风控、持仓、订单、审计
- `frontend/`
  负责页面展示、管理后台和后续工作台

## 建议页面结构

建议前端后续逐步收敛为以下页面：

1. Dashboard
   展示账户净值、风险状态、策略摘要、最新信号
2. Signals
   展示 `tradingagents` 产出的结构化信号
3. Orders
   展示订单状态与执行结果
4. Fills
   展示成交记录
5. Portfolio
   展示持仓、现金、敞口、快照
6. Risk
   展示风控规则命中情况与审批状态
7. Audit
   展示关键系统事件日志

## 后续建议的接口依赖

前端后续主要依赖 `backend` 提供接口，建议优先对接：

- `GET /health`
- `GET /v1/accounts/default`
- `GET /v1/portfolio`
- `GET /v1/snapshots/latest`
- `POST /v1/accounts/bootstrap`

后续再扩展到：

- signals 查询接口
- orders 查询接口
- audit 查询接口
- risk 查询接口

## 当前阶段建议

当前阶段建议优先做：

1. 将现有模板页面与 `backend` 接口字段对齐
2. 建立统一的 API client
3. 优先接通 dashboard / portfolio / orders 三个页面
4. 为后续信号展示预留 `tradingagents` 数据视图

## 说明

当前目录不是空占位目录，而是已经存在基础模板。后续应在现有模板基础上迭代，不建议重新初始化另一个前端项目，以避免目录和技术栈重复。
    
