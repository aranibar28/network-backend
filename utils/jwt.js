const jwt = require('jsonwebtoken');
const secret = process.env.SECRET_KEY;

const createToken = (data) => {
  return new Promise((resolve, reject) => {
    const payload = {
      sub: data._id,
      full_name: data.full_name,
      email: data.email,
    };
    return jwt.sign(payload, secret, { expiresIn: '12h' }, (error, token) => {
      if (error) {
        console.log(error);
        reject('No se pudo generar el JWT');
      } else {
        resolve(token);
      }
    });
  });
};

module.exports = {
  createToken,
};
