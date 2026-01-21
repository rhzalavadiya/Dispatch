const conn = require("../../Database/database");
const { encrypt, decrypt } = require("../../CryptoUtils");

/* -------------------------------- LOGIN -------------------------------- */


const loginWithPassword = async (req, res) => {
    try {
        const { UM_UserCode, UM_Password } = req.body;

        if (!UM_UserCode || !UM_Password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

       const [rows] = await conn.query(
  `SELECT usermaster.*, 
          companyitpolicymaster.CITPM_PolicyName,
          companyitpolicymaster.CITPM_SessionTimeOut
   FROM usermaster
   JOIN groupmaster 
     ON groupmaster.GRPM_GroupId = usermaster.UM_GroupId
   JOIN companyitpolicymaster 
     ON companyitpolicymaster.CITPM_PolicyID = groupmaster.GRPM_ITPolicyId 
   WHERE UM_UserCode = ?`,
  [UM_UserCode]
);

if (rows.length === 0) {
  return res.status(400).json({ message: "User Not Found" });
}

const user = rows[0]; // ✅ THIS IS THE REAL USER OBJECT

        // ✅ HARD SAFETY CHECK
        if (!user.UM_Password) {
            console.error("Password column missing or NULL for user:", UM_UserCode);
            return res.status(400).json({ message: "Invalid Password" });
        }
       

        let decryptedPassword;
        try {
            decryptedPassword = decrypt(user.UM_Password);
        } catch (err) {
            console.error("Decrypt failed:", err.message);
            return res.status(400).json({ message: "Invalid Password" });
        }

        // ✅ DEBUG (KEEP TEMPORARILY)
        console.log("INPUT PASSWORD    :", UM_Password);
        console.log("DECRYPTED PASSWORD:", decryptedPassword);

        if (UM_Password.trim() !== decryptedPassword.trim()) {
            return res.status(400).json({ message: "Invalid Password" });
        }

        // ✅ LOGIN SUCCESS
        await conn.query(
            `UPDATE usermaster
             SET UM_FailedCount = 0, UM_Isuserloggedin = 1
             WHERE BINARY UM_UserCode = ?`,
            [UM_UserCode]
        );
        
        return res.status(200).json({
            message: "Login Successfully",
            data: {
                userID: user.UM_UserId,
                CompanyId: user.UM_CompanyID,
                userName: user.UM_UserCode,
                DisplayName: user.UM_DisplayName,
                sessionExpirationTime: user.CITPM_SessionTimeOut,
                CompanyGroupId: user.UM_CompanyGrpID,
                SCPId:user.UM_DefaultSCPId,
                isPasswordChange :user.UM_IsChangeNewPwd,
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/* ---------------------------- CHANGE PASSWORD ---------------------------- */
const changePasswordByUser = async (req, res) => {
    try {
        const { userName, password } = req.body;

        if (!userName || !password) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const encryptedPwd = encrypt(password);

        const history = await conn.query(
            `SELECT UPT_Password
             FROM userpwdtransaction
             WHERE UPT_UserID = (
                 SELECT UM_UserId FROM usermaster WHERE BINARY UM_UserCode = ?
             )
             ORDER BY UPT_Timestamp DESC
             LIMIT 3`,
            [userName]
        );

        for (const row of history) {
            if (row.UPT_Password && decrypt(row.UPT_Password) === password) {
                return res.status(400).json({
                    message: "You can not reuse previous three password"
                });
            }
        }

        await conn.query(
            `UPDATE usermaster
             SET UM_Password = ?, UM_IsChangeNewPwd = 1,
                 UM_LastPwdChangeDate = NOW()
             WHERE BINARY UM_UserCode = ?`,
            [encryptedPwd, userName]
        );

        await conn.query(
            `INSERT INTO userpwdtransaction (UPT_UserID, UPT_Password, UPT_Timestamp)
             SELECT UM_UserId, ?, NOW()
             FROM usermaster
             WHERE BINARY UM_UserCode = ?`,
            [encryptedPwd, userName]
        );

        return res.status(200).json({
            message: "Password updated successfully"
        });

    } catch (err) {
        console.error("PASSWORD ERROR:", err);
        return res.status(500).json({ error: "Database error" });
    }
};

/* -------------------------------- LOGOUT -------------------------------- */
const userLogout = async (req, res) => {
    try {
        const result = await conn.query(
            `UPDATE usermaster SET UM_Isuserloggedin = 0 WHERE UM_UserId = ?`,
            [req.params.id]
        );
        return res.status(200).json({ message: "User logout" });
    } catch (err) {
        console.error("LOGOUT ERROR:", err);
        return res.status(500).json({ error: "Database error" });
    }
};



module.exports = {
    loginWithPassword,
    changePasswordByUser,
    userLogout


};
