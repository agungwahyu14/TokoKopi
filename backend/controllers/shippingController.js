const axios = require('axios');
const { Store } = require('../models');

const getRates = async (req, res) => {
  try {
    const { 
      originLatitude, 
      originLongitude, 
      destinationLatitude, 
      destinationLongitude,
      storeId,
      items // [{ name, value, quantity, weight }]
    } = req.body;

    let originLat = originLatitude;
    let originLng = originLongitude;

    // Jika storeId diberikan, ambil koordinat dari store
    if (storeId) {
      const store = await Store.findByPk(storeId);
      if (store && store.latitude && store.longitude) {
        originLat = store.latitude;
        originLng = store.longitude;
      }
    }

    if (!originLat || !originLng || !destinationLatitude || !destinationLongitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Origin and destination coordinates are required' 
      });
    }

    const biteshipKey = process.env.BITESHIP_API_KEY;
    if (!biteshipKey) {
      return res.status(500).json({ success: false, message: 'BITESHIP_API_KEY is not configured' });
    }

    // Persiapkan data untuk Biteship
    const biteshipData = {
      origin_latitude: parseFloat(originLat),
      origin_longitude: parseFloat(originLng),
      destination_latitude: parseFloat(destinationLatitude),
      destination_longitude: parseFloat(destinationLongitude),
      couriers: 'grab,gosend', // GoSend + GrabExpress as recommended
      items: items && items.length > 0 ? items.map(item => ({
        name: item.name,
        description: item.description || 'Pesanan Toko Kopi Jaya',
        value: parseFloat(item.value) || 20000,
        quantity: parseInt(item.quantity) || 1,
        weight: parseInt(item.weight) || 200 // Default 200g
      })) : [
        {
          name: 'Coffee & Food',
          description: 'Pesanan Toko Kopi Jaya',
          value: 50000,
          quantity: 1,
          weight: 500 // 500 grams default
        }
      ]
    };

    const response = await axios.post(
      'https://api.biteship.com/v1/rates/couriers',
      biteshipData,
      {
        headers: {
          'Authorization': biteshipKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`--- Biteship API Response for ${originLat},${originLng} to ${destinationLatitude},${destinationLongitude} ---`);
    console.log('Results Count:', response.data.pricing?.length || 0);
    if (response.data.pricing) {
      response.data.pricing.forEach(p => console.log(`- ${p.courier_name} (${p.courier_service_name}): ${p.price}`));
    }

    // Sort pricing by price (ascending)
    let pricing = response.data.pricing || [];
    pricing.sort((a, b) => a.price - b.price);

    // Filter out time-restricted services (e.g. Same Day only available 09:00–14:00)
    const currentHour = new Date().getHours();
    const isSameDayAvailable = currentHour >= 9 && currentHour < 14;
    if (!isSameDayAvailable) {
      const filtered = pricing.filter(p => !p.courier_service_code?.toLowerCase().includes('sameday'));
      // Only filter if there are still options left
      if (filtered.length > 0) {
        pricing = filtered;
        console.log(`ℹ️ Same Day service filtered out (current hour: ${currentHour}). ${pricing.length} options remain.`);
      }
    }

    return res.status(200).json({
      success: true,
      data: pricing
    });

  } catch (error) {
    const biteshipError = error.response?.data;
    console.error('Biteship rates error:', biteshipError || error.message);

    // Fallback mock rates jika saldo Biteship tidak cukup (untuk development)
    if (biteshipError?.error?.includes('balance') || biteshipError?.error?.includes('No sufficient')) {
      console.warn('⚠️ Biteship saldo habis, menggunakan mock rates untuk development...');
      // Also filter Same Day from mock rates when outside allowed hours
      const currentHour = new Date().getHours();
      const isSameDayAvailable = currentHour >= 9 && currentHour < 14;
      let mockRates = [
        {
          courier_code: 'gosend',
          courier_service_code: 'instant',
          courier_name: 'GoSend',
          courier_service_name: 'Instant',
          duration: '25-45',
          price: 15000,
          description: 'Estimasi 25-45 menit'
        },
        {
          courier_code: 'grab',
          courier_service_code: 'grabexpress',
          courier_name: 'GrabExpress',
          courier_service_name: 'Instant',
          duration: '20-40',
          price: 16000,
          description: 'Estimasi 20-40 menit'
        },
        ...(isSameDayAvailable ? [{
          courier_code: 'gosend',
          courier_service_code: 'sameday',
          courier_name: 'GoSend',
          courier_service_name: 'Same Day',
          duration: '3-5 Jam',
          price: 20000,
          description: 'Estimasi 3-5 jam (tersedia 09.00–14.00)'
        }] : [])
      ];
      return res.status(200).json({ success: true, data: mockRates, isMock: true });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil tarif pengiriman',
      error: error.response?.data?.message || error.message
    });
  }
};


