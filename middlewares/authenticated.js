const jwt = require("jsonwebtoken");
const secret = process.env.SECRET_KEY;

const validateJWT = (req, res, next) => {
   const token = req.headers.token;

   if (!token) {
      return res.status(401).json({ msg: "Unauthorized User" });
   }

   try {
      const payload = jwt.verify(token, secret);
      req.user = payload;
      req.id = payload.sub;
      next();
   } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
         return res.status(401).json({ msg: "Expired Token" });
      }
      return res.status(401).json({ msg: "Invalid Token" });
   }
};

module.exports = { validateJWT };
