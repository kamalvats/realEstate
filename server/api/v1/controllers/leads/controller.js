import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status, { DELETE } from "../../../enums/status";
import mongoose from "mongoose";

import { leadsServices } from "../../services/leads/leadsServices";

const {
  createLeads,
  getLeads,
  updateLeads,
  leadsAggSearch,
} = leadsServices;

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
   *             projectId:
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
        .valid("enquiry", "site_visit", "callback")
        .required(),

      source: Joi.string().valid("web", "mobile", "admin").optional(),

      userId: Joi.string().optional(),

      name: Joi.string().required(),
      mobile: Joi.string().required(),
      email: Joi.string().email().optional(),

      propertyId: Joi.string().optional(),
      projectId: Joi.string().optional(),

      message: Joi.string().optional(),

      preferredDate: Joi.date().optional(),
      preferredSlot: Joi.string().optional(),
      notes: Joi.string().optional(),

      timePreference: Joi.string().optional(),
    };

    try {
      const validatedBody = await Joi.validate(req.body, schema);

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
   */
  async viewLead(req, res, next) {
    try {
      const { leadId } = await Joi.validate(req.query, {
        leadId: Joi.string().required(),
      });

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
   */
  async updateLead(req, res, next) {
    const schema = {
      leadId: Joi.string().required(),

      status: Joi.string().valid("new", "contacted", "closed").optional(),

      notes: Joi.string().optional(),
      preferredDate: Joi.date().optional(),
      preferredSlot: Joi.string().optional(),
      timePreference: Joi.string().optional(),
    };

    try {
      const validatedBody = await Joi.validate(
        { ...req.query, ...req.body },
        schema
      );

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
  /**
   * @swagger
   * /lead/admin/delete:
   *   delete:
   *     tags:
   *       - ADMIN_LEAD
   */
  async deleteLead(req, res, next) {
    try {
      const { leadId } = await Joi.validate(req.query, {
        leadId: Joi.string().required(),
      });

      const deleted = await updateLeads(
        { _id: leadId },
        { status: DELETE }
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

  /* ================= LIST LEADS ================= */
  /**
   * @swagger
   * /lead/admin/list:
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
   *       - name: projectId
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
   */
  async listLeads(req, res, next) {
    const schema = {
      search: Joi.string().optional(),
      type: Joi.string().optional(),
      status: Joi.string().optional(),
      source: Joi.string().optional(),
      projectId: Joi.string().optional(),
      propertyId: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };

    try {
      const validatedBody = await Joi.validate(req.query, schema);

      if (validatedBody.projectId) {
        validatedBody.selfQuery = {
          $match: {
            projectId: mongoose.Types.ObjectId(validatedBody.projectId),
          },
        };
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
