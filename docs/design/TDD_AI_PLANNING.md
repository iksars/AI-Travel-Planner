
**技术设计与任务分解文档 (TDD) - AI 核心规划**

**1. 核心功能/用户故事 (Key Feature / User Story)**

*   **US-101: 智能规划-输入**
    *   **描述:** 作为一名旅行者，我想要通过**语音或文字**输入我的旅行目的地、时间、预算、人数和偏好，以便快速启动行程规划。
*   **US-102: 智能规划-生成**
    *   **描述:** 作为一名旅行者，我想要AI根据我的输入，**自动生成一份个性化的每日行程计划**，其中必须包含交通方式、住宿建议、景点安排和餐厅推荐。

**2. 数据库 Schema 设计 (Database Schema)**

*   此功能主要与第三方AI服务交互，直接依赖 `TDD_USER_AND_DATA_MANAGEMENT.md` 中定义的 `travel_plans` 表，用于持久化存储最终生成的 `plan_details` JSON对象。**无需新增数据表。**

**3. API 契约定义 (API Contract)**

**API 1: 生成旅行计划**

*   **Endpoint:** `POST /api/v1/planner/generate`
*   **描述:** 接收用户的自然语言输入，调用大语言模型（LLM）服务，生成结构化的旅行计划。这是一个长时任务API。
*   **认证:** `可选 (建议需要)` - 若需要登录后才能使用，则为 `需要 (Bearer Token)`。
*   **Request Body (application/json):**
    ```json
    {
      "prompt": "string (required, 用户的原始输入，如：我们一家三口想去日本，5天，预算1万块，孩子喜欢动漫和主题公园)",
      "input_type": "string (enum: 'text', 'voice')"
    }
    ```
*   **Success Response (200 OK):**
    *   **注意:** 由于是长时任务，为避免HTTP超时，后端立即返回一个任务ID，前端需要通过另一个API轮询结果。
    ```json
    {
      "task_id": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
    }
    ```
*   **Error Response (400 Bad Request):**
    ```json
    { "error": "Prompt cannot be empty." }
    ```

**API 2: 获取旅行计划生成结果**

*   **Endpoint:** `GET /api/v1/planner/results/{task_id}`
*   **描述:** 前端使用从 `generate` API 获取的 `task_id` 来轮询此端点，以获取最终的计划数据。
*   **认证:** 与 `generate` API 保持一致。
*   **Request Body:** `无`
*   **Responses:**
    *   **202 Accepted (处理中):**
        ```json
        {
          "status": "processing",
          "message": "正在为您规划完美旅程..."
        }
        ```
    *   **200 OK (成功):**
        ```json
        {
          "status": "completed",
          "plan_details": {
            "title": "日本亲子动漫5日游",
            "budget_overview": { "...": "..." },
            "daily_plan": [
              {
                "day": 1,
                "theme": "抵达与动漫初体验",
                "activities": [
                  { "type": "transport", "detail": "抵达东京成田机场，乘坐N'EX前往市区" },
                  { "type": "hotel", "name": "东京XX酒店", "suggestion": "..." },
                  { "type": "attraction", "name": "秋叶原", "time": "下午" },
                  { "type": "restaurant", "name": "高达咖啡厅", "time": "晚餐" }
                ]
              }
            ]
          }
        }
        ```
    *   **500 Internal Server Error (失败):**
        ```json
        {
          "status": "failed",
          "error": "无法连接到AI服务，请稍后重试。"
        }
        ```

**4. 工程任务分解 (Engineering Task Breakdown)**

*   **[BE]** `TASK-AI-001:` (Service) 封装一个调用第三方大语言模型 (LLM, 如OpenAI) 的服务类。需要处理API Key配置、超时和异常。
*   **[BE]** `TASK-AI-002:` (Prompt) 设计并优化发送给LLM的 `system prompt`，指导它稳定地输出我们期望的JSON结构。这是**保证功能质量的核心**。
*   **[BE]** `TASK-AI-003:` (Task Queue) 集成一个轻量级的后台任务队列（如 `Celery` with `Redis` 或 Django `channels`），用于异步处理耗时的LLM调用。
*   **[BE]** `TASK-AI-004:` (API) 实现 `POST /planner/generate` API。它接收用户请求，创建一个异步任务并立即返回 `task_id`。 (依赖: TASK-AI-003)
*   **[BE]** `TASK-AI-005:` (API) 实现 `GET /planner/results/{task_id}` API，用于查询异步任务的状态和结果。 (依赖: TASK-AI-003)
*   **[FE]** `TASK-AI-006:` (UI) 根据UX规格，构建主页的核心输入区，包括文本框和语音按钮。
*   **[FE]** `TASK-AI-007:` (Voice) 集成浏览器原生的 `Web Speech API` (`SpeechRecognition`) 来实现语音输入功能。点击语音按钮时启动识别，结束后将结果填入输入框。
*   **[FE]** `TASK-AI-008:` (Integration) 实现“开始规划”按钮的逻辑。点击后，调用 `POST /planner/generate` API，获取 `task_id`。 (依赖: TASK-AI-004, TASK-AI-006)
*   **[FE]** `TASK-AI-009:` (Polling) 获取 `task_id` 后，开始轮询 `GET /planner/results/{task_id}` API。期间向用户显示加载动画和提示语（如：“正在规划中...”）。 (依赖: TASK-AI-005, TASK-AI-008)
*   **[FE]** `TASK-AI-010:` (Display) 当轮询获得 `status: "completed"` 的结果后，停止轮询，并将获取到的 `plan_details` 数据传递给行程详情页进行渲染。
*   **[FE]** `TASK-AI-011:` (UI) 根据UX规格，实现行程详情页的布局，包括每日行程卡片和地图视图的骨架屏。
*   **[FE]** `TASK-AI-012:` (Component) 开发 `DailyItineraryCard` 和 `ActivityCard` 等组件，用于动态渲染 `plan_details` 中的行程数据。 (依赖: TASK-AI-011)

**5. 关键技术点与风险 (Key Notes & Risks)**

*   **Note 1 (Prompt Engineering):** `TASK-AI-002` 是整个功能成败的关键。Prompt需要精心设计，包含清晰的指令、角色扮演、输出格式要求（JSON Schema），以及少量示例 (few-shot learning)，以确保LLM输出的稳定性和可用性。
*   **Note 2 (长时任务处理):** 采用“立即返回task_id + 前端轮询”是实现长时任务最简单可靠的方式，避免了复杂的WebSocket或SSE。
*   **Risk 1 (AI服务依赖):** 功能完全依赖第三方LLM API的可用性和稳定性。API的延迟、错误率或内容审查策略的变更都会直接影响我们的产品。需要做好完善的错误处理和用户提示。
*   **Risk 2 (成本):** LLM API调用是按量付费的，成本可能很高。需要监控调用频率和token消耗，并考虑在后端增加缓存机制，对完全相同的请求直接返回缓存结果。
*   **Risk 3 (数据质量):** AI生成的内容可能存在事实性错误（如推荐一个已关闭的餐厅）。原型阶段可接受，但未来需要引入数据验证、用户反馈或与更可靠的POI（兴趣点）数据库进行交叉验证。
*   **Risk 4 (语音识别):** `Web Speech API` 在不同浏览器上的支持度和表现不一，可能存在兼容性问题。原型阶段简化处理，只支持主流Chrome浏览器。
