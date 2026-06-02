# Japan Life 社区 MVP 范围

这份文档用于锁定社区第一版范围，避免上线前继续扩张。当前规则：默认使用 Supabase；API 或 Supabase 失败时显示错误、登录要求或空状态，不展示 mock / 示例内容。

## 第一版保留

- 社区入口：全部社区、简中、繁中、日本语。
- 信息流：推荐、关注、生活分享、求助、闲置、搭子。
- 搜索、类型筛选、地区筛选、排序。
- 发帖：标题、正文、话题标签、地区、发布类型、本地图片预览。
- 帖子详情：正文、标签、评论、点赞、收藏、举报、申请联系、分享。
- 我的社区：我的帖子、收藏、收到的申请、发出的申请、社区资料。
- 通知中心：统一走 `/notifications`，以私信列表方式展示社区通知和生活帮手通知。
- 关注系统：关注、回关、互相关注、粉丝/关注列表。
- 后台审核：帖子审核、评论管理、举报管理、隐藏 / 删除 / 恢复、精选 / 置顶 / 官方推荐、社区数据看板、Supabase 检测页。

## 第一版不做

以下功能不应出现在主 UI 的可点击入口里：

- 积分、签到、每日任务、排行榜、等级、积分商城。
- 支付、配送、订单、退款、物流。
- 实时聊天之外的复杂 IM 功能。
- 短视频、直播。
- 社区图片直传 Supabase Storage。
- AI 推荐、AI 审核、自动翻译。
- 复杂地图定位。

实验文件可以保留，但不能从首页、我的页、社区首页或详情页链接到半成品页面。

## 用户可见社区路径

- `/community`
- `/community/all`
- `/community/zh-cn`
- `/community/zh-tw`
- `/community/ja`
- `/community/[locale]/new`
- `/community/[locale]/[id]`
- `/community/profile`
- `/community/me`
- `/notifications`
- `/messages`
- `/community/topic/[tag]`
- `/community/[locale]/topic/[tag]`
- `/community/user/[id]`
- `/community/user/[id]/follows`

不再使用 `/community/notifications`。社区通知统一进入 `/notifications`。

## 管理员路径

- `/admin`
- `/admin/community`
- `/admin/community/check`
- `/admin/community/stats`
- `/admin/life-helper`

后台第一版复用现有 `ADMIN_PASSWORD` 逻辑，不新增复杂权限系统。

## 上线前测试

- `npm run lint`
- `npm run build`
- `npm run test:e2e`

手动确认：

- 未登录可以浏览公开社区。
- 未登录点击发布、评论、点赞、收藏、申请联系、举报会进入登录引导。
- 登录后可以发布、评论、点赞、收藏、举报和申请联系。
- 发帖后前台只显示 `published` 内容。
- `hidden`、`deleted`、`pending` 内容不在普通前台信息流显示。
- 通知中心能看到真实通知内容，再从通知详情进入对应页面。
- Supabase 失败时没有 mock 帖子、mock 用户、mock 私信。
