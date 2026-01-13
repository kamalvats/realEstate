import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status, { ACTIVE, DELETE } from "../../../../enums/status";
import crypto from "crypto";
import { transactionServices } from "../../services/transaction";
import { blogServices } from "../../services/blogs";

const {
  createBlog,
  getBlog,
  updateBlog,
  blogAggSearch,
} = blogServices;
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
class blogController {

  /* ================= CREATE BLOG ================= */
  /**
 * @swagger
 * /blog/admin/create:
 *   post:
 *     tags:
 *       - ADMIN_BLOG
 *     description: Create new blog
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
 *           BLOGS:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             img:
 *               type: string
 *
 *     responses:
 *       200:
 *         description: Blog created successfully
 */

  async createBlog(req, res, next) {
    const schema = {
      /* ================= CORE ================= */
      title: Joi.string().required(),
      description: Joi.string().optional(),
      img: Joi.string().optional(),
     
    }

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

      const exists = await getBlog({
        title: validatedBody.title,
        status: { $ne: "DELETE" },
      });

      if (exists) {
        throw apiError.conflict("Blog title already exists");
      }

      const blog = await createBlog({
        ...validatedBody,
        status: validatedBody.status || "available",
      });

      return res.json(
        new response(blog, responseMessage.BLOG_CREATED)
      );
    } catch (error) {
      return next(error);
    }
  }


  /* ================= VIEW BLOG ================= */
  /**
   * @swagger
   * /blog/view:
   *   get:
   *     tags:
   *       - ADMIN_BLOG
   *     description: View blog details
   *     parameters:
   *       - name: blogId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   * 
   */
  async viewBlog(req, res, next) {
    try {
      const { blogId } = await Joi.validate(req.query, {
        blogId: Joi.string().required(),
      });

      const blog = await getBlog({
        _id: blogId,
        status: { $ne: "DELETE" },
      });

      if (!blog) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(blog, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /* ================= UPDATE BLOG ================= */
  /**
 * @swagger
 * /blog/admin/update:
 *   put:
 *     tags:
 *       - ADMIN_BLOG
 *     description: Update blog
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
 *             - blogId
 *           BLOGS:
 *             blogId:
 *               type: string
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             img:
 *               type: string
 *
 *     responses:
 *       200:
 *         description: Blog updated successfully
 */
  async updateBlog(req, res, next) {
    const schema = {
      blogId: Joi.string().required(),

      title: Joi.string().optional(),
      description: Joi.string().optional(),
      img: Joi.string().optional(),
    }

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

      const blog = await getBlog({
        _id: validatedBody.blogId,
        status: { $ne: "DELETE" },
      });

      if (!blog) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      if (validatedBody.title) {
        const duplicate = await getBlog({
          title: validatedBody.title,
          _id: { $ne: validatedBody.blogId },
          status: { $ne: "DELETE" },
        });

        if (duplicate) {
          throw apiError.conflict("Blog title already exists");
        }
      }

      const updated = await updateBlog(
        validatedBody.blogId,
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


  /* ================= DELETE BLOG ================= */
  /**
   * @swagger
   * /blog/admin/delete:
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
   *       - name: blogId
   *         description: blogId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteBlog(req, res, next) {
    try {
      const { blogId } = await Joi.validate(req.query, {
        blogId: Joi.string().required(),
      });
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const deleted = await updateBlog(
        { _id: blogId },
        { status: "DELETE" }
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
   * /blog/admin/updatestatus:
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
   *       - name: blogId
   *         description: blogId
   *         in: query
   *         required: true
   *       - name: status
   *         description: status
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async updateStatus(req, res, next) {
    try {
      const { blogId, status } = await Joi.validate(req.query, {
        blogId: Joi.string().required(),
        status: Joi.string().required(),
      });
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const updated = await updateBlog(
        { _id: blogId },
        { status: status }
      );

      if (!updated) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(
        new response(updated, status === "ACTIVE" ? "Blog Activated Successfully" : "Blog Deactivated Successfully")
      );
    } catch (error) {
      return next(error);
    }
  }

  /* ================= LIST BLOGS ================= */
  /**
 * @swagger
 * /blog/admin/list:
 *   get:
 *     tags:
 *       - ADMIN_BLOG
 *     description: Blog list with advanced filters
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
 *       - name: status
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

  async listBLOGS(req, res, next) {
    const schema = {
      search: Joi.string().optional(),

      status: Joi.string().optional(),
      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),

      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
    }

    try {
      const validatedQuery = await Joi.validate(req.query, schema);
      let admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: "USER"
        },
        status: status.ACTIVE
      })
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      const list = await blogAggSearch(validatedQuery);

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
  /**
 * @swagger
 * /blog/list:
 *   get:
 *     tags:
 *       - BLOG
 *     description: Blog list with advanced filters
 *     produces:
 *       - application/json
 *     parameters:
 *
 *       - name: search
 *         in: query
 *         type: string
 *
 *       - name: status
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

  async listBLOGSLP(req, res, next) {
    const schema = {
      search: Joi.string().optional(),


      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),

      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    }

    try {
      const validatedQuery = await Joi.validate(req.query, schema);
      validatedQuery.status = "ACTIVE"
      const list = await blogAggSearch(validatedQuery);

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


  async createPaymentOrder(req, res) {
    try {
      const { projectId } = req.body;
      const userId = req.user._id;

      let projectData = await getProjects({
        _id: projectId,
        status: { $ne: "DELETE" },
      });
      if (!projectData) {
        throw apiError.notFound("Project not found");
      }

      const options = {
        amount: projectData.tokenAmount * 100,
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
      });

      return res.status(200).json({
        success: true,
        order,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /** ================= VERIFY PAYMENT ================= **/
  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      await transactionServices.updateTransaction(
        { hash: razorpay_order_id },
        {
          status: "COMPLETED",
        }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new blogController();
