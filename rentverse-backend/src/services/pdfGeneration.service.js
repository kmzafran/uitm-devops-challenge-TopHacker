const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const { getSignatureQRCode } = require('./eSignature.service');
const { prisma } = require('../config/database');
const {
  cloudinary,
  isCloudinaryConfigured,
  CLOUD_FOLDER_PREFIX,
} = require('../config/storage');
const { v4: uuidv4 } = require('uuid');

class PDFGenerationService {
  /**
   * Upload PDF buffer to Cloudinary using signed upload
   * @param {Buffer} pdfBuffer
   * @param {string} fileName
   * @returns {Promise<Object>}
   */
  async uploadPDFToCloudinary(pdfBuffer, fileName) {
    if (!isCloudinaryConfigured) {
      throw new Error(
        'Cloudinary is not configured. Please check your environment variables.'
      );
    }

    return new Promise((resolve, reject) => {
      // Generate unique public ID
      const fileTimestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, '')
        .slice(0, 14);
      const shortId = uuidv4().split('-')[0];
      const publicId = `${CLOUD_FOLDER_PREFIX}/rental-agreements/${fileName}-${fileTimestamp}-${shortId}`;

      // Generate signature for signed upload
      const signatureTimestamp = Math.round(new Date().getTime() / 1000);
      const uploadParams = {
        public_id: publicId,
        resource_type: 'raw',
        format: 'pdf',
        use_filename: false,
        unique_filename: false,
        overwrite: true,
        type: 'upload', // Public upload type
        access_mode: 'public', // Make publicly accessible
        timestamp: signatureTimestamp,
      };

      // Generate signature using Cloudinary's method (fixed order and format)
      const paramsToSign = {
        public_id: publicId,
        resource_type: 'raw',
        timestamp: signatureTimestamp,
        format: 'pdf',
        overwrite: true,
        use_filename: false,
        unique_filename: false,
        type: 'upload',
        access_mode: 'public',
      };

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUD_API_SECRET
      );

      // Add signature and API key to params
      const signedParams = {
        ...uploadParams,
        signature: signature,
        api_key: process.env.CLOUD_API_KEY,
      };

      console.log('🔐 Using signed upload for PDF to Cloudinary...');

      const uploadStream = cloudinary.uploader.upload_stream(
        signedParams,
        (error, result) => {
          if (error) {
            console.error('Cloudinary signed PDF upload error:', error);

            // More detailed error logging for debugging
            if (error.message && error.message.includes('untrusted')) {
              console.error(
                '❌ Account marked as untrusted. Consider upgrading Cloudinary plan or contact support.'
              );
            }

            reject(error);
            return;
          }

          console.log('✅ PDF uploaded successfully with signed upload');

          resolve({
            publicId: result.public_id,
            fileName: `${fileName}.pdf`,
            size: result.bytes,
            url: result.secure_url,
            etag: result.etag,
            format: result.format,
            resourceType: result.resource_type,
          });
        }
      );

      // Write buffer to upload stream
      uploadStream.end(pdfBuffer);
    });
  }

  /**
   * Fallback: Upload PDF as image resource type (workaround for untrusted accounts)
   * @param {Buffer} pdfBuffer
   * @param {string} fileName
   * @returns {Promise<Object>}
   */
  async uploadPDFAsImageFallback(pdfBuffer, fileName) {
    if (!isCloudinaryConfigured) {
      throw new Error(
        'Cloudinary is not configured. Please check your environment variables.'
      );
    }

    return new Promise((resolve, reject) => {
      // Generate unique public ID
      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, '')
        .slice(0, 14);
      const shortId = uuidv4().split('-')[0];
      const publicId = `${CLOUD_FOLDER_PREFIX}/rental-agreements/${fileName}-${timestamp}-${shortId}`;

      console.log(
        '⚠️  Using fallback: uploading PDF as image resource type...'
      );

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image', // Use 'image' instead of 'raw' as fallback
          format: 'pdf',
          use_filename: false,
          unique_filename: false,
          overwrite: true,
          type: 'upload', // Public upload type
          access_mode: 'public', // Make publicly accessible
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary PDF fallback upload error:', error);
            reject(error);
            return;
          }

          console.log('✅ PDF uploaded successfully using image fallback');

          // Generate proper PDF access URL for fallback uploads
          let accessUrl = result.secure_url;

          // If uploaded as image resource, create proper PDF delivery URL
          if (result.resource_type === 'image') {
            // Use fl_attachment to force download and bypass some restrictions
            accessUrl = cloudinary.url(result.public_id, {
              resource_type: 'image',
              format: 'pdf',
              flags: 'attachment',
              secure: true,
            });

            console.log(
              '📎 Generated PDF download URL for image resource:',
              accessUrl
            );
          }

          resolve({
            publicId: result.public_id,
            fileName: `${fileName}.pdf`,
            size: result.bytes,
            url: accessUrl, // Use the processed URL
            etag: result.etag,
            format: result.format,
            resourceType: result.resource_type,
          });
        }
      );

      // Write buffer to upload stream
      uploadStream.end(pdfBuffer);
    });
  }

  /**
   * Chrome path detection for macOS/Linux
   */
  getChromePath() {
    if (process.env.CHROME_PATH) {
      return process.env.CHROME_PATH;
    }

    const macChromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];

    for (const chromePath of macChromePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`🔍 Found Chrome at: ${chromePath}`);
        return chromePath;
      }
    }

    console.log(
      '⚠️  No Chrome installation found, using Puppeteer bundled Chromium'
    );
    return null;
  }

  /**
   * Generate accessible PDF URL from Cloudinary public_id
   * @param {string} publicId
   * @param {string} resourceType
   * @returns {string}
   */
  generateAccessiblePDFUrl(publicId, resourceType = 'raw') {
    // For both raw and image, try the simplest possible URL
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUD_NAME}`;

    if (resourceType === 'raw') {
      // Direct raw URL without any transformations
      return `${baseUrl}/raw/upload/${publicId}.pdf`;
    } else {
      // Direct image URL without transformations for PDF
      return `${baseUrl}/image/upload/${publicId}.pdf`;
    }
  }

  /**
   * Save PDF to local storage and return server URL
   * @param {Buffer} pdfBuffer
   * @param {string} fileName
   * @returns {Promise<Object>}
   */
  async saveToLocalStorage(pdfBuffer, fileName) {
    const fs = require('fs');
    const path = require('path');

    // Create uploads directory if it doesn't exist (using the same path as app.js route)
    const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    const shortId = uuidv4().split('-')[0];
    const uniqueFileName = `${fileName}-${timestamp}-${shortId}.pdf`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Save PDF to local file
    fs.writeFileSync(filePath, pdfBuffer);

    // Generate server URL using the correct route path
    const serverUrl = `${process.env.BASE_URL || 'http://localhost:3005'}/api/files/pdfs/${uniqueFileName}`;

    return {
      fileName: uniqueFileName,
      filePath: filePath,
      url: serverUrl,
      size: pdfBuffer.length,
      publicId: null, // Local files don't have publicId
    };
  }

  /**
   * Generate rental agreement PDF and upload to Cloudinary
   * @param {string} leaseId
   * @returns {Promise<Object>} Cloudinary upload result + RentalAgreement record
   */
  async generateAndUploadRentalAgreementPDF(leaseId) {
    try {
      console.log(
        `🚀 Starting rental agreement PDF generation for lease: ${leaseId}`
      );

      // 1. Get lease data dengan relasi lengkap
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
        include: {
          property: {
            include: {
              propertyType: true,
              amenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              phone: true,
            },
          },
          landlord: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      if (!lease) {
        throw new Error(`Lease with ID ${leaseId} not found`);
      }

      console.log(
        `📋 Retrieved lease data for property: ${lease.property.title}`
      );

      // 2. Generate QR codes for signatures
      console.log('📝 Generating e-signature QR codes...');

      const landlordSignData = {
        name: lease.landlord.name,
        timestamp: new Date().toISOString(),
        leaseId: lease.id,
        role: 'landlord',
      };

      const tenantSignData = {
        name: lease.tenant.name,
        timestamp: new Date().toISOString(),
        leaseId: lease.id,
        role: 'tenant',
      };

      const [landlordQRCode, tenantQRCode] = await Promise.all([
        getSignatureQRCode(landlordSignData),
        getSignatureQRCode(tenantSignData),
      ]);

      console.log('✅ QR codes generated successfully');

      // 3. Prepare data untuk template EJS
      const templateData = {
        rentalAgreement: {
          id: `RA-${lease.id.slice(-8).toUpperCase()}-${new Date().getFullYear()}`,
        },
        lease: lease,
        signatures: {
          landlord: {
            qrCode: landlordQRCode,
            signDate: new Date().toLocaleDateString('id-ID'),
            name: lease.landlord.name,
          },
          tenant: {
            qrCode: tenantQRCode,
            signDate: new Date().toLocaleDateString('id-ID'),
            name: lease.tenant.name,
          },
        },
      };

      // 4. Read dan render EJS template
      const templatePath = path.join(
        __dirname,
        '../../templates/rental-agreement.ejs'
      );
      console.log('📖 Reading template from:', templatePath);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      console.log('⚡ Rendering EJS template...');
      const html = ejs.render(templateContent, templateData);

      // 5. Generate PDF menggunakan Puppeteer
      console.log('🌐 Launching browser for PDF generation...');

      const chromePath = this.getChromePath();
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      };

      if (chromePath) {
        launchOptions.executablePath = chromePath;
      }

      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      console.log('📄 Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
        preferCSSPageSize: true,
      });

      await browser.close();
      console.log(
        `✅ PDF generated successfully! Size: ${Math.round(pdfBuffer.length / 1024)} KB`
      );

      // 6. Save PDF locally with Cloudinary as backup
      console.log('💾 Saving PDF locally...');
      const fileName = `rental-agreement-${lease.id}`;

      let uploadResult;
      try {
        // Primary: Save to local storage
        uploadResult = await this.saveToLocalStorage(pdfBuffer, fileName);
        console.log('✅ PDF saved to local storage successfully!');
      } catch (localStorageError) {
        console.warn(
          '⚠️  Local storage failed, trying Cloudinary backup...',
          localStorageError.message
        );

        try {
          // Backup: Upload to Cloudinary with signed method
          uploadResult = await this.uploadPDFToCloudinary(pdfBuffer, fileName);
          console.log('✅ PDF uploaded to Cloudinary successfully as backup!');
        } catch (cloudinaryError) {
          console.error('❌ Both local storage and Cloudinary failed:', {
            localError: localStorageError.message,
            cloudinaryError: cloudinaryError.message,
          });
          throw new Error(
            `Failed to save PDF: Local storage failed (${localStorageError.message}), Cloudinary backup also failed (${cloudinaryError.message})`
          );
        }
      }

      console.log('📍 PDF URL:', uploadResult.url);

      // 7. Simpan record RentalAgreement ke database
      console.log('💾 Saving rental agreement record to database...');
      const rentalAgreement = await prisma.rentalAgreement.create({
        data: {
          leaseId: lease.id,
          pdfUrl: uploadResult.url,
          publicId: uploadResult.publicId,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.size,
        },
      });

      console.log('✅ Rental agreement record saved to database');

      return {
        success: true,
        message: 'Rental agreement PDF generated and uploaded successfully',
        data: {
          rentalAgreement,
          cloudinary: {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            fileName: uploadResult.fileName,
            size: uploadResult.size,
            etag: uploadResult.etag,
          },
        },
      };
    } catch (error) {
      console.error('❌ Error generating rental agreement PDF:', error.message);
      throw new Error(
        `Failed to generate rental agreement PDF: ${error.message}`
      );
    }
  }

  /**
   * Get rental agreement PDF for a lease
   * @param {string} leaseId
   * @returns {Promise<Object>}
   */
  async getRentalAgreementPDF(leaseId) {
    try {
      const rentalAgreement = await prisma.rentalAgreement.findUnique({
        where: { leaseId },
        include: {
          lease: {
            include: {
              property: {
                select: { id: true, title: true },
              },
              tenant: {
                select: { id: true, name: true, email: true },
              },
              landlord: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!rentalAgreement) {
        throw new Error('Rental agreement not found for this lease');
      }

      // Generate accessible URL based on how the file was stored
      let accessibleUrl = rentalAgreement.pdfUrl;

      // If we have publicId, generate a more accessible URL
      if (rentalAgreement.publicId) {
        // Determine resource type from the URL or publicId
        const resourceType = rentalAgreement.pdfUrl.includes('/image/upload/')
          ? 'image'
          : 'raw';
        accessibleUrl = this.generateAccessiblePDFUrl(
          rentalAgreement.publicId,
          resourceType
        );

        console.log('📎 Generated accessible PDF URL:', accessibleUrl);
      }

      return {
        success: true,
        data: {
          ...rentalAgreement,
          pdfUrl: accessibleUrl, // Use the accessible URL
        },
      };
    } catch (error) {
      throw new Error(`Failed to get rental agreement: ${error.message}`);
    }
  }

  /**
   * Check if rental agreement already exists for a lease
   * @param {string} leaseId
   * @returns {Promise<boolean>}
   */
  async rentalAgreementExists(leaseId) {
    const existing = await prisma.rentalAgreement.findUnique({
      where: { leaseId },
    });
    return !!existing;
  }
}

module.exports = new PDFGenerationService();
