import { appConfig } from "../../config/index.js";

type AdminCreatedEmailPayload = {
  adminName: string;
  adminEmail: string;
  temporaryPassword: string;
};

const loginUrl = `${appConfig.STAGING_FRONTEND_URL}/auth/sign-in`;

export const adminCreatedTemplate = ({
  adminName,
  adminEmail,
  temporaryPassword,
}: AdminCreatedEmailPayload) => {
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial; background:#f4f7fb; padding:40px;">
      
      <div
        style="
          max-width:600px;
          margin:auto;
          background:#fff;
          border-radius:10px;
          overflow:hidden;
          border:1px solid #e5e7eb;
        "
      >
        
        <div style="background:#111827; padding:30px;">
          <h1 style="color:white; margin:0;">
            Admin Account Created
          </h1>
        </div>

        <div style="padding:40px;">
          
          <p>Hello <b>${adminName}</b>,</p>

          <p>
            Your administrator account has been created successfully.
          </p>

          <div
            style="
              background:#f9fafb;
              padding:20px;
              border-radius:8px;
              border:1px solid #e5e7eb;
            "
          >
            <p><b>Email:</b> ${adminEmail}</p>
            <p><b>Temporary Password:</b> ${temporaryPassword}</p>
          </div>

          <a
            href="${loginUrl}"
            style="
              display:inline-block;
              margin-top:24px;
              padding:14px 24px;
              background:#111827;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Login Now
          </a>

          <p style="margin-top:24px; color:red;">
            Please change your password after first login.
          </p>
        </div>

        <div
          style="
            padding:20px;
            text-align:center;
            background:#fafafa;
            border-top:1px solid #e5e7eb;
          "
        >
          <small>
            © ${new Date().getFullYear()} Havendor
          </small>
        </div>

      </div>

    </body>
  </html>
  `;
};
