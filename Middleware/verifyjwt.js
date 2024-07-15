import jwt from 'jsonwebtoken';
import User from '../Model/userModel.js';

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded);
      if (decoded) {
        const email = decoded.email;
        const persistedUser = await User.findOne({ email });
        if (persistedUser) {
          next(); // Carry on with the original request
        } else {
          // User does not exist
          res.json({ success: false, message: 'User does not exist!' });
        }
      } else {
        // Decoding fails
        res.status(401).json({ success: false, message: 'Invalid token!' });
      }
    } catch (error) {
      console.error('Error verifying JWT:', error);
      res.status(401).json({ success: false, message: 'Token verification failed!' });
    }
  } else {
    // No authentication headers
    res.status(401).json({ success: false, message: 'No authorization headers found!' });
  }
}

export default authenticate;
