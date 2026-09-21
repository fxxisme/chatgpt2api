# Fork 对比分析：fxxisme vs jiawen-afk

> 生成日期：2026-09-20
>
> 上游仓库：[basketikun/chatgpt2api](https://github.com/basketikun/chatgpt2api)
>
> 本 Fork：[fxxisme/chatgpt2api](https://github.com/fxxisme/chatgpt2api) — 当前 `origin/main`
>
> 对比 Fork：[jiawen-afk/chatgpt2api](https://github.com/jiawen-afk/chatgpt2api) — `jiawen/main`

---

## 1. 基本信息

| 维度 | 本 Fork (fxxisme) | 对比 Fork (jiawen-afk) |
|------|-------------------|----------------------|
| 当前版本 | v1.8.0 | 未打版本号 |
| 共同祖先提交 | `1f96b49` (refactor: remove registration functionality) | 同左 |
| 独有提交数 | 11 个 | 9 个 |
| 文件变更量 | — | 相对本 fork 差异 53 个文件，+3106/-1426 行 |

---

## 2. 共同祖先

两个 fork 最近一次共享的提交为：

```
1f96b49 refactor: remove registration functionality and related configurations
```

即均基于上游在此之后各自发展。以下分析均以此提交为基线。

---

## 3. 本 Fork (fxxisme) 独有提交

按时间从早到晚：

| 提交 | 说明 | 分类 |
|------|------|------|
| `df2398f` | 保留标注前代码空格 | Bug 修复 |
| `3aafaf7` | 为图片 SSE 流增加硬超时上限，避免 ~30 分钟挂起 | 稳定性 |
| `ca26e54` | 增量同步数据库存储 | 性能优化 |
| `6675eb3` | 过滤内部 assistant tool 消息 | Bug 修复 |
| `d83cef8` | 无图片时也可移除本地对话 (`image_remove_conversation_always`) | 新功能 |
| `641e0de` | 发现并路由账户特定模型 | 新功能 |
| `bc2bce2` | 更新 changelog | 文档 |
| `79199cb` | 默认上游模型名称配置 (`default_upstream_model_name`) | 新功能 |
| `62dd0ef` | 默认思考强度配置 (`default_thinking_effort`) | 新功能 |
| `e55aef2` | 版本升级到 v1.8.0 + changelog | 发版 |
| `dc105e5` | README 增加 Atlas Cloud 赞助商 | 文档 |

### 本 Fork 独有的关键特性

#### 3.1 `model_service.py` — 模型目录与路由服务

完整的 `ModelCatalogService` 类（182 行），提供：
- 按账户类型缓存的模型目录
- 模型路由（`route_for_model`）：根据模型名找到需要哪种账户类型
- `get_text_access_token(model=...)` 支持按模型路由选择账户
- 自动刷新、TTL 缓存机制

#### 3.2 `default_upstream_model_name` / `default_thinking_effort` 配置

- 后端 `services/config.py` 新增两个配置项
- 前端 Settings 页面提供输入框和下拉选择
- `_image_model_settings()` 方法将 `gpt-image-2` 映射到配置的上游模型名 + 思考强度

#### 3.3 `image_remove_conversation_always` 选项

- 即使没有出图（失败/超时/纯文本），也异步隐藏 ChatGPT 侧的对话记录
- 前端有对应的 Checkbox 开关

#### 3.4 `is_visible_assistant_message` 过滤

在 `conversation.py` 中新增函数，过滤：
- `is_visually_hidden_from_conversation` 标记的消息
- 发给特定 recipient（非 "all"）的工具调用消息
- 非 "final" channel 的推理/内部消息

#### 3.5 增量数据库同步

`services/storage/database_storage.py` 改为增量存储，避免全量写入的性能问题。

---

## 4. jiawen-afk Fork 独有提交

按时间从早到晚：

| 提交 | 说明 | 分类 |
|------|------|------|
| `d4745ac` | 修复图片轮询超时预算 | Bug 修复 |
| `0a0d430` | 在 SSE 读取期间强制执行流 deadline | 稳定性 |
| `8723080` | 上游更新后修复请求 deadline | Bug 修复 |
| `dd986c4` | 配置图片生成模型列表 | 新功能 |
| `2ab8b1e` | 限制图片 SSE 流持续时间 | 稳定性 |
| `8a37ff6` | 发布图片模型发现和视觉编辑 | 新功能 |
| `7c91781` | 图片编辑中显示标注遮罩 | 新功能 |
| `bbe8b4c` | 分离图片元数据和操作 | 重构 |
| `7b4cc5f` | 浏览器端缓存生成的图片 | 新功能 |

### jiawen Fork 独有的关键特性

#### 4.1 图片模型发现与配置服务

**新增文件**：`services/image_model_service.py`（94 行）

- 从 ChatGPT 上游自动拉取可用的图片模型列表
- 正则匹配 `gpt-5+` 系列主线模型和 `gpt-image-*` 专用模型
- 排除非图片模型（audio/tts/search/mini 等）
- 将发现的模型与内置默认列表合并去重
- 结果缓存到 `config.json` 的 `image_models_cache` 字段
- 失败时回退到最近一次成功的列表

**新增 API 路由**（`api/system.py`）：
- `GET /api/image-models` — 获取当前图片模型目录
- `POST /api/image-models/refresh` — 管理员触发从上游刷新

**`services/config.py` 扩展**：
- 新增配置项：`custom_image_models`、`image_models_cache`、`image_models_source`、`image_models_updated_at`、`default_image_model`、`image_timeout_retry_secs`
- 内置默认模型列表：`gpt-image-2.5-sunburst`、`gpt-image-2.5-flare`、`gpt-image-2`、`gpt-5-5-thinking`、`gpt-5-5`、`gpt-5-3`
- 模型列表规范化、去重、验证等辅助函数

#### 4.2 图片视觉编辑 — 标注遮罩绘制

**新增文件**：`web/src/app/image/components/image-drawing-dialog.tsx`（245 行）

完整的画布绘制对话框组件，支持两种模式：
- **标注模式 (annotate)**：在已有图片上涂抹标记需要修改的区域，生成 mask 图层
- **草图模式 (sketch)**：从零画出大致布局/轮廓，作为参考图

功能细节：
- 画笔/橡皮工具切换
- 可调节笔刷大小（标注模式 16-180，草图模式 4-64）
- 双 Canvas 架构：可见层 + 隐藏 mask 层
- Pointer Events 支持触控设备
- 导出 mask 为 PNG 文件
- 清空/重置功能

**前端集成**（`web/src/app/image/page.tsx`，+182 行改动）：
- 新增 `maskFiles` / `maskImages` 状态管理
- `handleAnnotateImage` — 从结果图进入标注编辑
- `handleApplyDrawing` — 应用绘制结果（标注或草图）
- 标注完成后自动设置参考图 + mask，聚焦输入框
- 对话模型切换时自动同步（`handleConversationModelChange`）

**API 层**（`web/src/lib/api.ts`）：
- `createImageEditTask` 新增 `masks` 参数
- FormData 中追加 `mask` 文件上传

#### 4.3 浏览器端图片缓存

**新增文件**：`web/src/lib/image-cache.ts`（156 行）

基于 `localforage`（IndexedDB）的三级图片缓存：
1. **内存缓存** — `Map<string, { src: string; blob: Blob }>` + Object URL
2. **IndexedDB 持久缓存** — `localforage` 实例，`chatgpt2api/image_cache` 存储
3. **网络回退** — 缓存未命中时 fetch 后自动存入

API：
- `resolveCachedImage(source)` — 三级查找，返回 `{ source, src, blob, fromCache }`
- `getImmediateCachedImageSource(source)` — 同步内存查找
- `deleteCachedImageSources(sources)` — 删除指定图片缓存（含 Object URL 释放）
- `clearCachedImages()` — 清空所有缓存

**新增 Hook**：`web/src/hooks/use-cached-image-source.ts`（39 行）
- React Hook 封装，用于组件中获取缓存图片 URL

**集成点**：
- `image-lightbox.tsx` 改用缓存源
- 删除会话/轮次时同步清理对应图片缓存
- 清空历史时清空全部缓存

#### 4.4 请求 Deadline 机制（大幅重构）

**`services/openai_backend_api.py`** 新增约 130 行代码：

```python
# 核心方法
_active_request_deadline()        # 获取当前活跃的请求截止时间
_request_deadline_scope(timeout)  # 上下文管理器，自动设置/恢复 deadline
_deadline_timeout_secs(default)   # 计算剩余可用时间
_deadline_expired()               # 检查是否已超时
_sleep_with_request_deadline(s)   # 受 deadline 约束的 sleep
```

新增图片文件服务退避重试：
```python
_is_image_file_concurrency_error(error)  # 识别并发限流
_post_image_file_request(path, **kw)     # 有界退避重试（最多 3 次）
```

**`services/protocol/conversation.py`** 改动：
- `stream_text_deltas()` 整体包裹在 `TEXT_STREAM_TIMEOUT_SECS`（300s）deadline 下
- 新增 `_image_remaining_timeout_secs()` / `_sleep_image_retry()` / `_sleep_until_deadline()`
- 图片并发限流错误检测 `is_image_concurrency_error()`

**`utils/helper.py`** 新增 ~60 行 SSE 流 deadline 支持：
- `_iter_sse_chunks()` — 带 deadline 的流式读取，直接操作 `curl_cffi` 的内部队列
- `_iter_sse_lines()` — 流式行解析
- `_detach_stream_response()` — 超时后安全断开流连接
- `iter_sse_payloads()` 新增 `deadline` / `timeout_message` 参数

#### 4.5 图片模型路由简化

**删除** `_image_model_settings()` 方法（返回 `(model, thinking_effort)` 元组），
**替换为** `_image_model_slug()` — 直接映射模型 slug：
- `gpt-image-2` → 固定映射到 `gpt-5-5-thinking`（不再依赖 `default_upstream_model_name` 配置）
- `codex-gpt-image-2` → 保持原样
- 其他 → 直接使用 base_model 名

不再在 prepare 请求中传递 `thinking_effort` 参数。

#### 4.6 账号服务增强

**`services/account_service.py`** 改动：
- 新增 `_image_cooldown_until` 字典 — 账号级冷却时间管理
- `get_text_access_token()` 移除 `model` 参数和模型路由逻辑（简化）
- `mark_image_result()` 新增 `cooldown_secs` 参数
- 候选账号筛选时检查冷却时间
- Token 刷新/删除时同步维护冷却状态

---

## 5. 架构差异对比

### 5.1 模型管理方案

| 方面 | 本 Fork | jiawen Fork |
|------|---------|-------------|
| 模型服务文件 | `services/model_service.py`（保留） | 删除该文件 |
| 图片模型服务 | 无独立服务 | 新增 `services/image_model_service.py` |
| 模型路由 | 按账户类型路由，`ModelCatalogService` | 简化，不做账户类型路由 |
| 图片模型映射 | `_image_model_settings()` 返回 `(model, effort)` | `_image_model_slug()` 固定映射 |
| 上游模型名 | 可配置 `default_upstream_model_name` | 硬编码 `gpt-5-5-thinking` |
| 思考强度 | 可配置 `default_thinking_effort` | 不传递 |
| 模型列表来源 | 通过 `/v1/models` API 过滤 | 专用 `/api/image-models` + 上游拉取 |
| 前端模型选择 | 从 models 列表过滤 `image` 关键字 | 专用模型目录 API，内置回退列表 |

### 5.2 超时/Deadline 方案

| 方面 | 本 Fork | jiawen Fork |
|------|---------|-------------|
| 实现方式 | 复用 `image_poll_timeout_secs` 作墙钟硬上限 | 完整的 deadline scope 机制（130+ 行） |
| SSE 流超时 | 简单 `ImageStreamHardTimeoutError` | 操作 `curl_cffi` 内部队列的低级 deadline |
| 文本流超时 | 无 | `TEXT_STREAM_TIMEOUT_SECS = 300s` |
| 文件服务重试 | 无 | 并发限流检测 + 有界退避（最多 3 次） |
| 账号冷却 | 无 | `_image_cooldown_until` 机制 |

### 5.3 助手消息过滤

| 方面 | 本 Fork | jiawen Fork |
|------|---------|-------------|
| 过滤函数 | `is_visible_assistant_message()` — 完整过滤 | 删除该函数，简化为 `role == "assistant"` 检查 |
| recipient 过滤 | 过滤非 "all" recipient | 不过滤 |
| channel 过滤 | 过滤非 "final" channel | 不过滤 |
| hidden 消息 | 检查 `is_visually_hidden_from_conversation` | 不检查 |

### 5.4 文本标注处理

| 方面 | 本 Fork | jiawen Fork |
|------|---------|-------------|
| 标点前空格 | `replace_annotation_before_punctuation` 专用处理 | 删除该函数，改用 `re.sub(r"\s+([.,;:!?])", r"\1", text)` 全局清理 |
| 实现复杂度 | 两个正则替换函数 | 合并为一个 + 后处理 |

### 5.5 对话清理行为

| 方面 | 本 Fork | jiawen Fork |
|------|---------|-------------|
| 出图后移除 | `image_remove_conversation_after_result` | 同 |
| 没出图也移除 | `image_remove_conversation_always`（可选） | 无此功能 |
| `_remove_image_conversation_later` | 需要 `success` 参数判断 | 简化，只看 `after_result` |
| 流事件 `conversation_id` | 通过事件传递 | 不在事件中传递 |

---

## 6. 删除/替换的文件对照

### jiawen 删除了以下文件（本 Fork 仍保留）

| 文件 | 本 Fork 用途 |
|------|-------------|
| `services/model_service.py` | 模型目录缓存 + 按账户类型路由 |
| `test/test_chat_completion_cache.py` | 聊天补全缓存测试 |
| `test/test_database_storage.py` | 数据库存储测试 |
| `test/test_model_catalog_service.py` | 模型目录服务测试 |
| `test/test_text_model_routing.py` | 文本模型路由测试 |
| `test/test_image_remove_conversation.py` | 图片对话移除测试 |
| `assets/atlascloud.svg` | 赞助商 logo |

### jiawen 新增的文件（本 Fork 没有）

| 文件 | 行数 | 用途 |
|------|------|------|
| `services/image_model_service.py` | 94 | 图片模型发现/配置服务 |
| `web/src/app/image/components/image-drawing-dialog.tsx` | 245 | 画布标注/草图绘制对话框 |
| `web/src/lib/image-cache.ts` | 156 | IndexedDB 图片缓存库 |
| `web/src/hooks/use-cached-image-source.ts` | 39 | 缓存图片 React Hook |
| `PRODUCT.md` | 33 | 产品说明文档 |
| `test/test_account_image_capabilities.py` | 29 | 账号图片能力测试 |
| `test/test_config.py` | 113 | 配置服务测试 |
| `test/test_default_image_model.py` | 68 | 默认图片模型测试 |
| `test/test_image_mask_composite.py` | 28 | 遮罩合成测试 |
| `test/test_image_model_service.py` | 83 | 图片模型服务测试 |
| `test/test_image_tasks_api.py` | 37 | 图片任务 API 测试 |
| `test/test_request_deadlines.py` | 239 | 请求 deadline 测试 |
| `web/test/image-annotation-preview.cjs` | 143 | 标注预览前端测试 |
| `web/test/image-cache.cjs` | 94 | 图片缓存前端测试 |

---

## 7. 前端设置页差异

### 本 Fork 有而 jiawen 没有的设置项

- **默认请求上游模型名称** — 输入框，`default_upstream_model_name`
- **默认思考强度** — 下拉选择 (Auto/Standard/Extended/Max)，`default_thinking_effort`
- **没出图也移除本地对话** — Checkbox，`image_remove_conversation_always`

### jiawen 有而本 Fork 没有的设置项

- **生图模型管理面板** — 包含：
  - 默认模型下拉选择 (`default_image_model`)
  - 可用模型列表展示（Tag 标签）
  - 模型来源和更新时间显示
  - "拉取最新列表" 按钮（从上游刷新）
  - "保存全局模型" 按钮

---

## 8. 合并可行性评估

### 直接可 cherry-pick 的功能（冲突小）

| 功能 | 提交 | 冲突风险 | 价值 |
|------|------|----------|------|
| 浏览器图片缓存 | `7b4cc5f` | 低 | 高 — 避免重复下载 |
| 图片编辑标注遮罩 | `7c91781` | 中 | 高 — 精细化编辑能力 |
| 请求 deadline 底层机制 | `d4745ac`+`0a0d430`+`8723080` | 中 | 高 — 更健壮的超时控制 |

### 需要手动合并/二选一的功能（冲突大）

| 功能 | 冲突原因 |
|------|----------|
| 图片模型管理 | 架构完全不同：本 fork 用 `model_service.py` 做通用路由，jiawen 用专用 `image_model_service.py` |
| 模型映射逻辑 | `_image_model_settings()` vs `_image_model_slug()`，上游模型名配置 vs 硬编码 |
| 助手消息过滤 | 保留完整过滤 vs 简化为 role 检查 |
| 文本标注处理 | 两种不同的正则策略 |
| 对话清理逻辑 | `success` 参数 + `always` 选项 vs 简化版 |

### 合并难度总结

- **低冲突文件**（可直接合并）：新增的前端组件、缓存库、Hook、测试文件
- **中等冲突文件**：`utils/helper.py`、`api/system.py`、`web/src/lib/api.ts`
- **高冲突文件**：`services/openai_backend_api.py`、`services/protocol/conversation.py`、`services/config.py`、`services/account_service.py`、`web/src/app/settings/store.ts`、`web/src/app/settings/components/config-card.tsx`、`web/src/app/image/page.tsx`

---

## 9. 建议

1. **优先考虑合入的功能**：
   - 浏览器图片缓存 — 纯新增文件，冲突极小，用户体验提升明显
   - 请求 deadline 机制 — 比当前的简单硬超时更健壮，但需要适配现有代码

2. **需要权衡的功能**：
   - 图片模型发现 — 和现有 `model_service.py` 的通用路由方案是否共存
   - 标注遮罩编辑 — 功能完整但需要同时引入 mask 参数传递链路

3. **不建议直接合入的改动**：
   - 删除 `model_service.py` — 本 fork 的模型路由功能更全面
   - 删除 `is_visible_assistant_message` — 本 fork 的过滤更严格安全
   - 删除 `default_upstream_model_name` / `default_thinking_effort` — 本 fork 的配置灵活性更高
