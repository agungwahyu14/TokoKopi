const { Order, OrderItem, Product, User, Category, sequelize } = require('../models');
const { snap } = require('../config/midtrans');
const crypto = require('crypto');

const createPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ 
            model: Product, 
            as: 'product',
            include: [{ model: Category, as: 'categories', attributes: ['name'], through: { attributes: [] } }]
          }]
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const user = order.user;

    const itemDetails = order.items.map(item => {
      const productCategory = item.product.categories && item.product.categories.length > 0 
        ? item.product.categories[0].name 
        : 'General';

      return {
        id: item.productId,
        price: Math.round(item.unitPrice),
        quantity: item.quantity,
        name: item.product.name,
        category: productCategory,
      };
    });

    // Tambahkan Ongkir sebagai item jika ada
    if (order.shippingCost > 0) {
      itemDetails.push({
        id: 'SHIPPING',
        price: Math.round(order.shippingCost),
        quantity: 1,
        name: `Ongkir (${order.courierCode?.toUpperCase() || 'Kurir'})`,
      });
    }

    // Tambahkan Pajak sebagai item jika ada
    if (order.tax > 0) {
      itemDetails.push({
        id: 'TAX',
        price: Math.round(order.tax),
        quantity: 1,
        name: 'Pajak (PPN 11%)',
      });
    }

    // Tambahkan Diskon sebagai item (harga negatif) jika ada
    if (order.discount > 0) {
      itemDetails.push({
        id: 'DISCOUNT',
        price: -Math.round(order.discount),
        quantity: 1,
        name: 'Diskon/Promo',
      });
    }

    // Validasi: gross_amount harus sama dengan sum of item_details
    const itemTotal = itemDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grossAmount = Math.round(order.finalAmount);

    console.log(`[Payment] gross_amount: ${grossAmount}, item_total: ${itemTotal}`);
    if (Math.abs(itemTotal - grossAmount) > 1) {
      console.warn(`[Payment] ⚠️ Amount mismatch! Adjusting gross_amount to item_total: ${itemTotal}`);
    }

    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: itemTotal, // Gunakan itemTotal agar selalu cocok
      },
      customer_details: {
        first_name: user.name,
        phone: user.phone,
        email: user.email || `${user.phone}@tokokopijaya.com`,
      },
      item_details: itemDetails,
      enabled_payments: [
        'other_qris',
        'bca_va',
        'bni_va',
        'bri_va',
        'mandiri_bill',
        'alfamart',
        'indomaret',
      ],
      expiry: {
        unit: 'minutes',
        duration: 30,
      },
      callbacks: {
        finish: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/finish`,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    
    order.paymentToken = transaction.token;
    order.status = 'pending_payment';
    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    // Log detail error dari Midtrans untuk debugging
    const midtransError = error?.ApiResponse || error?.message;
    console.error('Midtrans Error Full:', JSON.stringify(error?.ApiResponse || error, null, 2));
    return res.status(500).json({ 
      success: false, 
      message: error?.ApiResponse?.error_messages?.[0] || error.message,
      detail: error?.ApiResponse
    });
  }
};

const handleWebhook = async (req, res) => {
  const {
    transaction_status,
    order_id,
    signature_key,
    gross_amount,
    status_code
  } = req.body;

  console.log('--- Incoming Webhook ---');
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  try {
    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    // Midtrans signature key uses: order_id + status_code + gross_amount + ServerKey
    // gross_amount must be exactly as received from Midtrans (often includes .00)
    const signaturePayload = order_id + status_code + gross_amount + serverKey;
    const hashed = crypto
      .createHash('sha512')
      .update(signaturePayload)
      .digest('hex');

    console.log('--- Signature Verification ---');
    console.log('Payload for Hash:', signaturePayload);
    console.log('Calculated Hash:', hashed);
    console.log('Received Signature:', signature_key);

    if (hashed !== signature_key) {
      console.error('❌ Signature mismatch! Please check your MIDTRANS_SERVER_KEY in .env');
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    const order = await Order.findOne({
      where: { orderNumber: order_id },
      include: [{ model: User, as: 'user' }]
    });

    if (!order) {
      console.error(`❌ Order with ID ${order_id} not found`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`Updating order ${order_id} status to: ${transaction_status}`);

    // Update VA details if present in payload (Bank Transfer / VA)
    if (req.body.va_numbers && req.body.va_numbers.length > 0) {
      order.vaNumber = req.body.va_numbers[0].va_number;
      order.bankName = req.body.va_numbers[0].bank;
    } else if (req.body.permata_va_number) {
      order.vaNumber = req.body.permata_va_number;
      order.bankName = 'permata';
    } else if (req.body.bill_key && req.body.biller_code) {
      // Mandiri Bill
      order.vaNumber = req.body.bill_key;
      order.bankName = 'mandiri';
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      order.status = 'processing';
      
      // Update payment method with specific channel from Midtrans
      let methodLabel = req.body.payment_type;
      if (req.body.bank) methodLabel += ` (${req.body.bank.toUpperCase()})`;
      if (req.body.store) methodLabel += ` (${req.body.store.toUpperCase()})`;
      order.paymentMethod = methodLabel;

      // Add reward points (e.g., 1 point for every 10,000 spent)
      const pointsEarned = Math.floor(order.finalAmount / 10000);
      if (order.user) {
        order.user.points += pointsEarned;
        await order.user.save();
      }

      // Fase 1: Jika delivery, otomatis buat shipment ke Biteship
      if (order.orderType === 'delivery') {
        try {
          const { processShipmentRequest } = require('./shippingController');
          await processShipmentRequest(order.id);
          console.log(`🚚 Automated shipment created for order ${order.orderNumber}`);
        } catch (shipmentError) {
          console.error(`❌ Failed to automate shipment for ${order.orderNumber}:`, shipmentError.message);
          // Kita tidak return error di sini agar status pembayaran tetap tersimpan sukses
        }
      }
    } else if (transaction_status === 'pending') {
      order.status = 'pending_payment';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      order.status = 'cancelled';
      // Here you could return used points if the app has a point redemption system
      // For now, we just update the status as requested
    } else if (transaction_status === 'pending') {
      order.status = 'pending_payment';
    }

    await order.save();
    console.log(`✅ Order ${order_id} updated successfully to status: ${order.status}`);

    // ✅ Kirim notifikasi otomatis ke mobile user (DB + Push Notification)
    try {
      const { sendOrderStatusNotification } = require('../utils/orderNotification');
      await sendOrderStatusNotification(order);
    } catch (notifErr) {
      console.error('[Notification Error in Payment Webhook]', notifErr.message);
    }

    return res.status(200).json({ success: true, message: 'Webhook handled' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { createPayment, handleWebhook };