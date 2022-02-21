$(document).ready(function () {
  //var domainName = 'https://ci.shopappdev.com';
  var domainName = "https://d887-115-166-143-82.ngrok.io";

  $(
    '<div class="btntext mt-0"><button type="button" class="cart__checkout-button button" id="CICheckout" data-bs-toggle="modal" >CI Checkout <div class="spinner loader btnlaoder"></div></button></div>'
  ).insertAfter("#checkout");

  var tcurrencyType,
    torderReference,
    ttxnAmountt = "";

  tcurrencyType = $("input[name='currencyType']").val();
  torderReference = $("input[name='orderReference']").val();
  ttxnAmountt = $("input[name='txnAmount']").val();
  $("#cipaymodel #inputSaveData").prop("disabled", true);

  var shippingArray = [];
  var tax_linesArray = [];
  var Contact,
    Country,
    FName,
    LName,
    Address,
    Apartment,
    City,
    State,
    Pin,
    regex,
    filter,
    itemssubtotalprice = "";
  var token = "";
  var total_tax = 0;
  var ci_shipping = 0;

  var orderid,
    Email,
    Country,
    shippingprice,
    FName,
    LName,
    Address,
    Apartment,
    City,
    State,
    Pin,
    billCountry,
    billFName,
    billname,
    billLName,
    billAddress,
    billApartment,
    billCity,
    billState,
    billPin,
    Phone,
    phone,
    Name = "";

  /*Payment live & development mode*/
  $.ajax({
    type: "POST",
    url: domainName + "/TooglbuttGets",
    dataType: "json",
    contentType: "application/json",
    success: function (data) {
      var cipay_baseurl = data[0].cipay_baseurl;
      var paymentmode = data[0].paymentmode;
      var status = data[0].status;
      var partnercode = data[0].partnercode;

      $("#cipayform").attr(
        "action",
        cipay_baseurl + "/" + partnercode + "/initiate"
      );
    },
    error: function (error) {
      console.log("checkouts >>>>", error);
    },
  });

  function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
  }

  function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1);
      if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
  }

  var icountry = (ifName = ilName = iaddress = icity = istate = ipin = iemail =
    "");
  $("#cipaymodel #ContactInfo input").keydown(function () {
    $("#cipaymodel #inputSaveData").prop("checked", false);
    $("#cipaymodel #inputSaveData").prop("disabled", true);

    // $('#cipaymodel #ContactInfo input').prop("disabled", false);
    document.cookie = "saveinfo" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";

    /**
     * Input save information enable disable
     *
     */

    icountry = $("#country").val();
    ifName = $("#inputFName").val();
    ilName = $("#inputLName").val();
    iaddress = $("#inputAddress").val();
    icity = $("#locality").val();
    istate = $("#administrative_area_level_1").val();
    ipin = $("#postal_code").val();
    iemail = $("#inputEmail").val();

    if (
      !icountry &
      !ifName &
      !ilName &
      !iaddress &
      !icity &
      !istate &
      !ipin &
      !iemail
    ) {
      $("#cipaymodel #inputSaveData").prop("disabled", true);
    } else {
      $("#cipaymodel #inputSaveData").prop("disabled", false);
    }
  });

  $("#cipaymodel #diffbilling input").keydown(function () {
    //$('#cipaymodel #Savebilladres').prop('checked', false);
    document.cookie =
      "billing_addresschk" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    $("#cipaymodel #inputSaveData").prop("checked", false);
    console.log("t22");
  });

  /*Discount code remove button*/
  $(document).on("click", ".removecode", function (e) {
    e.preventDefault();
    $(".appliedcode").empty();
    $(".CIdiscountrow").hide();
    $("#ciinputdiscount").val("");
    $("#cicheckout_submit").removeAttr("disabled");
    $("#cicheckout_submit").prop("disabled", false);
    $("#disc_hidden").val("");
    getcartData(e);
    $("#CITotal").text("₹" + totalpricecart);
    //console.log('totalpricecart',totalpricecart);
    document.cookie =
      "applied_discount" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
  });

  /**
   * Change Shipping Calculation on Changing the Shipping Methode
   */
  $(document).on("change", "input[name=shippingmethode]", function () {
    $(".spinner").addClass("show");

    shippingTitle = $(this).val();
    shippingIndex = $(this).attr("data-index");
    var selectedShipping = shippingArray[shippingIndex];

    var subtotal_price = selectedShipping.checkout.subtotal_price;
    var total_price = selectedShipping.checkout.total_price;
    var total_tax = selectedShipping.checkout.total_tax;
    var price = selectedShipping.price;
    var title = selectedShipping.title;

    $("#CIShipping").text("₹" + price);
    $("#CITax").text(total_tax);
    $("#CITotal").text("₹" + total_price);

    setTimeout(function () {
      $(".spinner").removeClass("show");
    }, 1000);
  });

  /**
   * Discount code Retrives
   **/
  function retrievesdiscount(e) {
    e.preventDefault();
    $(".spinner").addClass("show");
    $.ajax({
      type: "GET",
      //url: domainName+'/retrievesdiscount',
      url: "https://cipaytest.myshopify.com/admin/price_rules.json",
      dataType: "json",
      contentType: "application/json",
      success: function (data) {
        getcartData(e);

        var discountArray = data.price_rules;
        var cidiscountcode = $("#ciinputdiscount").val();
        var selectedarray = discountArray.filter(function (
          currentValue,
          index,
          array
        ) {
          if (currentValue.title == cidiscountcode) {
            return currentValue.title == cidiscountcode;
          }
        });
        //console.log('selectedarray',selectedarray);

        if (jQuery.isEmptyObject(selectedarray) == false) {
          $("#reductioncodeci").addClass("hidden");
          $(".CIdiscountrow").show();

          var discounthtml = "";
          $(selectedarray).each(function (index, value) {
            var discounttitle = selectedarray[index].title;
            var discountid = selectedarray[index].id;
            var discountvalue = selectedarray[index].value;
            var discountvaluename = Math.abs(discountvalue);
            var discountvalue_type = selectedarray[index].value_type;
            var discounttarget_type = selectedarray[index].target_type;
            var allocation_method = selectedarray[index].allocation_method;
            var target_selection = selectedarray[index].target_selection;

            var discounttotalp = totalpricecart - discountvaluename;
            var pricetoatal = discounttotalp.toFixed(2);
            //console.log("totalpricecart",pricetoatal);

            setTimeout(function () {
              $(".CIdiscountrow .total-line__price .cipricedis").text(
                "-₹" + discountvaluename
              );
              $(".CIdiscountrow .discounttitle").text(discounttitle);
              $("#CITotal").text("₹" + pricetoatal);
              $(".spinner").removeClass("show");
            }, 1500);

            var savediscountdata = JSON.stringify({
              title: discounttitle,
              value: discountvalue,
              amount: discountvalue,
              applicable: true,
              value_type: discountvalue_type,
              application_type: "discount_code",
              non_applicable_reason: null,
              allocation_method: allocation_method,
              target_selection: target_selection,
              target_type: discounttarget_type,
            });

            setCookie("savediscountdata", savediscountdata, 30);

            $(".cicodename").addClass("c2");
            $("th.total-line__name.cicodenameth span.sdiscnt").addClass(
              "discspan"
            );
            $("span.discname").text(discounttitle);

            $(".appliedcode").html(
              '<div class="img-dis  d-inline"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-discount color-foreground-text" viewBox="0 0 24 23"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 0h3a2 2 0 012 2v3a1 1 0 01-.3.7l-6 6a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l6-6A1 1 0 017 0zm2 2a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor"></path></svg></div><div class="applytext d-inline">' +
                discounttitle +
                '<div class="removecode"> x </div></div>'
            );
            $("#cicheckout_submit").prop("disabled", true);
            $("#ciinputdiscount").val("");
          });
        } else {
          $("#cicheckout_submit").removeAttr("disabled");
          $("#reductioncodeci").removeClass("hidden");
          $(".appliedcode").html("");
          $(".CIdiscountrow").hide();
          $(".CIdiscountrow .discname").text(" ");
          $(".CIdiscountrow .total-line__price .cipricedis").text(
            "Continue in next step"
          );
          $("#ratesTable .cicodenameth").html(
            '<span  class="sdiscnt">Discount</span>'
          );
          $(".cicodename").removeClass("c2");
          $("th.total-line__name.cicodenameth span.sdiscnt").removeClass(
            "discspan"
          );
          $("span.discname").text("");
          document.cookie =
            "savediscountdata" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
          $(".spinner").addClass("hide");
        }
      },
      error: function (error) {
        console.log("checkouts >>>>", error);
      },
    });
  }

  $("#cicheckout_submit").on("click", function (e) {
    retrievesdiscount(e);
    var cidiscountcode = $("#ciinputdiscount").val();
    //console.log(cidiscountcode);
    $("#disc_hidden").val(cidiscountcode);
    $("#ratesTable .cicodenameth").html(
      '<span class="sdiscnt">Discount</span><div class="cicodename"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-discount color-foreground-text" viewBox="0 0 30 30"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 0h3a2 2 0 012 2v3a1 1 0 01-.3.7l-6 6a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l6-6A1 1 0 017 0zm2 2a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor"></path></svg></div><span class="discname"></span>'
    );
  });

  /**
   * Checkout API to Generate Checkout ID (token)
   */
  function createCheckout(e) {
    var variantString = "";
    var arr = new Array();
    var arrnew = new Array();
    var arrshipping = new Array();

    //country  = $( "#inputCountry option:selected" ).val();
    country = $("#country").val();
    first_name = $("#inputFName").val();
    last_name = $("#inputLName").val();
    address1 = $("#inputAddress").val();
    name = first_name + " " + last_name;
    Apartment = $("#inputApartment").val();
    city = $("#locality").val();
    province = $("#administrative_area_level_1").val();
    zip = $("#postal_code").val();
    Email = $("#inputEmail").val();

    var province_code = $("#inputState option:selected").attr("datavalue");
    var country_code = $("#inputCountry option:selected").attr("datavalue");

    var gediscountdata = getCookie("savediscountdata");
    if (gediscountdata || !gediscountdata == "") {
      var jsonObjdis = JSON.parse(gediscountdata);

      var gettitle = jsonObjdis.title;
      var getvalue = Math.abs(jsonObjdis.value);
      var getvaluetype = jsonObjdis.value_type;
      var getamount = Math.abs(jsonObjdis.amount);
      var getallocationmethod = jsonObjdis.allocation_method;
      var getapplicable = jsonObjdis.applicable;
      var getapplicationtype = jsonObjdis.application_type;
      var gettarget_type = jsonObjdis.target_type;
      var gettargetselection = jsonObjdis.target_selection;
      var getnonapplicablereason = jsonObjdis.non_applicable_reason;

      var INvalue = $("#ciinputdiscount").val();
      if (INvalue.length > 0) {
        var applied_discount = JSON.stringify({
          title: gettitle,
          value: getvalue,
          amount: getamount,
          applicable: getapplicable,
          value_type: getvaluetype,
          application_type: getapplicationtype,
          non_applicable_reason: getnonapplicablereason,
        });
      }
    }
    $(".spinner").addClass("show");
    e.preventDefault();

    jQuery.ajax({
      type: "GET",
      url: "/cart.js",
      success: function (data) {
        var items = [];
        var obj = JSON.parse(data);
        item_count = obj.item_count;
        items = obj.items;

        var newArr = jQuery.map(items, function (val, index) {
          return {
            variant_id: val.id,
            quantity: val.quantity,
          };
        });

        $.ajax({
          type: "POST",
          url: domainName + "/CICheckout/",
          dataType: "json",
          contentType: "application/json",
          data: JSON.stringify({
            checkout: {
              line_items: newArr,
              order_id: null,
              applied_discount: {
                title: gettitle,
                value: getvalue,
                amount: getamount,
                applicable: getapplicable,
                value_type: getvaluetype,
                application_type: getapplicationtype,
                non_applicable_reason: getnonapplicablereason,
              },
              order_status_url: null,
              order: null,
              shipping_address: {
                zip: zip,
                city: city,
                phone: Email,
                company: null,
                country: country,
                address1: address1,
                address2: "null",
                province: province,
                last_name: last_name,
                first_name: first_name,
                country_code: country_code,
                province_code: province_code,
              },
            },
          }),

          success: function (data) {
            tax_linesArray = data.body.checkout.tax_lines;

            if (data.body.checkout.token) {
              token = data.body.checkout.token;

              var INvalue = $("#disc_hidden").val();
              console.log("INvalue", INvalue);
              if (INvalue.length > 0) {
                $(
                  "#ciinputdiscount, .applydiscount, #cicheckout_submit, .removecode"
                ).hide();

                discountvalue = data.body.checkout.applied_discount.value;
                discounttitle = data.body.checkout.applied_discount.title;
                discountamount = data.body.checkout.applied_discount.amount;
                discounvaluetype =
                  data.body.checkout.applied_discount.value_type;

                $(".CIdiscountrow .discname").text(discounttitle);
                $(".CIdiscountrow .total-line__price .cipricedis").text(
                  "-₹" + discountvalue
                );
                var applieddiscount = JSON.stringify({
                  title: discounttitle,
                  value: discountvalue,
                  amount: discountamount,
                  applicable: true,
                  value_type: discounvaluetype,
                  application_type: "discount_code",
                  non_applicable_reason: null,
                });
                console.log("applieddiscount", applieddiscount);
                setCookie("applied_discount", applieddiscount, 30);
              } else {
                // $('.applydiscount').empty();
                $(".applydiscount #cicheckout_submit,#ciinputdiscount").hide();
              }
              calculateShipping(token);

              /*for checkout token cookie*/
              setCookie("chkouttoken", data.body.checkout.token, 30);
              //console.log("chkdata",data.body.checkout.token);
            }
          },
          error: function (error) {
            console.log("checkouts >>>>", error);
          },
        });
      },

      error: function (error) {},
    });

    $("#ContactInfo").css("display", "none");
    $("#ShippingInfo").css("display", "none");
    $("#Payment").css("display", "block");

    $("#PayContact").html($("#mobileNo").val());
    $("#PayAdd").html(
      Address + ", " + Pin + " " + City + " " + State + ", " + Country
    );
    $("#ShipMethod").html("Standard Free");
  }

  /**
   * Calculate Shippign and Display
   */
  $("#cipaymodel p#error-inputEmail").hide();

  $("#ContinueShipping").on("click", function (e) {
    e.preventDefault();

    $("#createOrderbtn").hide();

    filter = /[0-9 -()+]+$/;
    Contact = $("#inputEmail").val();
    regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (!regex.test(Contact)) {
      // $('#cipaymodel p#error-inputEmail').show();
      // $('#cipaymodel p#error-inputEmail').text('Enter a valid Email');
      // $('#ContinueShipping').prop('disabled', true);
      // alert('Enter a valid Email');
    } else {
      // $('#cipaymodel p#error-inputEmail').hide();
      // $('#ContinueShipping').prop('disabled', false);
    }

    //Country  = $( "#inputCountry option:selected" ).val();
    Country = $("#country").val();
    FName = $("#inputFName").val();
    LName = $("#inputLName").val();
    Address = $("#inputAddress").val();
    Apartment = $("#street_number").val();
    apt = "";
    if (Apartment !== "") {
      apt = Apartment + ", ";
    }
    City = $("#locality").val();
    State = $("#administrative_area_level_1").val();
    Pin = $("#postal_code").val();

    $("#model-addbill, #ContinueOrder, .ship_retrn").hide();
    $(
      "#cipaymodel  .section.section--shipping-method, #ContinuePayment, .cart_retrn"
    ).show();
    $("#ContinueOrder, .ship_retrn").addClass("hidden");

    if (
      !Country ||
      !Contact ||
      !FName ||
      !LName ||
      !Address ||
      !City ||
      !State ||
      !Pin ||
      State == "State"
    ) {
      alert("Please fill required fields");
    } else {
      createCheckout(e);
      $("#ContactInfo").css("display", "none");
      $("#ShippingInfo").css("display", "block");
      $("#Payment").css("display", "none");
      $("#contact").html($("#mobileNo").val());
      //$("#add").html(Address+","+Pin+" "+City+" "+State+", "+Country);
      $("#add").html(apt + Address + "," + Pin);
      $("#cipaymodel #contact").text(Contact);
      /*breadcrumb*/
      $(
        ".custom-bd li.breadcrumb__item.breadcrumb__item.hidden.shippingbd, .infobd span.arrow-bd.hidden"
      ).removeClass("hidden");
    }
  });

  /**
   * Calculate Shipping by passing a Checkout token, so to run this route we will need a
   * token which will be generated by CICheckout route means first we need to run checkout
   * API and generate token by passing line items and shipping address
   */
  function calculateShipping() {
    $.ajax({
      type: "POST",
      url: domainName + "/CalculateShipping/" + token,
      dataType: "json",
      success: function (data) {
        shippingArray = data.body.shipping_rates;
        if (shippingArray) {
          var shippingHtml = "";
          $(data.body.shipping_rates).each(function (index, value) {
            var cititle = data.body.shipping_rates[index].title;

            var isSelected = "";
            if (index == 0) {
              var isSelected = "checked";
            }

            shippingHtml +=
              "<li data-index=" +
              index +
              "><input " +
              isSelected +
              ' id="shipping' +
              index +
              '" type="radio" name="shippingmethode" value="' +
              cititle +
              '" data-index="' +
              index +
              '" /><label for="shipping' +
              index +
              '">' +
              cititle +
              "</label></li>";
          });

          $("#shippingwrap").html(shippingHtml);

          total_tax = data.body.shipping_rates[0].checkout.total_tax;
          ci_shipping = data.body.shipping_rates[0].price;

          var subtotal_price =
            data.body.shipping_rates[0].checkout.subtotal_price;
          var total_price = data.body.shipping_rates[0].checkout.total_price;
          var total_tax = data.body.shipping_rates[0].checkout.total_tax;
          //var rate_igst = data.body.shipping_rates[0].checkout.rate;
          var price = data.body.shipping_rates[0].price;
          var title = data.body.shipping_rates[0].title;

          // $('#CISubtotal').text(subtotal_price);
          $("#CIShipping").text("₹" + price);
          $("#CITax").text(total_tax);
          $("#CITotal").text("₹" + total_price);

          // var payload = 'currencyType=INR|orderReference='+token+'|txnAmount='+total_price+'';
          // var checkSumHash = sha256.hmac('xiv1ibz7udg2hmg28f4pz2wphdegi84r9', payload);

          // $('#orderReference').val(token);
          // $('#txnAmount').val(total_price);
          // $('#checkSum').val(checkSumHash);

          $(".spinner").removeClass("show");
        }
      },
      error: function (error) {
        console.log("Shipping Calculation >>>>", error);
      },
    });
  }

  /**
   * Initiate Payment Gateway
   */
  function InitiatePayment(e) {
    var arr = new Array();
    arr.push({ total: "500.00", token: token });

    e.preventDefault();
    $.ajax({
      type: "POST",
      url: domainName + "/InitiatePayment",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(arr),
      success: function (data) {
        console.log("Payment Response", data.body);
      },
      error: function (error) {
        console.log("Payments >>>>", error);
      },
    });
  }

  /**
   * Get Shop Name
   */
  function getDomain(e) {
    var variantString = "";

    $.ajax({
      type: "POST",
      url: domainName + "GetDomain/",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(arr),
      success: function (data) {
        console.log(data.body.checkout.token);
        if (data.body.checkout.token) {
          calculateShipping(data.body.checkout.token);
        }
      },
      error: function (error) {
        console.log("checkouts >>>>", error);
      },
    });
  }

  /**
   * Change Slides on Popup
   */
  $(".ChangeInfo").on("click", function (e) {
    e.preventDefault();
    //retrievesdiscount(e);
    $("#ContactInfo").css("display", "block");
    $("#ShippingInfo").css("display", "none");
    $("#Payment").css("display", "none");
    $(".discalimer-txt").text("");
    document.cookie =
      "savediscountdata" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";

    /*breadcrumb*/
    $(
      ".custom-bd li.breadcrumb__item.breadcrumb__item.paymenetbd,.custom-bd li.breadcrumb__item.breadcrumb__item.shippingbd, .shippingbd span.arrow-bd,.infobd span.arrow-bd"
    ).addClass("hidden");

    /*end*/
    $("#reductioncodeci").addClass("hidden");
    $(
      "#ciinputdiscount, .applydiscount,.applydiscount #cicheckout_submit"
    ).show();
    $(".applydiscount").addClass("d-inline");

    //$('.applydiscount').html('<button name="cicheckout[submit]" type="submit" id="cicheckout_submit" class="field__input-btn btn btn-secondary" aria-busy="false">Apply</button>');

    $("#CIShipping").text("Continue in next step");
    $("#CITax").text("Continue in next step");

    $(".removecode").trigger("click");
    getcartData(e);
    $("#CITotal").text("₹" + totalpricecart);
  });

  var cartData = (saveCookie = "");
  var count = 0;

  $("#model-addbill, #section--billing-address__different").hide();

  /*for show and hide billing address form*/
  $('input:radio[name="cout_different_billing_address"]').change(function () {
    if ($(this).is(":checked") && $(this).val() == "Yes") {
      $("#section--billing-address__different").show();
      $("#createOrderbtn").prop("disabled", true);

      /*for cookie data save on billing form*/
      // var savebillinginfo = getCookie("savebillinginfo");
      //  if (savebillinginfo || !savebillinginfo == "") {
      //   var jsonbillObj = JSON.parse(savebillinginfo);
      //   $('#cipaymodel #Savebilladres').prop('checked', true);

      //   $("#billFName").val(jsonbillObj.first_name);
      //   $("#billCountry").val(jsonbillObj.country);
      //   $("#billLName").val(jsonbillObj.last_name);
      //   $("#billAddress").val(jsonbillObj.address2);
      //   $("#billApartment").val(jsonbillObj.Apartment);
      //   $("#billCity").val(jsonbillObj.city);
      //   $("#billState").val(jsonbillObj.province);
      //   $("#billPin").val(jsonbillObj.zip);

      // }
      /*end*/
    } else {
      $(" #section--billing-address__different").hide();
      $("#createOrderbtn").prop("disabled", false);
    }
  });

  /**
   * get cart items data on cicheckout model
   */
  function getcartData(e) {
    jQuery.ajax({
      type: "GET",
      url: "/cart.js",
      success: function (data) {
        var items = [];

        var obj = JSON.parse(data);
        itemssubtotalprice = obj.items_subtotal_price / 100;
        totalpricecart = obj.total_price / 100;
        item_count = obj.item_count;
        items = obj.items;

        var newArr = jQuery.map(items, function (val, index) {
          return {
            final_line_price: val.final_line_price / 100,
            id: val.id,
            url: val.url,
            image: val.image,
            product_title: val.product_title,
            quantity: val.quantity,
          };
        });

        var newArrimg = jQuery.map(items, function (val, index) {
          return {
            id: val.id,
            image: val.image,
          };
        });

        var cartHTML = (cartcount = "");
        $("#CISubtotal").text("₹" + itemssubtotalprice);
        $("#CITotal").text("₹" + totalpricecart);
        //console.log(totalpricecart);
        //$('#CISubtotal').text('₹'+itemssubtotalprice);

        newArr.forEach(function (e) {
          count++;
          cartHTML +=
            '<tr class="cart-item ci-cart-items" id="CartItem-' +
            count +
            '" data-price="' +
            e.final_line_price +
            '" data-title="' +
            e.product_title +
            '" data-quantity="' +
            e.quantity +
            '" data-variantid="' +
            e.id +
            '"><td class="cart-item__media"><a href="' +
            e.url +
            '" class="cart-item__link" aria-hidden="true" tabindex="-1"></a><img class="cart-item__image" src="' +
            e.image +
            '" alt="" loading="lazy" width="150" height="220"></td><td class="cart-item__details"><lable class="cart-item__name h4 break">' +
            e.product_title +
            '</lable></td><td class="cart-item__quantity"><span class="hidden qtytext">Qty: </span>' +
            e.quantity +
            '<span class="ctotal hidden">₹' +
            e.final_line_price +
            '</span></td><td class="cart-item__totals right small-hide"><div class="cart-item__price-wrapper"><span class="price price--end"><span>₹</span>' +
            e.final_line_price +
            "</span></div></td></tr>";
        });

        cartcount += '<span class="cartcount">' + item_count + "</span>";
        $("#cipaymodel #main-cart-items tbody").html(cartHTML);
        $("#cipaymodel h1.title.title--primary span").html(cartcount);
      },
      error: function (error) {
        console.log("checkouts >>>>", error);
      },
    });
  }

  $("#CICheckout").on("click", function (e) {
    $("#CICheckout .spinner").show();
    getcartData();

    setTimeout(function () {
      $("#cipaymodel").modal("show");
      $("#CICheckout .spinner").hide();
    }, 1200);

    if (meta.page.customerId !== undefined) {
      customerdetails(e);
    }

    var input = document.getElementById("autocomplete");
    var autocomplete = new google.maps.places.Autocomplete(input);

    initAutocomplete();
    //fillInAddress();
    geolocate();

    /*for update CICheckout API*/
    $("#ContactInfo").show();
    $("#ShippingInfo").hide();
    $(".spinner").removeClass("show");
    $(".discalimer-txt").text("");

    $(".appliedcode").empty();
    $(".CIdiscountrow").hide();
    $("#ciinputdiscount").val("");
    $("#cicheckout_submit").removeAttr("disabled");

    $("#ciinputdiscount, .applydiscount").show();

    //$('#CISubtotal').text("Continue in next step");
    $("#CIShipping").text("Continue in next step");
    $("#CITax").text("Continue in next step");
    //$('#CITotal').text("Continue in next step");

    document.cookie =
      "applied_discount" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    document.cookie =
      "savediscountdata" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    $(".CIdiscountrow .discname").text(" ");
    $(".CIdiscountrow .total-line__price .cipricedis").text(
      "Continue in next step"
    );
    $("#ratesTable .cicodenameth").html(
      '<span  class="sdiscnt">Discount</span>'
    );
  });

  /*Cookie for contact info*/
  $("#inputSaveData").on("click", function (e) {
    if ($("#inputSaveData:checked").length == $("#inputSaveData").length) {
      var Country = $("#country").val();
      var FName = $("#inputFName").val();
      var LName = $("#inputLName").val();
      var Address = $("#inputAddress").val();
      var Apt = $("#inputApartment").val();
      var City = $("#locality").val();
      var State = $("#administrative_area_level_1").val();
      var Pin = $("#postal_code").val();
      var Email = $("#inputEmail").val();
      var province_code = $("#inputState option:selected").attr("datavalue");
      var country_code = $("#inputCountry option:selected").attr("datavalue");

      var re = /^(([a-zA-Z0-9]+)|([a-zA-Z0-9]+((?:\_[a-zA-Z0-9]+)|(?:\.[a-zA-Z0-9]+))*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?)$)/;
      var a = /^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/;

      if (re.test(Email)) {
        var cookieinfojson = JSON.stringify({
          Country: Country,
          FName: FName,
          LName: LName,
          Address: Address,
          Apartment: Apt,
          City: City,
          State: State,
          Pin: Pin,
          Email: Email,
          Phone: null,
          province_code: province_code,
          country_code: country_code,
        });
      } else if (a.test(Email)) {
        var cookieinfojson = JSON.stringify({
          Country: Country,
          FName: FName,
          LName: LName,
          Address: Address,
          Apartment: Apt,
          City: City,
          State: State,
          Pin: Pin,
          Email: null,
          Phone: Email,
          province_code: province_code,
          country_code: country_code,
        });
      }

      setCookie("saveinfo", cookieinfojson, 30);
    } else {
      document.cookie = "saveinfo" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    }
  });

  $("#Savebilladres").on("click", function (e) {
    if ($("#Savebilladres:checked").length == $("#Savebilladres").length) {
      Contact = $("#cipaymodel #contact").text();
      billCountry = $("#billCountry option:selected").val();
      billFName = $("#billFName").val();
      billLName = $("#billLName").val();
      billname = billFName + " " + billLName;
      billAddress = $("#billAddress").val();
      billApartment = $("#billApartment").val();
      billCity = $("#billCity").val();
      billState = $("#billState").val();
      billPin = $("#billPin").val();

      province_code = $("#billState option:selected").attr("datavalue");
      country_code = $("#billCountry option:selected").attr("datavalue");

      if (
        !billCountry ||
        !Contact ||
        !billFName ||
        !billLName ||
        !billAddress ||
        !billCity ||
        !billState ||
        !billPin ||
        billState == "State"
      ) {
        alert("Please fill required fields");
      } else {
        var billing_addresschk = JSON.stringify({
          first_name: billFName,
          address1: billAddress,
          phone: Contact,
          city: billCity,
          zip: billPin,
          province: billState,
          country: billCountry,
          last_name: billLName,
          company: "",
          name: billname,
          country_code: country_code,
          province_code: province_code,
        });
        setCookie("billing_addresschk", billing_addresschk, 30);
        $("#createOrderbtn").prop("disabled", false);
      }
    } else {
      document.cookie =
        "billing_addresschk" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
      console.log("t133");
    }

    //}else{
    // document.cookie = 'savebillinginfo' + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
    // }
  });

  var saveCookie = getCookie("saveinfo");

  if (saveCookie || !saveCookie == "") {
    var jsonObj = JSON.parse(saveCookie);

    $("#country").val(jsonObj.Country);
    $("#inputFName").val(jsonObj.FName);
    $("#inputLName").val(jsonObj.LName);
    $("#inputAddress").val(jsonObj.Address);
    $("#inputApartment").val(jsonObj.Apartment);
    $("#locality").val(jsonObj.City);
    $("#administrative_area_level_1").val(jsonObj.State);
    $("#postal_code").val(jsonObj.Pin);

    if (jsonObj.Email == null) {
      $("#inputEmail").val(jsonObj.Phone);
    } else {
      $("#inputEmail").val(jsonObj.Email);
    }

    $("#cipaymodel #inputSaveData").prop("checked", true);
  }

  var billing_addresschk = getCookie("billing_addresschk");
  if (billing_addresschk || !billing_addresschk == "") {
    $("#cipaymodel #Savebilladres").prop("checked", true);
    var billjsonObj = JSON.parse(billing_addresschk);
    // console.log("billjsonObj",billjsonObj);

    billname = billjsonObj.name;
    Contact = billjsonObj.phone;
    billFName = $("#billFName").val(billjsonObj.first_name);
    billLName = $("#billLName").val(billjsonObj.last_name);
    billCountry = $("#billCountry option:selected").val(billjsonObj.country);
    billAddress = $("#billAddress").val(billjsonObj.address1);
    billCity = $("#billCity").val(billjsonObj.city);
    billState = $("#billState").val(billjsonObj.province);
    billPin = $("#billPin").val(billjsonObj.zip);
    // billApartment = $("#billApartment").val(billjsonObj.Country);
  }

  /**
   * Initiate Payment Gateway
   */

  //  $("#cout_different_billing_address_true").on('click', function(e){
  //   console.log("w1");
  //   if($('#cout_different_billing_address_true').is(':checked') && $('#cout_different_billing_address_true').val() == 'Yes') {
  //     $('#cipaymodel #createOrderbtn').removeAttr('id');
  //     console.log("w2");
  //   }

  //  });

  $("#ContinuePayment").on("click", function (e) {
    e.preventDefault();
    $("#model-addbill, #ContinueOrder, .ship_retrn").show();
    $(
      "#cipaymodel .section.section--shipping-method, #ContinuePayment, .cart_retrn"
    ).hide();
    $(".ship_retrn").removeClass("hidden");
    $("#createOrderbtn").show();
    $(".discalimer-txt").text("We will redirect you to cipay payment gateway");

    /*show and hide billing address form*/
    if (
      $("#cout_different_billing_address_true").is(":checked") &&
      $("#cout_different_billing_address_true").val() == "Yes"
    ) {
      $("#section--billing-address__different").show();
    } else {
      $("#section--billing-address__different").hide();
      document.cookie =
        "billing_addresschk" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
      console.log("t1");
    }
    /* end */

    /*For breadcrumb*/
    $(
      ".custom-bd li.breadcrumb__item.breadcrumb__item.hidden.paymenetbd, .shippingbd span.arrow-bd.hidden"
    ).removeClass("hidden");
    /*end*/
    //  getcartData(e);
  });

  /**
   * Getting  customer details through customerId
   */
  if (meta.page.customerId !== undefined) {
    document.cookie = "saveinfo" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";

    function customerdetails(e) {
      e.preventDefault();
      document.cookie =
        "savecustomerdetails" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";

      var customerId = meta.page.customerId;
      jQuery.ajax({
        type: "POST",
        url: domainName + "/customers",
        dataType: "json",
        data: JSON.stringify({ customer_id: customerId }),
        contentType: "application/json",
        success: function (data) {
          var customerobject = data.body.customer;
          var defaultaddress = customerobject.default_address;

          email = customerobject.email;
          phone = customerobject.phone;
          first_name = customerobject.first_name;
          last_name = customerobject.last_name;

          $("#col-savedata").empty();

          if (defaultaddress) {
            $("#inputFName").val(defaultaddress.first_name);
            $("#inputLName").val(defaultaddress.last_name);
            $("#country").val(defaultaddress.country_name);
            $("#inputAddress").val(defaultaddress.address1);
            $("#inputApartment").val(defaultaddress.Apartment);
            $("#locality").val(defaultaddress.city);
            $("#administrative_area_level_1").val(defaultaddress.province);
            $("#postal_code").val(defaultaddress.zip);

            phone = defaultaddress.phone;
            if (phone !== null) {
              $("#inputEmail").val(defaultaddress.phone);
            } else {
              $("#inputEmail").val(email);
            }
          } else {
            $("#inputEmail").val(email);
            $("#inputFName").val(first_name);
            $("#inputLName").val(last_name);
          }

          if (data.body) {
            setCookie(
              "savecustomerdetails",
              JSON.stringify(data.body.customer),
              30
            );
          }
        },
        error: function (error) {
          console.log("checkouts >>>>", error);
        },
      });
    }

    var getcustomerdetails = getCookie("savecustomerdetails");
    if (getcustomerdetails) {
      var Email = (email = phone = "");
      $("#col-savedata").empty();
      var customerobj = JSON.parse(getcustomerdetails);
      var default_address = customerobj.default_address;

      email = customerobj.email;
      phone = customerobj.phone;
      first_name = default_address.first_name;
      last_name = default_address.last_name;
      $("#inputFName").val(first_name);
      $("#inputLName").val(last_name);

      //var phonenum = default_address.phone.replaceAll(" ","").slice(-10);
    }
  } else {
    setCookie("savecustomerdetails", "", 30);
    document.cookie =
      "savecustomerdetails" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
  }
  /**
   * Create order
   */
  function createOrder(e) {
    e.preventDefault();

    /*loader on CIPay button*/
    $(".rtnsh .spinner.loader").removeClass("show");
    $(".rtnsh").removeClass("hidden");
    $("#createOrderbtn").removeClass("load");

    var variantString = "";
    var arry = new Array();
    var tax_lines = new Array();
    var arr = new Array();
    var arrshipping = new Array();
    var arrbilling = new Array();
    var billing_address = new Array();

    var getcustomerdetails = getCookie("savecustomerdetails");
    if (getcustomerdetails) {
      var customer = JSON.parse(getcustomerdetails);
    }

    if (
      $("#cout_different_billing_address_true").is(":checked") &&
      $("#cout_different_billing_address_true").val() == "Yes"
    ) {
      $("#createOrderbtn").prop("disabled", true);
      Contact = $("#cipaymodel #contact").text();
      billCountry = $("#billCountry option:selected").val();
      billFName = $("#billFName").val();
      billLName = $("#billLName").val();
      billname = billFName + " " + billLName;
      billAddress = $("#billAddress").val();
      billApartment = $("#billApartment").val();
      billCity = $("#billCity").val();
      billState = $("#billState").val();
      billPin = $("#billPin").val();

      province_code = $("#billState option:selected").attr("datavalue");
      country_code = $("#billCountry option:selected").attr("datavalue");

      if (
        !billCountry ||
        !Contact ||
        !billFName ||
        !billLName ||
        !billAddress ||
        !billCity ||
        !billState ||
        !billPin ||
        billState == "State"
      ) {
        alert("Please fill required fields");
      } else {
        var billing_addressvar = JSON.stringify({
          first_name: billFName,
          address1: billAddress,
          phone: Contact,
          city: billCity,
          zip: billPin,
          province: billState,
          country: billCountry,
          last_name: billLName,
          company: "",
          name: billname,
          country_code: country_code,
          province_code: province_code,
        });

        setCookie("billing_addressvar", billing_addressvar, 30);
        $("#createOrderbtn").prop("disabled", false);
      }
    } else {
      document.cookie =
        "billing_addressvar" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    }

    jQuery.ajax({
      type: "GET",
      url: "/cart.js",
      success: function (data) {
        $(".rtnsh .spinner.loader").addClass("show");
        $("#createOrderbtn").addClass("load");

        var obj = JSON.parse(data);
        items = obj.items;
        currency = obj.currency;
        items_subtotal_price = obj.items_subtotal_price / 100;

        /*for shipping address info*/
        var saveCookiejson = getCookie("saveinfo");
        if (saveCookiejson || !saveCookiejson == "") {
          var jsonObjck = JSON.parse(saveCookiejson);

          var country = jsonObjck.Country;
          var first_name = jsonObjck.FName;
          var last_name = jsonObjck.LName;
          var address1 = jsonObjck.Address;
          var name = first_name + " " + last_name;
          var Apartment = jsonObjck.Apartment;
          var city = jsonObjck.City;
          var province = jsonObjck.State;
          var zip = jsonObjck.Pin;
          var Email = jsonObjck.Email;
          var Phone = jsonObjck.Phone;
          // if(jsonObj.Email == null){
          //  $("#inputEmail").val(jsonObj.Phone);

          // }else{
          //   $("#inputEmail").val(jsonObj.Email);
          // }
          // console.log("address2",jsonObjck.Address);
          // var shipping_address = {email: Email, zip: zip, city: city, name: name, phone: "", country: country, address1: "",address2: address2, province: province, last_name: last_name, first_name: first_name};
        } else {
          var Email = "";

          var country = $("#country").val();
          var first_name = $("#inputFName").val();
          var last_name = $("#inputLName").val();
          var address1 = $("#inputAddress").val();
          var name = first_name + " " + last_name;
          var Apartment = $("#inputApartment").val();
          var city = $("#locality").val();
          var province = $("#administrative_area_level_1").val();
          var zip = $("#postal_code").val();
          Email = $("#inputEmail").val();
          var province_code = $("#inputState option:selected").attr(
            "datavalue"
          );
          var country_code = $("#inputCountry option:selected").attr(
            "datavalue"
          );

          if (Email == null) {
            var Phone = $("#inputEmail").val();
          } else {
            var Email = $("#inputEmail").val();
          }
        }

        /*for billing address info*/
        var billing_addressvar = getCookie("billing_addressvar");
        // var billing_addresschk = getCookie("billing_addresschk");

        if (billing_addressvar || !billing_addressvar == "") {
          var jsonbill = JSON.parse(billing_addressvar);
          billing_address.push(jsonbill);
          $("#createOrderbtn").prop("disabled", false);
        }

        $.each(items, function (index, value) {
          title = value.title;
          price = value.price / 100;
          image = value.image;
          url = value.url;
          quantity = value.quantity;
          final_line_price = value.final_line_price / 100;
          variant_id = value.variant_id;
          arr.push({
            variant_id: variant_id,
            title: title,
            price: price,
            quantity: quantity,
            final_price: final_line_price,
            image: image,
            url: url,
          });
        });

        shippingIndex = $("input[name=shippingmethode]:checked").attr(
          "data-index"
        );
        var selectedShipping = shippingArray[shippingIndex];

        var subtotal_price = selectedShipping.checkout.subtotal_price;
        var total_price = selectedShipping.checkout.total_price;
        var total_tax = selectedShipping.checkout.total_tax;
        //var tax_rate = selectedShipping.checkout.tax_rate;
        var shippingprice = selectedShipping.price;
        var title = selectedShipping.title;

        /*For applied_discount GET Cookie*/
        var INvalue = $("#disc_hidden").val();
        if (INvalue.length > 0) {
          var getcookie_discount = getCookie("applied_discount");

          if (getcookie_discount || !getcookie_discount == "") {
            var jsonObjdiscount = JSON.parse(getcookie_discount);

            var disc_title = jsonObjdiscount.title;
            var disc_value = jsonObjdiscount.value;
            var disc_amount = jsonObjdiscount.amount;
            var disc_applicable = jsonObjdiscount.applicable;
            var disc_value_type = jsonObjdiscount.value_type;
            var disc_fixed_amount = jsonObjdiscount.fixed_amount;
            var application_type = jsonObjdiscount.application_type;
            var non_applicable_reason = jsonObjdiscount.non_applicable_reason;
          }
        }

        $.each(tax_linesArray, function (index, value) {
          pricetotal_tax = value.price;
          tax_rates = value.rate;
          taxtitle = value.title;
          tax_lines.push({
            price: pricetotal_tax,
            rate: tax_rates,
            title: taxtitle,
            price_set: {
              shop_money: { amount: pricetotal_tax, currency_code: currency },
              presentment_money: {
                amount: pricetotal_tax,
                currency_code: currency,
              },
            },
          });
        });

        var myJsonString = JSON.stringify(billing_address);

        var billingcountry,
          billingcountry_code,
          billingfirst_name,
          billinglast_name,
          billingaddress1,
          billingname,
          billingApartment,
          billingcity,
          billingprovince,
          billingzip,
          billingEmail,
          billingphone,
          billingcompany = " ";

        if (billing_address.length !== 0) {
          console.log("billing_address", billing_address);
          $("#createOrderbtn").prop("disabled", false);

          var billingcountry = billing_address[0].country;
          var billingcountry_code = billing_address[0].country_code;
          var billingfirst_name = billing_address[0].first_name;
          var billinglast_name = billing_address[0].last_name;
          var billingaddress1 = billing_address[0].address1;
          var billingname = billing_address[0].name;
          var billingApartment = billing_address[0].Apartment;
          var billingcity = billing_address[0].city;
          var billingprovince = billing_address[0].province;
          var billingprovince_code = billing_address[0].province_code;
          var billingzip = billing_address[0].zip;
          var billingEmail = billing_address[0].Contact;
          var billingphone = billing_address[0].phone;
          var billingcompany = billing_address[0].company;
        }

        $.ajax({
          type: "POST",
          url: domainName + "/CIOrder/",
          dataType: "json",
          contentType: "application/json",

          // data: JSON.stringify({"order":{ "id": "","cancel_reason": null,"cancelled_at": null,"cart_token": null, "financial_status": "pending", "checkout_id": null, "checkout_token": null,"currency":currency, "current_subtotal_price":items_subtotal_price, "current_subtotal_price_set":{ "shop_money":{ "amount":items_subtotal_price, "currency_code":currency }, "presentment_money":{ "amount":items_subtotal_price, "currency_code":currency }}, "current_total_duties_set":null, "current_total_price":total_price, "current_total_price_set":{ "shop_money":{ "amount":total_price, "currency_code":currency }, "presentment_money":{"amount":total_price, "currency_code":currency }}, "current_total_tax":total_tax, "current_total_tax_set":{ "shop_money":{ "amount":total_tax, "currency_code":currency}, "presentment_money":{ "amount":total_tax, "currency_code":currency }}, "note":"It is a CIPay development Test Order", "note_attributes":[], "tags":"CIPay-Development","subtotal_price": items_subtotal_price,"subtotal_price_set": {"shop_money": {"amount": items_subtotal_price,"currency_code": currency},"presentment_money": {"amount": items_subtotal_price,"currency_code": currency}},tax_lines , "total_line_items_price":subtotal_price, "total_line_items_price_set":{ "shop_money":{ "amount":subtotal_price, "currency_code":currency }, "presentment_money":{ "amount":subtotal_price, "currency_code":currency }}, "total_outstanding":"0.00", "total_price":total_price, "total_price_set":{ "shop_money":{ "amount":total_price, "currency_code":currency}, "presentment_money":{ "amount":total_price, "currency_code":currency}}, "total_price_usd":"", "total_shipping_price_set":{ "shop_money":{ "amount":shippingprice, "currency_code":"INR" }, "presentment_money":{ "amount":shippingprice, "currency_code":"INR" }}, "total_tax": total_tax, "total_tax_set":{ "shop_money":{ "amount":total_tax, "currency_code": currency }, "presentment_money":{ "amount":total_tax, "currency_code":"INR" }} , "line_items":arr,"shipping_address": {"first_name":first_name, "zip":zip,"last_name":last_name,"address1":address1,"phone":Phone, "email":Email, "name":name}, "current_total_discounts":disc_amount, "current_total_discounts_set":{"shop_money":{"amount":disc_amount,"currency_code":"INR"},"presentment_money":{"amount":disc_amount,"currency_code":"INR"}}, "discount_codes":[{"code":disc_title,"amount":disc_amount,"type":disc_fixed_amount}], "total_discounts":disc_amount,"total_discounts_set":{"shop_money":{"amount":disc_amount,"currency_code":"INR"},"presentment_money":{"amount":disc_amount,"currency_code":"INR"}}, "discount_applications":[{"target_type":"","type":disc_fixed_amount,"value":disc_amount,"value_type":disc_fixed_amount,"allocation_method":"","target_selection":"","title":disc_title}], "shipping_lines": [{"code": "","price": shippingprice,"title": title,"source": "","price_set": {"shop_money": {"amount": shippingprice,"currency_code": currency},"presentment_money": {"amount": shippingprice,"currency_code": currency}}}], customer,  "billing_address":{"first_name":billingfirst_name,"address1":billingaddress1,"phone":billingphone,"city":billingcity,"zip":billingzip,"province":billingprovince,"country":billingcountry,"last_name":billinglast_name,"company":billingcompany,"name":billingname,"country_code":billingcountry_code,"province_code":billingprovince_code}}}),
          data: JSON.stringify({
            order: {
              id: "",
              cancel_reason: null,
              cancelled_at: null,
              cart_token: null,
              financial_status: "pending",
              checkout_id: null,
              checkout_token: null,
              currency: currency,
              current_subtotal_price: items_subtotal_price,
              current_subtotal_price_set: {
                shop_money: {
                  amount: items_subtotal_price,
                  currency_code: currency,
                },
                presentment_money: {
                  amount: items_subtotal_price,
                  currency_code: currency,
                },
              },
              current_total_duties_set: null,
              current_total_price: total_price,
              current_total_price_set: {
                shop_money: { amount: total_price, currency_code: currency },
                presentment_money: {
                  amount: total_price,
                  currency_code: currency,
                },
              },
              current_total_tax: total_tax,
              current_total_tax_set: {
                shop_money: { amount: total_tax, currency_code: currency },
                presentment_money: {
                  amount: total_tax,
                  currency_code: currency,
                },
              },
              note: "It is a CIPay development Test Order",
              note_attributes: [],
              tags: "CIPay-Development",
              subtotal_price: items_subtotal_price,
              subtotal_price_set: {
                shop_money: {
                  amount: items_subtotal_price,
                  currency_code: currency,
                },
                presentment_money: {
                  amount: items_subtotal_price,
                  currency_code: currency,
                },
              },
              tax_lines,
              total_line_items_price: subtotal_price,
              total_line_items_price_set: {
                shop_money: { amount: subtotal_price, currency_code: currency },
                presentment_money: {
                  amount: subtotal_price,
                  currency_code: currency,
                },
              },
              total_outstanding: "0.00",
              total_price: total_price,
              total_price_set: {
                shop_money: { amount: total_price, currency_code: currency },
                presentment_money: {
                  amount: total_price,
                  currency_code: currency,
                },
              },
              total_price_usd: "",
              total_shipping_price_set: {
                shop_money: { amount: shippingprice, currency_code: "INR" },
                presentment_money: {
                  amount: shippingprice,
                  currency_code: "INR",
                },
              },
              total_tax: total_tax,
              total_tax_set: {
                shop_money: { amount: total_tax, currency_code: currency },
                presentment_money: { amount: total_tax, currency_code: "INR" },
              },
              line_items: arr,
              shipping_address: {
                first_name: first_name,
                city: city,
                zip: zip,
                province: province,
                country: country,
                last_name: last_name,
                address1: address1,
                phone: Phone,
                email: Email,
                name: name,
                country_code: country_code,
                province_code: province_code,
              },
              current_total_discounts: disc_amount,
              current_total_discounts_set: {
                shop_money: { amount: disc_amount, currency_code: "INR" },
                presentment_money: {
                  amount: disc_amount,
                  currency_code: "INR",
                },
              },
              discount_codes: [
                {
                  code: disc_title,
                  amount: disc_amount,
                  type: disc_fixed_amount,
                },
              ],
              total_discounts: disc_amount,
              total_discounts_set: {
                shop_money: { amount: disc_amount, currency_code: "INR" },
                presentment_money: {
                  amount: disc_amount,
                  currency_code: "INR",
                },
              },
              discount_applications: [
                {
                  target_type: "",
                  type: disc_fixed_amount,
                  value: disc_amount,
                  value_type: disc_fixed_amount,
                  allocation_method: "",
                  target_selection: "",
                  title: disc_title,
                },
              ],
              shipping_lines: [
                {
                  code: "",
                  price: shippingprice,
                  title: title,
                  source: "",
                  price_set: {
                    shop_money: {
                      amount: shippingprice,
                      currency_code: currency,
                    },
                    presentment_money: {
                      amount: shippingprice,
                      currency_code: currency,
                    },
                  },
                },
              ],
              customer,
              billing_address: {
                first_name: billingfirst_name,
                address1: billingaddress1,
                phone: billingphone,
                city: billingcity,
                zip: billingzip,
                province: billingprovince,
                country: billingcountry,
                last_name: billinglast_name,
                company: billingcompany,
                name: billingname,
                country_code: billingcountry_code,
                province_code: billingprovince_code,
              },
            },
          }),
          success: function (data) {
            var payload =
              "currencyType=INR|orderReference=" +
              data.body.order.id +
              "|txnAmount=" +
              total_price +
              "";
            var checkSumHash = sha256.hmac(
              "xiv1ibz7udg2hmg28f4pz2wphdegi84r9",
              payload
            );

            torderReference = $("#orderReference").val(data.body.order.id);
            var torderReferenceval = torderReference.val();

            $("#txnAmount").val(data.body.order.total_price);
            $("#checkSum").val(checkSumHash);

            var order_status_url = data.body.order.order_status_url;
            var orderid = data.body.order.id;

            //if(!orderid == null){
            setCookie("saveorderid", orderid, 30);
            //}

            /*laoder */
            // $('#cipaymodel .modal-dialog.modal-lg').html('<div class="ciloadernew"></div>');
            var getrefsucess = getCookie("saverefsucess");
            var getreffailed = getCookie("savereffailedsavereffailed");

            setInterval(function () {
              if (getrefsucess || getreffailed) {
                console.log("getrefsucess");
                console.log("getreffailed");
                window.close();
              }
            }, 4000);

            //window.location = order_status_url;
          },
          error: function (error) {
            console.log("checkouts >>>>", error);
          },
        });
      },
      error: function (error) {
        console.log("checkouts >>>>", error);
      },
    });
  }

  /**
   * Billing data display
   *
   */
  $("#createOrderbtn").on("click", function (e) {
    createOrder(e);

    setTimeout(function () {
      $("#ContinueOrder").trigger("click");
    }, 7000);
  });

  /*
   **cart empty function
   */
  function CIemptycart() {
    $.ajax({
      type: "POST",
      url: "/cart/clear.js",
      success: function () {
        //console.log('cleared the cart!');
      },
      dataType: "json",
    });
  }

  /*new chk token*/
  var savechktoken = getCookie("chkouttoken");
  var getorderid = getCookie("saveorderid");

  /*
   **Retrive Orderdetails through orderid for Succes and Failure CIModel, Transaction details etc after successfull redirection
   */
  function retriveorderdetails() {
    var getorderid = getCookie("saveorderid");
    // var getorderid = "4657810866425";

    //if(!getorderid == ""){
    // console.log("getorderid",getorderid);
    jQuery.ajax({
      type: "post",
      url: domainName + "/retrievesorder/" + getorderid,
      success: function (data) {
        var name = (address1 = company = city = zip = province_code = country = fulladdress =
          "");

        var retr_total_price = data.body.order.total_price;
        var retr_orderid = data.body.order.id;
        var shipping_address = data.body.order.shipping_address;
        var billing_address = data.body.order.billing_address;
        var phone = shipping_address.phone;
        if (phone == null || phone == "NAN") {
          var phone = " ";
        } else {
          var phone = "+91 " + phone;
        }

        if (company == null || company == "NAN") {
          company = " ";
        }

        name = shipping_address.name;
        address1 = shipping_address.address1;
        company = shipping_address.company;
        city = shipping_address.city;
        zip = shipping_address.zip;
        province_code = shipping_address.province_code;
        country = shipping_address.country;

        if (billing_address) {
          $(".ship-head").text("Billing Details");
          name = billing_address.name;
          address1 = billing_address.address1;
          company = billing_address.company;
          city = billing_address.city;
          zip = billing_address.zip;
          province_code = billing_address.province_code;
          country = billing_address.country;
        }

        fulladdress = address1 + +city + +province_code + +zip + +country;
        var total_price = data.body.order.total_price;
        var items = data.body.order.line_items;
        //console.log("items",items);

        var newArr = jQuery.map(items, function (val, index) {
          return {
            title: val.title,
            quantity: val.quantity,
            price: val.price * val.quantity,
            variant_id: val.variant_id,
            product_id: val.product_id,
          };
        });

        var cartHTML = (cartcount = imgHTML = proimg = pro_id = "");
        var count = 0;

        newArr.forEach(function (e) {
          productImages = [];

          /**
           * Getting Ordered Product images through Product Ids
           */
          $.ajax({
            type: "GET",
            dataType: "json",
            url:
              "https://cipaytest.myshopify.com/admin/products/" +
              e.product_id +
              "/images.json",
            success: function (data) {
              proimg = data.images[0].src;
              // console.log("imagearray",proimg);
              cartHTML +=
                '<tr class="cart-item ci-cart-items" id="CartItem-' +
                count +
                '" data-price="' +
                e.price +
                '" data-title="' +
                e.title +
                '" data-quantity="' +
                e.quantity +
                '" data-variantid="' +
                e.variant_id +
                '" data-productid="' +
                e.product_id +
                '"><td class="cart-item__media"><a href="/products/example-pants?variant=' +
                e.variant_id +
                '" class="cart-item__link" aria-hidden="true" tabindex="-1"></a><img class="cart-item__image" src="' +
                data.images[0].src +
                '" alt="" loading="lazy" width="250" height="250"></td><td class="cart-item__details"><lable class="cart-item__name h4 break">' +
                e.title +
                '</lable><lable class="cart-item__name h4 break qty">Qty: ' +
                e.quantity +
                '</lable></td><td class="cart-item__totals"><div class="cart-item__price-wrapper"><span class="price">Rs. ' +
                e.price +
                "</span></div></td></tr>";

              $("#ordermodal .modal-body tbody").html(cartHTML);
              count++;
            },
          });
        });

        $("#ordermodal .shipdetails .uname").text(name);
        $("#ordermodal .shipdetails .shipadres").text(address1 + " " + zip);
        $("#ordermodal .shipdetails .shipphone").text(phone);
        $("#ordermodal .shiptotal .shiptotalamnt").text(total_price);

        var getcheckoutid = getCookie("chkouttoken");

        jQuery.ajax({
          type: "POST",
          url: domainName + "/gettingpaymentresponse",
          dataType: "json",
          data: JSON.stringify({ checkout_id: getorderid }),
          contentType: "application/json",
          success: function (data) {
            if (data.payment_status == "SUCCESS") {
              console.log("gettingpaymentresponse", data.payment_status);
              /**
               * Transaction through CI payment gateway
               */

              $.ajax({
                type: "POST",
                url: domainName + "/CITransaction",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify({
                  transaction: {
                    order_id: getorderid,
                    currency: "INR",
                    amount: " ",
                    kind: "sale",
                    source: "external",
                    parent_id: null,
                    gateway: "CIPay Gateway",
                    message: "CIPay Gateway",
                  },
                }),

                success: function (data) {
                  var orderid = data.body.order.id;
                },
                error: function (error) {
                  console.log("checkouts >>>>", error);
                },
              });
              /*end*/
            }
          },
          error: function (error) {
            console.log("checkouts >>>>", error);
          },
        });

        /**
         * Delete orderid cookie when sucess url hit after 2.5sec to avoid multiple amount add on "Paid by customer" in order details
         */
        setTimeout(function () {
          document.cookie =
            "saveorderid" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
          document.cookie =
            "savecustomerdetails" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
        }, 3500);
      },
      error: function (error) {
        console.log("checkouts >>>>", error);
      },
    });
    // }
  }

  /*
   **Trigger Succes or Failure CIModel
   */
  $("#rorder").on("click", function (e) {
    //retriveChekout();
    e.preventDefault();
    //orderchktoken(e);
  });

  var success_url = "https://cipaytest.myshopify.com/cart?ref=success";
  var failed_url = "https://cipaytest.myshopify.com/cart?ref=failed";
  var getorderid = getCookie("saveorderid");

  if (window.location.href == success_url) {
    //Success
    setCookie("saverefsucess", "refsucess", 30);
    $("body").children().addClass("ciloadernew");

    retriveorderdetails();
    $(".paydetails").html(
      '<div class="paymentdetail border-b"><b class="f-19 payhead dark-text">Payment Details</b><div class="paytext">Ordered through CIPay</div></div>'
    );
    setTimeout(function () {
      if (getorderid) {
        $("#reordrbtn").click();
      } else {
        window.location.href = "/cart";
      }

      $("body").children().removeClass("ciloadernew");
      $("#ordermodal .rightar").removeClass("failed");

      CIemptycart();
      document.cookie =
        "saverefsucess" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    }, 2000);
  } else if (window.location.href == failed_url) {
    //Failed
    setCookie("savereffailed", "reffailed", 30);

    $("body").children().addClass("ciloadernew");

    setTimeout(function () {
      if (getorderid) {
        $("#reordrbtn").click();
      } else {
        window.location.href = "/cart";
      }
      $("body").children().removeClass("ciloadernew");

      $("h5#ordermodalLabel").text("Order Failed");
      $("#ordermodal .rightar").addClass("failed");
      $("#ordermodal .rightar").html(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 416.979 416.979" style="enable-background:new 0 0 416.979 416.979;" xml:space="preserve"><g><path d="M355.914,61.065c-81.42-81.42-213.428-81.42-294.849,0s-81.421,213.427,0,294.849c81.42,81.42,213.428,81.42,294.849,0   C437.334,274.492,437.334,142.485,355.914,61.065z M312.525,258.763c4.454,4.454,4.454,11.675,0,16.129l-37.632,37.632   c-4.454,4.454-11.675,4.453-16.13,0l-50.273-50.275l-50.275,50.275c-4.453,4.455-11.674,4.453-16.128,0l-37.632-37.632   c-4.454-4.454-4.453-11.674,0-16.127l50.275-50.276l-50.275-50.275c-4.453-4.454-4.453-11.675,0-16.128l37.633-37.632   c4.454-4.454,11.675-4.454,16.127,0l50.275,50.275l50.274-50.275c4.454-4.454,11.675-4.454,16.129,0l37.632,37.632   c4.453,4.454,4.454,11.675,0,16.128l-50.275,50.275L312.525,258.763z"></path></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>'
      );

      retriveorderdetails();
      document.cookie =
        "savereffailed" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
    }, 1500);
  }

  /*Order delete on popup button close*/
  function deletepaymentrecord(e) {
    e.preventDefault();
    jQuery.ajax({
      type: "POST",
      url: domainName + "/deletepaymentrecord",
      dataType: "json",
      data: JSON.stringify({ checkout_id: getcheckoutid }),
      contentType: "application/json",
      success: function (data) {
        console.log("deletepaymentrecord", data);

        document.cookie =
          "saverefsucess" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
        document.cookie =
          "savereffailed" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
        document.cookie =
          "saveorderid" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
        document.cookie =
          "chkouttoken" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
        document.cookie =
          "savecustomerdetails" + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";

        $("#ordermodal .modal-header,#ordermodal .modal-body").empty();
        $("#ordermodal .modal-header,.rightar").hide();
        //$('#ordermodal .modal-body').html('<a href="/collections/all" class="button cont-shop">Continue shopping</a>');
      },
      error: function (error) {
        console.log("checkouts >>>>", error);
      },
    });
  }
  $("#ordermodal").on("click", function (e) {
    //retriveChekout();
    e.preventDefault();
    deletepaymentrecord(e);
  });

  /***
   * For Mobile View Order Accordian
   *
   **/

  //  $('#ciorderdetails tr').each(function(index, tr) {
  //   console.log(tr,"tr");
  //   $(tr).find('td').each (function (index, td) {
  //     console.log("td",td);
  //   });
  // });

  if ($(window).innerWidth() <= 767) {
    // $('.first-section table.table.calctable').empty();
    // $('#mobile-subtotal').removeClass('hidden');
    // $('#mobile-subtotal table').html('<tbody id="ratesTable"><tr class="spinner loader"></tr><tr><th>Subtotal</th><td id="CISubtotal">Continue in next step</td></tr><tr><tr class="total-line total-line--reduction CIdiscountrow" data-discount-type="fixed_amount" style="display: none;"><th class="total-line__name cicodenameth" scope="row"><span class="sdiscnt">Discount</span><span class="reduction-code"><div class="reduction-code__textdiv"></div></span></th><td class="total-line__price"><span class="cipricedis order-summary__emphasis skeleton-while-loading" aria-hidden="true" data-checkout-discount-amount-target="">Calculated at next step</span><span class="cipricedis2 visually-hidden skeleton-while-loading-sr">₹ off total order price</span></td></tr><tr><th>Shipping</th><td id="CIShipping">Calculated at next step</td></tr><tr><th>Taxes (estimated)</th><td id="CITax">Calculated at next step</td></tr><tr><th>Total</th><td id="CITotal">Calculated at next step</td></tbody>');

    $(document).on(
      "click",
      "#ciorderdetails button.accordion-button",
      function () {
        $("#ciorderdetails button.accordion-button").text("Hide order summary");
        $("#ciorderdetails button.accordion-button.collapsed").text(
          "Show order summary"
        );
      }
    );

    $("#ciorderdetails .accordion-header").removeClass("hidden");
  }
});
