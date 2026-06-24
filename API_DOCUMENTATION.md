# توثيق واجهة برمجة التطبيقات (API) — مشروع القصر العدلي

## المحتويات

1. [مقدمة عامة](#مقدمة-عامة)
2. [أنواع المستخدمين](#أنواع-المستخدمين)
3. [المصادقة من جانب العميل (Client)](#المصادقة-من-جانب-العميل-client)
4. [إنشاء وإدارة المدير (Admin)](#إنشاء-وإدارة-المدير-admin)
5. [المصادقة — Auth](#المصادقة--auth)
6. [إدارة المستخدمين — CRM](#إدارة-المستخدمين--crm)
7. [القضايا — Cases](#القضايا--cases)
8. [المستندات — Documents](#المستندات--documents)
9. [المواعيد — Appointments](#المواعيد--appointments)
10. [المهام — Tasks](#المهام--tasks)
11. [الإحصائيات والإشعارات — Statistics](#الإحصائيات-والإشعارات--statistics)
12. [الدردشة الفورية — Socket.IO](#الدردشة-الفورية--socketio)
13. [أشكال الأخطاء الموحدة](#أشكال-الأخطاء-الموحدة)

---

## مقدمة عامة

| البند | القيمة |
|-------|--------|
| **الإطار** | Node.js + Express |
| **قاعدة البيانات** | MongoDB (Mongoose) |
| **المنفذ الافتراضي** | `6013` (من `SERVER_PORT` في `.env`) |
| **عنوان الخادم** | `http://localhost:6013` |
| **CORS** | يجب أن يطابق `CLIENT_URL` في `.env` |
| **المصادقة** | JWT داخل Cookie باسم `token` (مدة 2 ساعة) |

### إعداد الطلبات من الواجهة الأمامية

```javascript
// مثال باستخدام fetch
const response = await fetch('http://localhost:6013/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // مهم: لإرسال واستقبال Cookie
  body: JSON.stringify({ email, password })
});
```

```javascript
// مثال باستخدام axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:6013';
```

---

## أنواع المستخدمين

| النوع (`type`) | الوصف | الصلاحيات العامة |
|----------------|-------|------------------|
| `client` | عميل | يرى قضاياه فقط، يسجل عبر `/auth/register` |
| `admin` | مدير | صلاحيات كاملة على القضايا والمستخدمين والمواعيد |
| `partner` | شريك | يمكنه إنشاء/تعديل/حذف القضايا مثل المدير |
| `associates` | محامي مشارك | يرى ويعدّل القضايا المسندة إليه |
| `paralegal` | مساعد قانوني | يرى القضايا المسندة إليه |

---

## المصادقة من جانب العميل (Client)

1. **تسجيل عميل جديد** → `POST /auth/register` (ينشئ `type: "client"` فقط)
2. **تسجيل الدخول** → `POST /auth/login` → يُرجع `{ token, type, name }` + Cookie
3. **جميع الطلبات المحمية** → أرسل Cookie تلقائياً عبر `credentials: 'include'`
4. **Socket.IO** → أرسل التوكن في `query.token`

---

## إنشاء وإدارة المدير (Admin)

### ⚠️ ملاحظة مهمة: أول مدير في النظام

لا يوجد سكربت seed في المشروع. **لا يمكن** إنشاء مدير عبر `/auth/register` (يُنشئ عميلاً فقط).

#### الطريقة 1 — عبر MongoDB مباشرة (موصى بها للبداية)

```javascript
// في MongoDB Compass أو mongosh
// 1. سجّل عميلاً عادياً عبر /auth/register
// 2. غيّر نوعه إلى admin:
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { type: "admin" } }
)
```

#### الطريقة 2 — عبر API بعد وجود مستخدم مسجل

1. سجّل دخول أي مستخدم موجود
2. استخدم `POST /api/crm/` لإنشاء موظف/مدير:

```http
POST /api/crm/
Content-Type: application/json
Cookie: token=<JWT>

{
  "username": "المدير",
  "email": "admin@example.com",
  "password": "123456",
  "type": "admin",
  "number": "0500000000",
  "address": "الرياض",
  "avatar_url": ""
}
```

**أنواع المستخدم (`type`) المسموحة عند الإنشاء:**
`admin` | `partner` | `associates` | `paralegal` | `client`

### إدارة المدير والموظفين

| الإجراء | Endpoint | من يستطيع |
|---------|----------|-----------|
| عرض جميع العملاء | `GET /api/crm/` | أي مستخدم مسجل |
| عرض جميع الموظفين | `GET /api/crm/employee` | أي مستخدم مسجل |
| عرض مستخدم | `GET /api/crm/:id` أو `GET /api/crm/self` | أي مستخدم مسجل |
| إنشاء مستخدم | `POST /api/crm/` | أي مستخدم مسجل |
| تعديل مستخدم | `PUT /api/crm/:id` | **admin**: أي مستخدم — **غير admin**: نفسه فقط |
| تعديل مع صورة | `PUT /api/crm/u/:id` | نفس القاعدة أعلاه |
| تغيير كلمة المرور | `PUT /api/crm/p` | المستخدم نفسه فقط |
| حذف مستخدم | `DELETE /api/crm/:id` | **admin**: أي مستخدم — **غير admin**: نفسه فقط |

---

## المصادقة — Auth

### 1. تسجيل عميل جديد

| | |
|---|---|
| **Endpoint** | `POST /auth/register` |
| **المصادقة** | لا (عام) |
| **من يستخدمه** | أي زائر |

**Body (JSON):**
```json
{
  "email": "client@example.com",
  "password": "123456",
  "username": "اسم العميل",
  "number": "0501234567",
  "address": "العنوان"
}
```

**Response نجاح (201):**
```json
{
  "message": "تم تسجيل المستخدم بنجاح"
}
```

**Response خطأ:**
```json
{ "err": "البريد الإلكتروني مطلوب!" }
```
```json
{ "message": "فشل تسجيل المستخدم" }
```

---

### 2. تسجيل الدخول

| | |
|---|---|
| **Endpoint** | `POST /auth/login` |
| **المصادقة** | لا (عام) |
| **من يستخدمه** | جميع أنواع المستخدمين |

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response نجاح (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "admin",
  "name": "اسم المستخدم"
}
```
> يُضبط أيضاً Cookie: `token` (httpOnly, 2 ساعة)

**Response خطأ:**
```json
{ "error": "لم يتم العثور على المستخدم" }
```
```json
{
  "error": "UnauthorizedAccessError",
  "message": "كلمة المرور غير صحيحة"
}
```

---

## إدارة المستخدمين — CRM

> جميع endpoints تتطلب `requireAuth` (Cookie `token`)

### 3. قائمة العملاء

| | |
|---|---|
| **Endpoint** | `GET /api/crm/` |
| **من يستخدمه** | أي مستخدم مسجل |

**Response (200):** مصفوفة من كائنات User (type = client)
```json
[
  {
    "_id": "665a1b2c3d4e5f6789012345",
    "username": "عميل",
    "email": "client@example.com",
    "number": "0501234567",
    "address": "الرياض",
    "avatar_url": "",
    "type": "client"
  }
]
```

---

### 4. قائمة الموظفين

| | |
|---|---|
| **Endpoint** | `GET /api/crm/employee` |
| **من يستخدمه** | أي مستخدم مسجل |

**Response (200):** مصفوفة من User حيث `type != "client"`

---

### 5. عرض مستخدم محدد

| | |
|---|---|
| **Endpoint** | `GET /api/crm/:id` |
| **من يستخدمه** | أي مستخدم مسجل |
| **`:id`** | معرف MongoDB أو `"self"` للمستخدم الحالي |

**Response (200):** كائن User كامل

**Response خطأ (400):**
```json
{
  "error": "DataNotExistError",
  "message": "المستخدم غير موجود"
}
```

---

### 6. إنشاء مستخدم (موظف/مدير)

| | |
|---|---|
| **Endpoint** | `POST /api/crm/` |
| **من يستخدمه** | أي مستخدم مسجل |

**Body (JSON):**
```json
{
  "username": "محمد",
  "email": "lawyer@example.com",
  "password": "123456",
  "type": "partner",
  "number": "0509876543",
  "address": "جدة",
  "avatar_url": ""
}
```

**Response (200):** كائن User المُنشأ

---

### 7. تحديث مستخدم

| | |
|---|---|
| **Endpoint** | `PUT /api/crm/:id` |
| **من يستخدمه** | admin: أي مستخدم — غير admin: نفسه فقط |

**Body (JSON):**
```json
{
  "username": "اسم جديد",
  "email": "new@example.com",
  "number": "0501111111",
  "address": "عنوان جديد",
  "type": "admin"
}
```
> حقل `type` يُطبَّق فقط إذا كان الطالب admin

---

### 8. تحديث مستخدم مع صورة

| | |
|---|---|
| **Endpoint** | `PUT /api/crm/u/:id` |
| **Content-Type** | `multipart/form-data` |
| **من يستخدمه** | admin: أي مستخدم — غير admin: نفسه فقط |

**Form fields:**
- `avatar_url` — ملف الصورة
- `username`, `email`, `number`, `address`, `type` — نص

---

### 9. تغيير كلمة المرور

| | |
|---|---|
| **Endpoint** | `PUT /api/crm/p` |
| **من يستخدمه** | المستخدم الحالي فقط |

**Body (JSON):**
```json
{
  "oldpassword": "123456",
  "newpassword": "654321"
}
```

**Response خطأ:**
```json
{
  "error": "PasswordNotSameError",
  "message": "كلمة المرور القديمة غير صحيحة"
}
```

---

### 10. حذف مستخدم

| | |
|---|---|
| **Endpoint** | `DELETE /api/crm/:id` |
| **من يستخدمه** | admin: أي مستخدم — غير admin: نفسه فقط |

**Response (200):** كائن User المحذوف

---

## القضايا — Cases

> جميع endpoints تتطلب `requireAuth`

### 11. قائمة القضايا

| | |
|---|---|
| **Endpoint** | `GET /api/cases/` |
| **admin** | يرى جميع القضايا |
| **غير admin** | يرى القضايا التي هو عضو فيها فقط |

**Response (200):**
```json
[
  {
    "_id": "665a1b2c3d4e5f6789012345",
    "case_title": "قضية تجارية",
    "case_created_by": "665a00000000000000000001",
    "case_description": "وصف القضية",
    "case_type": "تجاري",
    "case_status": "Open",
    "case_priority": "عالية",
    "case_total_billed_hour": 10,
    "case_member_list": [
      {
        "case_member_id": "665a00000000000000000001",
        "case_member_type": "client",
        "case_member_role": "مدعي"
      }
    ]
  }
]
```

**حالات القضية (`case_status`):** `Open` | `Closed` | `Pending`

---

### 12. عرض قضية واحدة

| | |
|---|---|
| **Endpoint** | `GET /api/cases/:id` |
| **admin / partner** | أي قضية |
| **غير ذلك** | القضايا التي هو عضو فيها |

---

### 13. رسائل القضية (Chat history)

| | |
|---|---|
| **Endpoint** | `GET /api/cases/:id/message` |
| **من يستخدمه** | admin, partner, أو associates المسند إليهم |

**Response (200):**
```json
{
  "_id": "...",
  "message_case_id": "665a1b2c3d4e5f6789012345",
  "message_list": [
    {
      "message_sender_id": "...",
      "message_sender_name": "محمد",
      "message_sender_avatar": "https://...",
      "message_type": "text",
      "message": "مرحباً",
      "message_sent_date": "1718364000000"
    }
  ]
}
```

---

### 14. إنشاء قضية

| | |
|---|---|
| **Endpoint** | `POST /api/cases/` |
| **admin / partner** | ✅ |
| **غير ذلك** | ❌ |

**Body (JSON):**
```json
{
  "case_title": "قضية جديدة",
  "case_description": "الوصف",
  "case_type": "مدني",
  "case_status": "Open",
  "case_priority": "متوسطة",
  "case_total_billed_hour": 5,
  "case_member_list": [
    {
      "case_member_id": "665a00000000000000000001",
      "case_member_type": "client",
      "case_member_role": "مدعي"
    }
  ]
}
```

**Response خطأ (403):**
```json
{
  "error": "رفض الوصول. فقط المدير أو الشريك يمكنه إنشاء قضية."
}
```

---

### 15. تعديل قضية

| | |
|---|---|
| **Endpoint** | `PUT /api/cases/:id` |
| **admin / partner** | ✅ |
| **associates** | ✅ إذا كان مسنداً للقضية |
| **غير ذلك** | ❌ |

**Body:** أي حقول Case للتحديث

---

### 16. حذف قضية

| | |
|---|---|
| **Endpoint** | `DELETE /api/cases/:id` |
| **admin / partner** | ✅ |
| **غير ذلك** | ❌ |

**Response (200):**
```json
{
  "message": "تم حذف القضية بنجاح",
  "deletedCase": { ... }
}
```

---

## المستندات — Documents

> جميع endpoints تتطلب `requireAuth`

### 17. جميع المستندات

| | |
|---|---|
| **Endpoint** | `GET /api/documents/all` |
| **من يستخدمه** | أي مستخدم مسجل |

**Response (200):** مصفوفة مع حقول إضافية:
```json
[
  {
    "_id": "...",
    "doc_title": "عقد",
    "doc_type": "pdf",
    "doc_link_file": "http://docs.google.com/uc?export=open&id=...",
    "doc_link_onlineDrive": "https://drive.google.com/file/d/.../view",
    "doc_avatar": "https://res.cloudinary.com/...",
    "filesize": 1024,
    "uploaded_at": "1718364000000",
    "uploaded_by": "...",
    "can_be_access_by": ["...", "..."],
    "doc_case_related": "...",
    "doc_description": "وصف",
    "uploadedByUserName": { "username": "...", "avatar_url": "..." },
    "lastAccessedByUserName": { "username": "...", "avatar_url": "..." },
    "relatedCaseName": { "case_title": "..." }
  }
]
```

---

### 18. مستندات قضية معينة

| | |
|---|---|
| **Endpoint** | `GET /api/documents/all/:caseId` |
| **admin** | جميع مستندات القضية |
| **غير admin** | المستندات التي `can_be_access_by` يتضمن userId |

---

### 19. عرض مستند واحد

| | |
|---|---|
| **Endpoint** | `GET /api/documents/:id/:caseId` |
| **من يستخدمه** | أعضاء القضية |

**Response (200):** كائن Document + `canEdit`, `uploadedByUserName`, `lastAccessedByUserName`, `relatedCaseName`

---

### 20. رفع مستند

| | |
|---|---|
| **Endpoint** | `POST /api/documents/` |
| **Content-Type** | `multipart/form-data` |
| **من يستخدمه** | أعضاء القضية |

**Form fields:**
| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `docUpload` | ✅ | الملف |
| `doc_type` | ✅ | نوع المستند |
| `filesize` | ✅ | حجم الملف |
| `doc_title` | ✅ | عنوان |
| `doc_case_related` | ✅ | معرف القضية |
| `doc_description` | ✅ | وصف |
| `uploaded_by` | ❌ | يُستخدم userId الحالي افتراضياً |
| `can_be_access_by` | ❌ | مصفوفة ObjectId — افتراضياً كل أعضاء القضية |
| `req_msg_id` | ❌ | معرف رسالة طلب مستند |

---

### 21. تعديل مستند

| | |
|---|---|
| **Endpoint** | `PUT /api/documents/` |
| **admin** | أي مستند |
| **غير admin** | مستنداته فقط |

**Body (JSON):**
```json
{
  "q": {
    "q_id": "665a1b2c3d4e5f6789012345",
    "q_caseId": "665a00000000000000000001"
  },
  "doc_type": "pdf",
  "doc_title": "عنوان جديد",
  "can_be_access_by": ["665a00000000000000000001"],
  "doc_description": "وصف محدّث"
}
```

---

### 22. حذف مستند

| | |
|---|---|
| **Endpoint** | `DELETE /api/documents/:id/:caseId` |
| **admin** | أي مستند |
| **غير admin** | مستنداته فقط |

---

## المواعيد — Appointments

> جميع endpoints تتطلب `requireAuth`

### 23. قائمة المواعيد

| | |
|---|---|
| **Endpoint** | `GET /api/appointments/` |
| **admin** | جميع المواعيد |
| **غير admin** | مواعيده (منشئ أو مدعو) وحالة `scheduled` |

**Response (200):**
```json
{
  "username": "محمد",
  "isAdmin": false,
  "appointments": [
    {
      "_id": "...",
      "creator": "محمد",
      "title": "اجتماع",
      "attendees": [
        { "name": "أحمد", "response": "pending" }
      ],
      "location": "المكتب",
      "dateStart": "2026-06-15",
      "dateEnd": "2026-06-15",
      "timeStart": "10:00",
      "timeEnd": "11:00",
      "details": "تفاصيل",
      "status": "scheduled"
    }
  ]
}
```

**قيم `response`:** `accepted` | `pending` | `declined`  
**قيم `status`:** `scheduled` | `cancelled`

---

### 24. التحقق هل المستخدم admin

| | |
|---|---|
| **Endpoint** | `GET /api/appointments/isAdmin` |
| **Response** | `true` أو `false` (نص خام، ليس JSON) |

---

### 25. قائمة أسماء المستخدمين

| | |
|---|---|
| **Endpoint** | `GET /api/appointments/userlist` |
| **Response (200):** | `["أحمد", "محمد", ...]` |

---

### 26. إنشاء موعد

| | |
|---|---|
| **Endpoint** | `POST /api/appointments/` |
| **من يستخدمه** | أي مستخدم مسجل |

**Body (JSON):**
```json
{
  "title": "اجتماع مع العميل",
  "attendees": [
    { "name": "أحمد", "response": "pending" }
  ],
  "location": "المكتب الرئيسي",
  "dateStart": "2026-06-20",
  "dateEnd": "2026-06-20",
  "timeStart": "14:00",
  "timeEnd": "15:00",
  "details": "مناقشة القضية",
  "status": "scheduled"
}
```
> `creator` يُضاف تلقائياً من JWT

---

### 27. عرض موعد واحد

| | |
|---|---|
| **Endpoint** | `GET /api/appointments/:id` |

---

### 28. تحديث موعد

| | |
|---|---|
| **Endpoint** | `PUT /api/appointments/:id` |
| **Body:** | كائن Appointment كامل |

---

### 29. إلغاء موعد

| | |
|---|---|
| **Endpoint** | `DELETE /api/appointments/:id` |
| **النتيجة** | يغيّر `status` إلى `cancelled` |

---

### 30. الرد على دعوة موعد

| | |
|---|---|
| **Endpoint** | `PUT /api/appointments/response/:id` |
| **من يستخدمه** | المدعو (attendee) |

**Body (JSON):**
```json
{
  "response": "accepted"
}
```
> القيم: `accepted` | `declined`

---

## المهام — Tasks

> جميع endpoints تتطلب `requireAuth`  
> ⚠️ لا توجد قيود صلاحيات حالياً — أي مستخدم مسجل يمكنه إدارة جميع المهام

### 31. جميع المهام

| | |
|---|---|
| **Endpoint** | `GET /api/tasks/` |

**Response (200):**
```json
[
  {
    "_id": "...",
    "title": "مراجعة عقد",
    "description": "تفاصيل",
    "status": "todo",
    "assignedBy": "...",
    "assignedTo": [
      { "userId": "...", "status": "pending" }
    ],
    "deadline": "2026-06-25",
    "taskAssignedDate": "2026-06-14",
    "acceptanceCriteria": "معايير القبول"
  }
]
```

**حالات المهمة (`status`):** `todo` | `in_progress` | `done`

---

### 32. مهام المستخدم الحالي

| | |
|---|---|
| **Endpoint** | `GET /api/tasks/user` |

**Response (200):** مصفوفة مع `assignedByUser` و `assignedToUsers`

---

### 33. إنشاء مهمة

| | |
|---|---|
| **Endpoint** | `POST /api/tasks/` |

**Body (JSON):**
```json
{
  "title": "مهمة جديدة",
  "description": "الوصف",
  "status": "todo",
  "assignedTo": [
    { "name": "665a00000000000000000001", "response": "pending" }
  ],
  "deadline": "2026-06-30",
  "acceptanceCriteria": "يجب إنجازها قبل الموعد"
}
```
> `name` = userId، `response` = status للمُسند إليه

---

### 34. عرض مهمة واحدة

| | |
|---|---|
| **Endpoint** | `GET /api/tasks/:id` |

---

### 35. تحديث مهمة

| | |
|---|---|
| **Endpoint** | `PUT /api/tasks/:id` |

**Body (JSON):**
```json
{
  "_id": "...",
  "title": "عنوان محدّث",
  "details": "وصف محدّث",
  "status": "in_progress",
  "assignedToUsers": [
    { "name": "665a00000000000000000001", "response": "working" }
  ],
  "dateStart": "2026-07-01",
  "location": "معايير محدّثة"
}
```

---

### 36. تحديث حالة مهمة

| | |
|---|---|
| **Endpoint** | `PUT /api/tasks/updateStatus/:status` |
| **`:status`** | مثل `working` أو `done` |

**Body (JSON):**
```json
{ "_id": "665a1b2c3d4e5f6789012345" }
```

---

### 37. حذف مهمة

| | |
|---|---|
| **Endpoint** | `DELETE /api/tasks/:id` |

**Response (200):**
```json
{ "message": "تم حذف المهمة" }
```

---

### 38. قائمة المستخدمين للمهام

| | |
|---|---|
| **Endpoint** | `GET /api/tasks/userlist` |
| **Response:** | مصفوفة كائنات User `{ _id, username, ... }` |

---

## الإحصائيات والإشعارات — Statistics

### 39. لوحة الإحصائيات

| | |
|---|---|
| **Endpoint** | `GET /api/statistics/dashboard` |
| **من يستخدمه** | أي مستخدم مسجل |

**Response (200):**
```json
{
  "caseStatistic": {
    "open": 5,
    "close": 2,
    "pending": 3
  },
  "userStatistic": {
    "admins": 1,
    "paralegals": 2,
    "clients": 10,
    "partners": 1,
    "associates": 3
  },
  "clientStatistic": {
    "serviceQuality": 4.5,
    "communication": 4.7,
    "professionalism": 4.3,
    "clientOverallSatisfactoryRating": 4.5,
    "performance": 4.4
  }
}
```
> `clientStatistic` بيانات تجريبية ثابتة حالياً

---

### 40. الإشعارات

| | |
|---|---|
| **Endpoint** | `GET /api/statistics/notifications` |
| **من يستخدمه** | أي مستخدم مسجل |

**Response (200):**
```json
[
  {
    "_id": "...",
    "notification_type": "addDocument",
    "notification_status": "sent",
    "notification": "محمد has uploaded new document in this case: ...",
    "notification_clicklink": "/php/document/view.php?id=...",
    "notification_sent_date": "1718364000000",
    "notification_recipient_id_and_status": [
      { "recipient_id": "...", "status": "read" }
    ],
    "read": true
  }
]
```
> عند الجلب تُعلَّم الإشعارات كـ `read`

---

## الدردشة الفورية — Socket.IO

**الاتصال:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:6013', {
  withCredentials: true,
  query: { token: '<JWT من login>' }
});
```

### الأحداث

| الحدث | الاتجاه | الوصف |
|-------|---------|-------|
| `joinRoom` | Client → Server | `{ caseId }` — الانضمام لغرفة القضية |
| `chatMessage` | Client → Server → Broadcast | إرسال رسالة |
| `message` | Server → Client | استقبال رسالة |
| `disconnect` | Client → Server | قطع الاتصال |

**إرسال رسالة:**
```javascript
socket.emit('joinRoom', caseId);
socket.emit('chatMessage', {
  caseId: '665a1b2c3d4e5f6789012345',
  type: 'text',
  message: 'مرحباً'
});

socket.on('message', (data) => {
  console.log(data);
});
```

**خطأ المصادقة:** `خطأ في المصادقة`

---

## أشكال الأخطاء الموحدة

### 401 — غير مصرح (لا Cookie أو Token منتهي)
```json
{
  "status": 401,
  "info": "وصول غير مصرح به",
  "error_code": 401,
  "message": "وصول غير مصرح به"
}
```

### 400 — خطأ تحقق
```json
{
  "error": "فشل التحقق من البيانات",
  "validationErrors": {
    "email": "البريد الإلكتروني مطلوب"
  }
}
```

### 400 — خطأ مخصص
```json
{
  "error": "DataNotExistError",
  "message": "المستخدم غير موجود"
}
```

### 403 — رفض صلاحية
```json
{
  "error": "رفض الوصول. فقط المدير أو الشريك يمكنه إنشاء قضية."
}
```

### 404 — غير موجود
```json
{
  "error": "القضية غير موجودة"
}
```

---

## ملخص سريع — جميع Endpoints

| Method | Endpoint | الصلاحية |
|--------|----------|----------|
| POST | `/auth/register` | عام |
| POST | `/auth/login` | عام |
| GET | `/api/crm/` | مسجل |
| GET | `/api/crm/employee` | مسجل |
| GET | `/api/crm/:id` | مسجل |
| POST | `/api/crm/` | مسجل |
| PUT | `/api/crm/p` | مسجل (نفسه) |
| PUT | `/api/crm/u/:id` | admin أو نفسه |
| PUT | `/api/crm/:id` | admin أو نفسه |
| DELETE | `/api/crm/:id` | admin أو نفسه |
| GET | `/api/cases/` | مسجل |
| GET | `/api/cases/:id` | مسجل |
| GET | `/api/cases/:id/message` | مسجل |
| POST | `/api/cases/` | admin, partner |
| PUT | `/api/cases/:id` | admin, partner, associates |
| DELETE | `/api/cases/:id` | admin, partner |
| GET | `/api/documents/all` | مسجل |
| GET | `/api/documents/all/:caseId` | مسجل |
| GET | `/api/documents/:id/:caseId` | مسجل |
| POST | `/api/documents/` | مسجل |
| PUT | `/api/documents/` | مسجل |
| DELETE | `/api/documents/:id/:caseId` | مسجل |
| GET | `/api/appointments/` | مسجل |
| POST | `/api/appointments/` | مسجل |
| GET | `/api/appointments/isAdmin` | مسجل |
| GET | `/api/appointments/userlist` | مسجل |
| GET | `/api/appointments/:id` | مسجل |
| PUT | `/api/appointments/:id` | مسجل |
| DELETE | `/api/appointments/:id` | مسجل |
| PUT | `/api/appointments/response/:id` | مسجل |
| GET | `/api/tasks/` | مسجل |
| POST | `/api/tasks/` | مسجل |
| GET | `/api/tasks/userlist` | مسجل |
| GET | `/api/tasks/user` | مسجل |
| PUT | `/api/tasks/updateStatus/:status` | مسجل |
| GET | `/api/tasks/:id` | مسجل |
| PUT | `/api/tasks/:id` | مسجل |
| DELETE | `/api/tasks/:id` | مسجل |
| GET | `/api/statistics/dashboard` | مسجل |
| GET | `/api/statistics/notifications` | مسجل |

---

*آخر تحديث: يونيو 2026 — جميع رسائل الأخطاء باللغة العربية*
