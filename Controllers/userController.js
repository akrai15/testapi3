import bcrypt from "bcrypt";
import _ from "lodash";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import User from "../Model/userModel.js";
import Otp from "../Model/otpModel.js";
import Blog from "../Model/addBlog.js";
import jwt from "jsonwebtoken";

import Question from "../Model/questionModel.js";
import Subscriber from "../Model/subscriber.js";
import { config } from "dotenv";

config();
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
        user: "labsmaiti@gmail.com", //process.env.NODEMAILER_USER
        pass: "kwed qwef ilih grdj", //process.env.NODEMAILER_PASS
      },
    });

    // Create an email message
    const mailOptions = {
      from: "labsmaiti@gmail.com", //process.env.NODEMAILER_USER
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
    // const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    // const limit = 5; // Default to 5 blogs per page if no limit is specified

    // const skip = (page - 1) * limit;

    const blogs = await Blog.find();
    // console.log("Fetched blogs:", blogs);
    res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error retrieving data:", err);
    return res.status(500).json({ error: "Error retrieving data" });
  }
};

export const searchBlogs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    
    const blogs = keyword ? await Blog.find(
        { $text: { $search: keyword } },
        { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } }) : 
    await Blog.find();
    
    return res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error searching data: ", err);
    return res.status(500).json({ error: "Error searching data" });
  }
}

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

export const sendEmail = async (req, res) => {
  try {
    const { name, email, message, partner } = req.body;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });
    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: !partner
        ? process.env.OFFICIAL_MAIL
        : ["Aashish@maitilabs.org", "Shryas@maitilabs.org"],
      subject: `Contact Form Submitted by ${name} ${
        partner ? "for partnership" : ""
      }`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: \n${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send("Email sent successfully");
  } catch (err) {
    res.status(500).send(`Error faced while sending Email \n${err}`);
  }
};
//getting blogs by email
export const getBlogsByEmail = async (req, res) => {
  try {
    const email = req.query.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({ email })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ blogs });
  } catch (error) {
    console.error("Error retrieving blogs:", error);
    return res.status(500).json({ error: "Error retrieving blogs" });
  }
};


export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ message: " Email is already subscribed" });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: email,
      subject: "Welcome to Vriksh! 🌳",
      html: `
        <html>
        <body>
            <h1>Welcome to Vriksh!</h1>
            <p>We are thrilled to have you join our community of eco-conscious individuals dedicated to making the world a greener place.</p>
            <p>At Vriksh, we believe that the future can't wait. Our mission is to combat climate change by planting trees, which absorb carbon dioxide and release the oxygen we need to live. Together, we can make a significant impact.</p>
            <h2>Here's what you can expect from us:</h2>
            <ul>
                <li><strong>Community Engagement:</strong> Join our community-driven initiatives and partner with local communities and businesses to foster environmental stewardship.</li>
                <li><strong>Eco-conscious Mission:</strong> Benefit from our expertise in selecting the right tree species and employing effective planting techniques to ensure the long-term health of your trees.</li>
                <li><strong>Transparency and Accountability:</strong> Receive detailed insights into our tree planting processes and regular updates on the growth and development of the trees we plant together.</li>
            </ul>
            <p>Stay tuned for updates, tips on eco-friendly living, and opportunities to get involved.</p>
            <p>Thank you for subscribing and for your commitment to the environment. Together, we can make a difference—one tree at a time.</p>
            <p>Warm regards,</p>
            <p>Vriksh Team</p>
            <hr>
            <h3>Follow Us on Social Media:</h3>
            <p>
                <a href="https://www.instagram.com/maitilabs">Instagram</a> | 
                <a href="https://x.com/MaitiLabs">Twitter</a> | 
                <a href="https://www.linkedin.com/company/maitilabs/">LinkedIn</a>
            </p>
            <h3>Contact Us:</h3>
            <p>Have questions? Feel free to reach out to us at <a href="mailto:labsmaiti@gmail.com">our mail</a>.</p>
            <div class="footer">
                <p>Copyright 2024 Vriksh</p>
                <p>If you no longer wish to receive these emails, you can <a href="${
                  process.env.REACT_APP_URL
                }/unsubscribe?email=${encodeURIComponent(
        email
      )}" style="color: #cf1111; text-decoration: underline;">unsubscribe here</a>.</p>
            </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send("Subscription successful. Welcome email sent.");
  } catch (err) {
    res.status(500).send(`Error faced while sending Email \n${err}`);
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).send("Email not found");
    }

    await Subscriber.deleteOne({ email });

    res.status(200).json({ message: "Unsubscribed Successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: `Error faced while unsubscribing \n${err}` });
  }
};


export const passwordreset = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const OTP = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(OTP, salt);

    const otpEntry = new Otp({
      email: req.body.email,
      otp: hashedOtp,
    });

    await otpEntry.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "labsmaiti@gmail.com", // Replace with process.env.NODEMAILER_USER
        pass: "kwed qwef ilih grdj", // Replace with process.env.NODEMAILER_PASS
      },
    });

    const mailOptions = {
      from: "labsmaiti@gmail.com", // Replace with process.env.NODEMAILER_USER
      to: req.body.email,
      subject: "Password Reset Verification Code",
      text: `Your OTP for password reset is ${OTP}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to send OTP via email." });
      }
      return res.status(200).json({ message: "OTP sent successfully!" });
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({ message: "An error occurred while sending OTP." });
  }


};

export const verifypasswordreset = async (req, res) => {
  try {
    const otpHolder = await Otp.findOne({
      email: req.body.email,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!otpHolder) {
      return res.status(400).json({ message: "Invalid or expired OTP!" });
    }

    const isValidOtp = await bcrypt.compare(req.body.otp, otpHolder.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.newPassword, salt);

    await user.save();
    await Otp.deleteMany({ email: req.body.email });

    return res.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({ message: "An error occurred while resetting the password." });
  }


};