const mongoose = require('mongoose');
const { Schema } = mongoose

const validateArrayLength = (value) => {
    if (!Array.isArray(value) || value.length == 0) {
        return false;
    }
    return true
}
// Schema
const caseSchema = new Schema({
    case_title: {
        type: String,
        required: [true, "عنوان القضية مطلوب"],
    },
    case_created_by: {
        type: String,
        required: [true, "منشئ القضية مطلوب"],
    },
    case_description: {
        type: String,
        required: [true, "وصف القضية مطلوب"],
    },
    case_type: {
        type: String,
        required: [true, "نوع القضية مطلوب"],
    },
    case_status: {
        type: String,
        required: [true, "حالة القضية مطلوبة"],
    },
    case_priority: {
        type: String,
        required: [true, "أولوية القضية مطلوبة"],
    },
    case_total_billed_hour: {
        type: Number,
        required: [true, "إجمالي ساعات الفوترة مطلوب"],
    },
    case_member_list: {
        type: [
            {
                case_member_id: {
                    type: String,
                    required: true,
                },
                case_member_type: {
                    type: String,
                    required: true,
                },
                case_member_role: {
                    type: String,
                    required: true,
                },
            }],
        validate: {
            validator: validateArrayLength,
            message: "قائمة أعضاء القضية لا يمكن أن تكون فارغة"
        }
    }
})

// Model
const CaseModel = mongoose.model('Case', caseSchema);

module.exports = CaseModel