import express from "express";
import Note from "../models/schema.js";
import User from "../models/users.js";
import auth from "../middleware/auth.js";
import bcrypt from 'bcrypt';
const router = express.Router();

//Register Page
router.post("/register", async (req, res) => {
  try{
    const { username, password, confirmPassword } = req.body;
    // Validation
    if(!username || !password || !confirmPassword)
      return res.status(400).json({ msg: "All Fields are required" });
    if(password.length < 5)
      return res.status(400).json({ msg: "Password need to be atleast of 5 characters" });
    if(password !== confirmPassword)
      return res.status(400).json({ msg: "Enter the same password twice for verification" });

    const existingUser = await User.findOne({username: username});
    if(existingUser)
      return res.status(400).json({ msg: "Already exists! Try with a different username" });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: passwordHash
    });
    const savedUser = await newUser.save();
    res.json(savedUser);
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
});
//Login Page
router.post("/login", async (req, res) => {
  try{
    const { username, password } = req.body;
    //Validation
    if(!username || !password)
      return res.status(400).json({ msg: "All Fields are required" });

    const user = await User.findOne({ username: username });
    if(!user)
      return res.status(400).json({ msg: "Account does not exist. Please register first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({ msg: "Invalid login credentials" });


    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    })

  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

router.route("/notes").get(auth, (req, res) => {
  try{
    Note.find({ userId: req.body.userId})
      .then(notes => res.json(notes))
      .catch(err => res.status(400).json('Error ' + err))
  } catch(err){
    res.status(500).json({ error: err.message });
    }


   });


//post route
router.route("/notes").post(auth, (req, res) => {
  try{
    const title = req.body.title;
    const content = req.body.content;
    const userId = req.body._id;

   const newNote = new Note({
     title,
     content,
     userId
   });
   newNote.save()
    .then(() => res.json("Note Added"))
    .catch(err => res.status(400).json("Error " + err));
  } catch(err){
    res.status(500).json({ error: err.message });
    }

});

//delete
router.route("/delete").delete(auth, (req, res) => {
  try{
    Note.findByIdAndDelete(req.user)
    .then(() => res.json("Note deleted."))
    .catch(err => res.status(400).json("Error: " + err));
  } catch(err){
    res.status(500).json({ error: err.message });
    }

});

export default router;
