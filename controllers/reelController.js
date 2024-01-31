


// loadReels==============================================================================================================

const loadReels = async (req, res) => {
    try {
     

res.render('loadReel');


    } catch (error) {
      console.error(error);
      
    }
  };


  module.exports = {
    loadReels
  }