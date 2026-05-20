const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post(
  "/add",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    // Question add logic
  }
);