const handleWebhook = async (req, res) => {
  // Biteship can send different payload shapes; handle both
  const event = req.body.event;
  const status = req.body.status;
  const order_id = req.body.order_id || req.body.id;   // Biteship's own order ID
  const reference_id = req.body.reference_id;          // Our orderNumber (sent when creating order)

  console.log('--- Biteship Webhook Received ---');
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // Acknowledge non-order.status events immediately
  if (event !== 'order.status' || (!order_id && !reference_id) || !status) {
    console.log(`ℹ️ Received event: ${event || 'none'}. Responding with 200 OK.`);
    return res.status(200).json({ success: true, message: 'Webhook reached successfully' });
  }

  try {
    const { Order, User } = require('../models');
    const { Op } = require('sequelize');

    // reference_id may have a retry suffix like "JKT-1234567890-123-R1716999200000"
    // Strip it to recover the original orderNumber for lookup
    const baseOrderNumber = reference_id ? reference_id.replace(/-R\d+$/, '') : null;

    // Strategy: find by biteshipOrderId (most reliable), fallback to orderNumber
    const whereClause = [];
    if (order_id) whereClause.push({ biteshipOrderId: order_id });
    if (baseOrderNumber) whereClause.push({ orderNumber: baseOrderNumber });

    const order = await Order.findOne({
      where: { [Op.or]: whereClause },
      include: [{ model: User, as: 'user' }]
    });

    if (!order) {
      console.error(`❌ Order not found. biteshipOrderId: ${order_id}, orderNumber: ${reference_id}`);
      // Always return 200 to Biteship so they don't keep retrying
      return res.status(200).json({ success: false, message: 'Order not found, but ack received' });
    }

    console.log(`📦 Processing webhook for order ${order.orderNumber} | Biteship status: ${status}`);

    // Mapping Biteship statuses → internal statuses
    // Full list: waiting, allocated, picking_up, picked_up, dropping_off, delivered, rejected, cancelled, returned
    switch (status) {
      case 'allocated':
      case 'picking_up':
        // Driver assigned / on the way to pick up — keep on_delivery
        if (order.status !== 'on_delivery') {
          order.status = 'on_delivery';
          console.log(`🚴 Order ${order.orderNumber}: driver allocated/picking up → on_delivery`);
        }
        break;

      case 'picked_up':
      case 'dropping_off':
        // Driver has the order and is en route to customer
        order.status = 'on_delivery';
        console.log(`🚀 Order ${order.orderNumber}: driver en route → on_delivery`);
        break;

      case 'delivered':
        order.status = 'completed';
        console.log(`✅ Order ${order.orderNumber}: delivered → completed`);

        // Award loyalty points on delivery completion
        if (order.user) {
          const pointsEarned = Math.floor((order.finalAmount || order.totalAmount) / 10000);
          if (pointsEarned > 0) {
            order.user.points = (order.user.points || 0) + pointsEarned;
            await order.user.save();
            console.log(`✨ User ${order.user.id} earned ${pointsEarned} points from delivery`);
          }
        }
        break;

      case 'cancelled':
      case 'rejected':
      case 'returned':
        // Courier cancelled — let admin pick another courier
        order.status = 'processing';
        order.biteshipOrderId = null; // Clear so admin can re-request
        console.log(`⚠️ Delivery ${status} for ${order.orderNumber}. Reverting to processing.`);
        break;

      default:
        console.log(`ℹ️ Unhandled Biteship status: "${status}" for order ${order.orderNumber}. No action.`);
    }

    await order.save();
    console.log(`💾 Order ${order.orderNumber} saved with status: ${order.status}`);

    // ✅ Kirim notifikasi otomatis ke mobile user (DB + Push Notification)
    try {
      const { sendOrderStatusNotification } = require('../utils/orderNotification');
      await sendOrderStatusNotification(order);
    } catch (notifErr) {
      console.error('[Notification Error in Biteship Webhook]', notifErr.message);
    }

    return res.status(200).json({ success: true, message: 'Webhook handled' });
  } catch (error) {
    console.error('Biteship Webhook Error:', error);
    // Return 200 even on error — Biteship will otherwise retry indefinitely
    return res.status(200).json({ success: false, message: 'Internal error, ack received' });
  }
};


const createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await processShipmentRequest(orderId);
    return res.status(200).json(result);
  } catch (error) {
    // If the error came from Biteship (axios error), extract the real message
    const biteshipErrorData = error.response?.data;
    const statusCode = error.response?.status || 500;
    const message = biteshipErrorData?.error || biteshipErrorData?.message || error.message || 'Gagal memanggil kurir Biteship';

    console.error('createShipment error:', biteshipErrorData || error.message);

    // Return 400 for known validation issues, otherwise use Biteship's status or 500
    const isValidationError = [
      'Pesanan tidak ditemukan',
      'bukan bertipe pengiriman',
      'Informasi kurir tidak lengkap',
    ].some(msg => message.includes(msg));

    return res.status(isValidationError ? 400 : statusCode).json({ 
      success: false, 
      message 
    });
  }
};

