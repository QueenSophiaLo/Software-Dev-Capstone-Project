const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resourceSchema = new Schema({
    title: { type: String, required: [true, 'Title is required'] },
    // A short summary for the resource list page
    description: { type: String, required: [true, 'Description is required'] },
    // Type determines if we show an article or video
    type: { type: String, enum: ['Article', 'Video', 'Infographic'], required: [true, 'Type is required'] },
    // Use this for the full text of an article
    content: { type: String },
    // Use this for the YouTube/Vimeo embed URL
    videoUrl: { type: String },
    // An array of strings for filtering
    categories: [{ type: String, required: [true, 'At least one category is required'] }],
    // Optional: an image for the resource card
    thumbnailUrl: { type: String },
    // Optional: an image for the infographic
    imageUrl: { type: String }
});

module.exports = mongoose.model('Resource', resourceSchema);