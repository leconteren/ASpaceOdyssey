# 飞书 CLI 能力介绍与上手建议

> 草稿：可直接复制到飞书云文档。撰写日期：2026-04-07

## 一、什么是飞书 CLI

飞书 CLI（Lark CLI / `lark-cli`）是飞书开放平台提供的命令行工具，面向开发者，用于在本地终端完成应用开发、调试、部署与运维。它把原本需要在开发者后台点击的操作，抽象成可脚本化、可纳入 CI/CD 的命令。

## 二、核心能力一览

### 1. 应用脚手架与项目初始化
- `lark init` / `create`：一键生成机器人、网页应用、小程序、工作台小组件等模板工程。
- 内置 TypeScript / Node / Python / Go 等多语言模板。
- 自动写入 App ID、App Secret 等环境变量，省去手动配置。

### 2. 本地开发与调试
- **本地隧道 / 回调转发**：把飞书平台的事件回调、卡片回传转发到 `localhost`，免去 ngrok。
- **热重载**：代码变更后自动重启服务。
- **Mock 事件**：可在本地模拟 `im.message.receive_v1`、审批、日程等事件，用于单元调试。

### 3. 开放能力调用（API Explorer）
- `lark api <path>`：直接在命令行调用任何开放平台 OpenAPI，自动处理 `tenant_access_token`。
- 支持 JSON / YAML 输入输出，可结合 `jq` 做管道处理。
- 适合快速验证接口、写一次性脚本（例如批量建群、批量发消息）。

### 4. 云文档 / 多维表格操作
- 读写 Docx、Sheet、Bitable（多维表格）。
- 批量导入导出 CSV、Markdown ↔ Docx。
- 适合做内容搬运、日报汇总、自动化报表。

### 5. 机器人与消息
- 直接从 CLI 发送文本 / 富文本 / 交互卡片到群或个人。
- 支持从文件读取卡片 JSON，便于做告警通知、CI 结果推送。

### 6. 应用发布与版本管理
- `lark app publish`：提交审核、发版、回滚。
- 查看版本历史、灰度发布、权限变更。
- 可集成到 GitHub Actions / GitLab CI。

### 7. 权限与成员管理
- 查询 / 修改应用权限点（scopes）。
- 管理可见范围、白名单部门和用户。

### 8. 日志与监控
- 拉取应用运行日志、事件推送日志、错误堆栈。
- 结合 `grep`、`tail -f` 做线上问题排查。

### 9. 插件与扩展
- 支持自定义命令插件，可把团队内部工具包装成 `lark xxx` 子命令统一分发。

---

## 三、结合 ASpaceOdyssey 项目：推荐先上手的能力

当前仓库是一个 React + TypeScript + Vite 的太空漫游小游戏。以下三个能力是"投入小、见效快"的切入点：

### ✅ 优先级 1：机器人消息推送（CI 结果通知）
**场景**：每次 `vite build` 或部署后，把构建结果、预览链接推送到你自己的飞书或项目群。

**上手步骤**：
1. 在开放平台创建一个「自建应用」→ 开启「机器人」能力。
2. 本地 `npm i -g @larksuiteoapi/lark-cli`（以官方包名为准）。
3. `lark auth login` 配置 App ID / Secret。
4. 在 `scripts/` 下新增 `notify.ts`，构建完成后调用 `lark im send --chat-id=xxx --card=./card.json`。
5. 把它挂到 `package.json` 的 `"postbuild"` 脚本里。

### ✅ 优先级 2：云文档 / 多维表格做关卡数据源
**场景**：`constants.tsx` 里现在硬编码了关卡 / 星球 / 台词等常量。可以把它们搬到飞书多维表格，让非开发者也能编辑，再用 CLI 同步回仓库。

**上手步骤**：
1. 创建一个 Bitable，字段对应 `types.ts` 里的数据结构。
2. 写一个 `scripts/sync-bitable.ts`，通过 `lark api /open-apis/bitable/v1/apps/.../tables/.../records` 拉取。
3. 生成 `src/data/levels.json`，在 App 里动态加载。
4. 加到 GitHub Actions 定时任务，实现「编辑表格 → 自动 PR」。

### ✅ 优先级 3：API Explorer 快速验证
**场景**：在正式写代码前，用 `lark api` 一行命令试出你需要的接口形态，避免在 SDK 里反复踩坑。

**上手步骤**：
- `lark api get /open-apis/bitable/v1/apps/{app_token}` 查看表结构。
- `lark api post /open-apis/im/v1/messages?receive_id_type=chat_id -d @msg.json` 试发消息。
- 把调通的 curl 直接粘到项目脚本里。

---

## 四、暂不建议现在投入的能力

- **应用发布 / 灰度**：ASpaceOdyssey 目前是纯前端游戏，没有发布到飞书工作台的需求。
- **权限精细化管理**：单人开发阶段，默认权限够用。
- **自定义 CLI 插件**：等团队规模上来、有重复操作时再做。

---

## 五、下一步

1. 先完成「优先级 1：CI 通知」，大约半小时即可跑通，立刻就有正反馈。
2. 验证顺畅后，再推进「优先级 2：Bitable 数据源」，这会显著提升关卡迭代效率。
3. 把常用命令沉淀到 `scripts/` 目录，形成团队可复用的自动化资产。

> 备注：具体命令与包名请以 [飞书开放平台官方文档](https://open.feishu.cn/) 最新版本为准，本文档侧重能力地图与选型思路。
