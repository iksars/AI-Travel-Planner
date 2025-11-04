
**技术设计与任务分解文档 (TDD) - 用户与数据管理**

**1. 核心功能/用户故事 (Key Feature / User Story)**

*   **US-201: 用户认证**
    *   **描述:** 作为一名用户, 我想要能够注册和登录我的账户, 以便安全地保存我的个人数据。
*   **US-202: 旅行计划管理**
    *   **描述:** 作为一名注册用户, 我想要能够保存、查看和管理我的多份旅行计划, 以便未来查阅或再次使用。
*   **US-203: 用户数据同步**
    *   **描述:** 作为一名注册用户, 我想要我的所有旅行计划、偏好设置和费用记录都能在云端同步, 以便我可以在电脑或手机上无缝访问和修改。

**2. 数据库 Schema 设计 (Database Schema)**

*   **技术选型:** 原型阶段使用 `SQLite`，通过 `Django ORM` 进行管理。

*   **表名： `users`**
    *   **描述:** 存储用户信息，用于认证和关联数据。
    ```sql
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL, -- 存储加盐哈希后的密码
        username VARCHAR(150) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 索引: 为频繁用于登录和查询的字段创建索引
    CREATE INDEX idx_users_email ON users(email);
    ```

*   **表名： `travel_plans`**
    *   **描述:** 存储用户创建的旅行计划的核心信息。
    ```sql
    CREATE TABLE travel_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        -- 存储由AI生成的完整计划详情，JSON格式具有良好的灵活性
        plan_details TEXT NOT NULL, -- 存储为 JSON 格式
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 索引: 加速按用户查询其所有旅行计划
    CREATE INDEX idx_travel_plans_user_id ON travel_plans(user_id);
    ```

**3. API 契约定义 (API Contract)**

**API 1: 创建新用户 (注册)**

