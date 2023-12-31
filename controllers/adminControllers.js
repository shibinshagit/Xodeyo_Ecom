const User = require('../models/userModels');
const bcrypt = require('bcrypt');

// load admin------------------------------------------------------------------------------------------------------------------------------

const loadAdmin = async (req, res) => {
    try {
      res.render('login');
    } catch (error) {
      console.error(error.message);
    }
  };

// verifyAdmin--------------------------------------------------------------------------------------------------------------------------------------------------------
const verifyAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        if (user.is_admin === 0) {
          return res.render('login', { message: "Username and password are incorrect!" });
        } else {
          req.session.adminData = user;
          req.session.admin_id = user._id;

          return res.redirect('/admin/dashboard');
        }
      } else {
        return res.render('login', { message: "Password is incorrect" });
      }
    } else {
      return res.render('login', { message: "Username is incorrect" });
    }
  } catch (error) {
    console.error(`Error in verifyAdmin: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
};

  
// LoadDashboard------------------------------------------------------------------------------------------------------------------------------------------

  const LoadDashboard = async(req,res)=>{
    try{

  
  res.render('adminDashboard');
   
  
    }catch(error){
      console.log(error.message);
    }
  }
  
// logout----------------------------------------------------------------------------------------------------------------------------------------------------------------

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Internal Server Error');
      }

      console.log('Session destroyed');
      res.redirect('/admin');
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Internal Server Error');
  }
};

 
// loadUsers---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loadUsers = async (req, res) => {
  const admin = req.session.adminData;

  try {
    const search = req.query.search || '';
    const isBlocked = req.query.blocked;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 5;

    const filter = {
      is_Admin: 0,
      is_verified: 1,
      $or: [
        { name: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
        { mobile: { $regex: new RegExp(search, 'i') } },
      ],
    };

    if (isBlocked === "true") {
      filter.isBlocked = true;
    } else if (isBlocked === "false") {
      filter.isBlocked = false;
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / perPage);

    const usersData = await User.find(filter)
      .sort({ createdDate: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('usersList', { users: usersData, admin, totalPages, currentPage: page, totalUsers });
  } catch (error) {
    console.error(`Error in loadUsers: ${error.message}`);
  }
};   
 
  
// blockUser------------------------------------------------------------------------------------------------------------------------------------

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findById(id);

    if (user) {
      user.isBlocked = !user.isBlocked; // Toggle the isBlocked property

      if (user.isBlocked) {
        // Clear session data when blocking a user
        req.session.user_id = null;
        req.session.userData = null;
      }

      await user.save();
      res.redirect('/admin/userslist');
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(`Error in blockUser: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};





module.exports = {loadAdmin,verifyAdmin,LoadDashboard,logout,loadUsers,blockUser}