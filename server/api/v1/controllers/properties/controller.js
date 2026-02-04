import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status, { ACTIVE, DELETE } from "../../../../enums/status";
import mongoose from "mongoose";
// import razorpay from "../../utils/razorpay";
import crypto from "crypto";
import { transactionServices } from "../../services/transaction";
import { propertiesServices } from "../../services/properties";

const {
  createProperties,
  getProperties,
  updateProperties,
  propertiesAggSearch,
} = propertiesServices;
import {
  userServices
} from "../../services/user";
const {
  userCheck,
  checkUserExists,
  emailExist,
  userCount,
  userCountGraph,
  createUser,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateAll,
  updateUserById,
  paginateSearch,
  multiUpdateLockedBal
} = userServices;

import { likedServices } from "../../services/liked";

const {
  createLiked,
  findLiked,
  deleteLiked,
  getAllLiked,
} = likedServices;

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_Rycjr1tUKovGmf",
  key_secret: "XpnnQy5EcWIdpC6kRw3vHw8Z",
});
class propertyController {

  /* ================= CREATE PROPERTY ================= */
  /**
 * @swagger
 * /property/admin/create:
 *   post:
 *     tags:
 *       - ADMIN_PROPERTY
 *     description: Create new property
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         in: header
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             type:
 *               type: string
 *               enum: [flat, villa, plot/land, farm, commercial, apartment, builder_floor]
 *             status:
 *               type: string
 *               enum: [upcoming, available, sold, reserved]
 *             propertyStatus:
 *               type: string
 *               enum: [ACTIVE, INACTIVE, DELETE]
 *             verified:
 *               type: boolean
 *             faq:
 *               type: array
 *             towers:
 *               type: array
 *             city:
 *               type: string
 *             zone:
 *               type: string
 *             prime:
 *               type: boolean
 *             pincode:
 *               type: string
 *             address:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *
 *             projectName:
 *               type: string
 *             builderName:
 *               type: string
 *
 *             price:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 perSqft:
 *                   type: number
 *
 *             priceRange:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *
 *             tokenAmount:
 *               type: number
 *             maintenanceCharges:
 *               type: number
 *
 *             carpetArea:
 *               type: object
 *               properties:
 *                 from:
 *                   type: number
 *                 to:
 *                   type: number
 *                 unit:
 *                   type: string
 *                   enum: [sqft, sqyd]
 *
 *             superArea:
 *               type: object
 *               properties:
 *                 from:
 *                   type: number
 *                 to:
 *                   type: number
 *                 unit:
 *                   type: string
 *                   enum: [sqft, sqyd]
 *
 *             plotSize:
 *               type: object
 *               properties:
 *                 from:
 *                   type: number
 *                 to:
 *                   type: number
 *                 unit:
 *                   type: string
 *                   enum: [sqyd, sqft, acre, bigha]
 *
 *             bhk:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   bhk:
 *                     type: number
 *                   startPrice:
 *                     type: number
 *                   endPrice:
 *                     type: number
 *                   token:
 *                     type: number
 *
 *             floor:
 *               type: number
 *             totalFloors:
 *               type: number
 *
 *             facing:
 *               type: string
 *               enum: [north, south, east, west, north-east, north-west]
 *
 *             furnishing:
 *               type: string
 *               enum: [unfurnished, semi-furnished, fully-furnished]
 *
 *             possessionType:
 *               type: string
 *               enum: [ready, date, quarter, under construction]
 *             possessionDate:
 *               type: string
 *               format: date-time
 *             possessionQuarter:
 *               type: string
 *               example: "Q1-2026"
 *
 *             roadWidth:
 *               type: number
 *             landUse:
 *               type: string
 *               enum: [residential, commercial, agricultural, industrial]
 *             soilType:
 *               type: string
 *             water:
 *               type: boolean
 *             boundaryWall:
 *               type: boolean
 *             approachRoad:
 *               type: boolean
 *
 *             commercialType:
 *               type: string
 *               enum: [shop, office, warehouse, showroom, industrial]
 *             isLeased:
 *               type: boolean
 *
 *             leaseDetails:
 *               type: object
 *               properties:
 *                 yield:
 *                   type: number
 *                 tenureMonths:
 *                   type: number
 *                 rent:
 *                   type: number
 *
 *             amenities:
 *               type: array
 *               items:
 *                 type: string
 *
 *             media:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [image, video, virtual_tour, brochure]
 *                   url:
 *                     type: string
 *                   isPrimary:
 *                     type: boolean
 *
 *             videoAvailable:
 *               type: boolean
 *             virtualTourAvailable:
 *               type: boolean
 *
 *             reraId:
 *               type: string
 *             registryStatus:
 *               type: string
 *               enum: [freehold, leasehold, registry_available, registry_pending]
 *
 *             legalDocs:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   url:
 *                     type: string
 *
 *             reservedUntil:
 *               type: string
 *               format: date-time
 *             launchDate:
 *               type: string
 *               format: date-time
 *
 *             space:
 *               type: array
 *
 *             keyHighlight:
 *               type: array
 *
 *             nearByConnectivity:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   distance:
 *                     type: string
 *
 *     responses:
 *       200:
 *         description: Property created successfully
 */