const processShipmentRequest = async (orderId) => {
  const { Order, OrderItem, Product, Store } = require('../models');

  const order = await Order.findByPk(orderId, {
    include: [
      { model: Store, as: 'store' },
      { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
    ]
  });

  if (!order) throw new Error('Pesanan tidak ditemukan');
  if (order.orderType !== 'delivery') throw new Error('Pesanan ini bukan bertipe pengiriman');
  if (!order.courierCode || !order.courierService) throw new Error('Informasi kurir tidak lengkap');

  const biteshipKey = process.env.BITESHIP_API_KEY;

  // Auto-fallback: Same Day is only available 09:00–14:00
  // If user originally chose sameday but it's now outside that window, switch to instant
  const SAMEDAY_KEYWORDS = ['sameday', 'same_day', 'same-day'];
  const isSameDayCourier = SAMEDAY_KEYWORDS.some(k => order.courierService?.toLowerCase().includes(k));
  const currentHour = new Date().getHours();
  const isSameDayAvailable = currentHour >= 9 && currentHour < 14;

  let effectiveCourierService = order.courierService;
  let serviceNote = '';
  if (isSameDayCourier && !isSameDayAvailable) {
    effectiveCourierService = 'instant';
    serviceNote = ` (auto-switch: Same Day → Instant karena di luar jam 09.00–14.00)`;
    console.log(`⚠️ Order ${order.orderNumber}: Same Day selected but current hour is ${currentHour}. Auto-switching to instant.`);
  }

  // Biteship requires reference_id to be globally unique across ALL attempts.
  // Appending a timestamp suffix ensures retries don't collide with previous attempts.
  const biteshipReferenceId = `${order.orderNumber}-R${Date.now()}`;

  const biteshipPayload = {
    reference_id: biteshipReferenceId,
    shipper_contact_name: order.store.name,
    shipper_contact_phone: order.store.phone || '081234567890',
    origin_contact_name: order.store.name,
    origin_contact_phone: order.store.phone || '081234567890',
    origin_address: `${order.store.address}, ${order.store.city}`,
    origin_coordinate: {
      latitude: parseFloat(order.store.latitude),
      longitude: parseFloat(order.store.longitude)
    },
    destination_contact_name: order.receiverName || 'Pelanggan',
    destination_contact_phone: order.receiverPhone || '081234567890',
    destination_address: order.deliveryAddress,
    destination_coordinate: {
      latitude: parseFloat(order.deliveryLatitude),
      longitude: parseFloat(order.deliveryLongitude)
    },
    courier_company: order.courierCode,
    courier_type: effectiveCourierService,
    delivery_type: 'now',
    items: order.items.map(item => ({
      name: item.product.name,
      description: `Quantity: ${item.quantity}`,
      value: parseFloat(item.unitPrice),
      quantity: item.quantity,
      weight: 200 // Default 200g
    }))
  };

  const response = await axios.post(
    'https://api.biteship.com/v1/orders',
    biteshipPayload,
    {
      headers: {
        'Authorization': biteshipKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const biteshipData = response.data;
  order.biteshipOrderId = biteshipData.id;
  // Persist the effective service used (might have been auto-switched)
  order.courierService = effectiveCourierService;
  // Auto-advance status to on_delivery — courier has been confirmed by Biteship
  order.status = 'on_delivery';
  await order.save();

  console.log(`✅ Order ${order.orderNumber}: courier dispatched (${order.courierCode} / ${effectiveCourierService}), status → on_delivery`);

  // ✅ Kirim notifikasi otomatis ke mobile user (DB + Push Notification)
  try {
    const { sendOrderStatusNotification } = require('../utils/orderNotification');
    await sendOrderStatusNotification(order);
  } catch (notifErr) {
    console.error('[Notification Error in processShipmentRequest]', notifErr.message);
  }

  return {
    success: true,
    message: `Berhasil memanggil kurir${serviceNote}`,
    data: biteshipData
  };
};

const getTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { Order } = require('../models');

    const order = await Order.findByPk(orderId);

    if (!order || !order.biteshipOrderId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tracking ID tidak ditemukan untuk pesanan ini' 
      });
    }

    const biteshipKey = process.env.BITESHIP_API_KEY;

    const response = await axios.get(
      `https://api.biteship.com/v1/orders/${order.biteshipOrderId}`,
      {
        headers: {
          'Authorization': biteshipKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Biteship tracking error:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data pelacakan',
      error: error.response?.data?.message || error.message
    });
  }
};

module.exports = { getRates, handleWebhook, createShipment, getTracking, processShipmentRequest };
