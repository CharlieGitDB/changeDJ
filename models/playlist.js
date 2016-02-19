var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// var PlaylistSchema = new Schema({
//     userId: {type: String, required: true},
//     songName: {type: String, required: true},
//     songId: {type: String, required: true},
//     imgUrl: {type: String, required: true},
// });

var PlaylistSchema = new Schema({
    userId: {type: String, required: true, index: { unique: true } },
    songs: [{songName: {type: String, required: true},
            songId: {type: String, required: true},
            imgUrl: {type: String, required: true}}]
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
