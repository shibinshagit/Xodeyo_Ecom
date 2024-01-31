const Banner = require('../models/bannerModel');


// listBanner====================================================================================================================

const listBanners =  async (req, res) => {
    try {
      var search = "";
      var isListed = req.query.listed;
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 5;
  
      if (req.query.search) {
        search = req.query.search;
      }
      const filter = {
        $or: [
          { head: { $regex: '.*' + search + '.*', $options: 'i' } },
          { subHead: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
      };
      
  
      if (isListed === "true") {
        filter.isListed = true;
      } else if (isListed === "false") {
        filter.isListed = false;
      } else {
      }
  
      const totalBanners = await Banner.countDocuments(filter);
      
      const totalPages = Math.ceil(totalBanners / perPage);
      const bannerData = await Banner.find(filter)
      .sort({ createdDate: -1 }) 
      .skip((page - 1) * perPage)
      .limit(perPage);

      res.render('listBanner', { banners: bannerData,totalPages, currentPage: page ,totalBanners});
    } catch (error) {
      console.log(error.message);
    }
  } 
  
// addBanner===============================================================================================

const addBanner = async (req, res) => res.render('addBanner')

// insertBanner===================================================================================

const insertBanner = async (req, res) => {
    try {
      const head = req.body.head;
      const bannerExist = await Banner.findOne({ head: { $regex: new RegExp(`^${head}$`, 'i') } });
  
      if (bannerExist) {
        return res.render('addBanner', { message: 'Category name already exists!' });
      }
  
      const bannerData = await new Banner({
        head: head,
        subHead: req.body.subHead,
        mainHead: req.body.mainHead,
        note: req.body.note,
        position : req.body.position,
        Image: req.file.filename,
        is_Listed: true,
      }).save();
  
      if (bannerData) {
        res.render('addBanner', { message: 'Banner added successful' });
      } else {
        res.render('addBanner', { message: 'failed to add Banner' });
      }
    } catch (error) {
      console.error(`Error in insertBanners: ${error.message}`);
      res.render('addBanner', { message: 'Failed to create Banner' });
    }
  };




// unlistBanner------------------------------------------------------------------------------------------------------------------------------
const unlistBanner = async (req, res) => {
    try {
      const id = req.query.id;
      const banner = await Banner.findById(id);
      if (banner) {
        banner.is_Listed = !banner.is_Listed;
        await banner.save();
        res.json({ success: true});
      } else {
        res.json({ success: false});
      }
    } catch (error) {
      console.error(`Error in unlist Banner: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


// dltBanner============================================================================================================================= 

const dltBanner = async (req, res) => {
    try {
      const id = req.query.id;
      console.log(id)
      const banner = await Banner.findByIdAndDelete(id);
      if (banner) {
       
        res.json({ success: true});
      } else {
        res.json({ success: false});
        
      }
    } catch (error) {
      console.error(`Error in delete Banner: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  };












module.exports = {
    listBanners,addBanner,insertBanner,unlistBanner,dltBanner
}