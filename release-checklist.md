# Japan Life 上线检查清单

## 构建状态

- 当前本地检查：`npm run lint` 已通过，无 error / warning。
- 当前本地检查：`npm run build` 已通过。
- 当前本地检查：`npm audit --omit=dev` 已通过，0 vulnerabilities。
- 如果 Windows / OneDrive 下出现 `.next/cache/.tsbuildinfo` 路径 Debug Failure，先删除 `.next/cache` 后重跑 build。

## 生产环境变量

- 部署前需要在 Vercel / 生产环境补齐以下变量；本地 `.env.local` 不会自动带到线上。
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `HOTPEPPER_API_KEY`
- `ODPT_API_KEY`
- `DEEPL_API_KEY`（福利翻译需要时）
- `OPENAI_API_KEY`（福利整理需要时）
- `OPENAI_BENEFIT_MODEL`
- `BENEFITS_AUTO_ORGANIZE`
- `BENEFITS_AUTO_PUBLISH`

## 当前仍使用本地 / 备用数据的地方

- 电车优惠 `/train-deals`：票券、适合人群和注意事项为 Japan Life 本地整理，不接 ODPT 实时票价，不保证最便宜。
- 随机散步 `/walk` 和今天去哪玩 `/play`：目的地推荐仍为本地整理；附近店铺优先通过 HotPepper 获取，失败时只显示说明或本地参考内容。
- 汇率和节假日：优先使用 Frankfurter / Holidays JP；失败时会显示 Japan Life 备用数据并在页面标注。
- 租屋助手：车站列表走 ODPT；租金估算仍是参考模型和地区/车站相场，不是实时不动产报价。

## Supabase 实测

- 在 Supabase SQL Editor 执行 `supabase-schema.sql`
- 如启用福利后台，执行 `supabase-benefits.sql`
- 如启用用户云同步，执行 `supabase-user-app-data.sql`
- 确认 `public-images` bucket 存在并可公开读取
- 确认 `SUPABASE_SERVICE_ROLE_KEY` 可用于账号删除 API `/api/account`
- 后台 `/admin` 可以用 `ADMIN_PASSWORD` 登录
- 推荐 App 可以新增、编辑、上传图片、上架、下架、删除
- 优惠链接可以新增、编辑、上传图片、上架、下架、删除
- 店铺申请可以从 `/claim` 提交，并在后台待审核里出现
- 后台确认店铺申请后，前台店铺页可以显示
- 用户登录后，本机收藏、设置、提醒、日历备注可以同步到 `user_app_data`

## 第三方 API 实测

- ODPT：东京交通页、首页路线状态、车站搜索、租屋车站选择可以读取真实数据
- HotPepper：今天吃什么、随机散步附近店铺、吃喝美容美发类店铺优先显示 HotPepper 结果
- Open-Meteo：天气页、首页天气、天气提醒正常
- Frankfurter：汇率页和首页汇率正常；失败时明确显示备用数据
- Holidays JP：节假日页和首页假期正常；失败时明确显示备用数据
- Apple iTunes Search：推荐 App 详情正常

## PWA 网页版材料

- 正式网址：`https://japan-life.vercel.app`
- Manifest：`/manifest.json`
- PWA 图标：`/icon-192.png`、`/icon-512.png`、`/apple-touch-icon.png`
- 隐私政策：`/privacy`
- 使用条款：`/terms`
- 联系 / 支持：`/contact`
- 免责声明：`/disclaimer`
- 数据来源与状态：`/data-status`
- App Store 审核说明：`/app-review`（noindex，不放公开 SEO）
- Robots：`/robots.txt`
- Sitemap：`/sitemap.xml`

## App Store 上架材料

- App 名称：Japan Life
- 副标题：在日生活助手
- 分类建议：生活 / 工具
- 年龄分级建议：4+
- 隐私政策 URL：`https://japan-life.vercel.app/privacy`
- 使用条款 URL：`https://japan-life.vercel.app/terms`
- 支持 URL：`https://japan-life.vercel.app/contact`
- 免责声明 URL：`https://japan-life.vercel.app/disclaimer`
- App 图标：使用当前 Japan Life App Icon
- 截图：准备首页、东京交通、今天吃什么、租屋助手、我的页面
- App Review Notes：填写测试账号邮箱、密码、需要测试的路径，以及 `/app-review` 说明页
- 账号删除入口：`/account`，路径为「我的 → 账号与密码 → 删除账号」

## App Store 描述草稿

Japan Life 是为在日本生活、留学、工作的用户准备的生活助手。你可以在一个清爽的日系 iOS 风格界面里查看天气、汇率、交通状态、工资估算、工时记录、租屋参考、生活提醒、推荐 App、优惠信息和附近店铺。

Japan Life focuses on daily life in Japan: weather, exchange rates, train status, salary estimation, work-hour records, rent checks, reminders, recommended apps, deals, and nearby shops.

## 关键词草稿

日本生活,在日生活,日本留学,日本打工,日本天气,日本汇率,日本日历,日本交通,租房,工资计算,在留卡,优惠,店铺,Japan Life

## 隐私声明要点

- 使用 Supabase Auth 保存账号邮箱和登录状态
- App 内提供账号删除入口，删除 Supabase Auth 用户和云同步数据
- 使用 Supabase Database 保存推荐内容、优惠链接、店铺申请、用户云同步数据
- 使用 Supabase Storage 保存用户上传头像、店铺图片、后台图片
- 使用 localStorage 保存本机设置、收藏、提醒、日历备注、首页自选工具和线路
- 用户主动授权后才使用浏览器定位
- 用户主动开启后才使用浏览器通知
- ODPT 用于交通运行信息和车站资料
- HotPepper 用于吃喝、美容美发等店铺资料
- 税金、签证、医疗、房租、交通、政策等内容仅供参考

## 真机测试

- iPhone Safari 打开首页，检查底部导航、玻璃按钮、天气/汇率/交通/假期卡片
- 登录、注册、Google 登录、忘记密码流程
- 账号删除流程：登录 → `/account` → 删除账号 → 再次确认 → 回到首页
- 不登录时设置和收藏是否仍保存在本机
- 登录后设置是否自动同步
- 退出登录后 App 是否仍可使用
- 今天吃什么和随机散步能否显示 HotPepper 真实店铺
- 东京交通能否显示 ODPT 实时参考状态
- 租屋助手能否按 ODPT 线路 / 车站搜索
- 店铺申请表单能否提交
- 后台能否审核店铺申请
- `/data-status` 数据来源说明正常
- `/feedback` 能生成包含页面和设备信息的邮件草稿
- `/app-review` 审核说明页正常
- 工资、工时、汇率、房租等工具可正常输入和返回结果
