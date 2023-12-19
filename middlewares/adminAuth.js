const isLogin = async (req, res, next) => {
  try {
      if (!req.session.admin_id) res.redirect('401-notAuthorized');
      else next();
  } catch (error) {
      console.error(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
      if (req.session.admin_id) res.redirect('/admin');
      else next();
  } catch (error) {
      console.error(error.message);
  }
};

module.exports = { isLogin, isLogout };
