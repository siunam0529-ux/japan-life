# Japan Life 上线检查清单

## Supabase 实测

- 在 Supabase SQL Editor 执行 `supabase-schema.sql`
- 确认 `public-images` bucket 存在并可公开读取
- 后台 `/admin` 可以登录
- 推荐 App 可以新增、编辑、上传图片、上架、下架、删除
- 优惠链接可以新增、编辑、上传图片、上架、下架、删除
- 友好店铺申请可以从 `/claim` 提交，并在后台待审核里出现
- 后台确认友好店铺后，前台店铺页可以显示
- 用户登录后，本机收藏、设置、提醒、日历备注可以自动同步到 `user_app_data`

## PWA 网页版材料

- 正式网址：`https://japan-life.vercel.app`
- Manifest：`/manifest.json`
- PWA 图标：`/icon-192.png`、`/icon-512.png`、`/apple-touch-icon.png`
- 隐私政策：`https://japan-life.vercel.app/privacy`
- 使用条款：`https://japan-life.vercel.app/terms`
- 联系 / 支持：`https://japan-life.vercel.app/contact`
- 免责声明：`https://japan-life.vercel.app/disclaimer`
- Robots：`https://japan-life.vercel.app/robots.txt`
- Sitemap：`https://japan-life.vercel.app/sitemap.xml`

## App Store 上架材料

- App 名称：Japan Life
- 副标题：在日生活助手
- 分类：生活 / 工具
- 年龄分级建议：4+
- 隐私政策 URL：`https://japan-life.vercel.app/privacy`
- 使用条款 URL：`https://japan-life.vercel.app/terms`
- 支持 URL：`https://japan-life.vercel.app/contact`
- 免责声明 URL：`https://japan-life.vercel.app/disclaimer`
- App 图标：使用当前 Japan Life App Icon
- 截图：准备首页、工具页、日历页、店铺页、我的页

## App Store 描述草稿

Japan Life 是为在日本生活、留学、工作的人准备的生活助手。你可以在一个干净的日系 iOS 风格界面里查看天气、日历、汇率、工资估算、工时提醒、房租评估、地区信息、优惠链接、推荐 App 和友好店铺。

Japan Life focuses on daily life in Japan: weather, calendar, exchange rates, salary estimation, work-hour reminders, rent checks, area information, deals, recommended apps, and foreigner-friendly shops.

## 关键词草稿

日本生活,在日生活,日本留学,日本打工,日本天气,日本汇率,日本日历,日本交通,房租,工资计算,在留卡,优惠,店铺,Japan Life

## 隐私声明要点

- 使用 Supabase Auth 保存账号邮箱和登录状态
- 使用 Supabase Database 保存推荐内容、优惠链接、友好店铺、用户云同步数据
- 使用 Supabase Storage 保存用户上传头像、店铺图片、后台图片
- 使用 localStorage 保存本机设置、收藏、提醒、日历备注、首页自选工具和线路
- 用户主动授权后才使用浏览器定位
- 用户主动开启后才使用浏览器通知
- 税金、签证、医疗、房租、政策等内容仅供参考

## 真机测试

- iPhone Safari 打开首页，检查底部导航、玻璃按钮、天气卡片
- 登录、注册、Google 登录、忘记密码流程
- 不登录时设置和收藏是否仍保存在本机
- 登录后设置是否自动同步
- 退出登录后 App 是否仍可使用
- 店铺申请表单：地址、预算、营业时间、电话、图片上传
- 后台审核店铺申请
- 日历页面颜色和标记是否清晰
- 工资、工时、汇率、房租等工具可正常输入和返回结果
