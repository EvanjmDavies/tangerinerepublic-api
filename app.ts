import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import axios from "axios";

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(
  cors({
    origin: ["https://tangerinerepublic.com"], // Change this to your frontend's domain
    methods: "POST",
    allowedHeaders: ["Content-Type"],
  })
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

interface EmailRequestBody {
  occasion: string;
  services: string;
  date: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  questions: string;
  recaptchaResponse: string;
}

app.post(
  "/send-email",
  async (
    req: Request<{}, {}, EmailRequestBody>,
    res: Response
  ): Promise<void> => {
    const {
      occasion,
      services,
      date,
      location,
      firstName,
      lastName,
      email,
      mobile,
      questions,
      recaptchaResponse,
    } = req.body;

    try {
      // 🔹 Verify reCAPTCHA
      const recaptchaVerifyResponse = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaResponse,
          },
        }
      );

      if (!recaptchaVerifyResponse.data.success) {
        res
          .status(400)
          .json({ success: false, message: "reCAPTCHA verification failed!" });
        return;
      }

      // 🔹 Email message
      const msg = {
        to: [
          "evanjmdavies@gmail.com",
          "thetangerinerepublic@gmail.com",
          "sinsir@hotmail.co.uk",
        ],
        from: "tangerine-republic@tangerinerepublic.com",
        subject: "A new meesage for the Tangerine Republic!",
        text: `You have a new contact form submission for Tangerine Republic!\n
          Occasion: ${occasion}\n
          Services: ${services}\n
          Date: ${date}\n
          Location: ${location}\n
          First Name: ${firstName}\n
          Last Name: ${lastName}\n
          Email: ${email}\n
          Mobile: ${mobile}\n
          Questions: ${questions}`,
      };

      // 🔹 Send email
      await sgMail.send(msg);
      res.json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Email failed to send." });
    }
  }
);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
