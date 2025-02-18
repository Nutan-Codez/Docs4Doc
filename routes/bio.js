const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Patient Schema
const patientSchema = new Schema({
    age: {
        type: Number,

        required: true,
        min: 0 // Ensure age is a positive number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    aadharNumber: {
        type: String,
        unique: true,

    },
    doctor: {
        name: {
            type: String,
            required: true
        },
        contactNumber: {
            type: String,

        }
    },
    contactNumber: {
        type: String,

    }
});

module.exports = mongoose.model('Bio', patientSchema);
