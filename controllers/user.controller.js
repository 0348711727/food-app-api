import User from "../models/User.js";
import catchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import bcrypt from 'bcryptjs';
import emailExistence from 'email-existence';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();


const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const accessKey = process.env.AWS_ACCESS_KEY

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey
  },
  region: bucketRegion
})

export const authController = {
  signUp: catchAsyncError(async (req, res, next) => {
    const { name, telephone, password } = req.body;
    const { file } = req;
    let passwordHashed = null;
    let user = {};
    try {
      user = await User.findOne({ telephone });
      console.log({ user, telephone });
      if (user) return next(new ErrorHandler(`Telephone: ${user.telephone} is already exist`, 200));

      if (!password) return next(new ErrorHandler('Password is missing', 200));
      // const check = await checkGmailExist(email)

      // if (!check) return next(new ErrorHandler(`Your Google Gmail account does not exist`, 200));

      passwordHashed = await hashPassword(password);

      // await sendToken(email, res)

      // const { token } = req.cookies;

      // if (!token) return next(new ErrorHandler(`Please login first`, 400));

      // user = await verifyJWT(token, next)// reasign user from token

      // const sendMailRes = await sendMail(email, next, user.tokenForSignup, `to activate your account`)
      user = await addUser(req.body, passwordHashed)

      // await saveToAWS({ file: req.file })
      // const url = await signedUrl({ file: req.file })
      // const params = {
      //   Bucket: bucketName,
      //   Key: 'b7932a54fb0dd8a0050ca590fd0ad0'
      // }
      // const command = new GetObjectCommand(params);

      // const url = await getSignedUrl(s3, command, { expiresIn: 60 })
      // return res.send({
      //   url
      // });
      return res.status(200).json({ user });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  }),
  logIn: catchAsyncError(async (req, res, next) => {
    const { telephone, password } = req.body;

    try {
      const user = await User.findOne({ telephone }).select("+password")

      if (!user) return next(new ErrorHandler(`Invalid telephone or password`, 404))

      const passwordHashed = user.password;

      await passwordCompare(req.body, passwordHashed, next);

      // const isActive = await checkAccountActive(user.active, next)

      // if (!isActive) return next(new ErrorHandler(`Account is not active yet, please active your account first`, 400))

      // await sendToken(email, res)

      // await updateResetPasswordToken(email, user.tokenResetPass)

      return res.status(200).json({ success: true, message: 'Login successfully', user })
    } catch (error) {
      console.log(error)
    }
  }),
  logOut: catchAsyncError(async (req, res, next) => {
    // console.log(req.cookies)
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true
    })
    return res.status(200).json({ success: true, message: 'Logout success' })
  }),
  getAllUsers: catchAsyncError(async (req, res, next) => {
    const user = await User.find({})

    if (!user) return next(new ErrorHandler(`There is no user in the database`, 400))

    res.status(200).json({ success: true, user })
  }),
  verifyEmail: catchAsyncError(async (req, res, next) => {

    const { token } = req.cookies;
    const { verifyCode } = req.body;
    if (!token) return next(new ErrorHandler(`You haven't login yet`, 400))

    const user = await verifyJWT(token, next)

    if (user.tokenForSignup !== String(verifyCode)) return next(new ErrorHandler(`You have enter the wrong code`, 500));

    const verifySuccess = await User.findOneAndUpdate({ email: user.email }, { $set: { active: true } }, { new: true })

    if (!verifySuccess) return next(new ErrorHandler(`Can't verify your account`, 400))

    return res.status(200).json({ message: `Verify account successfully` })
  })
  ,
  forgotPassword: catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    try {
      const user = await findUser(email, next)

      if (user) {

        await sendMail(email, next, user.tokenResetPass, 'to reset your password')

        await updateResetPasswordToken(email, user.tokenResetPass, next)

        await updateNewPassword(email)

        return res.status(200).json({ success: true, message: `A reset code has been sent to ${email}` })
      }
    } catch (error) {
      console.log(error)
    }
  }),
  updateNewPassword: (email) => catchAsyncError(async (req, res, next) => {
    const { resetCode } = req.body
    let newPasswordHashed = null;
    // console.log(email)
    const user = await findUser(email, next) //1

    if (user.resetPasswordToken !== resetCode) return next(new ErrorHandler(`Your reset code is not right`, 400)) //3

    newPasswordHashed = await hashPassword(newPassword)

    const changePass = await User.findOneAndUpdate({ email },
      {
        $set: { password: newPasswordHashed }
      }, { new: true }, (error, result) => {
        if (error) return next(new ErrorHandler(`Can't change password`, 404)) //4
      }).clone()
    // console.log({ changePass })
    return res.status(200).json({ success: true, message: 'Password changed' })
  }),
  getUserDetails: catchAsyncError(async (req, res, next) => {
    // console.log(req.user)
  })
}
export async function hashPassword(password) {

  return new Promise((resolve, reject) => {

    bcrypt.hash(password, 12, (err, result) => {

      if (err) reject(err);

      resolve(result);
    })
  })
}

