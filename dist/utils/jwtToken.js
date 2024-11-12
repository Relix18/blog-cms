import jwt from "jsonwebtoken";
export const sendToken = (user, statusCode, res) => {
    const token = jwt.sign({
        user,
    }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });
    const option = {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    };
    res.cookie("access_token", token, option);
    res.status(statusCode).json({
        success: true,
        user,
        token,
    });
};
export const activationToken = (user) => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jwt.sign({
        user,
        activationCode,
    }, process.env.JWT_SECRET, {
        expiresIn: "1m",
    });
    return { token, activationCode };
};
