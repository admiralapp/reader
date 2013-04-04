var mongoose = require('mongoose'),
    utils = require('../utils');

// A Feed containing posts, shared across all users
var Feed = mongoose.Schema({
    // feed metadata
    title: String,
    description: String,
    author: String,
    language: String,
    copyright: String,
    categories: [String],
    feedURL: { type: String, index: { unique: true }},
    siteURL: String,
    posts: [utils.ref('Post')],
    
    // tags and titles for individual users
    // a user is considered subscribed to a feed if there is a 
    // user/-/state/com.google/reading-list tag on the feed for that user
    tags: [utils.ref('Tag')],
    numSubscribers: { type: Number, default: 0 },
    
    // stores titles and sortIDs for users
    userInfo: { type: {}, default: {} },
    
    // fetcher metadata
    successfulCrawlTime: Date,
    failedCrawlTime: Date,
    lastFailureWasParseFailure: Boolean,
    lastModified: Date,
    etag: String,
});

Feed.virtual('stringID').get(function() {
    return 'feed/' + this.feedURL;
});

// Gets the tags for a user, assuming they have already been populated
Feed.methods.tagsForUser = function(user) {
    return this.tags.filter(function(tag) {
        return tag.user == user.id && tag.type == 'label';
    });
};

Feed.methods.titleForUser = function(user) {
    return this.userInfo[user.id] || this.title || '(title unknown)';
};

Feed.methods.setTitleForUser = function(title, user) {
    this.userInfo[user.id] = title;
    this.markModified('userInfo');
    return this;
};

Feed.methods.sortIDForUser = function(user) {
    var info = this.userInfo[user.id];
    return (info && info.sortID) || 0;
};

Feed.pre('remove', function(callback) {
    var Post = mongoose.model('Post');
    Post.where('_id').in(this.posts).remove(callback);
});

module.exports = mongoose.model('Feed', Feed);