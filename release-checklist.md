# Japan Life 上架检查清单

这份清单用于最后上架前核对。当前产品规则：能联网的数据优先接真实 API；API 失败时显示暂不可用、空状态或错误说明，不用假数据伪装成实时结果。确实属于本地整理的资料会明确标注为本地参考。

## 1. 当前构建状态

- [ ] `npm run lint` 通过。
- [ ] `npm run build` 通过。
- [ ] 如需最终保险，再跑 `npm run test:e2e`。
- [ ] 真机打开首页、社区、消息、我的、主要工具页，不白屏、不 404、不出现 `Application error`。

## 2. 必填环境变量

生产环境需要在 Vercel / 托管平台配置：

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `HOTPEPPER_API_KEY`
- `ODPT_API_KEY`

按功能需要配置：

- `DEEPL_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_BENEFIT_MODEL`
- `BENEFITS_AUTO_ORGANIZE`
- `BENEFITS_AUTO_PUBLISH`

## 3. 数据来源口径

- 社区、通知、关注、私信、账号资料：使用 Supabase。Supabase 不可用时显示登录要求、错误或空状态，不自动切到假用户、假帖子、假私信。
- 汇率：使用 Frankfurter。请求失败时显示暂不可用，不显示备用假汇率。
- 东京交通：使用 ODPT。请求失败时显示暂不可用，不用本地状态假装实时。
- 天气：使用 Open-Meteo。失败时显示暂不可用或提示用户重试。
- 店铺：优先 HotPepper 或后台真实店铺；如果页面展示本地参考店铺，必须明确标注为本地参考。
- 节日、烟花、考试、生活事项、租房参考、散步/游玩目的地：属于 Japan Life 本地整理资料，可以保留，但要以参考资料口径展示。

## 4. Supabase / 后台检查

- [ ] 已执行需要的 Supabase SQL。
- [ ] `public-images` bucket 可公开读取。
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 只存在服务端环境变量，不暴露到前端。
- [ ] `/admin` 可以用 `ADMIN_PASSWORD` 登录。
- [ ] 后台可以管理推荐 App、优惠、店铺申请、社区审核和生活帮手申请。
- [ ] 账号删除入口可用：我的 -> 账号与密码 -> 删除账号。

## 5. 关键流程真机测试

- [ ] 注册、登录、退出、忘记密码、改密码。
- [ ] 登录账号和我的资料、社区资料保持一致。
- [ ] 社区发帖、评论、点赞、收藏、举报、申请联系。
- [ ] 新增关注通知显示关注者；已关注的人显示互相关注，未关注的人可点回关并真实生效。
- [ ] 消息/通知以私信列表方式展示，点进会先看到通知内容，再从详情进入对应页面。
- [ ] 生活帮手发布、申请、管理、审核状态通知。
- [ ] 首页常用工具配置、收藏、提醒、日历备注能保存。
- [ ] 主要 API 断开时页面不白屏，也不出现假实时数据。
- [ ] 390px 到 430px 宽度下首页、社区、通知、详情页没有横向溢出或按钮文字重叠。

## 6. App Store / PWA 材料

- [ ] 正式网址可访问。
- [ ] `/manifest.json`、`/robots.txt`、`/sitemap.xml` 正常。
- [ ] App 图标：`/icon-192.png`、`/icon-512.png`、`/apple-touch-icon.png`。
- [ ] 隐私政策：`/privacy`。
- [ ] 使用条款：`/terms`。
- [ ] 联系 / 支持：`/contact`。
- [ ] 免责声明：`/disclaimer`。
- [ ] 数据来源：`/data-status`。
- [ ] 审核说明：`/app-review`。
- [ ] 准备 App Store 截图、描述、关键词、测试账号和 Review Notes。

## 7. 建议上架信息

- App 名称：Japan Life
- 副标题：在日生活助手
- 分类建议：生活 / 工具
- 年龄分级建议：4+
- 隐私政策 URL：`https://japan-life.vercel.app/privacy`
- 使用条款 URL：`https://japan-life.vercel.app/terms`
- 支持 URL：`https://japan-life.vercel.app/contact`

## 8. 审核说明重点

- App 使用 Supabase Auth 保存账号邮箱和登录状态。
- App 内提供账号删除入口，会删除 Supabase Auth 用户和云同步数据。
- 用户主动授权后才使用定位和浏览器通知。
- 汇率、天气、交通、店铺等第三方数据以官方或第三方服务返回为准。
- 税金、签证、医疗、房租、交通、政策等内容仅供参考，重要事项请确认官方信息。
