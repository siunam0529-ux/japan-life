# Japan Life 社区第一版 MVP 范围

这份文档用于锁定社区第一版范围，避免上线前继续扩张。当前阶段只做必要社区功能、后台审核、登录引导、Supabase fallback 和部署验收。

## 1. 第一版保留功能

语言社区入口：

- 全部社区
- 简中社区
- 繁中社區
- 日本語コミュニティ

信息流：

- 推荐 / 附近 / 求助 / 闲置 / 搭子
- 搜索
- 类型筛选
- 地区筛选
- 排序

发帖：

- 生活分享
- 求助提问
- 闲置转让
- 找搭子
- 找人帮忙
- 话题标签
- 地区
- 本地图片预览占位

当前第一版不接真实图片上传，不接 Supabase Storage。

帖子详情：

- 图片占位展示
- 正文
- 标签
- 评论
- 点赞
- 收藏
- 举报
- 申请联系
- 分享按钮复制链接 / `navigator.share`

我的社区：

- 我的帖子
- 我的收藏
- 收到的申请
- 发出的申请
- 消息通知
- 社区资料

后台审核：

- 帖子审核
- 评论管理
- 举报管理
- 隐藏 / 删除 / 恢复
- 精选 / 置顶 / 官方推荐
- 社区数据看板
- Supabase 检测页

安全提示：

- 发布规则
- 闲置安全提示
- 搭子安全提示
- 找人帮忙安全提示

SEO / 分享卡片：

- 社区页面 metadata
- 帖子详情 metadata
- 话题页 metadata
- sitemap 固定社区入口
- 发帖页、我的页面、通知页、后台页 noindex / robots 屏蔽

统一定位：

> 分享在日生活，看看附近的人都在做什么

辅助定位：

> 生活分享、求助、闲置、搭子、找人帮忙

统一免责声明：

> Japan Life 仅提供信息发布与联系服务，不参与付款、配送、交易或服务履行。线下见面请优先选择公共场所，不要提前转账，不要透露证件、住址、银行卡等敏感信息。

## 2. 第一版不做功能

以下功能不属于第一版，不应出现在主 UI 的可点击入口里：

- 匿名发布
- 积分
- 签到
- 每日任务
- 排行榜
- 等级
- 积分商城
- 支付
- 配送
- 订单
- 退款
- 物流
- 实时聊天
- 私信
- 关注
- 粉丝
- 好友系统
- 短视频
- 直播
- 图片真实上传
- Supabase Storage
- AI 推荐
- AI 审核
- 复杂地图定位
- 自动翻译
- 多端实时通知

如果相关实验文件未来存在，可以保留代码，但不能从首页、我的页面、社区首页、社区详情页等主 UI 链接到半成品页面。

## 3. 用户可见路径

第一版主 UI 只应链接到这些社区路径：

- `/community`
- `/community/all`
- `/community/zh-cn`
- `/community/zh-tw`
- `/community/ja`
- `/community/[locale]/new`
- `/community/[locale]/[id]`
- `/community/profile`
- `/community/me`
- `/community/notifications`
- `/notifications`
- `/community/topic/[tag]`
- `/community/[locale]/topic/[tag]`
- `/community/user/[id]`

其中 `[locale]` 用于浏览视图时允许 `all / zh-cn / zh-tw / ja`；帖子本身的 `communityLocale` 只能保存为 `zh-cn / zh-tw / ja`，不能保存为 `all`。

以下路径第一版不要在主 UI 展示入口：

- `/community/tasks`
- `/community/ranking`
- `/community/chat`
- `/community/messages`
- `/community/following`
- `/community/rewards`
- `/community/orders`
- `/community/map`

## 4. 管理员路径

- `/admin`
- `/admin/community`
- `/admin/community/check`
- `/admin/community/stats`
- `/admin/community/setup`
- `/admin/life-helper`

后台第一版复用现有 `ADMIN_PASSWORD` 逻辑，不新增复杂权限系统。

## 5. 手动 Supabase 配置

上线前请确认：

- 已存在社区相关表。
- `community_posts` 可读写。
- `community_comments` 可读写。
- `community_likes` / `community_favorites` 可读写。
- `community_contact_requests` / `community_reports` / `community_notifications` 可读写。
- `community_profiles` 可读写。
- RLS 策略符合当前产品预期。
- Auth 邮箱登录可用。

当前不需要：

- 重新跑 SQL。
- 新增 SQL。
- 重复创建表。
- 创建 Storage bucket。

## 6. 上线前测试清单

自动检查：

- `npm run lint`
- `npm run build`
- `npm run test:e2e`

手动检查：

- 进入 `/community`，确认 4 个语言入口可打开。
- 进入 `/community/all`，确认能浏览全部语言帖子。
- 分别进入 `/community/zh-cn`、`/community/zh-tw`、`/community/ja`。
- 从全部社区发帖，确认必须选择发布到哪个语言社区。
- 从单一语言社区发帖，确认不会保存为 `all`。
- 发帖带风险词时进入待审核。
- 评论、点赞、收藏、举报、申请联系。
- 我的社区能看到我的帖子、收藏、收到的申请、发出的申请。
- 后台隐藏 / 删除 / 恢复帖子。
- 前台确认 `hidden / deleted / pending` 内容不显示。
- 帖子详情分享按钮可复制链接或调用系统分享。

## 7. 后续版本可考虑功能

以下功能可以作为后续版本讨论，但明确不属于第一版：

- 私信聊天
- 关注系统
- 地图附近
- 支付配送
- 积分任务
- 图片真实上传
- Supabase Storage
- AI 审核
- 自动翻译
