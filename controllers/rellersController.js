const User = require('../models/userModels');

const loadResellers = async (req, res) => {
    const admin = req.session.adminData;
  
    try {
      var search = "";
      var isBlocked = req.query.blocked;
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 5;
  
      if (req.query.search) {
        search = req.query.search;
      }
      const filter = {
        is_Admin: 0,
        is_verified: 1,
        is_reseller:1,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
          { email: { $regex: '.*' + search + '.*', $options: 'i' } },
          { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },
        ],
      };
      
  
      if (isBlocked === "true") {
        filter.isBlocked = true;
      } else if (isBlocked === "false") {
        filter.isBlocked = false;
      } else {
      }
  
      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / perPage);
      const usersData = await User.find(filter)
      .sort({ createdDate: -1 }) // Sort in descending order based on createdAt
      .skip((page - 1) * perPage)
      .limit(perPage);
  
      res.render('resellersList', { users: usersData, admin: admin, totalPages, currentPage: page ,totalUsers});
    } catch (error) {
      console.log(error.message);
    }
  }    
    
















module.exports = {loadResellers}