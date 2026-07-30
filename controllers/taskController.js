const mongoose = require('mongoose');
const User = require('../models/user');
const Task = require('../models/task'); // Import the Task model
const getUserInfo = require('../helpers/getUserInfo');
const saveNotifications = require('../helpers/saveNotification');
const messages = require('../helpers/messages');

// 创建任务
const createTask = async (req, res) => {
    const nowDate = new Date();
    var yyyy = nowDate.getFullYear().toString();
    var mm = (nowDate.getMonth() + 1).toString();
    var dd = nowDate.getDate().toString();

    var mmChars = mm.split('');
    var ddChars = dd.split('');

    var assignedDateTdy = yyyy + '-' + (mmChars[1] ? mm : "0" + mmChars[0]) + '-' + (ddChars[1] ? dd : "0" + ddChars[0]);
    try {
        const { userId, type, name } = getUserInfo(res)
        const { title, description, status, assignedTo, deadline, acceptanceCriteria } = req.body;
        
        if (!title || !assignedTo || assignedTo.length === 0) {
            return res.status(400).json({
                error: "عنوان المهمة والمسند إليهم مطلوبان"
            })
        }
        
        const assignedToId = []
        assignedTo.forEach((pair) => {
            pair['userId'] = pair['name']
            assignedToId.push(pair['userId'])
            pair['status'] = pair['response']
            delete pair['name']
            delete pair['response']
        })

        const task = new Task({
            title,
            description,
            status,
            assignedBy: userId,
            assignedTo,
            deadline: deadline,
            taskAssignedDate: assignedDateTdy,
            acceptanceCriteria
        });
        const newTask = await task.save();
        await saveNotifications(`${name} أسند إليك مهمة جديدة: ${title}`, assignedToId, "assignedTask", `/php/task`)

        res.status(200).json(newTask);
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
        });
    }
};

// 获取所有任务
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ 
            error: messages.SERVER_ERROR,
            message: error.message 
        });
    }
};

const retrieveAllUsersExceptCurrentUser = async (excludeName) => {
    try {
        // Use the find method to retrieve all user names excluding the specified name
        const allUsers = await User.find({}, 'username');//username: { $ne: excludeName }
        // Extract the names from the result
        const userNames = allUsers //.map(user => user.username);

        return userNames;
    } catch (error) {
        throw new Error(`${messages.USERS_RETRIEVE_ERROR}: ${error.message}`);
    }
}

const getUserList = async (req, res) => {
    try {
        const { name } = getUserInfo(res);
        const userNames = await retrieveAllUsersExceptCurrentUser(name);
        return res.json(userNames);
    } catch (error) {
        return res.status(500).json({
            error: messages.SERVER_ERROR,
            message: error.message
        });
    }
};

// 获取某个律师的所有任务
const getTasksForUser = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    console.log(userId);
    try {
        const allUser = []
        const tasks = await Task.find({ "assignedTo.userId": userId, });
        tasks.forEach((task) => {
            task.assignedTo.forEach(assignedToId => {
                if (!(assignedToId.userId) in allUser) {
                    allUser.push((assignedToId.userId))
                }
            })
        })

        allUser.map((uid) => {
            return (new mongoose.Types.ObjectId(uid))
        })

        const users = await User.find({
            _id: {
                $in: allUser
            }
        }, ['username', 'avatar_url'])

        users.forEach((user) => {
            user._id = String(user._id)
        })

        const test = await Task.aggregate([
            {
                $match: {
                    'assignedTo.userId': userId
                }
            },
            {
                $addFields: {
                    assignedByObjectId: {
                        $toObjectId: '$assignedBy',
                    },
                    assignedToObjectId: {
                        $map: {
                            input: '$assignedTo',
                            as: 'assignedToUser',
                            in: {
                                userId: {
                                    $toObjectId: '$$assignedToUser.userId',
                                },
                                status: '$$assignedToUser.status',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedByObjectId',
                    foreignField: '_id',
                    as: 'assignedByUser'
                }
            },
            {
                $unwind: '$assignedByUser'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedToObjectId.userId',
                    foreignField: '_id',
                    as: 'assignedToUsers'
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    status: 1,
                    assignedByUser: {
                        _id: '$assignedByUser._id',
                        username: '$assignedByUser.username',
                        avatar_url: '$assignedByUser.avatar_url'
                    },
                    assignedToUsers:
                    {
                        $map: {
                            input: '$assignedToUsers',
                            as: 'assignedToUser',
                            in: {
                                username: '$$assignedToUser.username',
                                avatar_url: '$$assignedToUser.avatar_url'
                            }
                        }
                    },
                    deadline: 1,
                    assignedTo: 1,
                    assignedBy: 1,
                    taskAssignedDate: 1,
                    acceptanceCriteria: 1
                }
            }
        ])

        console.log(test);
        res.status(200).json(test);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ 
            error: messages.SERVER_ERROR,
            message: error.message 
        });
    }
};

