const mongoose = require('mongoose');
const { Schema } = mongoose

const appointmentSchema = new Schema({
  creator: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  attendees: [
    {
      name: {
        type: String,
        required: true,
      },
      response: {
        type: String,
        enum: {
          values: ['accepted', 'pending', 'declined'],
          message: 'الرد يجب أن يكون accepted أو pending أو declined'
        },
        required: true,
      },
    },
  ],
  location: {
    type: String,
    required: true,
  },
  dateStart: {
    type: String,
    required: true,
  },
  dateEnd: {
    type: String,
    required: true,
  },
  timeStart: {
    type: String,
  },
  timeEnd: {
    type: String,
  },
  details: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'cancelled'],
      message: 'حالة الموعد يجب أن تكون scheduled أو cancelled'
    },
    required: true,
  },
});

// Model
const AppointmentModel = mongoose.model('Appointment', appointmentSchema);

module.exports = AppointmentModel;  