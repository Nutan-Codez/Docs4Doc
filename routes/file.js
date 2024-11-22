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
    description: {
        type: String,
        maxlength: 500 // Example validation
    },
    date: {
        type: Date,
        default: Date.now
    },
    Authority: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctors'
    }]
});

module.exports = mongoose.model("file", fileSchema);
