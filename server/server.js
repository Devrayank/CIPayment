import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion, DataType } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import cors from 'koa-cors';
import koaBody from 'koa-bodyparser';
const { Pool, Client } = require('pg');
const date = require('date-and-time')
const siteurl = 'https://cipayment2.myshopify.com/cart'
var crypto = require('crypto');
const axios = require('axios')


const pool = new Pool({
  user: "tis24",
  host: "127.0.0.1",
  database: "tis24",
  password: "TechAdmin",
  port: 5432,
});

pool.connect(function (err) {
  if (err) throw err;
  console.log("Connected to DB!");

  pool.query("CREATE TABLE IF NOT EXISTS ciauth(id serial PRIMARY KEY, storeid VARCHAR ( 255 ) NOT NULL, authtoken VARCHAR ( 255 ) NOT NULL, storeorigin VARCHAR ( 100 ) NOT NULL)", (err, res) => {
    console.log('Create Executed');
  });

  pool.query("CREATE TABLE IF NOT EXISTS cigateway (id serial PRIMARY KEY, partnercode VARCHAR ( 255 ) NOT NULL, secretkey VARCHAR ( 255 ) NOT NULL, storeorigin VARCHAR ( 255 ) NOT NULL, paymentmode VARCHAR ( 255 ), createddate TIMESTAMP NOT NULL, updateddate TIMESTAMP, status INT DEFAULT 0, cipay_baseurl VARCHAR ( 255 ) NOT NULL)", (err, res) => {
    console.log('Create CIpayment Table');
  });

  pool.query("CREATE TABLE IF NOT EXISTS ci_payment (id serial PRIMARY KEY, checkout_id VARCHAR ( 255 ) NOT NULL, payment_status VARCHAR ( 255 ) NOT NULL, createddate TIMESTAMP NOT NULL, currencyType VARCHAR ( 255 ), orderReference VARCHAR ( 255 ), paymentRemarks VARCHAR ( 255 ), checkSum VARCHAR ( 255 ), txnAmount VARCHAR ( 255 ), paymentRef VARCHAR ( 255 ))", (err, res) => {
    console.log('Create CIpayment Table');
  });

});

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(cors());

  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;
        ACTIVE_SHOPIFY_SHOPS["shopOrigin"] = shop;
        ACTIVE_SHOPIFY_SHOPS["accessToken"] = accessToken;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {  
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }
        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });


  router.post("/setaccesstoken", async (ctx) => {
    console.log('access token calling');

    let CIAccessToken = ACTIVE_SHOPIFY_SHOPS["accessToken"];
    let CIShopOrigin = ACTIVE_SHOPIFY_SHOPS["shopOrigin"];
    let storeid = "tis86";

    pool.query("INSERT INTO ciauth(storeid, authtoken, storeorigin) VALUES ('" + storeid + "', '" + CIAccessToken + "', '" + CIShopOrigin + "')", (err, res) => {
      console.log('Inserted');
    });
    ctx.body = 'success';
    ctx.status = 200;
    console.log('Inserted success');
  });





  /**
   * Save Payment gateway Setting
   */
  router.post("/PaymentGatewaySetting", koaBody(), async (ctx) => {

    let CIShopOrigin = ACTIVE_SHOPIFY_SHOPS["shopOrigin"];
    var PaymentMode = ctx.request.body.PaymentMode;
    var secretkey = ctx.request.body.SecretKey;
    var partnercode = ctx.request.body.PartnerCode;
    var cipay_baseurl = ctx.request.body.Payurl;
    var status = "0";
    let paymentmode = '';
    if (PaymentMode == 'dev') {
      paymentmode = 'dev';
    } else {
      paymentmode = 'live';
    }
    const now = new Date();
    var mess = '';
    var dateTime = date.format(now, 'YYYY/MM/DD HH:mm:ss');
    pool.query("SELECT id FROM cigateway WHERE storeorigin = '" + CIShopOrigin + "' AND paymentmode = '" + paymentmode + "'", function (err, result) {
      if (result.rowCount === 0) {
        pool.query("INSERT INTO cigateway(partnercode, secretkey, storeorigin, paymentmode, status, createddate,cipay_baseurl)VALUES('" + partnercode + "', '" + secretkey + "', '" + CIShopOrigin + "', '" + paymentmode + "', '" + status + "', '" + dateTime + "', '" + cipay_baseurl + "')",
          (err, res) => {
            ctx.body = 'Inserted data successfully.';
            ctx.status = 200;
            mess = 'Inserted data successfully.';
          }
        );
      } else {
        pool.query("UPDATE cigateway SET partnercode = '" + partnercode + "', secretkey = '" + secretkey + "', updateddate = '" + dateTime + "', status = '" + status + "', cipay_baseurl = '" + cipay_baseurl + "' WHERE storeorigin = '" + CIShopOrigin + "' AND paymentmode = '" + paymentmode + "'", (err, res) => {

        });
        ctx.body = 'Updated data successfully.';
        ctx.status = 200;
        mess = 'Updated data successfully.';
      }
    }
    );
    ctx.body = "Data Save Successfully !";
    ctx.status = 200;
  });


  /**
   * Save Payment status
   */
  router.post("/PaymentGatewayStatus", koaBody(), async (ctx) => {
    let Paymentcheckstatus = ctx.request.body.statussets;
    let CIShopOrigin = ACTIVE_SHOPIFY_SHOPS["shopOrigin"];
    if (Paymentcheckstatus == '1') {
      pool.query("UPDATE cigateway SET status = '1' WHERE storeorigin = '" + CIShopOrigin + "' AND paymentmode = 'live'", (err, res) => {
      });
      pool.query("UPDATE cigateway SET status = '0' WHERE storeorigin = '" + CIShopOrigin + "' AND paymentmode = 'dev'", (err, res) => {
      });
    } else {
      pool.query("UPDATE cigateway SET status = '0' WHERE storeorigin = '" + CIShopOrigin + "' AND paymentmode = 'live'", (err, res) => {
      });
      pool.query("UPDATE cigateway SET status = '1' WHERE storeorigin = '" + CIShopOrigin + "' AND paymentmode = 'dev'", (err, res) => {
      });
    }
    ctx.body = 'PaymentGatewaySetting status is Working';
    ctx.status = 200;
  });



  router.post("/ModeDeveloper", async (ctx) => {

    let CIShopOrigin = ACTIVE_SHOPIFY_SHOPS["shopOrigin"];
    var datas = "";
    const results = await pool.query("SELECT paymentmode,id,partnercode,secretkey,cipay_baseurl FROM cigateway WHERE storeorigin = '" + CIShopOrigin + "' and paymentmode='dev'");
    if (results.rowCount > 0) {
      ctx.body = results;
      ctx.status = 200;
    } else {
      ctx.body = "no data found";
      ctx.status = 200;
    }

  });
  router.post("/Modelive", async (ctx) => {

    let CIShopOrigin = ACTIVE_SHOPIFY_SHOPS["shopOrigin"];
    var datas = "";
    const results = await pool.query("SELECT paymentmode,id,partnercode,secretkey,cipay_baseurl FROM cigateway WHERE storeorigin = '" + CIShopOrigin + "' and paymentmode='live'");
    if (results.rowCount > 0) {
      ctx.body = results;
      ctx.status = 200;
    } else {
      ctx.body = "no data found";
      ctx.status = 200;
    }
  });


  router.post("/TooglbuttGet", async (ctx) => {
    let CIShopOrigin = ACTIVE_SHOPIFY_SHOPS["shopOrigin"];
    const resulttoggle = await pool.query("SELECT paymentmode,status FROM cigateway WHERE storeorigin = '" + CIShopOrigin + "' and status='1' and paymentmode='live'");
    if (resulttoggle.rowCount > 0) {
      console.log("Pay mode live status : ", resulttoggle.rows);
      ctx.body = resulttoggle.rows;
      ctx.status = 200;
    } else {
      ctx.body = "no data found";
      ctx.status = 200;
    }
  });


  router.post("/CalculateShipping/:object", async (ctx) => {
    // console.log('Calculate Shipping', ctx.params.object);
    const shippingToken = ctx.params.object;
    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      //console.log('authtoken ====================== ', authtoken);
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const data = await client.get({
        path: 'checkouts/' + shippingToken + '/shipping_rates',
      })
        .then(data => {
          ctx.body = data;
          ctx.status = 200;
        });
    } else {
      ctx.body = [];
      ctx.status = 200;
    }
  });


  router.post("/retrievescheckout/:object", async (ctx) => {
    //console.log('Get details Shipping', ctx.params.object);
    const shippingToken = ctx.params.object;
    const Checkout_token = ctx.params.object;
    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const dataret = await client.get({
        path: 'checkouts/' + Checkout_token,
      })
        .then(data => {
          ctx.body = data;
          ctx.status = 200;
        });
    } else {
      ctx.body = [];
      ctx.status = 200;
    }
  });


  /**
   * Checkout API to Generate Checkout ID (token)
   */
    router.post("/CICheckout", koaBody(), async (ctx) => {
      console.log('inside checkout data here');
      if (!ctx.request.body) {
        ctx.body = [{ 'message': 'no items in the cart' }];
      }
      const checkoutData1 = ctx.request.body;
      const lineItems = checkoutData1.line_items;
      const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
      if (result || result.rows) {
        console.log('inside rows if');
        let authtoken = result.rows[0]['authtoken'];
        const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
        const checkoutdata = await client.post({
          path: 'checkouts',
          data: checkoutData1,
          type: DataType.JSON
        })
          .then(data => {
            ctx.body = data;
            ctx.status = 200;
          });
      } else {
        ctx.body = [{ 'message': 'You are not authorised!' }];
        ctx.status = 200;
      }

    });


  /**
 * Create Order API to create new order
 */
  router.post("/CIOrder", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'no items in the cart' }];
    }
    const lineItems = ctx.request.body.order.lineitems;
    const tags = ctx.request.body.order.tags;
    const tax_lines = ctx.request.body.order.tax_lines;
    const current_total_tax = ctx.request.body.order.current_total_tax;
    const shipping_address = ctx.request.body.order.shipping_address;
    const phone = ctx.request.body.order.shipping_address.phone;
    const total_shipping_price_set = ctx.request.body.order.total_shipping_price_set;
    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const orderdata = await client.post({
        path: 'orders',
        data: {
          "order": ctx.request.body.order
        },
        type: DataType.JSON
      })
        .then(data => {
          return data;
        });
      ctx.body = orderdata;
      ctx.status = 200;
    } else {
      ctx.body = [{ 'message': 'You are not authorised!' }];
      ctx.status = 200;
    }
  });



  /**
* Retrive Discount rules
*/
  router.get("/retrievesdiscount", async (ctx) => {
    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const data = await client.get({
        path: 'price_rules',
      }).then(data => {
        ctx.body = data;
        ctx.status = 200;
      });
    } else {
      ctx.body = erroe;
      ctx.status = 200;
    }
  });

  /**
    * Retrive Order API to create new order
    */
  router.post("/retrievesorder/:object", async (ctx) => {
    const orderid = ctx.params.object;
    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const data = await client.get({
        path: 'orders/' + orderid,
      }).then(data => {
        ctx.body = data;
        ctx.status = 200;
      });
    } else {
      ctx.body = [];
      ctx.status = 200;
    }
  });

  /**
   * Create Transaction API to create new order
   */
  router.post("/CITransaction", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'no items in the cart' }];
    }
    const order_id = ctx.request.body.transaction.order_id;
    // console.log("Transaction id +++++++++++++  ", order_id);
    // console.log("Transaction >>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<< ", ctx.request.body);

    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const data = await client.post({
        path: 'orders/' + order_id + '/transactions',
        data: ctx.request.body,
        type: DataType.JSON,
      }).then(data => {
        return data;
      });
      ctx.body = data;
      ctx.status = 200;
      //console.log('orderTrdata  created data', data);
    } else {
      ctx.body = [{ 'message': 'You are not authorised!' }];
      ctx.status = 200;
    }
  });




  /**
 * Success payment callback
 */
  router.post("/callback_cipayment/success", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'No data here' }];
    }
    else {
      const now = new Date();
      var dateTime = date.format(now, 'YYYY/MM/DD HH:mm:ss');
      ctx.body = "payment success";
      ctx.status = 200;
      console.log('Payment Detail: ', ctx.request.body);
      let secretKey = 'xiv1ibz7udg2hmg28f4pz2wphdegi84r9';
      let payloadString = 'currencyType=' + ctx.request.body.currencyType + '|orderReference=' + ctx.request.body.orderReference + '|paymentRef=' + ctx.request.body.paymentRef + '|paymentRemarks=' + ctx.request.body.paymentRemarks + '|paymentStatus=' + ctx.request.body.paymentStatus + '|txnAmount=' + ctx.request.body.txnAmount + '';
      const hash = crypto.createHmac('sha256', secretKey)
        .update(payloadString)
        .digest('hex');
      if (ctx.request.body.checkSum == hash) {
        pool.query("INSERT INTO ci_payment (checkout_id, payment_status, createddate,currencyType,orderReference,paymentRemarks,checkSum,txnAmount,paymentRef) VALUES ('" + ctx.request.body.orderReference + "', '" + ctx.request.body.paymentStatus + "', '" + dateTime + "', '" + ctx.request.body.currencyType + "', '" + ctx.request.body.orderReference + "', '" + ctx.request.body.paymentRemarks + "', '" + ctx.request.body.checkSum + "', '" + ctx.request.body.txnAmount + "', '" + ctx.request.body.paymentRef + "')", (err, res) => {
          console.log('Inserted payment data in DB');
        });
        ctx.body = "payment success response ++++++++++";
        ctx.redirect(siteurl + '?ref=success');
      } else {
        pool.query("INSERT INTO ci_payment (checkout_id, payment_status, createddate,currencyType,orderReference,paymentRemarks,checkSum,txnAmount,paymentRef) VALUES ('" + ctx.request.body.orderReference + "', 'FAILED', '" + dateTime + "', '" + ctx.request.body.currencyType + "', '" + ctx.request.body.orderReference + "', '" + ctx.request.body.paymentRemarks + "', '" + ctx.request.body.checkSum + "', '" + ctx.request.body.txnAmount + "', '" + ctx.request.body.paymentRef + "')", (err, res) => {
          console.log('Inserted payment data in DB');
        });
        ctx.redirect(siteurl + '?ref=fail');
      }
    }
  });

  /**
    * fail payment callback
    */
  router.post("/callback_cipayment/failed", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'No data here' }];
    }
    else {

      const now = new Date();
      var dateTime = date.format(now, 'YYYY/MM/DD HH:mm:ss');
      pool.query("INSERT INTO ci_payment (checkout_id, payment_status, createddate,currencyType,orderReference,paymentRemarks,checkSum,txnAmount,paymentRef) VALUES ('" + ctx.request.body.orderReference + "', '" + ctx.request.body.paymentStatus + "', '" + dateTime + "', '" + ctx.request.body.currencyType + "', '" + ctx.request.body.orderReference + "', '" + ctx.request.body.paymentRemarks + "', '" + ctx.request.body.checkSum + "', '" + ctx.request.body.txnAmount + "', '" + ctx.request.body.paymentRef + "')", (err, res) => {
        console.log('Inserted payment data in DB faile condition');
      });

      ctx.body = "payment fail";
      ctx.status = 200;
      const conditionget = ctx.params.object;
      console.log('Payment Detail: ', ctx.request.body);
      ctx.redirect(siteurl + '?ref=fail');

    }
  });



  /**
 * Create Order API to create new order
 */
  router.post("/gettingpaymentresponse", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'no items in the cart' }];
    }
    const checkout_id = ctx.request.body.checkout_id;
    const result = await pool.query("SELECT * FROM ci_payment WHERE checkout_id = '" + checkout_id + "' ORDER BY id DESC LIMIT 1");
    if (result.rowCount > 0) {
      var PaymentStatus = result.rows[0];
      ctx.body = PaymentStatus;
      ctx.status = 200;
    } else {
      ctx.body = "NA";
      ctx.status = 200;
    }
  });


  router.post("/deletepaymentrecord", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'no data found' }];
    }
    const checkout_id = ctx.request.body.checkout_id;
    const result = await pool.query("delete FROM ci_payment WHERE checkout_id = '" + checkout_id + "'");
      ctx.body = 'success';
      ctx.status = 200;
      console.log("delete payment record",)
    
  });


  /**
   * Order cancle API to create new order
   */
  router.post("/ordercancel", koaBody(), async (ctx) => {
    // if (!ctx.request.body) {
    //   ctx.body = [{ 'message': 'no items in the cart' }];
    // }
    //const order_id = ctx.request.body.order_id;
    const order_id = 4649912008925;
    const result = await pool.query("SELECT authtoken FROM ciauth WHERE storeorigin = '" + process.env.SHOP + "' ORDER BY id DESC LIMIT 1");
    if (result || result.rows) {
      let authtoken = result.rows[0]['authtoken'];
      const client = new Shopify.Clients.Rest(process.env.SHOP, authtoken);
      const data = await client.post({
        path: 'orders/' + order_id + '/cancel',
        data: {},
        type: DataType.JSON,
      }).then(data => {
        return data;
      });
      ctx.body = data;
      ctx.status = 200;
      console.log("Refund Data", data)
    } else {
      ctx.body = [{ 'message': 'You are not authorised!' }];
      ctx.status = 200;
      console.log("Refund not created",)
    }
  });



  /**
   * Refund API to create new order
   */
  router.post("/refund", koaBody(), async (ctx) => {
    if (!ctx.request.body) {
      ctx.body = [{ 'message': 'No data found' }];
    }
    
   const currencyType = ctx.request.body.transactions[0].currency
   const orderReference = ctx.request.body.order_id
   //const orderReference = '9a7bb749c6805bb46018a9eac1a5b474';
   const refundReference = ctx.request.body.transactions[0].id
   const refundAmount = ctx.request.body.transactions[0].amount
   const refundCharges = false

   let reqURL = 'https://demo.retail.cipay.inspirenetz.com/loyaltypg/public/payment/shopify-test/refund';

    let secretKey = 'xiv1ibz7udg2hmg28f4pz2wphdegi84r9';
    let payloadStringref = 'currencyType=' + currencyType +'|orderReference=' + orderReference +'|refundAmount=' + refundAmount +'|refundCharges=' + refundCharges +'|refundReference=' +refundReference
    const hash = crypto.createHmac('sha256', secretKey)
      .update(payloadStringref)
      .digest('hex');

      var qs = require('qs');
      var payloadObject = qs.stringify({
        'currencyType':currencyType,
        'orderReference': orderReference,
        'refundAmount': refundAmount,
        'refundCharges':refundCharges,
        'refundReference': refundReference,
        'checkSum': hash
      });
      var config = {
        method: 'post',
        url: reqURL,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: payloadObject
      };
      const res = await axios(config)
        .then(function (response) {
          return response.data;
        })
        .catch(function (error) {
          return error;
        });
      console.log('Refund Payment Data', res);
      ctx.body = res;
      ctx.status = 200;

  });

  /**
     * Test
     */
  router.post("/Testget", koaBody(), async (ctx) => {
    const data = {
      id: 123,
      secretKey: 'xiv1ibz7udg2hmg28f4pz2wphdegi84r9TEST'
    }
    ctx.body = data;
    ctx.status = 200;
    console.log('Test conditionget');
    //ctx.redirect(siteurl+'?ref=success');


  });

  const corsOpts = {
    origin: '*',

    methods: [
      'GET',
      'POST',
    ],

    allowedHeaders: [
      'Content-Type',
    ],
  };

  server.use(router.allowedMethods());
  server.use(cors(corsOpts));
  server.use(koaBody());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});