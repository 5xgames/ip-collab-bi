# IP 游戏化项目数据结构

本目录保存“日本 IP 游戏化项目库”的网页数据。`projects.json` 是标准 JSON，`projects.js` 是允许网页在本机直接打开的同内容版本。

## projects

每个独立游戏项目一条记录，建议字段：

- `id`：稳定的项目键
- `productName`：游戏产品名称
- `ipName`：原作 IP
- `ipType`：动漫、漫画、轻小说、游戏、VTuber 等
- `genre`：游戏类型
- `developer`、`publisher`
- `announcementDate`：首次正式公布日期
- `status`：announced、testing、preregister、upcoming、launched、delayed、cancelled、ended
- `summary`：项目内容简介
- `sourceUrl`、`verifiedAt`

## releases

每条记录代表一个“项目 × 地区 × 平台/商店”版本：

- `id`、`projectId`
- `platform`：ios、android、steam、windows、switch、playstation、xbox、web、wechat_minigame、douyin_minigame
- `region`：CN、HK、TW、JP、KR、SEA、US；仅有跨地区公告时使用 GLOBAL 或 ASIA，并在页面明确标为公告范围
- `store`、`storeId`
- `plannedLaunchDate`：计划上线日期或时间窗口
- `actualLaunchDate`：实际上线日期
- `testStartDate`、`preregisterDate`、`serviceEndDate`
- `status`、`sourceUrl`、`verifiedAt`

## rankSnapshots

每条记录保存一个平台原生指标：

- `releaseId`、`date`
- `metricType`：free_rank、grossing_rank、top_seller_rank、concurrent_users、download_rank、physical_sales、review_count、review_score 等
- `rank`：榜单名次
- `value`：销量、在线人数或评价数值
- `display`：需要保留原始文本口径时使用，例如商店奖项或“Steam 历史同时在线峰值”
- `scope`：游戏榜、全品类榜、日本地区榜等口径
- `source`、`sourceUrl`
- `performanceLevel`：phenomenon、strong、good、ordinary、insufficient

不同平台的原始指标不直接混算。产品级表现应先在各平台内部标准化，再汇总为表现等级。

当前 Steam 历史同时在线峰值分级：≥100,000 为 phenomenon，≥20,000 为 strong，≥5,000 为 good，其余为 ordinary；该阈值不得套用于手游、主机销量或商店奖项。
