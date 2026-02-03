import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import Mongoose, { Schema, Types } from "mongoose";
import { id } from "ethers/lib/utils";

const PropertySchema = new Schema(
    {
        /* ================= CORE ================= */
        title: {
            type: String,
            required: true,
            index: "text",
        },

        description: {
            type: String,
            index: "text",
        },

        type: {
            type: String,
            enum: ["flat", "villa", "plot/land", "farm", "commercial","apartment","builder_floor"],
            required: true,
            index: true,
        },

        faq:[],

        status: {
            type: String,
            enum: ["upcoming", "available", "sold", "reserved",],
            default: "upcoming",
            index: true,
        },
        propertyStatus: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "DELETE"],
            default: "ACTIVE",
            index: true,
        },

        verified: {
            type: Boolean,
            default: false,
            index: true,
        },

        /* ================= LOCATION ================= */
        city: { type: String, index: true },
        zone: { type: String, index: true },
        pincode: { type: String, index: true },

        address: String,
        latitude: Number,
        longitude: Number,

        /* ================= RELATIONS ================= */
        projectName: {
            type: String,
            index: true,
        },

        builderName: {
            type: String,
            index: true,
        },

        /* ================= PRICING ================= */
        price: {
            total: { type: Number, index: true },
            perSqft: Number,
        },

        priceRange: {
            min: { type: Number, index: true },
            max: { type: Number, index: true },
        },

        tokenAmount: {
            type: Number,
            index: true,
        },

        maintenanceCharges: Number,

        /* ================= AREA ================= */
        carpetArea: {
            from: Number,
            to: Number,
            unit: { type: String, enum: ["sqft", "sqyd"] },
        },

        superArea: {
            from: Number,
            to: Number,
            unit: { type: String, enum: ["sqft", "sqyd"] },
        },

        plotSize: {
            from: Number,
            to: Number,
            unit: {
                type: String,
                enum: ["sqyd", "sqft", "acre", "bigha"],
            },
        },

        /* ================= FLAT / VILLA ================= */
        bhk: [{
             bhk: Number,
             startPrice: Number,
             endPrice: Number,
             token: Number
        }],
        floor: Number,
        totalFloors: Number,

        facing: {
            type: String,
            enum: ["north", "south", "east", "west", "north-east", "north-west"],
        },

        furnishing: {
            type: String,
            enum: ["unfurnished", "semi-furnished", "fully-furnished"],
        },

        /* ================= POSSESSION ================= */
        possessionType: {
            type: String,
            enum: ["ready", "date", "quarter","under construction"],
            index: true,
        },

        possessionDate: Date,
        possessionQuarter: String, // Q1-2026

        /* ================= PLOT / LAND ================= */
        roadWidth: Number,

        landUse: {
            type: String,
            enum: ["residential", "commercial", "agricultural", "industrial"],
            index: true,
        },

        soilType: String,
        water: Boolean,
        boundaryWall: Boolean,
        approachRoad: Boolean,

        /* ================= COMMERCIAL ================= */
        commercialType: {
            type: String,
            enum: ["shop", "office", "warehouse", "showroom", "industrial"],
            index: true,
        },

        isLeased: Boolean,

        leaseDetails: {
            yield: Number,
            tenureMonths: Number,
            rent: Number,
        },

        /* ================= AMENITIES ================= */
        amenities: {
            type: [String],
            index: true,
        },

        /* ================= MEDIA ================= */
        media: [
            {
                type: {
                    type: String,
                    enum: ["image", "video", "virtual_tour", "brochure"],
                },
                url: String,
                isPrimary: Boolean,
            },
        ],

        videoAvailable: Boolean,
        virtualTourAvailable: Boolean,

        /* ================= LEGAL ================= */
        reraId: { type: String, index: true },

        registryStatus: {
            type: String,
            enum: [
                "freehold",
                "leasehold",
                "registry_available",
                "registry_pending",
            ],
            index: true,
        },

        legalDocs: [
            {
                name: String,
                url: String,
            },
        ],

        /* ================= AVAILABILITY ================= */
        reservedUntil: Date,
        launchDate: Date,
        space:{type:Array,},
        keyHighlight:{type:Array},
        nearByConnectivity:[{
            name:{type:String},
            distance:{type:String}
        }],
        prime:{type:Boolean,default:false},
        towers:[]


    },
    {
        timestamps: true,
    }
);

PropertySchema.index({ location: "2dsphere" });
PropertySchema.plugin(mongooseAggregatePaginate);
PropertySchema.plugin(mongoosePaginate);
module.exports = Mongoose.model("property", PropertySchema);
