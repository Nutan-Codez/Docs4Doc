const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
    file: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    description: {
        type: String,
        maxlength: 500 // Example validation
    },
    date: {
        type: Date,
        default: Date.now
    },
    status:{
        type:String,
        default:'Unverified',
    }
});

module.exports = mongoose.model("File", fileSchema);
