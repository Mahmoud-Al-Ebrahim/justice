const messages = {
    UNAUTHORIZED: 'وصول غير مصرح به',
    NO_ACCESS: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
    VALIDATION_FAILED: 'فشل التحقق من البيانات',

    // Auth
    EMAIL_REQUIRED: 'البريد الإلكتروني مطلوب!',
    PASSWORD_MIN_LENGTH: 'كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل!',
    USERNAME_REQUIRED: 'اسم المستخدم مطلوب!',
    NUMBER_REQUIRED: 'رقم الهاتف مطلوب!',
    ADDRESS_REQUIRED: 'العنوان مطلوب!',
    REGISTRATION_SUCCESS: 'تم تسجيل المستخدم بنجاح',
    REGISTRATION_FAILED: 'فشل تسجيل المستخدم',
    NO_USER_FOUND: 'لم يتم العثور على المستخدم',
    WRONG_PASSWORD: 'كلمة المرور غير صحيحة',

    // CRM
    NO_USER_UPLOADED: 'لم يتم إضافة المستخدم',
    USER_NOT_EXIST: 'المستخدم غير موجود',
    PASSWORD_NOT_SAME: 'كلمة المرور القديمة غير صحيحة',

    // Cases
    NO_CASE_UPLOADED: 'لم يتم إنشاء القضية',
    CASE_CREATE_DENIED: 'رفض الوصول. فقط المدير أو الشريك يمكنه إنشاء قضية.',
    CASE_EDIT_DENIED: 'رفض الوصول. فقط المدير أو الشريك أو المحامي المشارك يمكنه تعديل القضية.',
    CASE_DELETE_DENIED: 'رفض الوصول. فقط المدير أو الشريك يمكنه حذف القضية.',
    CASE_NOT_FOUND: 'القضية غير موجودة',
    CASE_NOT_EXIST: 'القضية غير موجودة',
    CASE_DELETED: 'تم حذف القضية بنجاح',

    // Documents
    DOCUMENT_NOT_EXIST: 'المستند غير موجود',
    NO_DOCUMENT_UPLOADED: 'لم يتم رفع المستند',

    // Appointments
    APPOINTMENT_NOT_FOUND: 'الموعد غير موجود',
    APPOINTMENT_NOT_MODIFIED: 'الموعد غير موجود أو لم يتم إجراء أي تعديل',
    APPOINTMENTS_SEND_ERROR: 'خطأ في إرسال المواعيد',
    USER_LIST_SEND_ERROR: 'خطأ في إرسال قائمة المستخدمين',
    APPOINTMENT_SAVE_ERROR: 'خطأ في حفظ أو معالجة الموعد',
    APPOINTMENT_FETCH_ERROR: 'خطأ في جلب الموعد',
    APPOINTMENT_UPDATE_ERROR: 'خطأ في تحديث الموعد',
    APPOINTMENT_STATUS_ERROR: 'خطأ في تحديث حالة الموعد',
    APPOINTMENT_RESPONSE_ERROR: 'خطأ في تحديث رد المشارك',
    APPOINTMENT_MESSAGE_ERROR: 'رسالة موعد غير صحيحة. يرجى التواصل مع المسؤول',
    APPOINTMENTS_RETRIEVE_ERROR: 'خطأ في جلب المواعيد',
    APPOINTMENT_RETRIEVE_ERROR: 'خطأ في جلب الموعد المحدد',
    USERS_RETRIEVE_ERROR: 'خطأ في جلب أسماء المستخدمين',

    // Tasks
    TASK_NOT_FOUND: 'المهمة غير موجودة',
    TASK_DELETED: 'تم حذف المهمة',

    // Statistics
    NOTIFICATIONS_NOT_EXIST: 'الإشعارات غير موجودة',

    // Socket
    AUTH_ERROR: 'خطأ في المصادقة',
    SERVER_ERROR: 'حدث خطأ في الخادم',

    // Internal
    NOTIFICATION_NOT_SENT: 'لم يتم إرسال الإشعار',
};

module.exports = messages;
