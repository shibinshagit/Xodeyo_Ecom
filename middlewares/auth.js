const isLogin = async (req, res, next) => {
    try {
      if (!req.session.user_id) {
        return res.redirect('/');
      } 
    } catch (error) {
      console.error(error.message);
      next(error);
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.user_id) {
        return res.redirect('/home');
      }
    } catch (error) {
      console.error(error.message);
      next(error);       
    }
  };
  
  module.exports = {
    isLogin,
    isLogout,
  };
  