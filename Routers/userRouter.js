import express from "express";
const router = express.Router();
import {
  signUp,
  verifyOtp,
  login,
  addBlog,
  showBlogs,
  blogDetail,
  getQuestions,
  getQuestion,
  addQuestion,
  addAnswer,
  googlesignin,
  getUserRegion,
} from "../Controllers/userController.js";
import { uploadImage } from "../Controllers/imageConroller.js";
import { upload } from "../Middleware/multer.js";
import verifyAuthentication from "../Middleware/verifyjwt.js";

router.route("/api/signup").post(signUp);

router.route("/api/signup/verify").post(verifyOtp);

router.route("/api/login").post(login);

router.route("/showBlogs").get(showBlogs);

router.route("/addBlog").all(verifyAuthentication).post(addBlog);

router.route("/blog/:id").get(blogDetail);

router.route("/getQuestions").get(getQuestions);

router.route("/getQuestion/:id").get(getQuestion);

router.route("/addQuestion").all(verifyAuthentication).post(addQuestion);
router.route("/addAnswer/:id").all(verifyAuthentication).post(addAnswer);

router.route("/googlesignin").post(googlesignin);

router.route("/file/upload").post(upload.single("file"), uploadImage);

router.route("/getRegion").post(getUserRegion);
export default router;
