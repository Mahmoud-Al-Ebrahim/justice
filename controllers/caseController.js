const Case = require('../models/case');
const Message = require('../models/message');
const mongoose = require('mongoose');
const getUserInfo = require('../helpers/getUserInfo');
const { DataNotExistError, UserNotSameError, DoNotHaveAccessError } = require('../helpers/exceptions');
const messages = require('../helpers/messages');

const checkCaseAccess = async (userId, type, caseId) => {
    // let cases;
    if (type === "admin" || type === 'partner')
        // cases = await Case.findById(new mongoose.Types.ObjectId(caseId))
        return true;
    // else
    //     cases = await Case.find(
    //         {
    //             "case_member_list.case_member_id": userId,
    //             "case_member_list.case_member_type": type,
    //             "_id": new mongoose.Types.ObjectId(caseId)
    //         }
    //     )

    // if (!cases || cases.length === 0)
    //     throw new DataNotExistError("Case not exist")
    // For associates, check if the case is assigned to them
    const cases = await Case.find({
        "case_member_list.case_member_id": userId,
        "case_member_list.case_member_type": "associates",
        "_id": new mongoose.Types.ObjectId(caseId)
    });

    return cases && cases.length > 0;
}

const createCase = async (req, res) => {
    const { type }  = getUserInfo(res);
    const userInfo = getUserInfo(res);

    const {
        case_title,
        case_description,
        case_type,
        case_status,
        case_priority,
        case_total_billed_hour,
        case_member_list
    } = req.body

    if (!case_title || !case_description || !case_type || !case_status || !case_priority || !case_total_billed_hour || !case_member_list) {
        return res.status(400).json({
            error: "جميع حقول القضية مطلوبة"
        })
    }

    console.log(type);

    try {
        if (type === "admin" || type === "partner") {
            const new_cases = new Case({
                case_title, case_created_by: userInfo.userId, case_description, case_type, case_status, case_priority, case_total_billed_hour, case_member_list
            });
    
            const cases = await new_cases.save();
            if (!cases) {
                return res.status(400).json({
                    error: messages.NO_CASE_UPLOADED
                })
            }
    
            return res.status(200).send(new_cases)
        }
        else {
            return res.status(403).json({
                error: messages.CASE_CREATE_DENIED
            });
        }
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};

            for (const field in error.errors) {
                if (!error.errors[field].message.includes("Cast to [ObjectId] failed for value"))
                    validationErrors[field] = error.errors[field].message;
            }

            return res.status(400).json({
                error: messages.VALIDATION_FAILED,
                validationErrors,
            });
        }
        res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        })
    }

}

// const editCase = (req, res) => {
//     returnRes(res, 200, "editCase")
// }

// const editCase = async (req, res) => {
//     const { userId, type } = getUserInfo(res);
//     const caseId = req.params.id; // Extracting the case ID from the request parameters

//     try {
//         // await checkCaseAccess(userId, type, caseId); // Check if the user has access to the case

//         if (type !== "admin") {
//             return res.status(403).json({
//                 error: 'Permission denied. Only admin can edit a case.'
//             });
//         }

//         // Assuming req.body contains updated information for the case
//         const updatedData = req.body;

//         // Find the existing case by ID and update its information
//         const updatedCase = await Case.findByIdAndUpdate(
//             caseId,
//             { $set: updatedData },
//             { new: true } // Return the updated document
//         );

//         if (!updatedCase) {
//             return res.status(404).json({ error: messages.CASE_NOT_FOUND });
//         }

//         return res.status(200).json(updatedCase); // Return the updated case
//     } catch (error) {
//         // Handle potential errors
//         if (error instanceof mongoose.Error.ValidationError) {
//             // Mongoose validation error
//             const validationErrors = {};
//             for (const field in error.errors) {
//                 validationErrors[field] = error.errors[field].message;
//             }
//             return res.status(400).json({
//                 error: messages.VALIDATION_FAILED,
//                 validationErrors,
//             });
//         } else {
//             res.status(400).json({
//                 error: error.name,
//                 message: error.message,
//             });
//         }
//     }
// };

const editCase = async (req, res) => {
    const { userId, type } = getUserInfo(res);
    const caseId = req.params.id;

    console.log(type);

    try {
        const caseAccess = await checkCaseAccess(userId, type, caseId);

        console.log(caseAccess);

        if(caseAccess){
            if (type === 'admin' || type === 'partner' || (type === 'associates' && caseAccess)) {
                const updatedData = req.body;
    
                const updatedCase = await Case.findByIdAndUpdate(
                    caseId,
                    { $set: updatedData },
                    { new: true }
                );
    
                if (!updatedCase) {
                    return res.status(404).json({ error: messages.CASE_NOT_FOUND });
                }
    
                return res.status(200).json(updatedCase);
            } else {
                return res.status(403).json({ error: messages.CASE_EDIT_DENIED });
            }
        } else {
            return res.status(404).json({ error: messages.CASE_NOT_FOUND });
        }

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                error: messages.VALIDATION_FAILED,
                validationErrors,
            });
        }
        res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        })
    }
};


