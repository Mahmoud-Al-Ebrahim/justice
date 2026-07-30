const Case = require('../models/case')
const Document = require('../models/document')
const User = require('../models/user')
const Notification = require('../models/notification')
const getUserInfo = require('../helpers/getUserInfo');
// const Appointment = require('../models/appointment')
const mongoose = require('mongoose');
const { DataNotExistError } = require('../helpers/exceptions');
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken');
const messages = require('../helpers/messages');

const dashboardStatistic = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    try {
        const allNotifications = await Notification.find({})
        const allCase = await Case.find({})
        const allDoc = await Document.find({})
        const allClient = await User.find({type: "client"})
        const allEmployee = await User.find({ type: {$ne: "client"} })

        const openCase = allCase.filter(x => x.case_status==="Open").length
        const closedCase = allCase.filter(x => x.case_status==="Closed").length
        const pendingCase = allCase.filter(x => x.case_status==="Pending").length
        const clientCount = allClient.length
        const adminCount = allEmployee.filter(x => x.type=="admin").length
        const partnerCount = allEmployee.filter(x => x.type=="partner").length
        const associatesCount = allEmployee.filter(x => x.type=="associates").length
        const paralegalCount = allEmployee.filter(x => x.type=="paralegal").length

        const caseStatistic = {
            "open": openCase,
            "close": closedCase,
            "pending": pendingCase
        }

        const userStatistic = {
            "admins": adminCount,
            "paralegals": paralegalCount,
            "clients": clientCount,
            "partners": partnerCount,
            "associates": associatesCount
        }

        const clientStatistic = {
            "serviceQuality": 4.5,
            "communication": 4.7,
            "professionalism": 4.3,
            "clientOverallSatisfactoryRating": 4.5,
            "performance": 4.4
        }

        return res.status(200).send({caseStatistic, userStatistic, clientStatistic})
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

const getNotifications = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    const allUpdatedNoti = []
    try {
        const allNotifications = await Notification.find(
            {
                "notification_recipient_id_and_status.recipient_id": userId,
            }
        ).sort( { "notification_sent_date": -1 } )

        allNotifications.forEach((noti, i)=>{
            let read = false
            noti._doc.notification_recipient_id_and_status.forEach(stat=>{
                if(stat.recipient_id === userId && stat.status === "read") 
                    read = true;
            })
            allUpdatedNoti.push({...noti._doc, read})
        })

        const unreadNoti = allUpdatedNoti.filter((noti)=> {return !noti.read})
        const readNoti = allUpdatedNoti.filter((noti)=> {return noti.read})

        const updatedNoti = await Notification.updateMany({
            "notification_recipient_id_and_status.recipient_id": userId
          }, {
            $set: {
              "notification_recipient_id_and_status.$.status": "read"
            }
          })

        if (!allNotifications)
            throw new DataNotExistError(messages.NOTIFICATIONS_NOT_EXIST)

        return res.status(200).send([...unreadNoti, ...readNoti])
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


module.exports = { dashboardStatistic, getNotifications }