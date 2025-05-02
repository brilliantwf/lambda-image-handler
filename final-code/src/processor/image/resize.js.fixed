"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResizeAction = void 0;
const sharp = require("sharp");
const __1 = require("..");
const is = require("../../is");
const _base_1 = require("./_base");
class ResizeAction extends _base_1.BaseImageAction {
    constructor() {
        super(...arguments);
        this.name = 'resize';
    }
    validate(params) {
        const opt = {
            m: "lfit" /* LFIT */,
            limit: true,
            color: '#FFFFFF',
        };
        for (const param of params) {
            if ((this.name === param) || (!param)) {
                continue;
            }
            const [k, v] = param.split('_');
            if (k === 'w') {
                opt.w = Number.parseInt(v, 10);
            }
            else if (k === 'h') {
                opt.h = Number.parseInt(v, 10);
            }
            else if (k === 'l') {
                opt.l = Number.parseInt(v, 10);
            }
            else if (k === 's') {
                opt.s = Number.parseInt(v, 10);
            }
            else if (k === 'm') {
                if (v && ((v === "lfit" /* LFIT */) || (v === "mfit" /* MFIT */) || (v === "fill" /* FILL */) || (v === "pad" /* PAD */) || (v === "fixed" /* FIXED */))) {
                    opt.m = v;
                }
                else {
                    throw new __1.InvalidArgument(`Unkown m: "${v}"`);
                }
            }
            else if (k === 'limit') {
                if (v && (v === '0' || v === '1')) {
                    opt.limit = (v === '1');
                }
                else {
                    throw new __1.InvalidArgument(`Unkown limit: "${v}"`);
                }
            }
            else if (k === 'color') {
                const color = '#' + v;
                if (is.hexColor(color)) {
                    opt.color = color;
                }
                else {
                    throw new __1.InvalidArgument(`Unkown color: "${v}"`);
                }
            }
            else if (k === 'p') {
                const p = Number.parseInt(v, 10);
                if (is.inRange(p, 1, 1000)) {
                    opt.p = p;
                }
                else {
                    throw new __1.InvalidArgument(`Unkown p: "${v}"`);
                }
            }
            else {
                throw new __1.InvalidArgument(`Unkown param: "${k}"`);
            }
        }
        return opt;
    }
    async process(ctx, params) {
        const o = this.validate(params);
        const opt = {
            width: o.w,
            height: o.h,
            withoutEnlargement: o.limit,
            background: o.color,
        };
        // Mode
        if (o.m === "lfit" /* LFIT */) {
            opt.fit = sharp.fit.inside;
        }
        else if (o.m === "mfit" /* MFIT */) {
            opt.fit = sharp.fit.outside;
        }
        else if (o.m === "fill" /* FILL */) {
            opt.fit = sharp.fit.cover;
        }
        else if (o.m === "pad" /* PAD */) {
            opt.fit = sharp.fit.contain;
        }
        else if (o.m === "fixed" /* FIXED */) {
            opt.fit = sharp.fit.fill;
        }
        const metadata = ctx.metadata;
        if (!(metadata.width && metadata.height)) {
            throw new __1.InvalidArgument('Can\'t read image\'s width and height');
        }
        if (o.p && (!o.w) && (!o.h)) {
            opt.withoutEnlargement = false;
            opt.width = Math.round(metadata.width * o.p * 0.01);
        }
        else {
            if (o.l) {
                if (metadata.width > metadata.height) {
                    opt.width = o.l;
                }
                else {
                    opt.height = o.l;
                }
            }
            if (o.s) {
                if (metadata.height < metadata.width) {
                    opt.height = o.s;
                }
                else {
                    opt.width = o.s;
                }
            }
        }
        
        try {
            // 记录图像格式和调整大小参数，用于调试
            console.log(`Resizing image: format=${metadata.format}, width=${metadata.width}, height=${metadata.height}`);
            console.log(`Resize parameters:`, JSON.stringify(opt));
            
            // 对PNG图像使用特殊处理
            if (metadata.format === 'png') {
                // 确保明确指定宽度和高度参数
                if (opt.width || opt.height) {
                    ctx.image.resize(opt.width, opt.height, {
                        fit: opt.fit || sharp.fit.inside,
                        background: opt.background,
                        withoutEnlargement: opt.withoutEnlargement
                    });
                } else {
                    ctx.image.resize(null, null, opt);
                }
            } else {
                // 其他格式使用标准处理
                ctx.image.resize(null, null, opt);
            }
        } catch (error) {
            console.error(`Error resizing image (format: ${metadata.format}):`, error);
            throw error;
        }
    }
}
exports.ResizeAction = ResizeAction;