const readCase = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    const caseId = req.params.id

    try {
        let cases;
        if (type === "admin" || type === "partner")
            cases = await Case.findById(new mongoose.Types.ObjectId(caseId))
        else
            cases = await Case.findOne(
                {
                    "case_member_list.case_member_id": userId,
                    "case_member_list.case_member_type": type,
                    "_id": new mongoose.Types.ObjectId(caseId)
                }
            )

        if (!cases || cases.length === 0)
            throw new DataNotExistError(messages.CASE_NOT_EXIST)
        return res.status(200).send(cases)

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};
            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: messages.VALIDATION_FAILED,
                validationErrors,
            });
        }
        res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        })
    }

}

const readCaseMessage = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    const caseId = req.params.id

    try {
        await checkCaseAccess(userId, type, caseId)
        const caseMessages = await Message.findOne({"message_case_id": caseId})
        if (!caseMessages)
            throw new DataNotExistError(messages.CASE_NOT_EXIST)

        return res.status(200).send(caseMessages)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};
            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: messages.VALIDATION_FAILED,
                validationErrors,
            });
        }
        res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        })
    }
}

const listCase = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    try {
        let cases;
        if (type === "admin")
            cases = await Case.find({})
        else
            cases = await Case.find(
                {
                    "case_member_list.case_member_id": userId,
                    "case_member_list.case_member_type": type
                }
            )

        if (!cases || cases.length === 0)
            throw new DataNotExistError(messages.CASE_NOT_EXIST)
        return res.status(200).send(cases)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};
            for (const field in error.errors) {
                if (!error.errors[field].message.includes("Cast to [ObjectId] failed for value"))
                    validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                error: messages.VALIDATION_FAILED,
                validationErrors,
            });
        }
        res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        })
    }
}


// const deleteCase = (req, res) => {
//     res.status(200).send({
//         message: "deleteCase"
//     })
// }

// const deleteCase = async (req, res) => {
//     const { userId, type } = getUserInfo(res);
//     const caseId = req.params.id;

//     try {
//         let deletedCase;

//         if (type === "admin") {
//             // For admin, directly delete by caseId
//             deletedCase = await Case.findByIdAndDelete(caseId);
//         } else {
//             // For non-admin users, validate the user's access before deletion
//             await checkCaseAccess(userId, type, caseId);
//             deletedCase = await Case.findOneAndDelete({
//                 _id: caseId,
//                 "case_member_list.case_member_id": userId,
//                 "case_member_list.case_member_type": type
//             });
//         }

//         if (!deletedCase) {
//             return res.status(404).json({
//                 error: 'Case not found'
//             });
//         }

//         return res.status(200).json({
//             message: messages.CASE_DELETED,
//             deletedCase
//         });
//     } catch (error) {
//         if (error instanceof mongoose.Error.ValidationError) {
//             // Mongoose validation error
//             const validationErrors = {};

//             for (const field in error.errors) {
//                 if (!error.errors[field].message.includes("Cast to [ObjectId] failed for value")) {
//                     validationErrors[field] = error.errors[field].message;
//                 }
//             }

//             return res.status(400).json({
//                 error: messages.VALIDATION_FAILED,
//                 validationErrors,
//             });
//         } else {
//             return res.status(400).json({
//                 error: error.name,
//                 message: error.message
//             });
//         }
//     }
// }

const deleteCase = async (req, res) => {
    const { type } = getUserInfo(res);
    const caseId = req.params.id;

    console.log(type);

    try {
        if (type !== "admin" && type !== "partner") {
            return res.status(403).json({
                error: messages.CASE_DELETE_DENIED
            });
        }

        const deletedCase = await Case.findByIdAndDelete(caseId);

        if (!deletedCase) {
            return res.status(404).json({
                error: messages.CASE_NOT_FOUND
            });
        }

        return res.status(200).json({
            message: messages.CASE_DELETED,
            deletedCase
        });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};
            for (const field in error.errors) {
                if (!error.errors[field].message.includes("Cast to [ObjectId] failed for value")) {
                    validationErrors[field] = error.errors[field].message;
                }
            }
            return res.status(400).json({
                error: messages.VALIDATION_FAILED,
                validationErrors,
            });
        }
        res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        })
    }
}


module.exports = {
    createCase, readCase, listCase, editCase, deleteCase, readCaseMessage
};
