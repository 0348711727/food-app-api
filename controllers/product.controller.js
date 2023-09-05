import catchAsyncError from "../middleware/catchAsyncError.js";
import { saveToAWS, signedUrl } from "./user.controller.js";
import Product from '../models/Proudct.js'
import ErrorHandler from "../utils/ErrorHandler.js";
import crypto from 'crypto';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

export const productController = {
  addProduct: catchAsyncError(async (req, res, next) => {
    const { title } = req.body;
    const { file } = req;
    try {
      if (!file || !title) return next(new ErrorHandler('Fill in the body', 200))
      const imageName = crypto.randomBytes(15).toString("hex");

      const newProduct = new Product({
        title,
        imageName,
        category: 'drink',
        price: '50000',
        description: 'ok'
      })
      const product = await newProduct.save();
      await saveToAWS({ file: req.file, folder: 'food-image/', imageName })

      // const params = {
      //   Bucket: bucketName,
      //   Key: `product/${imageName}`
      // }
      // const command = new GetObjectCommand(params);

      // const url = await getSignedUrl(s3, command)

      const url = await signedUrl({ imageName, folder: 'food-image/' })

      return res.status(200).send({ url, product })

    } catch (error) {
      return next(new ErrorHandler(`Can't add product`, 404))
    }
  }),
  deleteProduct: catchAsyncError(async (req, res, next) => {

  }),
  getAllProduct: catchAsyncError(async (req, res, next) => {
    try {
      const product = await Product.find({});
      return res.status(200).json({
        success: true,
        data: product
      })
    } catch (error) {
      return next(new ErrorHandler(`Can't get product`, 404))
    }
  }),
  getDetailProduct: catchAsyncError(async (req, res, next) => {
    try {
      const { name } = req.params;
      const product = await Product.find({});
      return res.status(200).json({
        success: true,
        data: product
      })
    } catch (error) {
      return next(new ErrorHandler(`Can't get product`, 404))
    }
  })
}