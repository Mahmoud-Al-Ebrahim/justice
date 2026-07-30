class DataNotExistError extends Error {
    constructor(message) {
      super(message); 
      this.name = "البيانات غير موجودة"; 
    }
  }
  class UserNotSameError extends Error {
    constructor(message) {
      super(message); 
      this.name = "المستخدم غير مطابق"; 
    }
  }

  class ServerError extends Error {
    constructor(message) {
      super(message); 
      this.name = "خطأ في الخادم"; 
    }
  }

  class DoNotHaveAccessError extends Error {
    constructor(message) {
      super(message); 
      this.name = "ليس لديك صلاحية الوصول"; 
    }
  }

  class PasswordNotSameError extends Error {
    constructor(message) {
      super(message); 
      this.name = "كلمة المرور غير مطابقة"; 
    }
  }

  class UnauthorizedAccessError extends Error {
    constructor(message) {
      super(message); 
      this.name = "وصول غير مصرح به"; 
    }
  }

module.exports = {
    DataNotExistError,
    UserNotSameError,
    DoNotHaveAccessError,
    PasswordNotSameError,
    UnauthorizedAccessError
};
