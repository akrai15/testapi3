import bcrypt from "bcrypt";
import _ from "lodash";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import User from "../Model/userModel.js";
import Otp from "../Model/otpModel.js";
import Blog from "../Model/addBlog.js";
import jwt from "jsonwebtoken";

import Question from "../Model/questionModel.js";

//======================================sign up ===========================================================//

export const signUp = async (req, res) => {
  try {
    console.log("inside signup try");
    const user = await User.findOne({
      email: req.body.email,
    });
    if (user)
      return res.status(400).json({
        message: "user already exists",
      });
    console.log("otp gen");
    const OTP = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log(OTP);
    const email = req.body.email;

    const otp = new Otp({ email: email, otp: OTP });
    const salt = await bcrypt.genSalt(10);
    otp.otp = await bcrypt.hash(OTP, salt);
    const result = await otp.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "labsmaiti@gmail.com",
        pass: "kwed qwef ilih grdj",
      },
    });

    // Create an email message
    const mailOptions = {
      from: "labsmaiti@gmail.com",
      to: email, // Use the recipient's email address
      subject: "Verification Code",
      text: `Verification Code ${OTP}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Failed to send OTP via email.");
      }
      console.log("Email sent: " + info.response);
      return res.status(200).send("OTP sent successfully!");
    });
  } catch {
    console.log("Error sending");
  }
};

//==========================================verify otp ================================================================//

export const verifyOtp = async (req, res) => {
  console.log(req.body.otp);

  const password = req.body.password;
  const salt = await bcrypt.genSalt(10);

  const otpHolder = await Otp.findOne({
    email: req.body.email,
  })
    .sort({ createdAt: -1 })
    .limit(1);

  if (otpHolder == null) return res.status(400).send("You use an Expired OTP!");

  const rightOtpFind = otpHolder;
  const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp);

  if (otpHolder.email === req.body.email && validUser) {
    const user = new User(
      _.pick(req.body, ["name", "email", "phone", "password"])
    );
    console.log(user.password);
    user.password = await bcrypt.hash(password, salt);
    console.log(user.password);
    const token = user.generateJWT();
    const result = await user.save();
    const OtpDelete = await Otp.deleteMany({
      email: req.body.email,
    });

    return res.status(200).send({
      message: "User Registration Successfull!",
      token: token,
      data: result,
    });
  } else {
    return res.status(400).send("Your OTP was wrong!");
  }
};

//================== login ======================================================================================//

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    User.findOne({ email })
      .then((user) => {
        bcrypt
          .compare(password, user.password)
          .then((passcheck) => {
            if (!passcheck)
              return res.status(400).send({ error: "dont have password" });
            //==================== jwt sign =====================================//
            const token = jwt.sign(
              {
                userId: user._id,
                email: user.email,
              },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "24h" }
            );

            return res.status(200).json({
              msg: "login success",
              user: user,
              token: token,
            });
          })
          .catch((err) => {
            res.status(400).send({ err: "password does not match" });
          });
      })
      .catch((err) => res.status(404).send({ err: "user not registered" }));
  } catch (err) {
    res.status(500).send({ err });
  }
};

//====================== get blogs =============================================================//
export const showBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const limit = 5; // Default to 5 blogs per page if no limit is specified

    const skip = (page - 1) * limit;

    const blogs = await Blog.find().skip(skip).limit(limit);
    console.log("Fetched blogs:", blogs);
    res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error retrieving data:", err);
    return res.status(500).json({ error: "Error retrieving data" });
  }
};
//=========================== add blog ========================================================//

export const addBlog = async (req, res) => {
  try {
    console.log(req.body);
    const data = req.body;
    const blog = new Blog(data);
    const result = await blog.save();
    if (result) {
      console.log("success");
      res.status(201).send("success");
    } else {
      console.log("error");
      res.status(400).send("error");
    }
  } catch (err) {
    return res.status(400).send({ error: "Authentication failed" });
  }
};
//=========================== blog detail =========================================================//

export const blogDetail = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    res.json(blog);
    console.log(blog);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getQuestion = async (req, res) => {
  try {
    console.log(req.params.id);
    const question = await Question.findById(req.params.id);
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const addQuestion = async (req, res) => {
  try {
    const question = new Question(req.body);
    const result = await question.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const addAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    question.answers.push(req.body);
    const result = await question.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const googlesignin = async (req, res) => {
  try {
    console.log("Google sign-in request:", req.body);
    const { email, name } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user if they don't exist
      user = new User({ name, email });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    // Send the JWT and user details to the client
    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
