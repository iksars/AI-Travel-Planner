
**技术设计与任务分解文档 (TDD) - 财务管理**

**1. 核心功能/用户故事 (Key Feature / User Story)**

*   **US-103: 费用-预算分析**
    *   **描述:** 作为一名旅行者，我想要AI在我规划行程时，能**自动估算并展示总预算**，并对其构成（如机票、酒店、餐饮）进行分析，以便我判断是否超支。
*   **US-104: 费用-记账**
    *   **描述:** 作为一名旅行者，我想要在旅行途中，能方便地通过**语音（或手动）记录每一笔开销**，以便实时掌握花费情况。

**2. 数据库 Schema 设计 (Database Schema)**

*   **技术选型:** 原型阶段使用 `SQLite`，通过 `Django ORM` 进行管理。

*   **表名： `expenses`**
    *   **描述:** 存储与某个旅行计划关联的每一笔具体开销。
    ```sql
    CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL, -- 使用 REAL 或 DECIMAL 存储金额
        currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
        category VARCHAR(50), -- 如：交通, 餐饮, 住宿, 购物, 娱乐
        description TEXT,
        expense_date DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 索引: 加速按计划查询其所有开销
    CREATE INDEX idx_expenses_plan_id ON expenses(plan_id);
    ```
*   **预算数据:** 预算估算数据由AI在生成计划时一并产出，并存储在 `travel_plans` 表的 `plan_details` JSON字段中，**无需新增数据表**。结构示例：
    ```json
    "budget_overview": {
      "total_estimated": 10000,
      "currency": "CNY",
      "breakdown": [
        { "category": "交通", "amount": 4000 },
        { "category": "住宿", "amount": 3000 },
        { "category": "餐饮", "amount": 2000 },
        { "category": "其他", "amount": 1000 }
      ]
    }
    ```

**3. API 契约定义 (API Contract)**

**API 1: 添加一笔开销**

*   **Endpoint:** `POST /api/v1/plans/{planId}/expenses`
*   **描述:** 为指定的旅行计划添加一笔新的开销记录。
*   **认证:** `需要 (Bearer Token)`
*   **Request Body (application/json):**
    ```json
    {
      "amount": "number (required)",
      "category": "string (required)",
      "description": "string (optional)",
      "expense_date": "string (required, ISO 8601 format)"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "id": 501,
      "amount": 35,
      "category": "交通",
      "description": "打车去酒店"
    }
    ```
*   **Error Response (400 Bad Request):** `{"error": "Amount and category are required."}`

**API 2: 获取计划的所有开销**

*   **Endpoint:** `GET /api/v1/plans/{planId}/expenses`
*   **描述:** 获取指定旅行计划下的所有开销记录。
*   **认证:** `需要 (Bearer Token)`
*   **Success Response (200 OK):**
    ```json
    [
      { "id": 501, "amount": 35, "category": "交通", "description": "打车去酒店", "expense_date": "..." },
      { "id": 502, "amount": 128, "category": "餐饮", "description": "拉面午餐", "expense_date": "..." }
    ]
    ```

**API 3: (可选) 语音记账解析**

*   **Endpoint:** `POST /api/v1/expenses/parse-voice`
*   **描述:** (高级功能) 接收语音转录的文本，调用LLM解析出金额、类别等信息。
*   **认证:** `需要 (Bearer Token)`
*   **Request Body (application/json):**
    ```json
    {
      "text": "string (required, e.g., '打车花了35块')"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "amount": 35,
      "category": "交通",
      "description": "打车"
    }
    ```

**4. 工程任务分解 (Engineering Task Breakdown)**

*   **[BE]** `TASK-FIN-001:` (DB) 使用 Django ORM 定义 `expenses` 模型，并执行数据库迁移。
*   **[BE]** `TASK-FIN-002:` (API) 实现 `expenses` 的完整 CRUD API，特别是 `POST` 和 `GET`。 (依赖: TASK-FIN-001)
*   **[BE]** `TASK-FIN-003:` (API) 在 `GET /api/v1/plans/{planId}` 的返回结果中，聚合 `expenses` 表计算总花费，并与 `plan_details` 中的预算对比，形成完整的预算分析数据。
*   **[BE]** `TASK-FIN-004:` (Advanced) 实现 `POST /expenses/parse-voice` API，内部调用LLM服务解析文本。 (依赖: TASK-AI-001)
*   **[FE]** `TASK-FIN-005:` (UI) 在行程详情页，根据 `plan_details.budget_overview` 数据，使用图表库 (如 Ant Design Charts) 开发“预算分析”组件。
*   **[FE]** `TASK-FIN-006:` (UI) 根据UX规格，开发“记一笔”悬浮按钮 (FAB) 和弹出的记账模态框，包含金额、类别、日期等表单。
*   **[FE]** `TASK-FIN-007:` (Logic) 实现手动记账逻辑。提交表单时，调用 `POST /plans/{planId}/expenses` API。 (依赖: TASK-FIN-002, TASK-FIN-006)
*   **[FE]** `TASK-FIN-008:` (State) 记账成功后，需要重新获取计划的开销数据或预算分析数据，并更新UI，让用户能看到实时变化。 (依赖: TASK-FIN-003, TASK-FIN-007)
*   **[FE]** `TASK-FIN-009:` (Advanced) 在记账模态框中集成语音输入功能。获取到文本后，调用 `POST /expenses/parse-voice` API，并将返回结果自动填充到表单中。 (依赖: TASK-FIN-004, TASK-AI-007)

**5. 关键技术点与风险 (Key Notes & Risks)**

*   **Note 1 (预算估算):** US-103 的预算估算功能，其数据来源于 `TDD_AI_PLANNING` 中AI生成计划时一并产出的 `budget_overview` 对象。本模块只负责**展示**和**对比**，不负责**计算**估算值。
*   **Note 2 (数据聚合):** 为了减轻前端负担，实时的“总花费”应该由后端API (`GET /api/v1/plans/{planId}` 或一个专门的分析API) 计算好后直接返回给前端，而不是让前端获取所有开销记录后再自行计算。
*   **Note 3 (原型简化):** 根据技术方案，原型阶段将简化 `US-104`，**暂时移除语音记账功能 (TASK-FIN-004, TASK-FIN-009)**，只保留手动文本记账。
*   **Risk 1 (货币单位):** 目前硬编码为 `CNY`。未来支持多国旅行时，需要处理多货币的记录和换算，复杂度会显著增加。
*   **Risk 2 (类别管理):** 开销类别 (category) 目前是字符串。未来可能需要将其做成一个可配置的独立数据表，以方便用户自定义或后台管理。
*   **Risk 3 (LLM解析):** 语音记账的解析准确率依赖LLM。对于模糊的输入（如：“中午饭”），可能无法解析出金额，需要有良好的兜底和用户手动确认机制。
