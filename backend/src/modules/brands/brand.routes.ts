import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { getAuth, requirePermission } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/http-response.js';
import {
  addDomainSchema,
  addTrademarkSchema,
  BRAND_LIMITS,
  brandParamsSchema,
  createBrandSchema,
  domainParamsSchema,
  logoParamsSchema,
  monitoringSchema,
  trademarkParamsSchema,
  updateBrandSchema,
  updateTrademarkSchema,
} from './brand.schemas.js';
import { invalidLogo, type BrandService } from './brand.service.js';

/**
 * Reads one uploaded file from the multipart field `logo` into memory.
 *
 * Limits stop oversized or abusive uploads while they stream in: one file of
 * at most 1 MB, a few small text fields. Any parsing problem (too big, wrong
 * field, too many files, a broken body) becomes the same plain 400 the
 * website shows next to the upload button, never a 500.
 */
function receiveLogo(): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: BRAND_LIMITS.logoBytes, files: 1, fields: 5, fieldSize: 1024, parts: 6 },
    // Browsers send file names as UTF-8; multer's default would garble "Café.png".
    defParamCharset: 'utf8',
  }).single('logo');

  return (req, res, next) => {
    upload(req, res, (err: unknown) => {
      if (err) {
        next(invalidLogo());
        return;
      }
      next();
    });
  };
}

/**
 * /api/v1/brands — the organisation's protected brands.
 * Mounted behind `requireAuth`; every route also checks a permission from roles.ts.
 * The permission check runs before the upload is read, so a Viewer's upload is
 * refused without buffering it.
 */
export function createBrandRouter(service: BrandService): Router {
  const router = Router();
  const read = requirePermission('brands:read');
  const manage = requirePermission('brands:manage');

  router.get('/', read, async (_req, res) => {
    sendSuccess(res, await service.list(getAuth(res)));
  });

  router.post('/', manage, async (req, res) => {
    const input = createBrandSchema.parse(req.body);
    sendSuccess(res, await service.create(getAuth(res), input), 201);
  });

  router.get('/:brandId', read, async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    sendSuccess(res, await service.get(getAuth(res), brandId));
  });

  router.patch('/:brandId', manage, async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    const input = updateBrandSchema.parse(req.body);
    sendSuccess(res, await service.update(getAuth(res), brandId, input));
  });

  router.delete('/:brandId', manage, async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    await service.remove(getAuth(res), brandId);
    sendSuccess(res, { deleted: true });
  });

  /* ---------------------------------------------------------------- Domains */

  router.post('/:brandId/domains', manage, async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    const { domain } = addDomainSchema.parse(req.body);
    sendSuccess(res, await service.addDomain(getAuth(res), brandId, domain), 201);
  });

  router.delete('/:brandId/domains/:domain', manage, async (req, res) => {
    const { brandId, domain } = domainParamsSchema.parse(req.params);
    sendSuccess(res, await service.removeDomain(getAuth(res), brandId, domain));
  });

  /* ------------------------------------------------------------- Trademarks */

  router.post('/:brandId/trademarks', manage, async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    const input = addTrademarkSchema.parse(req.body);
    sendSuccess(res, await service.addTrademark(getAuth(res), brandId, input), 201);
  });

  router.patch('/:brandId/trademarks/:trademarkId', manage, async (req, res) => {
    const { brandId, trademarkId } = trademarkParamsSchema.parse(req.params);
    const input = updateTrademarkSchema.parse(req.body);
    sendSuccess(res, await service.updateTrademark(getAuth(res), brandId, trademarkId, input));
  });

  router.delete('/:brandId/trademarks/:trademarkId', manage, async (req, res) => {
    const { brandId, trademarkId } = trademarkParamsSchema.parse(req.params);
    sendSuccess(res, await service.removeTrademark(getAuth(res), brandId, trademarkId));
  });

  /* ------------------------------------------------------------- Monitoring */

  router.put('/:brandId/monitoring', manage, async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    const input = monitoringSchema.parse(req.body);
    sendSuccess(res, await service.setMonitoring(getAuth(res), brandId, input));
  });

  /* ------------------------------------------------------------------ Logos */

  router.post('/:brandId/logos', manage, receiveLogo(), async (req, res) => {
    const { brandId } = brandParamsSchema.parse(req.params);
    const file = req.file && { originalName: req.file.originalname, bytes: req.file.buffer };
    sendSuccess(res, await service.addLogo(getAuth(res), brandId, file), 201);
  });

  router.delete('/:brandId/logos/:logoId', manage, async (req, res) => {
    const { brandId, logoId } = logoParamsSchema.parse(req.params);
    sendSuccess(res, await service.removeLogo(getAuth(res), brandId, logoId));
  });

  router.get('/:brandId/logos/:logoId', read, async (req, res) => {
    const { brandId, logoId } = logoParamsSchema.parse(req.params);
    const logo = await service.getLogo(getAuth(res), brandId, logoId);
    res.set({
      'Content-Type': logo.contentType, // from the sniffed bytes, never the upload's claim
      'Content-Length': String(logo.data.length),
      'X-Content-Type-Options': 'nosniff',
      // Even opened directly, the image can't run or load anything.
      'Content-Security-Policy': "default-src 'none'",
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
    });
    res.status(200).end(logo.data);
  });

  return router;
}
