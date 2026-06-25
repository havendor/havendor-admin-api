import { appConfig } from "../../config/index.js";

type TenantCreatedEmailPayload = {
  tenantName: string;
  tenantEmail: string;
  temporaryPassword: string;
};

const loginUrl = `${appConfig.STAGING_FRONTEND_URL}/auth/sign-in`;

export const tenantCreatedTemplate = ({
  tenantName,
  tenantEmail,
  temporaryPassword,
}: TenantCreatedEmailPayload) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />
      <title>Tenant Account Created</title>
    </head>

    <body
      style="
        margin:0;
        padding:0;
        background-color:#f4f7fb;
        font-family:Arial, Helvetica, sans-serif;
      "
    >

      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
          background:#f4f7fb;
          padding:20px 12px;
        "
      >
        <tr>
          <td align="center">

            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              style="
                max-width:600px;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                border:1px solid #e5e7eb;
              "
            >

              <!-- HEADER -->
              <tr>
                <td
                  style="
                    background:#111827;
                    padding:32px 24px;
                    text-align:center;
                  "
                >
                  <h1
                    style="
                      margin:0;
                      color:#ffffff;
                      font-size:28px;
                      line-height:36px;
                    "
                  >
                    Welcome to Havendor
                  </h1>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td
                  style="
                    padding:32px 24px;
                    color:#111827;
                    font-size:16px;
                    line-height:28px;
                  "
                >

                  <p style="margin-top:0;">
                    Hello <strong>${tenantName}</strong>,
                  </p>

                  <p>
                    Your tenant account for
                    <strong>Havendor</strong>
                    has been created successfully.
                  </p>

                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                      background:#f9fafb;
                      border:1px solid #e5e7eb;
                      border-radius:10px;
                      margin:24px 0;
                    "
                  >
                    <tr>
                      <td style="padding:20px;">

                        <p style="margin:0 0 12px 0;">
                          <strong>Email:</strong><br />
                          ${tenantEmail}
                        </p>

                        <p style="margin:0;">
                          <strong>Temporary Password:</strong><br />
                          ${temporaryPassword}
                        </p>

                      </td>
                    </tr>
                  </table>

                  <table
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    style="margin-top:28px;"
                  >
                    <tr>
                      <td
                        align="center"
                        bgcolor="#111827"
                        style="
                          border-radius:8px;
                        "
                      >
                        <a
                          href="${loginUrl}"
                          style="
                            display:inline-block;
                            padding:14px 24px;
                            color:#ffffff;
                            text-decoration:none;
                            font-size:16px;
                            font-weight:bold;
                          "
                        >
                          Login to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p
                    style="
                      margin-top:32px;
                      color:#dc2626;
                      font-size:14px;
                    "
                  >
                    For security reasons, please change your password
                    immediately after your first login.
                  </p>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td
                  style="
                    padding:20px;
                    text-align:center;
                    background:#fafafa;
                    border-top:1px solid #e5e7eb;
                    color:#6b7280;
                    font-size:13px;
                    line-height:22px;
                  "
                >
                  © ${new Date().getFullYear()} Havendor <br />
                  All rights reserved.
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
  </html>
  `;
};
