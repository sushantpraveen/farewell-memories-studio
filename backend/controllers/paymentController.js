import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendMail } from '../utils/email.js';
import Order from '../models/orderModel.js';

const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const getKey = async (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    if (!keyId) return res.status(500).json({ message: 'Razorpay key not configured' });
    return res.json({ keyId });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch key' });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body || {};
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ message: 'Amount (in paise) is required' });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount, // paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    return res.status(201).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (err) {
    console.error('createRazorpayOrder error:', err);
    return res.status(500).json({ message: 'Failed to create payment order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clientOrderId, orderId } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ message: 'Razorpay secret not configured' });

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const valid = expectedSignature === razorpay_signature;
    if (!valid) return res.status(400).json({ valid: false, message: 'Invalid signature' });

    // Attempt to send confirmation email to the customer
    let emailed = false;
    try {
      // First try to get customer email from the request body
      let customerEmail = req.body.email;
      let customerName = req.body.name;
      let orderDetails = null;
      
      // If no email in request body, try to find it from the associated order
      if (!customerEmail && (clientOrderId || orderId)) {
        const orderRef = clientOrderId || orderId;
        orderDetails = await Order.findOne({ clientOrderId: orderRef }).lean();
        
        if (orderDetails && orderDetails.shipping && orderDetails.shipping.email) {
          customerEmail = orderDetails.shipping.email;
          customerName = orderDetails.shipping.name;
        }
      }
      
      // If still no email, use the authenticated user's email
      if (!customerEmail && req.user && req.user.email) {
        customerEmail = req.user.email;
        customerName = req.user.name;
      }

      if (customerEmail) {
        const displayOrderId = clientOrderId || orderId || '';
        const amountPaise = req.body.amount; // Optional
        const amountDisplay = typeof amountPaise === 'number' ? `₹${(amountPaise / 100).toFixed(2)}` : undefined;

        // Create a more professional email template
        const htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Payment Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background-color: #6d28d9; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
              .order-details { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
              h1 { margin: 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payment Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName || 'Customer'},</p>
              <p>Thank you for your payment. We're pleased to confirm that your transaction has been successfully processed.</p>
              
              <div class="order-details">
                <h2>Payment Details</h2>
                <table>
                  <tr>
                    <th>Payment ID:</th>
                    <td>${razorpay_payment_id}</td>
                  </tr>
                  <tr>
                    <th>Order ID:</th>
                    <td>${displayOrderId || razorpay_order_id}</td>
                  </tr>
                  ${amountDisplay ? `
                  <tr>
                    <th>Amount:</th>
                    <td>${amountDisplay}</td>
                  </tr>` : ''}
                  <tr>
                    <th>Date:</th>
                    <td>${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <p>We will start processing your order shortly. You will receive another email when your order is shipped.</p>
              
              <p>If you have any questions about your order, please contact our customer service team.</p>
              
              <p>Thank you for choosing our service!</p>
              
              <p>Best regards,<br>The Signature Day Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Signature Day. All rights reserved.</p>
            </div>
          </body>
          </html>
        `;

        // Plain text version for email clients that don't support HTML
        const textVersion = `
          Payment Confirmation
          
          Dear ${customerName || 'Customer'},
          
          Thank you for your payment. We're pleased to confirm that your transaction has been successfully processed.
          
          Payment Details:
          - Payment ID: ${razorpay_payment_id}
          - Order ID: ${displayOrderId || razorpay_order_id}
          ${amountDisplay ? `- Amount: ${amountDisplay}\n` : ''}
          - Date: ${new Date().toLocaleString()}
          
          We will start processing your order shortly. You will receive another email when your order is shipped.
          
          If you have any questions about your order, please contact our customer service team.
          
          Thank you for choosing our service!
          
          Best regards,
          The Signature Day Team
          
          This is an automated message, please do not reply to this email.
          © ${new Date().getFullYear()} Signature Day. All rights reserved.
        `;

        await sendMail({
          to: customerEmail,
          subject: 'Payment Confirmation - Signature Day',
          html: htmlTemplate,
          text: textVersion,
        });
        emailed = true;
      }
    } catch (emailErr) {
      console.error('Failed to send payment confirmation email:', emailErr);
    }

    return res.json({ valid: true, emailed });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
};


