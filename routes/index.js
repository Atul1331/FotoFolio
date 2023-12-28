var express = require('express');
var router = express.Router();
const userModel = require('./users'); 
const postModel = require('./post')
const passport = require('passport');
const localStrategy = require('passport-local')
const upload = require('./multer')

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { nav: false });
});

/* GET register page.  -- Register page shows because of this */
router.get('/register', function(req, res, next) {
  res.render('register', {nav: false})
});

/* GET profile page. */
router.get('/profile',isLoggedIn, async function(req, res, next) {
  const user = await userModel
      .findOne({username: req.session.passport.user})
      .populate('posts'); 

  res.render('profile', {user, nav:true});
});

router.get('/add',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user}); 

  res.render('add', {user, nav:true});
});

/* When we submit register form, this is used. */
router.post('/register', function(req, res, next){
  const data = new userModel({
    username: req.body.username,
    name: req.body.fullname,
    email: req.body.email,
    contact: req.body.contact
  })

  userModel.register(data, req.body.password)
  .then(function(){
    passport.authenticate('locl')(req,res,function(){
      res.redirect('/profile');
    })
  })
});

/* When we submit login form, this is used. */
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/',
  successRedirect: '/profile'
}), function(req, res, next){
});


/* Logout */
router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

/* isLoggedIn function to check whether user is logged in or not at  particulr time */
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  return res.redirect('/');
}

/* File upload for dp change */
router.post('/fileupload',isLoggedIn, upload.single('image'), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
});


/* Create post */
router.post('/createpost',isLoggedIn, upload.single('postimage'), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user}); 
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile')
});


router.get('/show/posts',isLoggedIn, async function(req, res, next) {
  const user = await userModel
      .findOne({username: req.session.passport.user})
      .populate('posts'); 

  res.render('show', {user, nav:true});
});

router.get('/feed',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const posts = await postModel.find()
  .populate('user')
       

  res.render('feed', {user, posts, nav:true});
});

module.exports = router;
 