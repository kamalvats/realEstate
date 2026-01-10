import config from "config";
import Joi from "joi";
const fs = require("fs");
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import cloudinary from "cloudinary";
const algorithm = 'aes-256-cbc';
const secretKey = '12345678901234567890123456789012'; // Must be 32 characters
const iv = crypto.randomBytes(16);
cloudinary.config({
    cloud_name: config.get("cloudinary.cloud_name"),
    api_key: config.get("cloudinary.api_key"),
    api_secret: config.get("cloudinary.api_secret"),
});
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(config.get("SENDGRID_API_KEY"));
import qrcode from "qrcode";

module.exports = {
    getOTP() {
        var otp = Math.floor(100000 + Math.random() * 900000);
        return otp;
    },
    generateTempPassword() {
        return Math.random().toString(36).slice(2, 10);
    },

    getToken: async (payload) => {
        var token = await jwt.sign(payload, config.get("jwtsecret"), {
            expiresIn: "24h",
        });
        return token;
    },

    getImageUrl: async (files) => {
        try {
            var result = await cloudinary.v2.uploader.upload(files[0].path, {
                resource_type: "auto",
            });

            return result.secure_url;
        } catch (error) {
            console.log(error);
        }
    },
    genBase64: async (data) => {
        return await qrcode.toDataURL(data);
    },

    getSecureUrl: async (base64) => {
        var result = await cloudinary.v2.uploader.upload(base64);
        return result.secure_url;
    },

    sendMailForSubAdmin: async (to, name, password, admin) => {
        let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        td {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2> Sub-Admin Account Created Successfully</h2>
        <p>Dear ${name},</p>
        
        <p> This is to inform you that a new sub-administrator account has been successfully created. Below are the details of the newly created sub-administrator account:</p>
        


<hr>
            <table style="width: 100%;">
                <tr>
                    <td style="text-align: left;">Sub-Admin Name:</td>
                    <td style="text-align: right;">${name}</td>
<br>
                </tr>
                <tr>
                    <td style="text-align: left;">Sub-Admin Email:</td>
                    <td style="text-align: right;">${to}</td>

                </tr>
               
                <tr>
                    <td>Password:</td>
                    <td style="text-align: right;">${password}</td>

                </tr>
              
                

            </table>

            <p>  The sub-administrator now has access to manage certain aspects of SIG Realtech based on the assigned access level. Please ensure that they are briefed on their responsibilities and access rights accordingly.</p>
        
            <p> If you have any questions or concerns regarding this sub-administrator account creation, please feel free to contact us at [Administrator's Contact Email].</p>
            
            <p> Thank you for your attention to this matter.</p>
            <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href=""
               target="_blank">Contact Us</a>
       </div>
            <p>  Best regards,</p>
            <p>  The SIG Realtech Team</p>
            <br>
        </div>
        
    </div>
</body>
    
    </html>
    `

        const msg = {
            to,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: "SIG Realtech",
            },
            subject: "Sub-Admin Account Created Successfully",
            html,
        };

        await sgMail.send(msg);
        return true;
    },


    sendMailForBlock: async (to, name, reason) => {
        let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>Your SIG Realtech  Account Suspended.</h2>
           <p> Dear ${name},</p>
            
           <p> We regret to inform you that your account on SIG Realtech has been blocked by our administrative team due to "${reason}".</p>
            
           <p> Thank you for your understanding.</p>
           <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href=""
               target="_blank">Contact Us</a>
       </div>
           <p> Best regards,</p>
           <p> The SIG Realtech Team</p>
            
            
            
           
            </div>
            
           
        
        </div>
    </body>
    
    </html>
    `

        const msg = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Account Blocked",
            html,
        };

        await sgMail.send(msg);
        return true;


    },

    sendMailForUnblock: async (to, name) => {
        let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        
                            
                        <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                    </div>
                </header>
           <h2>  Account Unblocked - SIG Realtech</h2>

            <p>Dear ${name}</p>
            
            <p> We're pleased to inform you that your account on SIG Realtech has been unblocked by our administrative team.</p>
            
            <p> You can now access your account and resume enjoying all the features and benefits of SIG Realtech. We apologize for any inconvenience this may have caused and appreciate your patience during the review process.</p>
            
            <p> If you have any questions or require further assistance, please don't hesitate to contact our support team at SIG Realtech!</p>
            
            <p> Thank you for being a valued member of our community.</p>
            <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href=""
               target="_blank">Contact Us</a>
       </div>
            <p>  Best regards,</p>
            <p>  The SIG Realtech Team </p>
            
            
            
           
            </div>
            
        
        </div>
    </body>
    
    </html>
    `
        const msg = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Account Unblocked",
            html,
        };

        await sgMail.send(msg);
        return true;

    },


    sendMailContactus: async (to, name, userNames, emails, msg) => {
        let html =
            `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
      body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          color: #fbf2f2;
      }

      .main-container {
          max-width: 600px;

          margin: 0 auto;
          padding: 30px;
          background-color: #211124;
          border-radius: 5px;
          overflow: hidden;
          /* Added to handle potential overflow */
      }

      .container {
          max-width: 100%;
          /* Adjusted to full width on smaller screens */
          max-height: 1000px;
          margin-top: 10px;
          padding: 20px;
          background-color: #190c1b;
          border-radius: 5px;
      }

      header {
          text-align: center;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      img {
          max-width: 100%;
          /* Added to make the image responsive */
          height: auto;
          /* Added to maintain aspect ratio */
      }

      h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #fbf2f2;
      }
      .contactbutton {
        border: 1px solid #b120c9 !important;
        background: #19051c !important;
        box-shadow: inset 0 0 10px 0 #580665 !important;
        color: #fff !important;
        padding: 13px 30px;
        border-radius: 10px;
        margin-bottom: 24px;
        margin-top: 10px;
        text-decoration: none;
        font-size: 14px;
    }
      p {
          margin-bottom: 15px;
          line-height: 1.5;
          color: #fbf2f2;
      }

      .otp-code {
          display: flex;
          justify-content: center;
          margin: 10px auto;
          color: #fbf2f2;
      }

      .otp-code h3 {
          font-size: 24px;
          margin: 0 10px;
          text-align: center;
          color: #fbf2f2;
      }

      footer {
          border-top: 1px solid #5f5858;
          padding-top: 20px;
          text-align: center;
      }

      a {
          text-decoration: underline;
      }

      @media only screen and (max-width: 600px) {
          .container {
              padding: 15px;
          }

          header {
              text-align: center;
          }

          h2 {
              font-size: 20px;
              color: #fbf2f2;
          }

          .otp-code h3 {
              font-size: 20px;
              color: #fbf2f2;
          }
      }
  </style>
  </head>
  
  <body>
      <div class="main-container">
          <div class="container">
              <header>
                  <div style="display: flex; align-items: center; justify-content: center;">
                      
                          
                      <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                  </div>
              </header>
              <h2>User Query for - SIG Realtech </h2>
              
              <p>Dear ${name}👋</p>
 <p>We're writing to inform you that there is a msg from ${userNames}.</p>
 <p>The user's query is provided below.</p>
 <p>${msg}</p>
 
 <p>Thank you for your attention to this matter.</p>

 <p>Best regards from ${userNames},</p>
 <p>The SIG Realtech Team</p>
             
             <br>
          </div>
          
      </div>
  </body>
  
  </html>`
        const msgs = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "User Query",
            html,
        };

        await sgMail.send(msgs);
        return true;
    },

    sendMailContactusUser: async (to, name, msg) => {
        let html =
            `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
      body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          color: #fbf2f2;
      }

      .main-container {
          max-width: 600px;

          margin: 0 auto;
          padding: 30px;
          background-color: #211124;
          border-radius: 5px;
          overflow: hidden;
          /* Added to handle potential overflow */
      }

      .container {
          max-width: 100%;
          /* Adjusted to full width on smaller screens */
          max-height: 1000px;
          margin-top: 10px;
          padding: 20px;
          background-color: #190c1b;
          border-radius: 5px;
      }

      header {
          text-align: center;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      img {
          max-width: 100%;
          /* Added to make the image responsive */
          height: auto;
          /* Added to maintain aspect ratio */
      }

      h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #fbf2f2;
      }
      .contactbutton {
        border: 1px solid #b120c9 !important;
        background: #19051c !important;
        box-shadow: inset 0 0 10px 0 #580665 !important;
        color: #fff !important;
        padding: 13px 30px;
        border-radius: 10px;
        margin-bottom: 24px;
        margin-top: 10px;
        text-decoration: none;
        font-size: 14px;
    }
      p {
          margin-bottom: 15px;
          line-height: 1.5;
          color: #fbf2f2;
      }

      .otp-code {
          display: flex;
          justify-content: center;
          margin: 10px auto;
          color: #fbf2f2;
      }

      .otp-code h3 {
          font-size: 24px;
          margin: 0 10px;
          text-align: center;
          color: #fbf2f2;
      }

      footer {
          border-top: 1px solid #5f5858;
          padding-top: 20px;
          text-align: center;
      }

      a {
          text-decoration: underline;
      }

      @media only screen and (max-width: 600px) {
          .container {
              padding: 15px;
          }

          header {
              text-align: center;
          }

          h2 {
              font-size: 20px;
              color: #fbf2f2;
          }

          .otp-code h3 {
              font-size: 20px;
              color: #fbf2f2;
          }
      }
  </style>
  </head>
  
  <body>
      <div class="main-container">
          <div class="container">
              <header>
                  <div style="display: flex; align-items: center; justify-content: center;">
                      
                          
                      <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                  </div>
              </header>
              <h2>User Query for - SIG Realtech </h2>
              
              <p>Dear ${name}👋</p>
 <p>We're writing to inform you send a query .</p>
 <p>Your query is : ${msg}</p>
 
 
 <p>Thank you for your attention to this matter.</p>

 <p>Best regards from SIG Realtech,</p>
 <p>The SIG Realtech Team</p>
             
             <br>
          </div>
         
      </div>
  </body>
  
  </html>`

        const msgs = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "User Query",
            html,
        };

        await sgMail.send(msgs);
        return true;


    },

    sendMailReplyFromAdmin: async (to, name, msg, question) => {
        let html =
            `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
      body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          color: #fbf2f2;
      }

      .main-container {
          max-width: 600px;

          margin: 0 auto;
          padding: 30px;
          background-color: #211124;
          border-radius: 5px;
          overflow: hidden;
          /* Added to handle potential overflow */
      }

      .container {
          max-width: 100%;
          /* Adjusted to full width on smaller screens */
          max-height: 1000px;
          margin-top: 10px;
          padding: 20px;
          background-color: #190c1b;
          border-radius: 5px;
      }

      header {
          text-align: center;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      img {
          max-width: 100%;
          /* Added to make the image responsive */
          height: auto;
          /* Added to maintain aspect ratio */
      }
      .contactbutton {
        border: 1px solid #b120c9 !important;
        background: #19051c !important;
        box-shadow: inset 0 0 10px 0 #580665 !important;
        color: #fff !important;
        padding: 13px 30px;
        border-radius: 10px;
        margin-bottom: 24px;
        margin-top: 10px;
        text-decoration: none;
        font-size: 14px;
    }
      h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      p {
          margin-bottom: 15px;
          line-height: 1.5;
          color: #fbf2f2;
      }

      .otp-code {
          display: flex;
          justify-content: center;
          margin: 10px auto;
          color: #fbf2f2;
      }

      .otp-code h3 {
          font-size: 24px;
          margin: 0 10px;
          text-align: center;
          color: #fbf2f2;
      }

      footer {
          border-top: 1px solid #5f5858;
          padding-top: 20px;
          text-align: center;
      }

      a {
          text-decoration: underline;
      }

      @media only screen and (max-width: 600px) {
          .container {
              padding: 15px;
          }

          header {
              text-align: center;
          }

          h2 {
              font-size: 20px;
              color: #fbf2f2;
          }

          .otp-code h3 {
              font-size: 20px;
              color: #fbf2f2;
          }
      }
  </style>
  </head>
  
  <body>
      <div class="main-container">
          <div class="container">
              <header>
                  <div style="display: flex; align-items: center; justify-content: center;">
                      
                          
                      <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                  </div>
              </header>
              <h2> Query Reply from Admin- SIG Realtech </h2>
              
              <p>Dear ${name}👋</p>
 <p>We're writing to inform you that there is a reply for you query .</p>
 <p>Reply for  : ${question}</p>
 <p> ${msg}</p>
 
 <p>Thank you for your attention to this matter.</p>
 <div style="margin: 40px 0 50px;">
 <a type="button" class="contactbutton" href=""
     target="_blank">Contact Us</a>
</div>
 <p>Best regards from SIG Realtech Team,</p>
 <p>The SIG Realtech Team</p>
             
             <br>
          </div>
          
      </div>
  </body>
  
  </html>`

        const msgs = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: `Query Reply`,
            html,
        };

        await sgMail.send(msgs);
        return true;

    },

    sendEmailOtp: async (email, otp, userName) => {
        let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>OTP Verification for SIG Realtech</h2>
            <p>Dear ${userName}</p>
            <p>Thank you for signing up with SIG Realtech. To ensure the security of your account, we require you to
                verify your email address.</p>
            <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>Please note that this OTP is valid for a limited time period (for 3 minutes). If you did not request this
                verification, please disregard this email.</p>
            <p>Thank you for choosing SIG Realtech. If you have any questions or need further assistance, feel free to
                contact our support team.</p><br>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href=""
                    target="_blank">Contact Us</a>
            </div>
            <p>Best regards,</p>
            <p>The SIG Realtech Team</p><br>
            </div>
            
        
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: `Otp for verification`,
            html,
        };

        await sgMail.send(msg);
        return true;



    },

    sendEmailOtpLogin: async (email, otp) => {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Login OTP</title>
    <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }
        .main-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
        }
        .container {
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin: 24px 0 10px;
            text-decoration: none;
            font-size: 14px;
        }
        header {
            text-align: center;
            margin-bottom: 20px;
        }
        h2, p {
            color: #fbf2f2;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }
        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
        }
        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }
        a {
            text-decoration: underline;
            color: #9e9c9c;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }
            h2 {
                font-size: 20px;
            }
            .otp-code h3 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>Login OTP for SIG Realtech</h2>
            <p>Hello,</p>
            <p>We received a request to log in to your SIG Realtech account using this email address.</p>
            <p>Please use the following One-Time Password (OTP) to proceed with the login:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>This OTP is valid for only 3 minutes. If you did not attempt to log in, please ignore this message.</p>
            <p>For your safety, do not share this OTP with anyone.</p>
           
            <p>Best regards,<br>The SIG Realtech Team</p>
        </div>
        
    </div>
</body>
</html>`;

        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: `Your Login OTP for SIG Realtech`,
            html,
        };

        await sgMail.send(msg);
        return true;

    },


    sendEmailForWithdrawal: async (email, otp, userName) => {
        let html =

            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>OTP for Withdrawal Verification</h2>
            <p>Dear ${userName}</p>
            <p>Thank you for signing up with SIG Realtech. To ensure the security of your withdrawal, we require you to
                verify .</p>
            <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>Please note that this OTP is valid for a limited time period (for 3 minutes). If you did not request this
                verification, please disregard this email.</p>
            <p>Thank you for choosing SIG Realtech. If you have any questions or need further assistance, feel free to
                contact our support team.</p><br>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href=""
                    target="_blank">Contact Us</a>
            </div>
            <p>Best regards,</p>
            <p>The SIG Realtech Team</p><br>
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${"magnum@mailinator.com"}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from SIG Realtech?<a
                href="mailto:${"magnum@mailinator.com"}">Unsubscribe</a></p>
            
        
        </div>
    </body>
    
    </html>
    `
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: `Otp for withdrawal Verification`,
            html,
        };

        await sgMail.send(msg);
        return true;



    },

    sendEmailForgotPassOtp: async (email, otp, userName) => {
        let html =

            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        
                            
                        <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                    </div>
                </header>
                <h2>Reset OTP for SIG Realtech!</h2>
                <p>Dear ${userName},</p>
                <p>We've received a request to reset the password for your SIG Realtech account. To proceed with the password
                    reset process, please use the following One-Time Password (OTP):</p>
                <div class="otp-code">
                    <h3>${otp}</h3>
                </div>
                <p>You can enter this code on the password reset page of our website to securely reset your password. Please
                    note that this OTP is valid for a limited time period.</p>
                <p>If you did not initiate this password reset request, please disregard this email. Your account remains
                    secure, and no changes have been made.</p>
                <p>For security reasons, we recommend keeping your OTP confidential and not sharing it with anyone. If you
                    need further assistance or have any concerns, please don't hesitate to contact our support team at
                    [Support Email].</p>
                <p>Thank you for choosing SIG Realtech. We're here to ensure a smooth and secure experience for all our
                    players.</p><br>
                    <div style="margin: 40px 0 50px;">
                    <a type="button" class="contactbutton" href=""
                        target="_blank">Contact Us</a>
                </div>
                <p>Best regards,</p>
                <p>The SIG Realtech Team</p><br>
            </div>
           
        </div>
    </body>
    
    </html>`

        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Otp for reset password",
            html,
        };

        await sgMail.send(msg);
        return true;

    },

    sendEmail2FAOtp: async (email, status, name) => {
        let html =
            `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
            body {
                font-family: sans-serif;
                margin: 0;
                padding: 0;
                color: #fbf2f2;
            }
    
            .main-container {
                max-width: 600px;
    
                margin: 0 auto;
                padding: 30px;
                background-color: #211124;
                border-radius: 5px;
                overflow: hidden;
                /* Added to handle potential overflow */
            }
    
            .container {
                max-width: 100%;
                /* Adjusted to full width on smaller screens */
                max-height: 1000px;
                margin-top: 10px;
                padding: 20px;
                background-color: #190c1b;
                border-radius: 5px;
            }
    
            header {
                text-align: center;
                margin-bottom: 20px;
                color: #fbf2f2;
            }
            .contactbutton {
                border: 1px solid #b120c9 !important;
                background: #19051c !important;
                box-shadow: inset 0 0 10px 0 #580665 !important;
                color: #fff !important;
                padding: 13px 30px;
                border-radius: 10px;
                margin-bottom: 24px;
                margin-top: 10px;
                text-decoration: none;
                font-size: 14px;
            }
            img {
                max-width: 100%;
                /* Added to make the image responsive */
                height: auto;
                /* Added to maintain aspect ratio */
            }
    
            h2 {
                font-size: 24px;
                margin-bottom: 20px;
                color: #fbf2f2;
            }
    
            td {
                font-size: 15px;
                margin-bottom: 20px;
                color: #fbf2f2;
            }
    
            p {
                margin-bottom: 15px;
                line-height: 1.5;
                color: #fbf2f2;
            }
    
            .otp-code {
                display: flex;
                justify-content: center;
                margin: 10px auto;
                color: #fbf2f2;
            }
    
            .otp-code h3 {
                font-size: 24px;
                margin: 0 10px;
                text-align: center;
                color: #fbf2f2;
            }
    
            footer {
                border-top: 1px solid #5f5858;
                padding-top: 20px;
                text-align: center;
            }
    
            a {
                text-decoration: underline;
            }
    
            @media only screen and (max-width: 600px) {
                .container {
                    padding: 15px;
                }
    
                header {
                    text-align: center;
                }
    
                h2 {
                    font-size: 20px;
                    color: #fbf2f2;
                }
    
                .otp-code h3 {
                    font-size: 20px;
                    color: #fbf2f2;
                }
            }
        </style>
        </head>
        
        <body>
            <div class="main-container">
                <div class="container">
                    <header>
                        <div style="display: flex; align-items: center; justify-content: center;">
                            
                                
                            <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                        </div>
                    </header>
                    <h2>Email Verification Status Update - SIG Realtech </h2>
                    
                    <p>Dear ${name}👋</p>
       <p>We're writing to inform you that the email verification status for your account on SIG Realtech  has been updated.</p>
                        <table style="width: 100%;">
                    <tr>
                        <td style="text-align: left;">Email Verification:</td>
                        <td style="text-align: right;">${status}</td>
    
                    </tr>
                   
                    
    
                </table>
       
       <p>If you have any questions or concerns regarding your email verification status, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
    
       <p>Thank you for your attention to this matter.</p>
       <div style="margin: 40px 0 50px;">
       <a type="button" class="contactbutton" href=""
           target="_blank">Contact Us</a>
    </div>
       <p>Best regards,</p>
       <p>The SIG Realtech Team</p>
                   
                   <br>
                </div>
               
                </div>
            </div>
        </body>
        
        </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Email Verification Status",
            html,
        };

        await sgMail.send(msg);
        return true;


    },
    sendEmailForWelcome: async (email, name) => {
        let html =
            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        
                            
                        <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                    </div>
                </header>
               <h2> Welcome to SIG Realtech!</h2>
<p>Dear ${name},</p>

<p>Welcome to SIG Realtech! We're thrilled to have you join our gaming community. Get ready for an exciting adventure filled with thrilling games, engaging challenges, and endless fun!</p>

<p>Here's a quick overview of what you can expect from your SIG Realtech experience:</p>

<p>Explore a Variety of Games: Dive into a diverse collection of games ranging from action-packed adventures to brain-teasing puzzles. With new releases and updates regularly added, there's always something fresh to enjoy.</p>

<p>Connect with Players: Engage with fellow gamers from around the world. Whether you're looking for allies to conquer quests or rivals to challenge, our vibrant community is always ready to connect.</p>

<p>Unlock Achievements and Rewards: Set goals, complete challenges, and earn rewards! As you progress through games, unlock achievements, and level up your skills, you'll discover exciting rewards waiting for you.</p>

<p>Stay Updated: Don't miss out on the latest news, events, and special offers. Keep an eye on your inbox for updates, promotions, and exclusive content tailored just for you.</p>

<p>To kick-start your gaming journey, we've included a special bonus just for new players.</p>

<p>Ready to start playing? Simply log in to your account and explore the world of SIG Realtech today!</p>

<p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at support@SIG Realtech.com anytime.</p>

<p>Once again, welcome aboard, ${name}! Get ready to unleash your gaming potential and embark on epic adventures with SIG Realtech</p>
<div style="margin: 40px 0 50px;">
<a type="button" class="contactbutton" href=""
    target="_blank">Contact Us</a>
</div>
<p>Best regards,</p>
<p>The SIG Realtech Team</p>
               
               <br>
            </div>
            
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Welcome to SIG Realtech!",
            html,
        };

        await sgMail.send(msg);
        return true;



    },

    sendEmailForPasswordResetSuccess: async (email, name) => {
        let html =
            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
               <h2> Password Reset Successfully - SIG Realtech!</h2>
             <p>   Dear ${name},</p>
                
             <p> We're writing to inform you that the password for your SIG Realtech account has been successfully reset. You can now log in using your new password and resume enjoying our games and features.</p>
                
             <p>  If you initiated this password reset request, you can disregard this email.</p>
                
             <p>  If you did not initiate this password reset request, please contact our support team immediately at [Support Email] for further assistance.</p>
                
             <p> Thank you for choosing SIG Realtech If you have any questions or encounter any issues, please don't hesitate to reach out to us.</p>
             <div style="margin: 40px 0 50px;">
             <a type="button" class="contactbutton" href=""
                 target="_blank">Contact Us</a>
         </div>
             <p>  Best regards,</p>
             <p> The SIG Realtech Team</p>
               
               <br>
            </div>
            
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Password Reset Successfully",
            html,
        };

        await sgMail.send(msg);
        return true;



    },
    sendEmailForPasswordChangeSuccess: async (email, name) => {
        let html =
            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
               <h2> Password Change Successfully - SIG Realtech!</h2>
             <p>   Dear ${name},</p>
                
             <p> We're writing to inform you that the password for your SIG Realtech account has been successfully changed. You can now log in using your new password and resume enjoying our games and features.</p>
                
             <p>  If you initiated this password change request, you can disregard this email.</p>
                
             <p>  If you did not initiate this password reset request, please contact our support team immediately at [Support Email] for further assistance.</p>
                
             <p> Thank you for choosing SIG Realtech If you have any questions or encounter any issues, please don't hesitate to reach out to us.</p>
             <div style="margin: 40px 0 50px;">
             <a type="button" class="contactbutton" href=""
                 target="_blank">Contact Us</a>
         </div>
             <p>  Best regards,</p>
             <p> The SIG Realtech Team</p>
               
               <br>
            </div>
           
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Password Change Successfully",
            html,
        };

        await sgMail.send(msg);
        return true;



    },
    sendEmailForEnableGoogle2FA: async (email, name) => {
        let html =
            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        
                            
                        <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                    </div>
                </header>
               <h2> Google Authentication Verification</h2> 
               <h2>  Activated- SIG Realtech </h2>
                <p>Dear ${name}👋</p>
                <p>To enhance the security of your account on STRING ARC, we have enabled Google Authentication. This additional layer of security helps protect your account from unauthorized access.</p>
                
                <p> To complete the setup process, please follow the instructions below:</p>
                
                <p> Download Google Authenticator: If you haven't already, download the Google Authenticator app from the App Store (iOS) or Google Play Store (Android).</p>
                
                <p> Scan QR Code: Open the Google Authenticator app and scan the QR code </p>
                
                <p> Enter Verification Code: After scanning the QR code, enter the verification code provided by the app into the designated field on SIG Realtech.</p>
                
                <p> If you have any questions or encounter any issues during the setup process, please contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                
                <p> Thank you for choosing [Game Website]. We appreciate your cooperation in enhancing the security of your account.</p>
                <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href=""
               target="_blank">Contact Us</a>
       </div>
                <p> Best regards,</p>
                <p> The SIG Realtech Team</p>
               
               <br>
            </div>
            
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Google Authentication Verification",
            html,
        };

        await sgMail.send(msg);
        return true;


    },

    sendEmailForBuyTicket: async (email, name, amount, walletAddress, time) => {
        let html =
            `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #fbf2f2;
                }
        
                .main-container {
                    max-width: 600px;
        
                    margin: 0 auto;
                    padding: 30px;
                    background-color: #211124;
                    border-radius: 5px;
                    overflow: hidden;
        
                }
        
                .container {
                    max-width: 100%;
        
                    margin-top: 10px;
                    padding: 20px;
                    background-color: #190c1b;
                    border-radius: 5px;
                }
        
                header {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #fbf2f2;
                }
        
                img {
                    max-width: 100%;
        
                }
        
                tr {
                    padding-bottom: 10px;
                   
                }
                .contactbutton {
                    border: 1px solid #b120c9 !important;
                    background: #19051c !important;
                    box-shadow: inset 0 0 10px 0 #580665 !important;
                    color: #fff !important;
                    padding: 13px 30px;
                    border-radius: 10px;
                    margin-bottom: 24px;
                    margin-top: 10px;
                    text-decoration: none;
                    font-size: 14px;
                }
                h2 {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #fbf2f2;
                }
        
                td {
                    font-size: 14px;
                }
        
                tr {
                    font-size: 14px;
                }
        
                th {
                    font-size: 14px;
                }
        
                p {
                    margin-bottom: 15px;
                    line-height: 1.5;
                    color: #fbf2f2;
                }
                td {
                    margin-bottom: 15px;
                    line-height: 1.5;
                    color: #fbf2f2;
                }
                .otp-code {
                    display: flex;
                    justify-content: center;
                    margin: 10px auto;
                    color: #fbf2f2;
                }
        
                .otp-code h3 {
                    font-size: 24px;
                    margin: 0 10px;
                    text-align: center;
                    color: #fbf2f2;
                }
        
                footer {
                    border-top: 1px solid #5f5858;
                    padding-top: 20px;
                    text-align: center;
                }
        
                a {
                    text-decoration: underline;
                }
        
                @media only screen and (max-width: 600px) {
                    .container {
                        padding: 15px;
                    }
        
                    header {
                        text-align: center;
                    }
        
                    h2 {
                        font-size: 20px;
                        color: #fbf2f2;
                    }
        
                    .otp-code h3 {
                        font-size: 20px;
                        color: #fbf2f2;
                    }
                }
            </style>
        </head>
        
        <body>
            <div class="main-container">
                <div class="container">
                    <header>
                        <div style="display: flex; align-items: center; justify-content: center;">
                            
                                
                            <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                        </div>
                    </header>
                    <h2>Ticket Purchase Confirmation - </h2>
                    <h2>SIG Realtech</h2>
                    <p>Dear ${name}👋</p>
                    <p>We're writing to confirm that your ticket purchase on SIG Realtech has been successfully processed</p>
                       <p> using your wallet funds. Below are the details of your purchase:</p>
                    
        
        
        <hr>
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: left;">Date and Time of Purchase</td>
                               <td style="text-align: right;">${time}</td>
              
                              </tr>
                              <tr>
                                  <td style="text-align: left;">Wallet Deduction</td>
                                  <td style="text-align: right;">${amount}</td>
              
                              </tr>
                             
                              <tr>
                                  <td>Wallet Address</td>
                                  <td style="text-align: right;">${walletAddress}</td>
              
                              </tr>
                        
        
                    </table>
                    <p>Your wallet balance has been updated accordingly, reflecting the deduction for the ticket purchase. </p>
                    <p> You are now registered for the event or activity associated with the ticket type.</p>
        
                    <p>If you have any questions or concerns regarding this ticket purchase, please feel free to contact our</p>
                    <p>  support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
        
                    <p>Thank you for choosing SIG Realtech. We hope you enjoy the event and have a great experience!</p>
                    <div style="margin: 40px 0 50px;">
                    <a type="button" class="contactbutton" href=""
                        target="_blank">Contact Us</a>
                </div>
                    <p>Best regards,</p>
                    <p>The SIG Realtech Team</p>
        
                    <br>
                </div>
                
            </div>
        </body>
        
        </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Ticket Purchase Confirmation",
            html,
        };

        await sgMail.send(msg);
        return true;



    },

    sendEmailApproveWithdrawRequest: async (email, name, amount, time, walletAddress,) => {
        let html =
            `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #fbf2f2;
                    }
            
                    .main-container {
                        max-width: 600px;
            
                        margin: 0 auto;
                        padding: 30px;
                        background-color: #211124;
                        border-radius: 5px;
                        overflow: hidden;
            
                    }
            
                    .container {
                        max-width: 100%;
            
                        margin-top: 10px;
                        padding: 20px;
                        background-color: #190c1b;
                        border-radius: 5px;
                    }
            
                    header {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    img {
                        max-width: 100%;
            
                    }
            
                    tr {
                        padding-bottom: 10px;
                       
                    }
            
                    h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    td {
                        font-size: 14px;
                    }
                    .contactbutton {
                        border: 1px solid #b120c9 !important;
                        background: #19051c !important;
                        box-shadow: inset 0 0 10px 0 #580665 !important;
                        color: #fff !important;
                        padding: 13px 30px;
                        border-radius: 10px;
                        margin-bottom: 24px;
                        margin-top: 10px;
                        text-decoration: none;
                        font-size: 14px;
                    }
                    tr {
                        font-size: 14px;
                    }
            
                    th {
                        font-size: 14px;
                    }
            
                    p {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    td {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    .otp-code {
                        display: flex;
                        justify-content: center;
                        margin: 10px auto;
                        color: #fbf2f2;
                    }
            
                    .otp-code h3 {
                        font-size: 24px;
                        margin: 0 10px;
                        text-align: center;
                        color: #fbf2f2;
                    }
            
                    footer {
                        border-top: 1px solid #5f5858;
                        padding-top: 20px;
                        text-align: center;
                    }
            
                    a {
                        text-decoration: underline;
                    }
            
                    @media only screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
            
                        header {
                            text-align: center;
                        }
            
                        h2 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
            
                        .otp-code h3 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
                    }
                </style>
            </head>
            
            <body>
                <div class="main-container">
                    <div class="container">
                        <header>
                            <div style="display: flex; align-items: center; justify-content: center;">
                                
                                    
                                <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                            </div>
                        </header>
                        <h2> Withdrawal Request Confirmation -</h2> 
                                <h2> SIG Realtech</h2>
                                 <p>Dear ${name}👋</p>
                                 <p> We're writing to confirm that your withdrawal request on SIG Realtech has been successfully processed. Below are the details of your withdrawal </p>
                              
            
            
            <hr>
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left;">Amount Withdraw</td>
                                <td style="text-align: right;">${amount}</td>
            
                            </tr>
                            <tr>
                                <td style="text-align: left;">Date and Time</td>
                                <td style="text-align: right;">${time}</td>
            
                            </tr>
                           
                            <tr>
                                <td>Withdrawal Address</td>
                                <td style="text-align: right;">${walletAddress}</td>
            
                            </tr>
                            
            
                        </table>
                        <p>The withdrawn amount has been transferred to your designated account or payment method. Please allow [X business days] for the funds to reflect in your account, depending on your withdrawal method and banking institution.</p>
                                    
                        <p>If you have any questions or concerns regarding this withdrawal, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                        
                        <p>Thank you for choosing [Game Website]. We hope you continue to enjoy your gaming experience with us!</p>
                        <div style="margin: 40px 0 50px;">
                        <a type="button" class="contactbutton" href=""
                            target="_blank">Contact Us</a>
                    </div>
                        <p>Best regards,</p>
                        <p>The SIG Realtech Team</p>
            
                        <br>
                    </div>
                    
                </div>
            </body>
            
            </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Withdrawal Request Confirmation",
            html,
        };

        await sgMail.send(msg);
        return true;


    },

    sendEmailCreateWithdrawRequest: async (email, name, amount, time, walletAddress,) => {
        let html =
            `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #fbf2f2;
                    }
            
                    .main-container {
                        max-width: 600px;
            
                        margin: 0 auto;
                        padding: 30px;
                        background-color: #211124;
                        border-radius: 5px;
                        overflow: hidden;
            
                    }
            
                    .container {
                        max-width: 100%;
            
                        margin-top: 10px;
                        padding: 20px;
                        background-color: #190c1b;
                        border-radius: 5px;
                    }
            
                    header {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    img {
                        max-width: 100%;
            
                    }
            
                    tr {
                        padding-bottom: 10px;
                       
                    }
            
                    h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    td {
                        font-size: 14px;
                    }
                    .contactbutton {
                        border: 1px solid #b120c9 !important;
                        background: #19051c !important;
                        box-shadow: inset 0 0 10px 0 #580665 !important;
                        color: #fff !important;
                        padding: 13px 30px;
                        border-radius: 10px;
                        margin-bottom: 24px;
                        margin-top: 10px;
                        text-decoration: none;
                        font-size: 14px;
                    }
                    tr {
                        font-size: 14px;
                    }
            
                    th {
                        font-size: 14px;
                    }
            
                    p {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    td {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    .otp-code {
                        display: flex;
                        justify-content: center;
                        margin: 10px auto;
                        color: #fbf2f2;
                    }
            
                    .otp-code h3 {
                        font-size: 24px;
                        margin: 0 10px;
                        text-align: center;
                        color: #fbf2f2;
                    }
            
                    footer {
                        border-top: 1px solid #5f5858;
                        padding-top: 20px;
                        text-align: center;
                    }
            
                    a {
                        text-decoration: underline;
                    }
            
                    @media only screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
            
                        header {
                            text-align: center;
                        }
            
                        h2 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
            
                        .otp-code h3 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
                    }
                </style>
            </head>
            
            <body>
                <div class="main-container">
                    <div class="container">
                        <header>
                            <div style="display: flex; align-items: center; justify-content: center;">
                                
                                    
                                <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                            </div>
                        </header>
                        <h2> Withdrawal Request  -</h2> 
                                <h2> SIG Realtech</h2>
                                 <p>Dear ${name}👋</p>
                                 <p> We're writing to confirm that your withdrawal request on SIG Realtech has been in processing. Below are the details of your withdrawal </p>
                              
            
            
            <hr>
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left;">Amount Withdraw</td>
                                <td style="text-align: right;">${amount}</td>
            
                            </tr>
                            <tr>
                                <td style="text-align: left;">Date and Time</td>
                                <td style="text-align: right;">${time}</td>
            
                            </tr>
                           
                            <tr>
                                <td>Withdrawal Address</td>
                                <td style="text-align: right;">${walletAddress}</td>
            
                            </tr>
                            
            
                        </table>
                        <p>The withdrawn request has been confirmed by the admin. Please allow few days for the funds to reflect in your account, depending on your withdrawal method and banking institution.</p>
                                    
                        <p>If you have any questions or concerns regarding this withdrawal, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                        
                        <p>Thank you for choosing [Game Website]. We hope you continue to enjoy your gaming experience with us!</p>
                        <div style="margin: 40px 0 50px;">
                        <a type="button" class="contactbutton" href=""
                            target="_blank">Contact Us</a>
                    </div>
                        <p>Best regards,</p>
                        <p>The SIG Realtech Team</p>
            
                        <br>
                    </div>
                    
                </div>
            </body>
            
            </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Withdrawal Request",
            html,
        };

        await sgMail.send(msg);
        return true;


    },
    sendEmailRejectWithdrawRequest: async (email, name, reason,) => {
        let html =
            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        
                            
                        <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                    </div>
                </header>
               <h2> Withdrawal Request Rejected -</h2> 
               <h2> SIG Realtech</h2>
                <p>Dear ${name}👋</p>
                <p> We're writing to confirm that your withdrawal request on SIG Realtech has been rejected. Below are the reason of your withdrawal rejection </p>
                <p>Reason is :${reason}</p>
                <p>If you have any questions or concerns regarding this withdrawal, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                
                <p>Thank you for choosing [Game Website]. We hope you continue to enjoy your gaming experience with us!</p>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href=""
                    target="_blank">Contact Us</a>
            </div>
                <p>Best regards,</p>
                <p>The SIG Realtech Team</p>
               
               <br>
            </div>
            
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Withdrawal Request Rejected",
            html,
        };

        await sgMail.send(msg);
        return true;


    },

    sendEmailOtpFOR2FA: async (email, otp, userName) => {
        let html =

            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>OTP Verification for  Email 2FA SIG Realtech</h2>
            <p>${userName}</p>
            <p>Thank you for signing up with SIG Realtech. To ensure the security of your account, we require you to
                verify your otp .</p>
            <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>Please note that this OTP is valid for a limited time period (for 3 minutes). If you did not request this
                verification, please disregard this email.</p>
            <p>Thank you for choosing SIG Realtech. If you have any questions or need further assistance, feel free to
                contact our support team.</p><br>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href=""
                    target="_blank">Contact Us</a>
            </div>
            <p>Best regards,</p>
            <p>The SIG Realtech Team</p><br>
            </div>
            
        </div>
    </body>
    
    </html>
    `
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "OTP Verification for Email 2FA",
            html,
        };

        await sgMail.send(msg);
        return true;



    },
    sendMailForDelete: async (to, name) => {
        let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>Your SIG Realtech  Account Permanent Suspended.</h2>
           <p> Dear ${name},</p>
            
           <p> We regret to inform you that your account on SIG Realtech has been permanent blocked by our administrative team .</p>
            
           <p> As a result, you will no longer be able to access your account or its associated features .</p>
            
           <p> Thank you for your understanding.</p>
           <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href=""
               target="_blank">Contact Us</a>
       </div>
           <p> Best regards,</p>
           <p> The SIG Realtech Team</p>
            
           
            
           
            </div>
            
        
        </div>
    </body>
    
    </html>
    `

        const msg = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Your SIG Realtech  Account Permanent Suspended",
            html,
        };

        await sgMail.send(msg);
        return true;

    },

    sendEmailForConnectWallet: async (email, name, wallet) => {
        let html =
            `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        
                            
                        <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                    </div>
                </header>
               <h2> Wallet Connected to SIG Realtech!</h2>
<p>Dear ${name},</p>

<p>Your wallet  ${wallet} is connected with SIG Realtech!</p>

<p>If you want to change your connected wallet then contact with Admin</p>

<p>We're thrilled to have you join our gaming community. Get ready for an exciting adventure filled with thrilling games, engaging challenges, and endless fun!</p>

<p>Here's a quick overview of what you can expect from your SIG Realtech experience:</p>

<p>Explore a Variety of Games: Dive into a diverse collection of games ranging from action-packed adventures to brain-teasing puzzles. With new releases and updates regularly added, there's always something fresh to enjoy.</p>

<p>Connect with Players: Engage with fellow gamers from around the world. Whether you're looking for allies to conquer quests or rivals to challenge, our vibrant community is always ready to connect.</p>

<p>Unlock Achievements and Rewards: Set goals, complete challenges, and earn rewards! As you progress through games, unlock achievements, and level up your skills, you'll discover exciting rewards waiting for you.</p>

<p>Stay Updated: Don't miss out on the latest news, events, and special offers. Keep an eye on your inbox for updates, promotions, and exclusive content tailored just for you.</p>

<p>To kick-start your gaming journey, we've included a special bonus just for new players.</p>

<p>Ready to start playing? Simply log in to your account and explore the world of SIG Realtech today!</p>

<p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at support@SIG Realtech.com anytime.</p>
<div style="margin: 40px 0 50px;">
<a type="button" class="contactbutton" href="contact"
    target="_blank">Contact Us</a>
</div>
<p>Best regards,</p>
<p>The SIG Realtech Team</p>
               
               <br>
            </div>
           
        </div>
    </body>
    
    </html>`
        const msg = {
            to: email,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "Wallet Connected SIG Realtech!",
            html,
        };

        await sgMail.send(msg);
        return true;


    },

    sendMailForLoginActivity: async (to, name) => {
        let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    
                        
                    <h2 style="margin-bottom: 30px;">SIG Realtech</h2>
                </div>
            </header>
            <h2>SIG Realtech Login Activity Notification</h2>
            <p>Dear ${name}</p>
           <p> We're reaching out to inform you about recent login activity on your SIG Realtech account. Here are the details of the login activity:</p>
            
           <p>  Date and Time:   [Date and Time of Login]</p>
           <p>  Location:               [Location of Login]</p>
           <p>  Device:                   [Device Used for Login]</p>
           <p>  IP Address:           [IP Address Used for Login]
</p>
           <p> If you recognize this login activity and it was initiated by you, there's no need to take any action. However, if you do not recognize this login or suspect any unauthorized access to your account, please take the following steps immediately:</p>
            
           <p> Change your password: Go to your account settings on [Game Website] and update your password to a strong and unique one.
</p>
           <p> Review your account activity: Check for any unauthorized changes or activities within your account history.</p>
            
           <p> Contact support: If you believe your account security has been compromised; please contact our support team at [Support Email] for further assistance.</p>
            
           <p> Please note that ensuring the security of your account is our top priority, and we take proactive measures to protect your information.</p>
            
           <p>Thank you for your attention to this matter.</p>
           <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href=""
               target="_blank">Contact Us</a>
       </div>
     
   
       
           <p>Best regards,</p>
           <p> The SIG Realtech Team</p>
            
            
           
            </div>
           
        </div>
    </body>
    
    </html>
    `

        const msg = {
            to: to,
            from: {
                email: config.get("SENDGRID_FROM_EMAIL"),
                name: "SIG Realtech",
            },
            subject: "SIG Realtech Login Activity Notification",
            html,
        };

        await sgMail.send(msg);
        return true;
    },
    uploadImage(image) {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(image, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.url);
                }
            });
        })
    }

}