  async createProperty(req, res, next) {
    const schema = {
    /* ================= CORE ================= */
    title: Joi.string().required(),
    description: Joi.string().optional(),
    faq: Joi.array().optional(),
    towers: Joi.array().optional(),

    type: Joi.string()
      .valid(
        "flat",
        "villa",
        "plot/land",
        "farm",
        "commercial",
        "apartment",
        "builder_floor"
      )
      .required(),

    status: Joi.string()
      .valid("upcoming", "available", "sold", "reserved")
      .optional(),

    // ✅ Added (missing in Joi but present in swagger/schema)
    propertyStatus: Joi.string()
      .valid("ACTIVE", "INACTIVE", "DELETE")
      .optional(),

    verified: Joi.boolean().optional(),

    /* ================= LOCATION ================= */
    city: Joi.string().optional(),
    zone: Joi.string().optional(),
    pincode: Joi.string().optional(),
    address: Joi.string().optional(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),

    /* ================= RELATIONS ================= */
    projectName: Joi.string().optional(),
    builderName: Joi.string().optional(),

    /* ================= PRICING ================= */
    price: Joi.object({
      total: Joi.number().optional(),
      perSqft: Joi.number().optional(),
    }).optional(),

    priceRange: Joi.object({
      min: Joi.number().optional(),
      max: Joi.number().optional(),
    }).optional(),

    tokenAmount: Joi.number().optional(),
    maintenanceCharges: Joi.number().optional(),

    /* ================= AREA ================= */
    carpetArea: Joi.object({
      from: Joi.number().optional(),
      to: Joi.number().optional(),
      unit: Joi.string().valid("sqft", "sqyd").optional(),
    }).optional(),

    superArea: Joi.object({
      from: Joi.number().optional(),
      to: Joi.number().optional(),
      unit: Joi.string().valid("sqft", "sqyd").optional(),
    }).optional(),

    plotSize: Joi.object({
      from: Joi.number().optional(),
      to: Joi.number().optional(),
      unit: Joi.string().valid("sqyd", "sqft", "acre", "bigha").optional(),
    }).optional(),

    /* ================= FLAT / VILLA ================= */
    bhk: Joi.array()
      .items(
        Joi.object({
          bhk: Joi.number().required(),
          startPrice: Joi.number().optional(),
          endPrice: Joi.number().optional(),
          token: Joi.number().optional(),
        })
      )
      .optional(),

    floor: Joi.number().optional(),
    totalFloors: Joi.number().optional(),

    facing: Joi.string()
      .valid(
        "north",
        "south",
        "east",
        "west",
        "north-east",
        "north-west"
      )
      .optional(),

    furnishing: Joi.string()
      .valid("unfurnished", "semi-furnished", "fully-furnished")
      .optional(),

    /* ================= POSSESSION ================= */
    possessionType: Joi.string()
      .valid("ready", "date", "quarter", "under construction")
      .optional(),

    possessionDate: Joi.date().optional(),
    possessionQuarter: Joi.string().optional(),

    /* ================= PLOT ================= */
    roadWidth: Joi.number().optional(),
    landUse: Joi.string()
      .valid("residential", "commercial", "agricultural", "industrial")
      .optional(),

    soilType: Joi.string().optional(),
    water: Joi.boolean().optional(),
    boundaryWall: Joi.boolean().optional(),
    approachRoad: Joi.boolean().optional(),

    /* ================= COMMERCIAL ================= */
    commercialType: Joi.string()
      .valid("shop", "office", "warehouse", "showroom", "industrial")
      .optional(),

    isLeased: Joi.boolean().optional(),
    leaseDetails: Joi.object({
      yield: Joi.number().optional(),
      tenureMonths: Joi.number().optional(),
      rent: Joi.number().optional(),
    }).optional(),

    /* ================= AMENITIES ================= */
    amenities: Joi.array().items(Joi.string()).optional(),

    /* ================= MEDIA ================= */
    media: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid("image", "video", "virtual_tour", "brochure")
            .required(),
          url: Joi.string().required(),
          isPrimary: Joi.boolean().optional(),
        })
      )
      .optional(),

    videoAvailable: Joi.boolean().optional(),
    virtualTourAvailable: Joi.boolean().optional(),

    /* ================= LEGAL ================= */
    reraId: Joi.string().optional(),
    registryStatus: Joi.string()
      .valid(
        "freehold",
        "leasehold",
        "registry_available",
        "registry_pending"
      )
      .optional(),

    legalDocs: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          url: Joi.string().required(),
        })
      )
      .optional(),

    /* ================= AVAILABILITY ================= */
    reservedUntil: Joi.date().optional(),
    launchDate: Joi.date().optional(),

    space: Joi.array()
      .items(
        Joi.string().valid(
          "Servant Room",
          "Family Lounge",
          "Study Room",
          "Private Garden/Lawn",
          "Private Pool"
        )
      )
      .optional(),

    keyHighlight: Joi.array().items(Joi.string()).optional(),

    nearByConnectivity: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          distance: Joi.string().required(),
        })
      )
      .optional(),

    // ✅ prime is present in swagger + schema, keep required if you want
    prime: Joi.boolean().required(),
  };

    try {
      const validatedBody = await Joi.validate(req.body, schema);
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const exists = await getProperties({
        title: validatedBody.title,
        propertyStatus: { $ne: "DELETE" },
      });

      if (exists) {
        throw apiError.conflict("Property title already exists");
      }

      const property = await createProperties({
        ...validatedBody,
        status: validatedBody.status || "available",
      });

      return res.json(
        new response(property, responseMessage.PROPERTY_CREATED)
      );
    } catch (error) {
      return next(error);
    }
  }


  /* ================= VIEW PROPERTY ================= */
  /**
   * @swagger
   * /property/view:
   *   get:
   *     tags:
   *       - ADMIN_PROPERTY
   *     description: View property details
   *     parameters:
   *       - name: propertyId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   * 
   */
  async viewProperty(req, res, next) {
    try {
      const { propertyId } = await Joi.validate(req.query, {
        propertyId: Joi.string().required(),
      });

      const property = await getProperties({
        _id: propertyId,
        propertyStatus: { $ne: "DELETE" },
      });

      if (!property) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(property, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /* ================= UPDATE PROPERTY ================= */
  /**
 * @swagger
 * /property/admin/update:
 *   put:
 *     tags:
 *       - ADMIN_PROPERTY
 *     description: Update property
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         in: header
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - propertyId
 *           properties:
 *             propertyId:
 *               type: string
 *
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             type:
 *               type: string
 *               enum: [flat, villa, plot/land, farm, commercial, apartment, builder_floor]
 *             status:
 *               type: string
 *               enum: [upcoming, available, sold, reserved]
 *
 *             propertyStatus:
 *               type: string
 *               enum: [ACTIVE, INACTIVE, DELETE]
 *
 *             verified:
 *               type: boolean
 *             faq:
 *               type: array
 *             towers:
 *               type: array
 *             city:
 *               type: string
 *             zone:
 *               type: string
 *             pincode:
 *               type: string
 *             address:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *
 *             projectName:
 *               type: string
 *             builderName:
 *               type: string
 *
 *             price:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 perSqft:
 *                   type: number
 *
 *             priceRange:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *
 *             tokenAmount:
 *               type: number
 *             maintenanceCharges:
 *               type: number
 *
 *             carpetArea:
 *               type: object
 *               properties:
 *                 from:
 *                   type: number
 *                 to:
 *                   type: number
 *                 unit:
 *                   type: string
 *                   enum: [sqft, sqyd]
 *
 *             superArea:
 *               type: object
 *               properties:
 *                 from:
 *                   type: number
 *                 to:
 *                   type: number
 *                 unit:
 *                   type: string
 *                   enum: [sqft, sqyd]
 *
 *             plotSize:
 *               type: object
 *               properties:
 *                 from:
 *                   type: number
 *                 to:
 *                   type: number
 *                 unit:
 *                   type: string
 *                   enum: [sqyd, sqft, acre, bigha]
 *
 *             bhk:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   bhk:
 *                     type: number
 *                   startPrice:
 *                     type: number
 *                   endPrice:
 *                     type: number
 *                   token:
 *                     type: number
 *
 *             floor:
 *               type: number
 *             totalFloors:
 *               type: number
 *
 *             facing:
 *               type: string
 *               enum: [north, south, east, west, north-east, north-west]
 *
 *             furnishing:
 *               type: string
 *               enum: [unfurnished, semi-furnished, fully-furnished]
 *
 *             possessionType:
 *               type: string
 *               enum: [ready, date, quarter, under construction]
 *             possessionDate:
 *               type: string
 *               format: date
 *             possessionQuarter:
 *               type: string
 *
 *             roadWidth:
 *               type: number
 *             landUse:
 *               type: string
 *               enum: [residential, commercial, agricultural, industrial]
 *
 *             soilType:
 *               type: string
 *             water:
 *               type: boolean
 *             boundaryWall:
 *               type: boolean
 *             approachRoad:
 *               type: boolean
 *             prime:
 *               type: boolean
 *
 *             commercialType:
 *               type: string
 *               enum: [shop, office, warehouse, showroom, industrial]
 *             isLeased:
 *               type: boolean
 *             leaseDetails:
 *               type: object
 *               properties:
 *                 yield:
 *                   type: number
 *                 tenureMonths:
 *                   type: number
 *                 rent:
 *                   type: number
 *
 *             amenities:
 *               type: array
 *               items:
 *                 type: string
 *
 *             media:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [image, video, virtual_tour, brochure]
 *                   url:
 *                     type: string
 *                   isPrimary:
 *                     type: boolean
 *
 *             videoAvailable:
 *               type: boolean
 *             virtualTourAvailable:
 *               type: boolean
 *
 *               type: string
 *             registryStatus:
 *               type: string
 *               enum: [freehold, leasehold, registry_available, registry_pending]
 *
 *             legalDocs:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   url:
 *                     type: string
 *
 *             reservedUntil:
 *               type: string
 *               format: date
 *             launchDate:
 *               type: string
 *               format: date
 *
 *             space:
 *               type: array
 *               items:
 *                 type: string
 *                 enum:
 *                   - Servant Room
 *                   - Family Lounge
 *                   - Study Room
 *                   - Private Garden/Lawn
 *                   - Private Pool
 *
 *             keyHighlight:
 *               type: array
 *               items:
 *                 type: string
 *
 *             nearByConnectivity:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   distance:
 *                     type: string
 *
 *     responses:
 *       200:
 *         description: Property updated successfully
 */

  async updateProperty(req, res, next) {
    const schema = {
    propertyId: Joi.string().required(),

    /* ================= CORE ================= */
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    faq: Joi.array().optional(),
    towers: Joi.array().optional(),
    type: Joi.string()
      .valid(
        "flat",
        "villa",
        "plot/land",
        "farm",
        "commercial",
        "apartment",
        "builder_floor"
      )
      .optional(),

    status: Joi.string()
      .valid("upcoming", "available", "sold", "reserved")
      .optional(),

    // ✅ Added missing field (Swagger + Schema)
    propertyStatus: Joi.string()
      .valid("ACTIVE", "INACTIVE", "DELETE")
      .optional(),

    verified: Joi.boolean().optional(),

    /* ================= LOCATION ================= */
    city: Joi.string().optional(),
    zone: Joi.string().optional(),
    pincode: Joi.string().optional(),
    address: Joi.string().optional(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),

    /* ================= RELATIONS ================= */
    projectName: Joi.string().optional(),
    builderName: Joi.string().optional(),

    /* ================= PRICING ================= */
    price: Joi.object({
      total: Joi.number().optional(),
      perSqft: Joi.number().optional(),
    }).optional(),

    priceRange: Joi.object({
      min: Joi.number().optional(),
      max: Joi.number().optional(),
    }).optional(),

    tokenAmount: Joi.number().optional(),
    maintenanceCharges: Joi.number().optional(),

    /* ================= AREA ================= */
    carpetArea: Joi.object({
      from: Joi.number().optional(),
      to: Joi.number().optional(),
      unit: Joi.string().valid("sqft", "sqyd").optional(),
    }).optional(),

    superArea: Joi.object({
      from: Joi.number().optional(),
      to: Joi.number().optional(),
      unit: Joi.string().valid("sqft", "sqyd").optional(),
    }).optional(),

    plotSize: Joi.object({
      from: Joi.number().optional(),
      to: Joi.number().optional(),
      unit: Joi.string().valid("sqyd", "sqft", "acre", "bigha").optional(),
    }).optional(),

    /* ================= FLAT / VILLA ================= */
    bhk: Joi.array()
      .items(
        Joi.object({
          bhk: Joi.number().required(),
          startPrice: Joi.number().optional(),
          endPrice: Joi.number().optional(),
          token: Joi.number().optional(),
        })
      )
      .optional(),

    floor: Joi.number().optional(),
    totalFloors: Joi.number().optional(),

    facing: Joi.string()
      .valid("north", "south", "east", "west", "north-east", "north-west")
      .optional(),

    furnishing: Joi.string()
      .valid("unfurnished", "semi-furnished", "fully-furnished")
      .optional(),

    /* ================= POSSESSION ================= */
    possessionType: Joi.string()
      .valid("ready", "date", "quarter", "under construction")
      .optional(),

    possessionDate: Joi.date().optional(),
    possessionQuarter: Joi.string().optional(),

    /* ================= PLOT ================= */
    roadWidth: Joi.number().optional(),
    landUse: Joi.string()
      .valid("residential", "commercial", "agricultural", "industrial")
      .optional(),

    soilType: Joi.string().optional(),
    water: Joi.boolean().optional(),
    boundaryWall: Joi.boolean().optional(),
    approachRoad: Joi.boolean().optional(),

    /* ================= COMMERCIAL ================= */
    commercialType: Joi.string()
      .valid("shop", "office", "warehouse", "showroom", "industrial")
      .optional(),

    isLeased: Joi.boolean().optional(),
    leaseDetails: Joi.object({
      yield: Joi.number().optional(),
      tenureMonths: Joi.number().optional(),
      rent: Joi.number().optional(),
    }).optional(),

    /* ================= AMENITIES ================= */
    amenities: Joi.array().items(Joi.string()).optional(),

    /* ================= MEDIA ================= */
    media: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid("image", "video", "virtual_tour", "brochure")
            .required(),
          url: Joi.string().required(),
          isPrimary: Joi.boolean().optional(),
        })
      )
      .optional(),

    videoAvailable: Joi.boolean().optional(),
    virtualTourAvailable: Joi.boolean().optional(),

    /* ================= LEGAL ================= */
    reraId: Joi.string().optional(),
    registryStatus: Joi.string()
      .valid(
        "freehold",
        "leasehold",
        "registry_available",
        "registry_pending"
      )
      .optional(),

    legalDocs: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          url: Joi.string().required(),
        })
      )
      .optional(),

    /* ================= AVAILABILITY ================= */
    reservedUntil: Joi.date().optional(),
    launchDate: Joi.date().optional(),

    space: Joi.array()
      .items(
        Joi.string().valid(
          "Servant Room",
          "Family Lounge",
          "Study Room",
          "Private Garden/Lawn",
          "Private Pool"
        )
      )
      .optional(),

    keyHighlight: Joi.array().items(Joi.string()).optional(),

    nearByConnectivity: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          distance: Joi.string().required(),
        })
      )
      .optional(),

    prime: Joi.boolean().optional(),
  };

    try {
      const validatedBody = await Joi.validate(req.body, schema);
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const property = await getProperties({
        _id: validatedBody.propertyId,
        propertyStatus: { $ne: "DELETE" },
      });

      if (!property) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      if (validatedBody.title) {
        const duplicate = await getProperties({
          title: validatedBody.title,
          _id: { $ne: validatedBody.propertyId },
          propertyStatus: { $ne: "DELETE" },
        });

        if (duplicate) {
          throw apiError.conflict("Property title already exists");
        }
      }

      const updated = await updateProperties(
        validatedBody.propertyId,
        validatedBody,
        { new: true }
      );

      return res.json(
        new response(updated, responseMessage.UPDATE_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }


  /* ================= DELETE PROPERTY ================= */
  /**
   * @swagger
   * /property/admin/delete:
   *   delete:
   *     tags:
   *     description: get his own profile details with getProfile API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: propertyId
   *         description: propertyId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteProperty(req, res, next) {
    try {
      const { propertyId } = await Joi.validate(req.query, {
        propertyId: Joi.string().required(),
      });
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const deleted = await updateProperties(
        { _id: propertyId },
        { propertyStatus: "DELETE" }
      );

      if (!deleted) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(
        new response(deleted, responseMessage.DELETE_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /property/admin/updatePropertyStatus:
   *   put:
   *     tags:
   *     description: get his own profile details with getProfile API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: propertyId
   *         description: propertyId
   *         in: query
   *         required: true
   *       - name: propertyStatus
   *         description: propertyStatus
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async updatePropertyStatus(req, res, next) {
    try {
      const { propertyId, propertyStatus } = await Joi.validate(req.query, {
        propertyId: Joi.string().required(),
        propertyStatus: Joi.string().required(),
      });
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const updated = await updateProperties(
        { _id: propertyId },
        { propertyStatus: propertyStatus }
      );

      if (!updated) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(
        new response(updated, propertyStatus === "ACTIVE" ? "Property Activated Successfully" : "Property Deactivated Successfully")
      );
    } catch (error) {
      return next(error);
    }
  }

  /* ================= LIST PROPERTIES ================= */
  /**
 * @swagger
 * /property/token/list:
 *   get:
 *     tags:
 *       - ADMIN_PROPERTY
 *     description: Property list with advanced filters
 *     parameters:
 *       - name: token
 *         in: header
 *         required: true
 *         type: string
 *
 *       - name: search
 *         in: query
 *         type: string
 *
 *       - name: city
 *         in: query
 *         type: string
 *
 *       - name: zone
 *         in: query
 *         type: string
 *
 *       - name: type
 *         in: query
 *         type: string
 *         enum: [flat, villa, plot/land, farm, commercial, apartment, builder_floor]
 *
 *       - name: bhk
 *         in: query
 *         type: number
 *         description: Filter by BHK (1,2,3...)
 *
 *       - name: possessionDate
 *         in: query
 *         type: string
 *         format: date
 *
 *       - name: space
 *         in: query
 *         type: array
 *         items:
 *           type: string
 *
 *       - name: reraRegistered
 *         in: query
 *         type: boolean
 *
 *       - name: virtualTourAvailable
 *         in: query
 *         type: boolean
 *
 *       - name: minPrice
 *         in: query
 *         type: number
 *
 *       - name: maxPrice
 *         in: query
 *         type: number
 *
 *       - name: minToken
 *         in: query
 *         type: number
 *
 *       - name: maxToken
 *         in: query
 *         type: number
 *
 *       - name: latitude
 *         in: query
 *         type: number
 *
 *       - name: longitude
 *         in: query
 *         type: number
 *
 *       - name: radius
 *         in: query
 *         type: number
 *         description: Radius in KM
 *
 *       - name: status
 *         in: query
 *         type: string
 *
 *       - name: verified
 *         in: query
 *         type: boolean
 *
 *       - name: fromDate
 *         in: query
 *         type: string
 *
 *       - name: toDate
 *         in: query
 *         type: string
 *
 *       - name: page
 *         in: query
 *         type: number
 *
 *       - name: limit
 *         in: query
 *         type: number
 *
 *       - name: prime
 *         in: query
 *         type: boolean
 *
 *       - name: zoneWise
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: Returns success message
 */

  async listProperties(req, res, next) {
    const schema = {
      search: Joi.string().optional(),
      prime: Joi.boolean().optional(),

      zoneWise: Joi.boolean().optional(),
      city: Joi.string().optional(),
      zone: Joi.string().optional(),

      type: Joi.string()
        .valid(
          "flat",
          "villa",
          "plot/land",
          "farm",
          "commercial",
          "apartment",
          "builder_floor"
        )
        .optional(),

      bhk: Joi.number().optional(),
      possessionDate: Joi.date().optional(),

      space: Joi.array().items(Joi.string()).optional(),

      reraRegistered: Joi.boolean().optional(),
      virtualTourAvailable: Joi.boolean().optional(),

      minPrice: Joi.number().optional(),
      maxPrice: Joi.number().optional(),

      minToken: Joi.number().optional(),
      maxToken: Joi.number().optional(),

      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      radius: Joi.number().optional(),

      status: Joi.string().optional(),
      verified: Joi.boolean().optional(),

      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),

      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      propertyStatus: Joi.string().optional(),
    }

    try {
      const validatedQuery = await Joi.validate(req.query, schema);
      let admin = await findUser({
        _id: req.userId,

        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const list = await propertiesAggSearch(validatedQuery);

      if (!list.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      if (admin.userType == "USER") {
        list.docs = JSON.parse(JSON.stringify(list.docs))
        for (let i = 0; i < list.docs.length; i++) {
          let findLike = await findLiked({
            userId: admin._id,
            propertyId: list.docs[i]._id
          })
          if (findLike) {
            list.docs[i].liked = true
          }else{
            list.docs[i].liked = false
          }
        }
      }

      return res.json(
        new response(list, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
 * @swagger
 * /property/list:
 *   get:
 *     tags:
 *       - PROPERTY
 *     description: Property list with advanced filters
 *     produces:
 *       - application/json
 *     parameters:
 *
 *       - name: search
 *         in: query
 *         type: string
 *
 *       - name: city
 *         in: query
 *         type: string
 *
 *       - name: zone
 *         in: query
 *         type: string
 *
 *       - name: type
 *         in: query
 *         type: string
 *         enum: [flat, villa, plot/land, farm, commercial, apartment, builder_floor]
 *
 *       - name: bhk
 *         in: query
 *         type: number
 *         description: Filter by BHK (1,2,3...)
 *
 *       - name: possessionDate
 *         in: query
 *         type: string
 *         format: date
 *
 *       - name: space
 *         in: query
 *         type: array
 *         items:
 *           type: string
 *
 *       - name: reraRegistered
 *         in: query
 *         type: boolean
 *
 *       - name: virtualTourAvailable
 *         in: query
 *         type: boolean
 *
 *       - name: minPrice
 *         in: query
 *         type: number
 *
 *       - name: maxPrice
 *         in: query
 *         type: number
 *
 *       - name: minToken
 *         in: query
 *         type: number
 *
 *       - name: maxToken
 *         in: query
 *         type: number
 *
 *       - name: latitude
 *         in: query
 *         type: number
 *
 *       - name: longitude
 *         in: query
 *         type: number
 *
 *       - name: radius
 *         in: query
 *         type: number
 *         description: Radius in KM
 *
 *       - name: status
 *         in: query
 *         type: string
 *
 *       - name: verified
 *         in: query
 *         type: boolean
 *
 *       - name: fromDate
 *         in: query
 *         type: string
 *
 *       - name: toDate
 *         in: query
 *         type: string
 *
 *       - name: page
 *         in: query
 *         type: number
 *
 *       - name: limit
 *         in: query
 *         type: number
 *
 *       - name: prime
 *         in: query
 *         type: boolean
 *
 *       - name: zoneWise
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: Returns success message
 */

  async listPropertiesLP(req, res, next) {
    const schema = {
      search: Joi.string().optional(),
      prime: Joi.boolean().optional(),
      zoneWise: Joi.boolean().optional(),

      city: Joi.string().optional(),
      zone: Joi.string().optional(),

      type: Joi.string()
        .valid(
          "flat",
          "villa",
          "plot/land",
          "farm",
          "commercial",
          "apartment",
          "builder_floor"
        )
        .optional(),

      bhk: Joi.number().optional(),
      possessionDate: Joi.date().optional(),

      space: Joi.array().items(Joi.string()).optional(),

      reraRegistered: Joi.boolean().optional(),
      virtualTourAvailable: Joi.boolean().optional(),

      minPrice: Joi.number().optional(),
      maxPrice: Joi.number().optional(),

      minToken: Joi.number().optional(),
      maxToken: Joi.number().optional(),

      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      radius: Joi.number().optional(),

      status: Joi.string().optional(),
      verified: Joi.boolean().optional(),

      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),

      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    }

    try {
      const validatedQuery = await Joi.validate(req.query, schema);
      validatedQuery.propertyStatus = "ACTIVE"
      const list = await propertiesAggSearch(validatedQuery);

      if (!list.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(
        new response(list, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }


  async createPaymentOrder(req, res,next) {
    try {
      const { projectId ,towerId,floorId,unitId,amount,name,mobileNumber,note} = req.body;
      const userId = req.userId;

      let projectData = await getProperties({
        _id: projectId,
        propertyStatus: { $ne: "DELETE" },
      });
      if (!projectData) {
        throw apiError.notFound("Project not found");
      }

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);

      // create pending transaction
      await transactionServices.createTransaction({
        userId,
        amount,
        projectId,
        transactionType: "TOKEN",
        status: "PENDING",
        orderId: order.id,
        towerId,floorId,unitId,name,mobileNumber,note
      });
return res.json(
        new response({
        success: true,
        order,
        amount:projectData.tokenAmount * 100
      }, responseMessage.DATA_FOUND)
      );

    } catch (error) {
     return next(error);
    }
  }

  /** ================= VERIFY PAYMENT ================= **/
  async verifyPayment(req, res,next) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.userId;

    // 1️⃣ Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", "XpnnQy5EcWIdpC6kRw3vHw8Z")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // 2️⃣ Get transaction
    const trxData = await transactionServices.getTransaction({
      orderId: razorpay_order_id,
    });

    if (!trxData) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // 3️⃣ Update transaction status
    await transactionServices.updateTransaction(
      { orderId: razorpay_order_id },
      { status: "COMPLETED" }
    );

    // trxData should contain:
    // projectId, towerId, floorId, unitId

    // 4️⃣ Get property
    const propertyData = await getProperties({
      _id: trxData.projectId,
      propertyStatus: { $ne: "DELETE" },
    });

    if (!propertyData) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // 5️⃣ Update unit inside towers → floors → units
    let unitFound = false;

    for (const tower of propertyData.towers) {
      if (tower.towerId !== trxData.towerId) continue;

      for (const floor of tower.floors) {
        if (floor.floorId !== trxData.floorId) continue;

        for (const unit of floor.units) {
          if (unit.unitId === trxData.unitId) {
            unit.status = "BOOKED"; // or "SOLD"
            unit.launchDate = new Date();
            unit.reservedUntil = null;
            unit.holdByUserId = null;
            unitFound = true;
            break;
          }
        }
      }
    }

    if (!unitFound) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    // 6️⃣ Save property
    await propertiesServices.updateProperties(
      { _id: propertyData._id },
      { towers: propertyData.towers }
    );
return res.json(
        new response({
        success: true,
      }, "Payment verified and unit booked successfully")
      );
  
  }  catch (error) {
     return next(error);
    }
}


  /**
   * @swagger
   * /property/likeUnlike:
   *   put:
   *     tags:
   *     description: get his own profile details with getProfile API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: propertyId
   *         description: propertyId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async likeUnlike(req, res, next) {
    try {
      const { propertyId, propertyStatus } = await Joi.validate(req.query, {
        propertyId: Joi.string().required(),
      });
      let admin = await findUser({
        _id: req.userId,
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      let findLike = await findLiked({
        userId: req.userId,
        propertyId: propertyId
      })
      if (findLike) {
        await deleteLiked({
          userId: req.userId,
          propertyId: propertyId
        })
      } else {
        await createLiked({
          userId: req.userId,
          propertyId: propertyId
        })
      }

      return res.json(
        new response({}, findLike ? "Property Unliked Successfully" : "Property Liked Successfully")
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
 * @swagger
 * /property/listLiked:
 *   get:
 *     tags:
 *       - ADMIN_PROPERTY
 *     description: Property list with advanced filters
 *     parameters:
 *       - name: token
 *         in: header
 *         required: true
 *         type: string
 *
 *       - name: search
 *         in: query
 *         type: string
 *
 *       - name: fromDate
 *         in: query
 *         type: string
 *
 *       - name: toDate
 *         in: query
 *         type: string
 *
 *       - name: page
 *         in: query
 *         type: number
 *
 *       - name: limit
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Returns success message
 */

  async listPropertiesLiked(req, res, next) {
    const schema = {
      search: Joi.string().optional(),

      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),

      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    }

    try {
      const validatedQuery = await Joi.validate(req.query, schema);
      let admin = await findUser({
        _id: req.userId,

        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      // validatedQuery.status = "ACTIVE"
      validatedQuery.userId = req.userId
      const list = await getAllLiked(validatedQuery);

      if (!list.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(
        new response(list, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
}

export default new propertyController();