*   **Endpoint:** `POST /api/v1/auth/register`
*   **描述:** 允许新用户通过邮箱和密码创建账户。
*   **认证:** `无需`
*   **Request Body (application/json):**
    ```json
    {
      "username": "string (required, unique)",
      "email": "string (required, valid email, unique)",
      "password": "string (required, min 8 chars)"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "userId": 1,
      "username": "testuser",
      "email": "user@example.com",
      "token": "jwt.token.string" 
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: `{"error": "Password must be at least 8 characters long."}`
    *   `409 Conflict`: `{"error": "Email or username already in use."}`

**API 2: 用户登录**

*   **Endpoint:** `POST /api/v1/auth/login`
*   **描述:** 使用邮箱和密码进行身份验证，获取访问令牌 (Token)。
*   **认证:** `无需`
*   **Request Body (application/json):**
    ```json
    {
      "email": "string (required)",
      "password": "string (required)"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "token": "jwt.token.string"
    }
    ```
*   **Error Response (401 Unauthorized):** `{"error": "Invalid credentials."}`

**API 3: 获取当前用户信息**

*   **Endpoint:** `GET /api/v1/users/me`
*   **描述:** 获取当前已登录用户的个人资料。
*   **认证:** `需要 (Bearer Token)`
*   **Request Body:** `无`
*   **Success Response (200 OK):**
    ```json
    {
      "userId": 1,
      "username": "testuser",
      "email": "user@example.com"
    }
    ```

**API 4: 保存/创建旅行计划**

*   **Endpoint:** `POST /api/v1/plans`
*   **描述:** 为当前登录用户保存一个新的旅行计划。
*   **认证:** `需要 (Bearer Token)`
*   **Request Body (application/json):**
    ```json
    {
      "title": "string (required)",
      "plan_details": "object (required, JSON object)"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "id": 101,
      "title": "我的日本东京5日游",
      "created_at": "2025-11-04T10:00:00Z"
    }
    ```

**API 5: 获取用户的所有旅行计划**

*   **Endpoint:** `GET /api/v1/plans`
*   **描述:** 获取当前登录用户的所有旅行计划列表。
*   **认证:** `需要 (Bearer Token)`
*   **Success Response (200 OK):**
    ```json
    [
      { "id": 101, "title": "我的日本东京5日游", "updated_at": "2025-11-04T10:00:00Z" },
      { "id": 102, "title": "周末云南徒步之旅", "updated_at": "2025-10-28T15:30:00Z" }
    ]
    ```

**API 6: 更新旅行计划**

*   **Endpoint:** `PUT /api/v1/plans/{planId}`
*   **描述:** 更新一个已存在的旅行计划。
*   **认证:** `需要 (Bearer Token)`
*   **Success Response (200 OK):**
    ```json
    {
      "id": 101,
      "title": "修改后的日本之旅",
      "updated_at": "2025-11-05T11:00:00Z"
    }
    ```

**4. 工程任务分解 (Engineering Task Breakdown)**

*   **[BE]** `TASK-USER-001:` (DB) 使用 Django ORM 定义 `users` 和 `travel_plans` 模型，并执行数据库迁移。
*   **[BE]** `TASK-USER-002:` (Security) 配置 Django 认证系统，确保密码自动加盐哈希。
*   **[BE]** `TASK-USER-003:` (API) 实现 `POST /register` 端点逻辑。 (依赖: TASK-USER-001, TASK-USER-002)
*   **[BE]** `TASK-USER-004:` (API) 实现 `POST /login` 端点逻辑，并集成 `djangorestframework-simplejwt` 生成 JWT。 (依赖: TASK-USER-002)
*   **[BE]** `TASK-USER-005:` (API) 实现 `GET /users/me` 端点，要求有效 JWT 认证。 (依赖: TASK-USER-004)
*   **[BE]** `TASK-USER-006:` (API) 实现 `travel_plans` 的完整 CRUD API。 (依赖: TASK-USER-001, TASK-USER-004)
*   **[FE]** `TASK-USER-007:` (UI) 构建“注册”和“登录”页面的 UI。
*   **[FE]** `TASK-USER-008:` (State) 配置前端路由及全局路由守卫。
*   **[FE]** `TASK-USER-009:` (Logic) 实现注册和登录表单的客户端验证。 (依赖: TASK-USER-007)
*   **[FE]** `TASK-USER-010:` (Integration) 对接注册和登录 API，并将 JWT Token 存入 `localStorage`。 (依赖: TASK-USER-003, TASK-USER-004)
*   **[FE]** `TASK-USER-011:` (Integration) 实现“保存计划”功能，未登录则弹出登录模态框，登录后调用 `POST /api/v1/plans`。 (依赖: TASK-USER-006, TASK-USER-010)
*   **[FE]** `TASK-USER-012:` (UI) 创建“我的旅行”页面。
*   **[FE]** `TASK-USER-013:` (Integration) 在“我的旅行”页面加载时，调用 `GET /api/v1/plans` 并渲染列表。 (依赖: TASK-USER-006, TASK-USER-012)
*   **[FE]** `TASK-USER-014:` (Sync) 建立一个全局状态管理模块 (如 Pinia/Vuex)，用于存储用户信息和认证状态。应用启动时，检查 `localStorage` 中的 `token` 并调用 `GET /users/me` 恢复登录状态，确保多设备访问时体验一致。 (依赖: TASK-USER-005, TASK-USER-010)

**5. 关键技术点与风险 (Key Notes & Risks)**

*   **Note 1 (数据同步):** US-203 的核心是通过中心化的后端API实现的。任何设备上的任何修改（如通过 `PUT /api/v1/plans/{id}`）都会更新数据库中的“唯一真相来源”，其他设备下次拉取（`GET /api/v1/plans`）时自然会获得最新数据。
*   **Note 2 (安全):** 前端获取的 JWT Token 存储在 `localStorage` 在原型阶段是可接受的，但有 XSS 风险。
*   **Risk 1 (数据一致性):** 数据库层面的 `UNIQUE` 约束是防止并发请求导致数据重复的关键。
*   **Risk 2 (部署):** SQLite 是单文件数据库，部署时需确认平台的文件系统是持久化的，否则重启可能导致数据丢失。这是原型阶段的最大风险。
