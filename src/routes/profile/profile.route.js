import express from "express";
import { authorize } from "../../middleware/authorize.js";
import attachUserProfile from "../../middleware/attachUserProfile.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.use(authorize, attachUserProfile);

router.post("/create", checkPermission("ROLE", "CREATE"), (req, res) => {
    res.json({ message: "Role created" });
});


// ================== READ ==================
router.get("/list", checkPermission("ROLE", "READ"), (req, res) => {
    res.json({ message: "Role list" });
});

router.get("/:id", checkPermission("ROLE", "READ"), (req, res) => {
    res.json({ message: "Role by id" });
});

router.put("/update/:id", checkPermission("ROLE", "UPDATE"), (req, res) => {
    res.json({ message: "Role updated" });
});


router.delete("/delete/:id", checkPermission("ROLE", "DELETE"), (req, res) => {
    res.json({ message: "Role deleted" });
});
router.get("/dropdown/list", (req, res) => {
    res.json({ message: "Dropdown (no permission)" });
});

export default router;