const mongoose = require('mongoose');
const { Schema } = mongoose
const { ObjectId } = mongoose.Types;
// Schema

const validateObjectId = (value) => {
    if (!Array.isArray(value) && typeof value === 'string') {
        return /^[0-9a-fA-F]{24}$/.test(value);
    }

    // Check if every element in the array is a valid ObjectId
    const isValid = value.every((element) => {
        return /^[0-9a-fA-F]{24}$/.test(element);
    });

    return isValid;
}

const validateArrayLength = (value) => {
    if (!Array.isArray(value) || value.length == 0) {
        return false;
    }
    return true
}

const documentSchema = new Schema({
    doc_link_file: {
        type: String,
        required: true,
    },
    doc_link_fileId: {
        type: String,
        required: true,
    },
    doc_link_onlineDrive: {
        type: String,
        required: true,
    },
    doc_type: {
        type: String,
        required: true,
    }, 
    doc_avatar: {
        type: String
    },
    filesize: {
        type: Number,
        required: true,
    },
    uploaded_at: {
        type: String,
        required: [true, "تاريخ الرفع مطلوب"],
    },
    last_accessed_at: {
        type: [{
            userId: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            },
            action: {
                type: String,
                required: true
            },
            access_date_time :{
                type: String
            }
        }],
    },
    doc_title: {
        type: String,
        required: [true, "عنوان المستند مطلوب"],
    },
    uploaded_by: {
        type: String,
        required: [true, "رافع المستند مطلوب"],
        validate: {
            validator: validateObjectId,
            message: props => `رافع المستند غير صالح أو معرف غير صحيح`
        },
    },
    can_be_access_by: {
        type: [String],
        required: [true, "قائمة من يمكنهم الوصول مطلوبة"],
        validate: [{
            validator: validateObjectId,
            message: props => `معرف الوصول غير صالح`
        }, {
            validator: validateArrayLength,
            message: props => `قائمة من يمكنهم الوصول لا يمكن أن تكون فارغة`
        }],
    },
    doc_case_related: {
        type: String,
        required: [true, "القضية المرتبطة مطلوبة"],
    },
    doc_description: {
        type: String,
        required: [true, "وصف المستند مطلوب"],
    },
    doc_requested: {
        type: String
    }
})

// Model
const DocumentModel = mongoose.model('Document', documentSchema);

module.exports = DocumentModel  