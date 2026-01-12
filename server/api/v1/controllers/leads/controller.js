import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status, { DELETE } from "../../../../enums/status";
import mongoose from "mongoose";

import { leadsServices } from "../../services/leads";

const {
  createLeads,
  getLeads,
  updateLeads,
  leadsAggSearch,
} = leadsServices;
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

class leadController {

  /* ================= CREATE LEAD ================= */
  /**
   * @swagger
   * /lead/create:
   *   post:
   *     tags:
   *       - LEAD
   *     description: Create new lead (enquiry / site_visit / callback)
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             type:
   *               type: string
   *               enum: [enquiry, site_visit, callback]
   *             source:
   *               type: string
   *               enum: [web, mobile, admin]
   *             name:
   *               type: string
   *             mobile:
   *               type: string
   *             email:
   *               type: string
   *             propertyId:
   *               type: string
   *             message:
   *               type: string
   *             preferredDate:
   *               type: string
   *             preferredSlot:
   *               type: string
   *             timePreference:
   *               type: string
   *     responses:
   *       200:
   *         description: Lead created successfully
   */
  async createLead(req, res, next) {
    const schema = {
      type: Joi.string()
        .valid("enquiry", "site_visit", "callback","info")
        .required(),

      source: Joi.string().valid("web", "mobile", "admin").optional(),

      userId: Joi.string().optional(),

      name: Joi.string().optional(),
      mobile: Joi.string().optional(),
      email: Joi.string().email().optional(),

      propertyId: Joi.string().optional(),

      message: Joi.string().optional(),

      preferredDate: Joi.string().optional(),
      preferredSlot: Joi.string().optional(),
      notes: Joi.string().optional(),

      timePreference: Joi.string().optional(),
    };

    try {
      const validatedBody = await Joi.validate(req.body, schema);
      if (validatedBody.type == "info") {
        let alreadyPresent = await getLeads({ email: validatedBody.email, type: validatedBody.type })
        if (alreadyPresent) {
          return res.json(
            new response(alreadyPresent, "Email added successfully.")
          );
        }
      }
      if(req.userId){
        validatedBody.userId = req.userId
      }
      const lead = await createLeads(validatedBody);

      return res.json(
        new response(lead, responseMessage.LEAD_CREATED || "Lead created successfully")
      );
    } catch (error) {
      return next(error);
    }
  }

  /* ================= VIEW LEAD ================= */
  /**
   * @swagger
   * /lead/admin/view:
   *   get:
   *     tags:
   *       - ADMIN_LEAD
   *     description: View lead details
   *     parameters:
   *       - name: token
   *         in: header
   *         required: true
   *       - name: leadId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Lead created successfully
   */

  async viewLead(req, res, next) {
    try {
      const { leadId } = await Joi.validate(req.query, {
        leadId: Joi.string().required(),
      });
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const lead = await getLeads({
        _id: leadId,
        status: { $ne: DELETE },
      });

      if (!lead) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(lead, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /* ================= UPDATE LEAD ================= */
  /**
   * @swagger
   * /lead/admin/update:
   *   put:
   *     tags:
   *       - ADMIN_LEAD
   *     description: Update lead status/details
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: leadId
   *         description: leadId
   *         in: formData
   *         required: true
   *       - name: status
   *         description: status
   *         in: formData
   *         required: true
   *       - name: notes
   *         description: notes
   *         in: formData
   *         required: false
   *       - name: preferredDate
   *         description: preferredDate
   *         in: formData
   *         required: false
   *       - name: preferredSlot
   *         description: preferredSlot
   *         in: formData
   *         required: false
   *       - name: timePreference
   *         description: timePreference
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Lead created successfully
   */
  async updateLead(req, res, next) {
    const schema = {
      leadId: Joi.string().required(),

      status: Joi.string().valid("new", "contacted", "closed").required(),

      notes: Joi.string().optional(),
      preferredDate: Joi.date().optional(),
      preferredSlot: Joi.string().optional(),
      timePreference: Joi.string().optional(),
    };

    try {
      const validatedBody = await Joi.validate(
        { ...req.body },
        schema
      );
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const lead = await getLeads({
        _id: validatedBody.leadId,
        status: { $ne: DELETE },
      });

      if (!lead) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      const updated = await updateLeads(
        { _id: validatedBody.leadId },
        validatedBody
      );

      return res.json(
        new response(updated, responseMessage.UPDATE_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /lead/reSchedule:
   *   put:
   *     tags:
   *       - USER_LEAD
   *     description: Update lead status/details
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: leadId
   *         description: leadId
   *         in: formData
   *         required: true
   *       - name: preferredDate
   *         description: preferredDate
   *         in: formData
   *         required: false
   *       - name: preferredSlot
   *         description: preferredSlot
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Lead created successfully
   */
  async reSchedule(req, res, next) {
    const schema = {
      leadId: Joi.string().required(),
      preferredDate: Joi.date().optional(),
      preferredSlot: Joi.string().optional()
    };

    try {
      const validatedBody = await Joi.validate(
        { ...req.body },
        schema
      );
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const lead = await getLeads({
        _id: validatedBody.leadId,
        status: { $ne: DELETE },
      });

      if (!lead) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      const updated = await updateLeads(
        { _id: validatedBody.leadId },
        validatedBody
      );

      return res.json(
        new response(updated, responseMessage.UPDATE_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  /* ================= DELETE LEAD ================= */
  // /**
  //  * @swagger
  //  * /lead/admin/delete:
  //  *   delete:
  //  *     tags:
  //  *       - ADMIN_LEAD
  //  */
  // async deleteLead(req, res, next) {
  //   try {
  //     const { leadId } = await Joi.validate(req.query, {
  //       leadId: Joi.string().required(),
  //     });
  //     let admin = await findUser({
  //       _id: req.userId,
  //       userType: {
  //         $ne: "USER"
  //       },
  //       status: status.ACTIVE
  //     })
  //     if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

  //     const deleted = await updateLeads(
  //       { _id: leadId },
  //       { status: DELETE }
  //     );

  //     if (!deleted) {
  //       throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
  //     }

  //     return res.json(
  //       new response(deleted, responseMessage.DELETE_SUCCESS)
  //     );
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

  /* ================= LIST LEADS ================= */
  /**
   * @swagger
   * /lead/list:
   *   get:
   *     tags:
   *       - ADMIN_LEAD
   *     description: Lead list with filters
   *     parameters:
   *       - name: token
   *         in: header
   *         required: true
   *       - name: search
   *         in: query
   *       - name: type
   *         in: query
   *       - name: status
   *         in: query
   *       - name: source
   *         in: query
   *       - name: propertyId
   *         in: query
   *       - name: fromDate
   *         in: query
   *       - name: toDate
   *         in: query
   *       - name: page
   *         in: query
   *       - name: limit
   *         in: query
   *     responses:
   *       200:
   *         description: Lead created successfully
   */
  async listLeads(req, res, next) {
    const schema = {
      search: Joi.string().optional(),
      type: Joi.string().optional(),
      status: Joi.string().optional(),
      source: Joi.string().optional(),
      propertyId: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };

    try {
      const validatedBody = await Joi.validate(req.query, schema);
      let admin = await findUser({
        _id: req.userId,
        
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      if(admin.userType=="USER"){
        validatedBody.userId = admin._id
      }
     

      if (validatedBody.propertyId) {
        validatedBody.selfQuery = {
          $match: {
            propertyId: mongoose.Types.ObjectId(validatedBody.propertyId),
          },
        };
      }

      const list = await leadsAggSearch(validatedBody);

      if (!list.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(list, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  
}

export default new leadController();
