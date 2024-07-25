import mongoose from "mongoose";

const blogSchema = mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  twitter: {
    type: String,
    required: false,
  },
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