// 获取单个任务
const getTask = async (req, res) => {
    try {
        const task = await Task.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $addFields: {
                    assignedByObjectId: {
                        $toObjectId: '$assignedBy',
                    },
                    assignedToObjectId: {
                        $map: {
                            input: '$assignedTo',
                            as: 'assignedToUser',
                            in: {
                                userId: {
                                    $toObjectId: '$$assignedToUser.userId',
                                },
                                status: '$$assignedToUser.status',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedByObjectId',
                    foreignField: '_id',
                    as: 'assignedByUser'
                }
            },
            {
                $unwind: '$assignedByUser'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedToObjectId.userId',
                    foreignField: '_id',
                    as: 'assignedToUsers'
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    status: 1,
                    assignedByUser: {
                        _id: '$assignedByUser._id',
                        username: '$assignedByUser.username',
                        avatar_url: '$assignedByUser.avatar_url'
                    },
                    assignedToUsers:
                    {
                        $map: {
                            input: '$assignedToUsers',
                            as: 'assignedToUser',
                            in: {
                                username: '$$assignedToUser.username',
                                avatar_url: '$$assignedToUser.avatar_url'
                            }
                        }
                    },
                    deadline: 1,
                    assignedTo: 1,
                    assignedBy: 1,
                    taskAssignedDate: 1,
                    acceptanceCriteria: 1
                }
            }
        ])
        if (!task || task.length === 0) return res.status(404).json({ error: messages.TASK_NOT_FOUND });

        res.status(200).json(task[0]);
    } catch (error) {
        res.status(500).json({ 
            error: messages.SERVER_ERROR,
            message: error.message 
        });
    }
};

const updateStatus = async (req, res) => {
    const { _id } = req.body
    const { userId, type, name } = getUserInfo(res)
    const status = req.params.status
    
    if (!_id) {
        return res.status(400).json({
            error: "معرف المهمة مطلوب"
        })
    }
    
    try {
        const task = await Task.findByIdAndUpdate(_id, { status });
        if (!task) {
            return res.status(404).json({ error: messages.TASK_NOT_FOUND });
        }
        let notiMsg
        if(status === "working") notiMsg = "يعمل حالياً على المهمة المسندة إليك:"
        else if(status==="done") notiMsg = "أنهى المهمة المسندة إليك:"
        else  notiMsg = "أعاد المهمة المسندة إليك إلى القائمة:"
        
        await saveNotifications(`${name} ${notiMsg} ${task.title}`, [task.assignedBy], "finishedTask", `/php/task`)

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ 
            error: messages.SERVER_ERROR,
            message: error.message 
        });
    }
}

// 更新任务
const updateTask = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    console.log(req.body);
    let { _id, title, details, status, assignedTo, dateStart, location, assignedToUsers } = req.body;
    
    if (!_id) {
        return res.status(400).json({
            error: "معرف المهمة مطلوب"
        })
    }
    
    assignedToUsers.forEach((pair) => {
        pair['userId'] = pair['name']
        pair['status'] = pair['response']
        delete pair['name']
        delete pair['response']
    })

    assignedTo = assignedToUsers

    try {
        const updatedTask = {
            title,
            description: details,
            status,
            assignedBy: userId,
            assignedTo,
            deadline: dateStart,
            acceptanceCriteria: location
        };
        const newTask = await Task.findByIdAndUpdate(_id, updatedTask, { new: true });

        if (!newTask) {
            return res.status(404).json({ error: messages.TASK_NOT_FOUND });
        }

        res.status(200).json(newTask);
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
        });
    }
};

// 删除任务
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({ error: messages.TASK_NOT_FOUND });
        }
        res.status(200).json({ message: messages.TASK_DELETED });
    } catch (error) {
        res.status(500).json({ 
            error: messages.SERVER_ERROR,
            message: error.message 
        });
    }
};


module.exports = { createTask, getTasks, updateStatus, getTask, updateTask, deleteTask, getTasksForUser, getUserList };