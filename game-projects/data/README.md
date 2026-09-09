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
- `latestUpdateDate`、`latestUpdateLabel`：最近一次可核验的官网、新闻稿或媒体动态及其类型
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

每条记录保存一个平台原生指标，或一个明确标注汇总范围的跨平台估算：

- `releaseId`、`date`；跨平台汇总记录改用 `projectId`，并通过 `platforms` 和 `region` 保存适用范围
- `metricType`：free_rank、grossing_rank、top_seller_rank、concurrent_users、download_rank、physical_sales、review_count、review_score、estimated_downloads、estimated_revenue 等
- `rank`：榜单名次
- `value`：销量、在线人数或评价数值
- `display`：需要保留原始文本口径时使用，例如商店奖项或“Steam 历史同时在线峰值”
- `scope`：游戏榜、全品类榜、日本地区榜等口径
- `source`、`sourceUrl`
- `performanceLevel`：phenomenon、strong、good、ordinary、insufficient

不同平台的原始指标不直接混算。产品级表现应先在各平台内部标准化，再汇总为表现等级。

## regionChecks

每条记录代表一次“项目 × 平台 × 目标地区”的官方商店检查。`availability` 区分 `available`、`delisted_store_page`、`not_available_currently`、`not_listed_currently` 与 `check_failed`；后四者都不等同于游戏在所有平台从未发行。东南亚为复合地区，检查单一代表市场时必须写入 `representativeCountry` 并在页面披露样本范围。

已正式公布但尚无发售日期的版本仍建立 release，`plannedLaunchDate` 留空、状态设为 `announced`；只有年份或“上半年 / 下半年”等窗口时直接保存官方原文。未来项目统计必须同时包含精确日期、时间窗口和日期待定三类，不得因为商店或榜单尚未出现而漏记。

当前 Steam 历史同时在线峰值分级：≥100,000 为 phenomenon，≥20,000 为 strong，≥5,000 为 good，其余为 ordinary；该阈值不得套用于手游、主机销量或商店奖项。

当前 AppMagic 手游生命周期估算分级：收入 ≥US$50,000,000 为 phenomenon、≥US$20,000,000 为 strong、≥US$5,000,000 为 good，其余为 ordinary；下载量 ≥10,000,000 为 phenomenon、≥5,000,000 为 strong、≥1,000,000 为 good，其余为 ordinary。免费版只公开数值区间时，`value` 保存公开下限、`lowerBound` 设为 true，并在 `display` 中保留“>”标记；该口径仅用于同类手游规模分级。

历史 Steam 批次分别查询美国与日本商店。商店接口当前无法核验的地区不建立 release，不根据其他地区日期反推；全历史同时在线峰值通过 SteamCharts 或 SteamDB 记录，并在 `scope` 中保留核验截至日期。

PlayStation 地区核验使用香港、台湾、韩国、新加坡官方商品页。同一产品在英文与中韩文商店使用不同 Product ID 时，按地区分别保存；上线日期直接采用当地商品页展示值。只有在版本包含基础游戏且与基础版同日上线时才允许使用版本页作为发行证据，扩展包或后续升级版不用于反推基础游戏上线日期。

Xbox 地区核验使用香港、台湾、韩国、新加坡官方商品页，并保存基础游戏 Product ID、商店原始标题及原始 `releaseDate`。有时间戳时按对应商店时区转换为当地日期；旧商品页未返回日期时只确认当前商品页可用，并标记“当地首发日期待核验”，不套用其他地区日期。东南亚仍以新加坡作为代表样本。

地区筛选固定采用 `meta.targetRegions` 中的七个核心市场。`GLOBAL` 与 `ASIA` 不作为可选地区：选择某一核心市场时，这两类记录只能以“公告覆盖、待逐区确认”的状态出现，且不得继承全球榜单或市场表现；存在同平台逐区记录时，逐区记录优先并去除公告范围重复项。
