const mongoose = require('mongoose');

let doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNo: {
        type: Number,
        minlength: 10,
        maxlength: 10,
    },
    picture: {
        type: String,
        default:'default.jpg',
    },
    patients:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:'User',
    }]
});

const doctor = mongoose.model('doctor', doctorSchema);

module.exports = doctor;