import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendMail } from '../utils/email.js';
import Order from '../models/orderModel.js';
import Group from '../models/groupModel.js';

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
    // Works with both user auth (req.user) and OTP auth (req.otpAuth)
    // No authentication check needed as this is just returning the public key
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
              
              ${req.body.invoicePdfBase64 ? '<p><strong>Your tax invoice is attached to this email.</strong></p>' : ''}
              
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
          
          ${req.body.invoicePdfBase64 ? 'Your tax invoice is attached to this email.\n' : ''}
          
          If you have any questions about your order, please contact our customer service team.
          
          Thank you for choosing our service!
          
          Best regards,
          The Signature Day Team
          
          This is an automated message, please do not reply to this email.
          © ${new Date().getFullYear()} Signature Day. All rights reserved.
        `;

        const attachments = [];
        
        // Attach invoice PDF if provided
        if (req.body.invoicePdfBase64 && req.body.invoiceFileName) {
          attachments.push({
            filename: req.body.invoiceFileName,
            content: req.body.invoicePdfBase64,
            encoding: 'base64',
            contentType: 'application/pdf'
          });
        }

        await sendMail({
          to: customerEmail,
          subject: 'Payment Confirmation - Signature Day',
          html: htmlTemplate,
          text: textVersion,
          attachments: attachments.length > 0 ? attachments : undefined,
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

/**
 * Calculate amount for joining a group
 * T-shirt price: ₹299 + Print: ₹99 = ₹398 per member
 */
export const calculateJoinAmount = (req, res) => {
  try {
    const TSHIRT_PRICE = 299; // ₹299
    const PRINT_PRICE = 99;   // ₹99
    const TOTAL_PER_MEMBER = TSHIRT_PRICE + PRINT_PRICE; // ₹398
    
    const amountInRupees = TOTAL_PER_MEMBER;
    const amountInPaise = amountInRupees * 100;
    
    return res.json({
      tshirtPrice: TSHIRT_PRICE,
      printPrice: PRINT_PRICE,
      total: amountInRupees,
      amountInPaise,
      currency: 'INR'
    });
  } catch (err) {
    console.error('calculateJoinAmount error:', err);
    return res.status(500).json({ message: 'Failed to calculate amount' });
  }
};

/**
 * Verify payment and allow group join
 * This endpoint validates payment before allowing member to join
 */
export const verifyPaymentAndJoin = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      groupId,
      memberData // { name, memberRollNumber, photo, vote, size, email }
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing payment verification fields' 
      });
    }

    if (!groupId || !memberData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing group or member data' 
      });
    }

    // Verify payment signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'Razorpay secret not configured' 
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        valid: false, 
        message: 'Invalid payment signature' 
      });
    }

    // Payment is valid, now add member to group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if group is full
    if (group.members.length >= group.totalMembers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group is already full' 
      });
    }

    // Check if member already exists
    const existingMember = group.members.find(
      m => m.memberRollNumber === memberData.memberRollNumber
    );

    if (existingMember) {
      return res.status(400).json({ 
        success: false, 
        message: 'Member with this roll number already exists' 
      });
    }

    // Get phone from OTP auth if available
    const phone = req.otpAuth?.phone || memberData.phone;

    // Add member to group
    const newMember = {
      name: memberData.name,
      memberRollNumber: memberData.memberRollNumber,
      photo: memberData.photo,
      vote: memberData.vote,
      size: memberData.size || 'm',
      phone,
      email: memberData.email,
      joinedAt: new Date(),
      paymentId: razorpay_payment_id,
      paidAmount: 398 // Store amount paid
    };

    group.members.push(newMember);
    group.votes[memberData.vote] = (group.votes[memberData.vote] || 0) + 1;

    await group.save();

    // Send confirmation email with invoice
    try {
      if (memberData.email) {
        const htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to ${group.name}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #6d28d9 0%, #db2777 100%); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
              .details { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
              h1 { margin: 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Welcome to ${group.name}!</h1>
            </div>
            <div class="content">
              <p>Hi ${memberData.name},</p>
              <p>Congratulations! You've successfully joined <strong>${group.name}</strong> (Class of ${group.yearOfPassing}).</p>
              
              <div class="details">
                <h3>Your Details</h3>
                <p><strong>Name:</strong> ${memberData.name}</p>
                <p><strong>Roll Number:</strong> ${memberData.memberRollNumber}</p>
                <p><strong>T-Shirt Size:</strong> ${(memberData.size || 'm').toUpperCase()}</p>
                <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                <p><strong>Amount Paid:</strong> ₹398</p>
              </div>
              
              <p>You're now part of the group collage! We'll start printing once all members have joined.</p>
              
              <p><strong>Your tax invoice is attached to this email.</strong></p>
              
              <p>Thank you for being part of this memorable journey!</p>
              
              <p>Best regards,<br>The Signature Day Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Signature Day. All rights reserved.</p>
            </div>
          </body>
          </html>
        `;

        const attachments = [];
        
        // Attach invoice PDF if provided
        if (req.body.invoicePdfBase64 && req.body.invoiceFileName) {
          attachments.push({
            filename: req.body.invoiceFileName,
            content: req.body.invoicePdfBase64,
            encoding: 'base64',
            contentType: 'application/pdf'
          });
        }

        await sendMail({
          to: memberData.email,
          subject: `Welcome to ${group.name} - Signature Day`,
          html: htmlTemplate,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
    }

    return res.json({ 
      success: true, 
      valid: true,
      groupId: group._id,
      member: newMember,
      message: 'Payment verified and successfully joined group'
    });

  } catch (err) {
    console.error('verifyPaymentAndJoin error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process payment and join group' 
    });
  }
};