export async function addUser(props, passwordHash) {
  const { name, telephone } = props;
  const newUser = new User({
    telephone,
    name,
    password: passwordHash,
    avatar: '',
    tokenForSignup: crypto.randomBytes(3).toString('hex'),
    resetPasswordToken: crypto.randomBytes(3).toString("hex") //gerenating password token

  })
  await newUser.save();
  return newUser;
}

export async function sendMail(email, next, token, subject) {

  let smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'Quangbrave21@gmail.com',
      pass: 'ocbgwldtvylitxda' //mật khẩu ứng dụng của gmail
    },
  });
  var mailOptions = {
    from: 'Quangbrave21@gmail.com',
    to: email,
    subject: `This is an auto mail send ${subject}`,
    text: `${token}`
  }
  return new Promise((resolve, reject) => {
    smtpTransport.sendMail(mailOptions, async (error, response) => {
      if (error) reject(next(new ErrorHandler(`Can't send code to your email`)))

      resolve({ success: true, message: `Sign Up success. An email has been sent to ${email}. Please login to your gmail & active :)` })
    })
  })
}

export async function verifyJWT(token, next) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (!decoded) return next(new ErrorHandler(`Something wrong`))

  return await findUser(decoded.email, next)
}

//create new code verify for forgot password
async function updateResetPasswordToken(email, tokenReset) {

  //hashing and add reset token to User Model in Mongo
  return new Promise(async (resolve, reject) => {
    try {
      await User.findOneAndUpdate({ email },
        {
          $set: {
            tokenResetPass: crypto.createHash('sha256')
              .update(tokenReset)
              .digest('hex'),
            tokenResetPassExpire: Date.now() + 15 * 60 * 1000
          }
        }, { new: true }, (err, result) => {
          if (err) reject(err);

          resolve('Update token success')
        }).clone();// .clone to query twice or more time with collection
    } catch (error) {
    }
  })

}
//compare password for login action
export async function passwordCompare(props, passwordHashed, next) {

  await User.find({ telephone: props.telephone }).select("+password")

  return new Promise((resolve, reject) => {

    bcrypt.compare(props.password, passwordHashed, async (_, result) => {

      if (!result) { reject(next(new ErrorHandler(`Password is incorrect`, 200))) }

      resolve(result)
    })
  })
}

export async function checkGmailExist(email) {
  return new Promise((resolve, reject) => {
    emailExistence.check(email, function (error, response) {
      if (error) reject(error)

      resolve(response)
    })
  });
}

export function setJWTToken(email) {

  return jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE })

}

export async function checkAccountActive(isActive, next) {

  // const user = await findUser(email, next)

  // setJWTToken(user.email)

  if (!isActive) return;

  return { success: true, message: `Your account is activate` }
}

export async function findUser(email, next) {
  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler(`You haven't register or your account does not exist`, 400))

  return user;
}

// const sendToken = (email, res) => {

//   const token = setJWTToken(email);

//   const options = {
//     expires: new Date(
//       Date.now() + process.env.COOCKIE_EXPIRE * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true
//   };
//   return res.cookie('token', token, options)
// }

export async function saveToAWS(props) {
  const { file, folder, imageName } = props;

  // const buffer = await sharp(file.buffer).resize({ height: 1080, width: 1080, fit: "contain" }).toBuffer();

  const params = {
    Bucket: bucketName,
    Key: folder + imageName,
    Body: file.buffer,
    ContentType: file.mimetype
  }

  const command = new PutObjectCommand(params);

  s3.send(command);
}

export async function signedUrl(props) {
  const { imageName, folder } = props;

  const params = {
    Bucket: bucketName,
    Key: folder + imageName
  }
  const command = new GetObjectCommand(params);

  return await getSignedUrl(s3, command)
}