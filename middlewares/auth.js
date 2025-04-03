const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token || req.header('x-auth-token');
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[AUTH] Decoded Token: ", decoded); //testing checkpoint

    //checking if id exists in the decoded token
    if (!decoded._id) {
      return res.status(403).json({ error: "Corrupted token: Missing user id" });
    }

    req.user = {_id: decoded._id};
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};