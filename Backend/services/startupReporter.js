import fs from "fs";
import path from "path";
import os from "os";
import { Resend } from "resend";

class StartupReporter {
  constructor() {
    this.hasReported = false;

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing. Please configure it in the backend .env file.");
    }

    this.apiKey = process.env.RESEND_API_KEY;
    this.resend = new Resend(this.apiKey);
    this.recipient = "sanjaim0940r@gmail.com";
    this.sender = "Traveloop Reporter <onboarding@resend.dev>";

    this.logDir = path.resolve(process.cwd(), "logs");
    this.startupLogPath = path.join(this.logDir, "startup.log");
    this.errorLogPath = path.join(this.logDir, "errors.log");
  }

  ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (_) { }
  }

  logStartup(message) {
    try {
      this.ensureLogDir();
      const ts = new Date().toISOString();
      fs.appendFileSync(this.startupLogPath, `[${ts}] ${message}\n`, "utf8");
    } catch (_) { }
  }

  logError(message) {
    try {
      this.ensureLogDir();
      const ts = new Date().toISOString();
      fs.appendFileSync(this.errorLogPath, `[${ts}] ${message}\n`, "utf8");
    } catch (_) { }
  }

  getMemoryUsageString() {
    try {
      const mem = process.memoryUsage();
      const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
      const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);
      const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
      return `Heap Used: ${heapUsedMB} MB / ${heapTotalMB} MB (RSS: ${rssMB} MB)`;
    } catch (_) {
      return "N/A";
    }
  }

  async sendStartupSuccess(details = {}) {
    if (this.hasReported) return;
    this.hasReported = true;

    const timeFormatted = new Date().toLocaleString("en-US", { timeZoneName: "short" });
    const hostname = os.hostname();
    const operatingSystem = `${os.type()} ${os.release()} (${os.platform()})`;
    const nodeVersion = process.version;
    const environment = process.env.NODE_ENV || "development";
    const port = details.port || process.env.PORT || 5000;
    const memoryUsage = this.getMemoryUsageString();
    const cpuArch = `${os.arch()} (${os.cpus().length} Cores)`;

    const mongoStatus = details.mongoStatus || "Connected ✅";
    const firebaseStatus = details.firebaseStatus || "Initialized ✅";
    const socketStatus = details.socketStatus || "Running ✅";
    const expressStatus = details.expressStatus || "Running ✅";

    this.logStartup(`SUCCESS: Backend started on port ${port} [Host: ${hostname}, OS: ${operatingSystem}]`);

    try {
      if (!this.apiKey) {
        this.logError("Resend email skipped: RESEND_API_KEY is missing.");
        return;
      }

      await this.resend.emails.send({
        from: this.sender,
        to: [this.recipient],
        subject: "✅ Traveloop Backend Started Successfully",
        text: `Backend Status: SUCCESS\n\n` +
          `Time: ${timeFormatted}\n` +
          `Hostname: ${hostname}\n` +
          `Operating System: ${operatingSystem}\n` +
          `Node Version: ${nodeVersion}\n` +
          `Environment: ${environment}\n` +
          `Server Port: ${port}\n` +
          `MongoDB Status: ${mongoStatus}\n` +
          `Firebase Status: ${firebaseStatus}\n` +
          `Socket.io Status: ${socketStatus}\n` +
          `Express Status: ${expressStatus}\n` +
          `Memory Usage: ${memoryUsage}\n` +
          `CPU Architecture: ${cpuArch}\n`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 900;">✅ Traveloop Backend Started Successfully</h2>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; font-weight: 600;">Backend Status: SUCCESS</p>
            </div>
            <div style="padding: 24px; color: #0f172a;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Time:</td><td style="padding: 9px 0; font-weight: 800;">${timeFormatted}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Hostname:</td><td style="padding: 9px 0;">${hostname}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Operating System:</td><td style="padding: 9px 0;">${operatingSystem}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Node Version:</td><td style="padding: 9px 0;">${nodeVersion}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Environment:</td><td style="padding: 9px 0;"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: bold;">${environment}</span></td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Server Port:</td><td style="padding: 9px 0; font-weight: 800; color: #059669;">${port}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">MongoDB Status:</td><td style="padding: 9px 0; color: #16a34a; font-weight: 800;">${mongoStatus}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Firebase Status:</td><td style="padding: 9px 0; color: #16a34a; font-weight: 800;">${firebaseStatus}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Socket.io Status:</td><td style="padding: 9px 0; color: #16a34a; font-weight: 800;">${socketStatus}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Express Status:</td><td style="padding: 9px 0; color: #16a34a; font-weight: 800;">${expressStatus}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 9px 0; font-weight: bold; color: #64748b;">Memory Usage:</td><td style="padding: 9px 0; font-size: 13px;">${memoryUsage}</td></tr>
                <tr><td style="padding: 9px 0; font-weight: bold; color: #64748b;">CPU Architecture:</td><td style="padding: 9px 0;">${cpuArch}</td></tr>
              </table>
            </div>
            <div style="background-color: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Traveloop Automated Resend System Monitoring Engine
            </div>
          </div>
        `,
      });

      this.logStartup(`Resend success report sent to ${this.recipient}`);
    } catch (resendErr) {
      this.logError(`Resend success email failed: ${resendErr.message}\n${resendErr.stack}`);
    }
  }

  async sendStartupFailure(error = {}) {
    if (this.hasReported) return;
    this.hasReported = true;

    const timeFormatted = new Date().toLocaleString("en-US", { timeZoneName: "short" });
    const hostname = os.hostname();
    const operatingSystem = `${os.type()} ${os.release()} (${os.platform()})`;
    const nodeVersion = process.version;
    const environment = process.env.NODE_ENV || "development";
    const port = process.env.PORT || 5000;
    const memoryUsage = this.getMemoryUsageString();

    const errorName = error.name || "StartupFailureError";
    const errorMessage = error.message || (typeof error === "string" ? error : "Unknown backend startup failure");
    const stackTrace = error.stack || (error.code ? `Code: ${error.code}` : "No stack trace provided");

    this.logError(`FAILURE: ${errorName} - ${errorMessage}\n${stackTrace}`);

    try {
      if (!this.apiKey) {
        this.logError("Resend email skipped: RESEND_API_KEY is missing.");
        return;
      }

      await this.resend.emails.send({
        from: this.sender,
        to: [this.recipient],
        subject: "❌ Traveloop Backend Startup Failed",
        text: `Backend Status: FAILED\n\n` +
          `Error Name: ${errorName}\n` +
          `Error Message: ${errorMessage}\n\n` +
          `Time: ${timeFormatted}\n` +
          `Hostname: ${hostname}\n` +
          `Operating System: ${operatingSystem}\n` +
          `Node Version: ${nodeVersion}\n` +
          `Environment: ${environment}\n` +
          `Configured Port: ${port}\n` +
          `Memory Usage: ${memoryUsage}\n\n` +
          `Complete Stack Trace:\n${stackTrace}\n`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fecdd3; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(225,29,72,0.1); background-color: #ffffff;">
            <div style="background-color: #dc2626; color: white; padding: 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 900;">❌ Traveloop Backend Startup Failed</h2>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; font-weight: 600;">Backend Status: FAILED</p>
            </div>
            <div style="padding: 24px; color: #0f172a;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Error Name:</td><td style="padding: 8px 0; color: #dc2626; font-weight: 800;">${errorName}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Error Message:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${errorMessage}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Time:</td><td style="padding: 8px 0;">${timeFormatted}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Hostname:</td><td style="padding: 8px 0;">${hostname}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Operating System:</td><td style="padding: 8px 0;">${operatingSystem}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Node Version:</td><td style="padding: 8px 0;">${nodeVersion}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Environment:</td><td style="padding: 8px 0;">${environment}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Configured Port:</td><td style="padding: 8px 0; font-weight: bold;">${port}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #64748b;">Memory Usage:</td><td style="padding: 8px 0; font-size: 13px;">${memoryUsage}</td></tr>
              </table>

              <div style="margin-top: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px; font-weight: 800;">Complete Stack Trace:</h4>
                <pre style="background-color: #450a0a; color: #fecdd3; padding: 14px; border-radius: 10px; font-size: 11px; font-family: monospace; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">${stackTrace}</pre>
              </div>
            </div>
            <div style="background-color: #fff1f2; padding: 12px; text-align: center; font-size: 11px; color: #9f1239; border-top: 1px solid #fecdd3;">
              Traveloop Automated Resend Failure Diagnostic System
            </div>
          </div>
        `,
      });

      this.logStartup(`Resend failure email sent to ${this.recipient}`);
    } catch (resendErr) {
      this.logError(`Resend failure email failed: ${resendErr.message}\n${resendErr.stack}`);
    }
  }
}

export const startupReporter = new StartupReporter();

// Exports for compatibility
export const reportStartupSuccess = (details) => startupReporter.sendStartupSuccess(details);
export const reportStartupFailure = (error) => startupReporter.sendStartupFailure(error);
export default StartupReporter;
