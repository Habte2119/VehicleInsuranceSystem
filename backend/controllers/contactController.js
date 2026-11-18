import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";
import { generateInquiryId, generateNotificationId } from "../utils/idGenerator.js";

const INQUIRIES_FILE = path.join(process.cwd(), "uploads", "contact_inquiries.json");

// Helper to ensure inquiries file exists and returns array
const loadInquiries = () => {
  try {
    if (!fs.existsSync(INQUIRIES_FILE)) {
      const dir = path.dirname(INQUIRIES_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const raw = fs.readFileSync(INQUIRIES_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("Error reading contact_inquiries.json:", err);
    return [];
  }
};

// Helper to save inquiries array
const saveInquiries = (inquiries) => {
  try {
    const dir = path.dirname(INQUIRIES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2));
  } catch (err) {
    console.error("Error writing contact_inquiries.json:", err);
  }
};

/**
 * Public Endpoint: Submit Contact Inquiry
 * POST /api/contact
 */
export const submitContactInquiry = async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide your full name.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please write a message with at least 5 characters.",
      });
    }

    const ticketId = generateInquiryId();
    const cleanSubject = subject && subject.trim().length > 0 ? subject.trim() : "General Support Inquiry";
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanMessage = message.trim();

    // 1. Persist inquiry into durable JSON storage
    const newInquiry = {
      id: ticketId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const inquiries = loadInquiries();
    inquiries.unshift(newInquiry);
    saveInquiries(inquiries);

    // 2. Notify all Admin accounts in the database
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true },
      });

      // If admins exist, create a notification for each admin
      const targetUsers = admins.length > 0 ? admins : await prisma.user.findMany({ take: 1, select: { id: true, email: true } });

      for (const admin of targetUsers) {
        await prisma.notification.create({
          data: {
            id: generateNotificationId(),
            customerId: admin.id,
            title: `Support Inquiry: ${cleanSubject} (${cleanName})`,
            message: `From: ${cleanName} <${cleanEmail}>${cleanPhone ? ` | Phone: ${cleanPhone}` : ""}\nTicket: ${ticketId}\n\n${cleanMessage}`,
            type: "contact",
            status: "unread",
            sentDate: new Date(),
          },
        });
      }

      // 3. If sender is registered, create an inquiry confirmation notice for them
      const registeredUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true },
      });

      if (registeredUser) {
        await prisma.notification.create({
          data: {
            id: generateNotificationId(),
            customerId: registeredUser.id,
            title: `Support Ticket Received (${ticketId})`,
            message: `We received your inquiry regarding "${cleanSubject}". A specialist will follow up at ${cleanEmail}.`,
            type: "system",
            status: "unread",
            sentDate: new Date(),
          },
        });
      }
    } catch (notifErr) {
      console.error("Non-blocking notification error for contact inquiry:", notifErr);
    }

    return res.status(201).json({
      success: true,
      message: "Thank you! Your inquiry has been received by our underwriting desk.",
      ticketId,
      inquiry: newInquiry,
    });
  } catch (error) {
    console.error("Error submitting contact inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while sending your message. Please try again.",
    });
  }
};

/**
 * Admin Endpoint: List Inquiries
 * GET /api/contact
 */
export const getContactInquiries = async (req, res) => {
  try {
    const inquiries = loadInquiries();
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    console.error("Error fetching contact inquiries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact inquiries.",
    });
  }
};

/**
 * Admin Endpoint: Update Inquiry Status
 * PUT /api/contact/:id/status
 */
export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiries = loadInquiries();
    const index = inquiries.findIndex((i) => i.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found.",
      });
    }

    inquiries[index].status = status || "resolved";
    inquiries[index].updatedAt = new Date().toISOString();
    saveInquiries(inquiries);

    return res.status(200).json({
      success: true,
      message: `Inquiry #${id} status updated to ${status}.`,
      inquiry: inquiries[index],
    });
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inquiry status.",
    });
  }
};
