"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatermarkAction = void 0;
const sharp = require("sharp");
const __1 = require("..");
const is = require("../../is");
const _base_1 = require("./_base");
const margin = 5;
class WatermarkAction extends _base_1.BaseImageAction {
    constructor() {
        super(...arguments);
        this.name = 'watermark';
    }
    beforeNewContext(ctx, params) {
        this.validate(params);
        ctx.features[__1.Features.ReadAllAnimatedFrames] = false;
    }
    validate(params) {
        const opt = {
            text: '',
            t: 100,
            g: 'southeast',
            fill: false,
            rotate: 0,
            size: 40,
            color: '000000',
            image: '',
            auto: true,
            order: 0,
            x: undefined,
            y: undefined,
            voffset: 0,
            interval: 0,
            align: 0,
            type: 'FZHei-B01',
            shadow: 0,
        };
        for (const param of params) {
            if ((this.name === param) || (!param)) {
                continue;
            }
            const [k, v] = param.split('_');
            if (k === 'text') {
                if (v) {
                    const buff = Buffer.from(v, 'base64');
                    opt.text = buff.toString('utf-8');
                }
            }
            else if (k === 'image') {
                if (v) {
                    const buff = Buffer.from(v, 'base64');
                    opt.image = buff.toString('utf-8');
                }
            }
            else if (k === 't') {
                opt.t = Number.parseInt(v, 10);
            }
            else if (k === 'x') {
                opt.x = Number.parseInt(v, 10);
                if (opt.x < 0 || opt.x > 4096) {
                    throw new __1.InvalidArgument('Watermark param \'x\' must be between 0 and 4096');
                }
            }
            else if (k === 'y') {
                opt.y = Number.parseInt(v, 10);
                if (opt.y < 0 || opt.y > 4096) {
                    throw new __1.InvalidArgument('Watermark param \'y\' must be between 0 and 4096');
                }
            }
            else if (k === 'voffset') {
                opt.voffset = Number.parseInt(v, 10);
                if (opt.voffset < -1000 || opt.voffset > 1000) {
                    throw new __1.InvalidArgument('Watermark param \'voffset\' must be between -1000 and 1000');
                }
            }
            else if (k === 'order') {
                opt.order = Number.parseInt(v, 10);
            }
            else if (k === 'interval') {
                opt.interval = Number.parseInt(v, 10);
                if (opt.interval < 0 || opt.interval > 1000) {
                    throw new __1.InvalidArgument('Watermark param \'interval\' must be between 0 and 1000');
                }
            }
            else if (k === 'align') {
                opt.align = Number.parseInt(v, 10);
            }
            else if (k === 'g') {
                opt.g = this.gravityConvert(v);
            }
            else if (k === 'size') {
                const size = Number.parseInt(v, 10);
                opt.size = size;
                if (opt.size < 0 || opt.size > 1000) {
                    throw new __1.InvalidArgument('Watermark param \'size\' must be between 0 and 4096');
                }
            }
            else if (k === 'fill') {
                if (v && (v === '0' || v === '1')) {
                    opt.fill = (v === '1');
                }
                else {
                    throw new __1.InvalidArgument('Watermark param \'fill\' must be 0 or 1');
                }
            }
            else if (k === 'auto') {
                if (v && (v === '0' || v === '1')) {
                    opt.auto = (v === '1');
                }
                else {
                    throw new __1.InvalidArgument('Watermark param \'auto\' must be 0 or 1');
                }
            }
            else if (k === 'rotate') {
                const rotate = Number.parseInt(v, 10);
                if (0 <= rotate && 360 >= rotate) {
                    if (rotate === 360) {
                        opt.rotate = 0;
                    }
                    else {
                        opt.rotate = rotate;
                    }
                }
                else {
                    throw new __1.InvalidArgument('Watermark param \'rotate\' must be between 0 and 360');
                }
            }
            else if (k === 'color') {
                opt.color = v;
            }
            else if (k === 'type') {
                if (v) {
                    const buff = Buffer.from(v, 'base64');
                    opt.type = buff.toString('utf-8');
                }
            }
            else if (k === 'shadow') {
                const shadow = Number.parseInt(v, 10);
                if (is.inRange(shadow, 0, 100)) {
                    opt.shadow = shadow;
                }
                else {
                    throw new __1.InvalidArgument('Watermark param \'shadow\' must be between 0 and 100');
                }
            }
            else {
                throw new __1.InvalidArgument(`Unkown param: "${k}"`);
            }
        }
        if (!opt.text && !opt.image) {
            throw new __1.InvalidArgument('Watermark param \'text\' and \'image\' should not be empty at the same time');
        }
        return opt;
    }
    async process(ctx, params) {
        const opt = this.validate(params);
        if (opt.text && opt.image) {
            await this.mixedWaterMark(ctx, opt);
        }
        else if (opt.text) {
            await this.textWaterMark(ctx, opt);
        }
        else {
            await this.imgWaterMark(ctx, opt);
        }
    }
    async textWaterMark(ctx, opt) {
        const textOpt = this.calculateTextSize(opt.text, opt.size);
        const svg = this.textSvgStr(opt, textOpt, true, opt.shadow / 100);
        const svgBytes = Buffer.from(svg);
        const metadata = await ctx.image.metadata();
        if (0 < opt.rotate) {
            // hard to rotate the svg directly, so attach it on image, then rotate the image
            const overlapImg = this.textSvgImg(svgBytes, textOpt);
            const overlapImgBuffer = await overlapImg.png().toBuffer();
            let optOverlapImg = sharp(overlapImgBuffer).png();
            if (0 < opt.rotate) {
                optOverlapImg = optOverlapImg.rotate(opt.rotate, { background: '#00000000' });
            }
            const watermarkImg = await this.autoResizeImg(optOverlapImg, ctx, opt, textOpt);
            const markMetadata = await watermarkImg.metadata();
            const pos = this.calculateImgPos(opt, metadata, markMetadata);
            const rotateOverlabImgBuffer = await watermarkImg.toBuffer();
            ctx.image.composite([{ input: rotateOverlabImgBuffer, tile: opt.fill, gravity: opt.g, top: pos.y, left: pos.x }]);
        }
        else {
            const resizeOpt = this.autoCalculateResize(metadata, opt, textOpt);
            let bt = svgBytes;
            if (resizeOpt.need) {
                // hard to resize the svg directly, so attach it on image, then resize the image
                let overlapImg = this.textSvgImg(svgBytes, textOpt);
                const overlapImgBuffer = await overlapImg.png().toBuffer();
                overlapImg = sharp(overlapImgBuffer).png();
                overlapImg = overlapImg.resize(resizeOpt.width, resizeOpt.height);
                bt = await overlapImg.toBuffer();
            }
            const pos = this.calculatePos(opt, metadata.width, metadata.height, resizeOpt.width, resizeOpt.height);
            ctx.image.composite([{ input: bt, tile: opt.fill, gravity: opt.g, top: pos.y, left: pos.x }]);
        }
    }
    async imgWaterMark(ctx, opt) {
        const bs = ctx.bufferStore;
        const watermarkImgBuffer = (await bs.get(opt.image)).buffer;
        let watermarkImg = sharp(watermarkImgBuffer).png();
        if (0 < opt.rotate) {
            watermarkImg = sharp(await watermarkImg.toBuffer());
            const bt = await watermarkImg.rotate(opt.rotate, { background: '#ffffff' }).toBuffer();
            watermarkImg = sharp(bt);
        }
        // auto scale warkmark size
        const metadata = await ctx.image.metadata();
        const markMetadata = await watermarkImg.metadata();
        if (opt.auto) {
            // check the warkmark image size, if bigger than backgroud image, need resize the overlay
            let width = markMetadata.width;
            let height = markMetadata.height;
            let needResize = false;
            if (markMetadata.width && metadata.width && markMetadata.width > metadata.width) {
                width = metadata.width - 1;
                needResize = true;
            }
            if (markMetadata.height && metadata.height && markMetadata.height > metadata.height) {
                height = metadata.height - 1;
                needResize = true;
            }
            if (needResize) {
                watermarkImg = watermarkImg.resize(width, height);
            }
        }
        const pos = this.calculateImgPos(opt, metadata, markMetadata);
        const overlay = await this.extraImgOverlay(ctx, watermarkImg, markMetadata, opt, pos);
        ctx.image.composite([overlay]);
    }
    async mixedWaterMark(ctx, opt) {
        const bs = ctx.bufferStore;
        const textOpt = this.calculateTextSize(opt.text, opt.size);
        const svg = this.textSvgStr(opt, textOpt, false, opt.shadow / 100);
        const svgBytes = Buffer.from(svg);
        const watermarkImgBuffer = (await bs.get(opt.image)).buffer;
        const watermarkImg = sharp(watermarkImgBuffer).png();
        const imgMetadata = await watermarkImg.metadata();
        const imgW = imgMetadata.width ? imgMetadata.width : 0;
        const imgH = imgMetadata.height ? imgMetadata.height : 0;
        const gravityOpt = this.calculateMixedGravity(opt);
        const wbt = await watermarkImg.toBuffer();
        const metadata = await ctx.image.metadata();
        const expectedWidth = textOpt.width + imgW + opt.interval;
        const expectedHeight = Math.max(textOpt.height, imgH);
        let overlapImg = sharp({
            create: {
                width: expectedWidth,
                height: expectedHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        }).composite([{ input: svgBytes, gravity: gravityOpt.textGravity }, { input: wbt, gravity: gravityOpt.imgGravity }]);
        let alWidth = expectedWidth;
        let alHeight = expectedHeight;
        let needResize = false;
        if (metadata.width && expectedWidth > metadata.width) {
            alWidth = Math.min(expectedWidth, metadata.width) - 1;
            needResize = true;
        }
        if (metadata.height && expectedHeight > metadata.height) {
            alHeight = Math.min(expectedHeight, metadata.height) - 1;
            needResize = true;
        }
        if (needResize) {
            overlapImg.resize(alWidth, alHeight);
        }
        const markMeta = await overlapImg.metadata();
        const pos = this.calculateImgPos(opt, metadata, markMeta);
        const overlay = await this.extraImgOverlay(ctx, overlapImg, imgMetadata, opt, pos);
        ctx.image.composite([overlay]);
    }
    gravityConvert(param) {
        if (['north', 'west', 'east', 'south', 'center', 'centre', 'southeast', 'southwest', 'northwest'].includes(param)) {
            return param;
        }
        else if (param === 'se') {
            return 'southeast';
        }
        else if (param === 'sw') {
            return 'southwest';
        }
        else if (param === 'nw') {
            return 'northwest';
        }
        else if (param === 'ne') {
            return 'northeast';
        }
        else {
            throw new __1.InvalidArgument('Watermark param \'g\' must be in \'north\', \'west\', \'east\', \'south\', \'center\', \'centre\', \'southeast\', \'southwest\', \'northwest\'');
        }
    }
    calculateTextSize(text, fontSize) {
        let cWidth = 0;
        for (let v of text) {
            const charCode = v.charCodeAt(0);
            if (charCode > 256) {
                cWidth += fontSize;
            }
            else if (charCode > 97) {
                cWidth += fontSize / 2;
            }
            else {
                cWidth += fontSize * 0.8;
            }
        }
        return {
            width: Math.round(cWidth + margin),
            height: Math.round(fontSize * 1.2),
        };
    }
    textSvgStr(opt, textOpt, applyOpacity = true, shadow = 0) {
        const xOffset = Math.round(textOpt.width / 2);
        const yOffset = Math.round(textOpt.height * 0.8);
        const color = `#${opt.color}`;
        const opacity = applyOpacity ? opt.t / 100 : 1;
        // https://gitlab.gnome.org/GNOME/librsvg/-/blob/main/FEATURES.md
        // https://gitlab.gnome.org/GNOME/librsvg/-/merge_requests/529
        // https://github.com/lovell/sharp/issues/1490#issuecomment-1162760143
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${textOpt.width} ${textOpt.height}" text-anchor="middle">
    <text filter="drop-shadow(rgba(0,0,0,${shadow}) 2px 0px 2px)" font-size="${opt.size}" x="${xOffset}" y="${yOffset}" fill="${color}" opacity="${opacity}" font-family="${opt.type}">${opt.text}</text>
    </svg>`;
        return svg;
    }
    textSvgImg(svgBytes, textOpt) {
        const overlapImg = sharp({
            create: {
                width: textOpt.width + margin,
                height: textOpt.height + margin,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        }).composite([{ input: svgBytes }]);
        return overlapImg;
    }
    calculateImgPos(opt, metadata, markMetadata) {
        return this.calculatePos(opt, metadata.width, metadata.height, markMetadata.width, markMetadata.height);
    }
    calculatePos(opt, sourceW, sourceH, markW, markH) {
        let imgX = undefined;
        let imgY = undefined;
        if (markW && sourceW && markH && sourceH) {
            if (['east', 'west', 'center'].includes(opt.g)) {
                imgY = Math.round((sourceH - markH) / 2) + opt.voffset;
            }
            else {
                const checkY = opt.y ? opt.y : 0;
                if (opt.g.startsWith('south')) {
                    imgY = sourceH - markH - checkY;
                }
                else {
                    imgY = checkY;
                }
            }
            if (['north', 'south'].includes(opt.g)) {
                imgX = Math.round((sourceW - markW) / 2);
                if (!imgY) {
                    if (opt.g === 'north') {
                        imgY = 0;
                    }
                    else {
                        imgY = sourceH - markH;
                    }
                }
            }
            else {
                const checkX = opt.x ? opt.x : 0;
                if (opt.g.endsWith('east')) {
                    imgX = sourceW - markW - checkX;
                }
                else if (opt.g === 'center') {
                    imgX = Math.round((sourceW - markW) / 2);
                }
                else {
                    imgX = checkX;
                }
            }
        }
        return {
            x: imgX,
            y: imgY,
        };
    }
    calculateMixedGravity(opt) {
        let imgGravity = 'west';
        let txtGravity = 'east';
        if (opt.order === 1) {
            if (opt.align === 1) {
                imgGravity = 'east';
                txtGravity = 'west';
            }
            else if (opt.align === 2) {
                imgGravity = 'southeast';
                txtGravity = 'southwest';
            }
            else {
                imgGravity = 'northeast';
                txtGravity = 'northwest';
            }
        }
        else {
            if (opt.align === 1) {
                imgGravity = 'west';
                txtGravity = 'east';
            }
            else if (opt.align === 2) {
                imgGravity = 'southwest';
                txtGravity = 'southeast';
            }
            else {
                imgGravity = 'northwest';
                txtGravity = 'northeast';
            }
        }
        return {
            imgGravity: imgGravity,
            textGravity: txtGravity,
        };
    }
    async autoResizeImg(source, ctx, opt, textOpt) {
        if (opt.auto) {
            let w = textOpt.width;
            let h = textOpt.height;
            let needResize = false;
            const overlapImgMeta = await source.metadata();
            const metadata = await ctx.image.metadata();
            if (overlapImgMeta.width && metadata.width && overlapImgMeta.width > metadata.width) {
                w = metadata.width - 10;
                needResize = true;
            }
            if (overlapImgMeta.height && metadata.height && overlapImgMeta.height > metadata.height) {
                h = metadata.height - 10;
                needResize = true;
            }
            if (needResize) {
                const overlapImgBuffer = await source.toBuffer();
                source = sharp(overlapImgBuffer);
                source = source.resize(w, h);
            }
        }
        return source;
    }
    autoCalculateResize(metadata, opt, textOpt) {
        if (opt.auto) {
            let w = textOpt.width;
            let h = textOpt.height;
            let needResize = false;
            if (metadata.width && metadata.width < textOpt.width) {
                w = metadata.width;
                needResize = true;
            }
            if (metadata.height && metadata.height < textOpt.height) {
                h = metadata.height;
                needResize = true;
            }
            return {
                need: needResize,
                width: w,
                height: h,
            };
        }
        return {
            need: false,
            width: textOpt.width,
            height: textOpt.height,
        };
    }
    async extraImgOverlay(ctx, markImg, markMetadata, opt, pos) {
        if (opt.t < 100 && !markMetadata.hasAlpha) {
            // jpeg or other no alpha image, we change the opacity by change the alpha channel
            markImg = markImg.removeAlpha().ensureAlpha(opt.t / 100);
        }
        const bt = await markImg.png().toBuffer();
        const overlay = { input: bt, tile: opt.fill, gravity: opt.g };
        if (pos) {
            overlay.top = pos.y;
            overlay.left = pos.x;
        }
        if (opt.t < 100 && markMetadata.hasAlpha) {
            // png or other image with alpha, we change the opacity by change the combined image
            const overForPng = sharp(await ctx.image.toBuffer()).png();
            const overBuffer = await overForPng.composite([overlay]).removeAlpha().ensureAlpha(opt.t / 100).toBuffer();
            const overlay2 = { input: overBuffer };
            return overlay2;
        }
        return overlay;
    }
}
exports.WatermarkAction = WatermarkAction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0ZXJtYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Byb2Nlc3Nvci9pbWFnZS93YXRlcm1hcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQStCO0FBRS9CLDBCQUF1RjtBQUN2RiwrQkFBK0I7QUFDL0IsbUNBQTBDO0FBQzFDLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQztBQTJDakIsTUFBYSxlQUFnQixTQUFRLHVCQUFlO0lBQXBEOztRQUNrQixTQUFJLEdBQVcsV0FBVyxDQUFDO0lBMmQ3QyxDQUFDO0lBemRRLGdCQUFnQixDQUFDLEdBQW9CLEVBQUUsTUFBZ0I7UUFDNUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUN2RCxDQUFDO0lBRU0sUUFBUSxDQUFDLE1BQWdCO1FBQzlCLE1BQU0sR0FBRyxHQUFrQjtZQUN6QixJQUFJLEVBQUUsRUFBRTtZQUNSLENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLFdBQVc7WUFDZCxJQUFJLEVBQUUsS0FBSztZQUNYLE1BQU0sRUFBRSxDQUFDO1lBQ1QsSUFBSSxFQUFFLEVBQUU7WUFDUixLQUFLLEVBQUUsUUFBUTtZQUNmLEtBQUssRUFBRSxFQUFFO1lBQ1QsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsQ0FBQztZQUNSLENBQUMsRUFBRSxTQUFTO1lBQ1osQ0FBQyxFQUFFLFNBQVM7WUFDWixPQUFPLEVBQUUsQ0FBQztZQUNWLFFBQVEsRUFBRSxDQUFDO1lBQ1gsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLEVBQUUsV0FBVztZQUNqQixNQUFNLEVBQUUsQ0FBQztTQUNWLENBQUM7UUFFRixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRTtZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLElB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RyxDQUFDLENBQUMsQ0FBQztTQUN0QjtRQUVELElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRTtZQUN4QyxvRkFBb0Y7WUFDcEYsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzNELE1BQU0sVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDM0csTUFBTSxRQUFRLEdBQXlCLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQzdELE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBNWRELDBDQTRkQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCB7IElJbWFnZUNvbnRleHQgfSBmcm9tICcuJztcbmltcG9ydCB7IElBY3Rpb25PcHRzLCBSZWFkT25seSwgSW52YWxpZEFyZ3VtZW50LCBGZWF0dXJlcywgSVByb2Nlc3NDb250ZXh0IH0gZnJvbSAnLi4nO1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnLi4vLi4vaXMnO1xuaW1wb3J0IHsgQmFzZUltYWdlQWN0aW9uIH0gZnJvbSAnLi9fYmFzZSc7XG5jb25zdCBtYXJnaW4gPSA1O1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhdGVybWFya09wdHMgZXh0ZW5kcyBJQWN0aW9uT3B0cyB7XG4gIHRleHQ6IHN0cmluZztcbiAgdDogbnVtYmVyOyAvLyDkuI3pgI/mmI7luqZcbiAgZzogc3RyaW5nOyAvLyDkvY3nva5cbiAgZmlsbDogYm9vbGVhbjsgLy8g5paH5a2X5piv5ZCm6YeN5aSNXG4gIHJvdGF0ZTogbnVtYmVyOyAvLyDmloflrZfml4vovazop5LluqZcbiAgc2l6ZTogbnVtYmVyOyAvLyDmloflrZflpKflsI9cbiAgY29sb3I6IHN0cmluZzsgLy8g5paH5a2X6aKc6ImyXG4gIGltYWdlOiBzdHJpbmc7IC8vIGltZyDmsLTljbBVUkxcbiAgYXV0bzogYm9vbGVhbjsgLy8g6Ieq5Yqo6LCD5pW05rC05Y2w5Zu+54mH5aSn5bCP5Lul6YCC5bqU6IOM5pmvXG4gIHg/OiBudW1iZXI7IC8vIOWbvuaWh+awtOWNsOeahHjkvY3nva5cbiAgeT86IG51bWJlcjsgLy8g5Zu+5paH5rC05Y2w55qEeeS9jee9rlxuICB2b2Zmc2V0OiBudW1iZXI7IC8vIOWbvuaWh+awtOWNsOeahOWxheS4reaXtuWAmeeahOWBj+enu+S9jee9rlxuICBvcmRlcjogbnVtYmVyOyAvLyDlm77mlofmt7fmjpLkuK3vvIzmloflrZflm77niYfnmoTlhYjlkI7pobrluo9cbiAgaW50ZXJ2YWw6IG51bWJlcjsgLy8g5Zu+5paH5re35o6S5Lit77yM5Zu+54mH5ZKM5paH5a2X6Ze06ZqUXG4gIGFsaWduOiBudW1iZXI7IC8vIOWbvuaWh+a3t+aOkuS4re+8jOWbvueJh+WSjOaWh+Wtl+WvueWFtuaWueW8j1xuICB0eXBlOiBzdHJpbmc7IC8vIOWtl+S9k1xuICBzaGFkb3c6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdhdGVybWFya1RleHRPcHRzIGV4dGVuZHMgSUFjdGlvbk9wdHMge1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdhdGVybWFya1RleHRSZXNpemVPcHRzIGV4dGVuZHMgSUFjdGlvbk9wdHMge1xuICBuZWVkOiBib29sZWFuO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdhdGVybWFya1Bvc09wdHMgZXh0ZW5kcyBJQWN0aW9uT3B0cyB7XG4gIHg/OiBudW1iZXI7XG4gIHk/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBXYXRlcm1hcmtNaXhlZEdyYXZpdHlPcHRzIGV4dGVuZHMgSUFjdGlvbk9wdHMge1xuICBpbWdHcmF2aXR5OiBzdHJpbmc7XG4gIHRleHRHcmF2aXR5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBXYXRlcm1hcmtBY3Rpb24gZXh0ZW5kcyBCYXNlSW1hZ2VBY3Rpb24ge1xuICBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nID0gJ3dhdGVybWFyayc7XG5cbiAgcHVibGljIGJlZm9yZU5ld0NvbnRleHQoY3R4OiBJUHJvY2Vzc0NvbnRleHQsIHBhcmFtczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICB0aGlzLnZhbGlkYXRlKHBhcmFtcyk7XG4gICAgY3R4LmZlYXR1cmVzW0ZlYXR1cmVzLlJlYWRBbGxBbmltYXRlZEZyYW1lc10gPSBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyB2YWxpZGF0ZShwYXJhbXM6IHN0cmluZ1tdKTogUmVhZE9ubHk8V2F0ZXJtYXJrT3B0cz4ge1xuICAgIGNvbnN0IG9wdDogV2F0ZXJtYXJrT3B0cyA9IHtcbiAgICAgIHRleHQ6ICcnLFxuICAgICAgdDogMTAwLFxuICAgICAgZzogJ3NvdXRoZWFzdCcsXG4gICAgICBmaWxsOiBmYWxzZSxcbiAgICAgIHJvdGF0ZTogMCxcbiAgICAgIHNpemU6IDQwLFxuICAgICAgY29sb3I6ICcwMDAwMDAnLFxuICAgICAgaW1hZ2U6ICcnLFxuICAgICAgYXV0bzogdHJ1ZSxcbiAgICAgIG9yZGVyOiAwLFxuICAgICAgeDogdW5kZWZpbmVkLFxuICAgICAgeTogdW5kZWZpbmVkLFxuICAgICAgdm9mZnNldDogMCxcbiAgICAgIGludGVydmFsOiAwLFxuICAgICAgYWxpZ246IDAsXG4gICAgICB0eXBlOiAnRlpIZWktQjAxJyxcbiAgICAgIHNoYWRvdzogMCxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCBwYXJhbSBvZiBwYXJhbXMpIHtcbiAgICAgIGlmICgodGhpcy5uYW1lID09PSBwYXJhbSkgfHwgKCFwYXJhbSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBbaywgdl0gPSBwYXJhbS5zcGxpdCgnXycpO1xuICAgICAgaWYgKGsgPT09ICd0ZXh0Jykge1xuICAgICAgICBpZiAodikge1xuICAgICAgICAgIGNvbnN0IGJ1ZmYgPSBCdWZmZXIuZnJvbSh2LCAnYmFzZTY0Jyk7XG4gICAgICAgICAgb3B0LnRleHQgPSBidWZmLnRvU3RyaW5nKCd1dGYtOCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdpbWFnZScpIHtcbiAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICBjb25zdCBidWZmID0gQnVmZmVyLmZyb20odiwgJ2Jhc2U2NCcpO1xuICAgICAgICAgIG9wdC5pbWFnZSA9IGJ1ZmYudG9TdHJpbmcoJ3V0Zi04Jyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3QnKSB7XG4gICAgICAgIG9wdC50ID0gTnVtYmVyLnBhcnNlSW50KHYsIDEwKTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3gnKSB7XG4gICAgICAgIG9wdC54ID0gTnVtYmVyLnBhcnNlSW50KHYsIDEwKTtcbiAgICAgICAgaWYgKG9wdC54IDwgMCB8fCBvcHQueCA+IDQwOTYpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50KCdXYXRlcm1hcmsgcGFyYW0gXFwneFxcJyBtdXN0IGJlIGJldHdlZW4gMCBhbmQgNDA5NicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICd5Jykge1xuICAgICAgICBvcHQueSA9IE51bWJlci5wYXJzZUludCh2LCAxMCk7XG4gICAgICAgIGlmIChvcHQueSA8IDAgfHwgb3B0LnkgPiA0MDk2KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudCgnV2F0ZXJtYXJrIHBhcmFtIFxcJ3lcXCcgbXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDQwOTYnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrID09PSAndm9mZnNldCcpIHtcbiAgICAgICAgb3B0LnZvZmZzZXQgPSBOdW1iZXIucGFyc2VJbnQodiwgMTApO1xuICAgICAgICBpZiAob3B0LnZvZmZzZXQgPCAtMTAwMCB8fCBvcHQudm9mZnNldCA+IDEwMDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50KCdXYXRlcm1hcmsgcGFyYW0gXFwndm9mZnNldFxcJyBtdXN0IGJlIGJldHdlZW4gLTEwMDAgYW5kIDEwMDAnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrID09PSAnb3JkZXInKSB7XG4gICAgICAgIG9wdC5vcmRlciA9IE51bWJlci5wYXJzZUludCh2LCAxMCk7XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdpbnRlcnZhbCcpIHtcbiAgICAgICAgb3B0LmludGVydmFsID0gTnVtYmVyLnBhcnNlSW50KHYsIDEwKTtcbiAgICAgICAgaWYgKG9wdC5pbnRlcnZhbCA8IDAgfHwgb3B0LmludGVydmFsID4gMTAwMCkge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnQoJ1dhdGVybWFyayBwYXJhbSBcXCdpbnRlcnZhbFxcJyBtdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwMCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdhbGlnbicpIHtcbiAgICAgICAgb3B0LmFsaWduID0gTnVtYmVyLnBhcnNlSW50KHYsIDEwKTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ2cnKSB7XG4gICAgICAgIG9wdC5nID0gdGhpcy5ncmF2aXR5Q29udmVydCh2KTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3NpemUnKSB7XG4gICAgICAgIGNvbnN0IHNpemUgPSBOdW1iZXIucGFyc2VJbnQodiwgMTApO1xuICAgICAgICBvcHQuc2l6ZSA9IHNpemU7XG4gICAgICAgIGlmIChvcHQuc2l6ZSA8IDAgfHwgb3B0LnNpemUgPiAxMDAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudCgnV2F0ZXJtYXJrIHBhcmFtIFxcJ3NpemVcXCcgbXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDQwOTYnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrID09PSAnZmlsbCcpIHtcbiAgICAgICAgaWYgKHYgJiYgKHYgPT09ICcwJyB8fCB2ID09PSAnMScpKSB7XG4gICAgICAgICAgb3B0LmZpbGwgPSAodiA9PT0gJzEnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50KCdXYXRlcm1hcmsgcGFyYW0gXFwnZmlsbFxcJyBtdXN0IGJlIDAgb3IgMScpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdhdXRvJykge1xuICAgICAgICBpZiAodiAmJiAodiA9PT0gJzAnIHx8IHYgPT09ICcxJykpIHtcbiAgICAgICAgICBvcHQuYXV0byA9ICh2ID09PSAnMScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnQoJ1dhdGVybWFyayBwYXJhbSBcXCdhdXRvXFwnIG11c3QgYmUgMCBvciAxJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3JvdGF0ZScpIHtcbiAgICAgICAgY29uc3Qgcm90YXRlID0gTnVtYmVyLnBhcnNlSW50KHYsIDEwKTtcbiAgICAgICAgaWYgKDAgPD0gcm90YXRlICYmIDM2MCA+PSByb3RhdGUpIHtcbiAgICAgICAgICBpZiAocm90YXRlID09PSAzNjApIHtcbiAgICAgICAgICAgIG9wdC5yb3RhdGUgPSAwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHQucm90YXRlID0gcm90YXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50KCdXYXRlcm1hcmsgcGFyYW0gXFwncm90YXRlXFwnIG11c3QgYmUgYmV0d2VlbiAwIGFuZCAzNjAnKTtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdjb2xvcicpIHtcbiAgICAgICAgb3B0LmNvbG9yID0gdjtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3R5cGUnKSB7XG4gICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgY29uc3QgYnVmZiA9IEJ1ZmZlci5mcm9tKHYsICdiYXNlNjQnKTtcbiAgICAgICAgICBvcHQudHlwZSA9IGJ1ZmYudG9TdHJpbmcoJ3V0Zi04Jyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3NoYWRvdycpIHtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gTnVtYmVyLnBhcnNlSW50KHYsIDEwKTtcbiAgICAgICAgaWYgKGlzLmluUmFuZ2Uoc2hhZG93LCAwLCAxMDApKSB7XG4gICAgICAgICAgb3B0LnNoYWRvdyA9IHNoYWRvdztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50KCdXYXRlcm1hcmsgcGFyYW0gXFwnc2hhZG93XFwnIG11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudChgVW5rb3duIHBhcmFtOiBcIiR7a31cImApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW9wdC50ZXh0ICYmICFvcHQuaW1hZ2UpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnQoJ1dhdGVybWFyayBwYXJhbSBcXCd0ZXh0XFwnIGFuZCBcXCdpbWFnZVxcJyBzaG91bGQgbm90IGJlIGVtcHR5IGF0IHRoZSBzYW1lIHRpbWUnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0O1xuICB9XG5cblxuICBwdWJsaWMgYXN5bmMgcHJvY2VzcyhjdHg6IElJbWFnZUNvbnRleHQsIHBhcmFtczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvcHQgPSB0aGlzLnZhbGlkYXRlKHBhcmFtcyk7XG4gICAgaWYgKG9wdC50ZXh0ICYmIG9wdC5pbWFnZSkge1xuICAgICAgYXdhaXQgdGhpcy5taXhlZFdhdGVyTWFyayhjdHgsIG9wdCk7XG4gICAgfSBlbHNlIGlmIChvcHQudGV4dCkge1xuICAgICAgYXdhaXQgdGhpcy50ZXh0V2F0ZXJNYXJrKGN0eCwgb3B0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5pbWdXYXRlck1hcmsoY3R4LCBvcHQpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHRleHRXYXRlck1hcmsoY3R4OiBJSW1hZ2VDb250ZXh0LCBvcHQ6IFdhdGVybWFya09wdHMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ZXh0T3B0ID0gdGhpcy5jYWxjdWxhdGVUZXh0U2l6ZShvcHQudGV4dCwgb3B0LnNpemUpO1xuICAgIGNvbnN0IHN2ZyA9IHRoaXMudGV4dFN2Z1N0cihvcHQsIHRleHRPcHQsIHRydWUsIG9wdC5zaGFkb3cgLyAxMDApO1xuICAgIGNvbnN0IHN2Z0J5dGVzID0gQnVmZmVyLmZyb20oc3ZnKTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IGF3YWl0IGN0eC5pbWFnZS5tZXRhZGF0YSgpO1xuICAgIGlmICgwIDwgb3B0LnJvdGF0ZSkge1xuICAgICAgLy8gaGFyZCB0byByb3RhdGUgdGhlIHN2ZyBkaXJlY3RseSwgc28gYXR0YWNoIGl0IG9uIGltYWdlLCB0aGVuIHJvdGF0ZSB0aGUgaW1hZ2VcbiAgICAgIGNvbnN0IG92ZXJsYXBJbWcgPSB0aGlzLnRleHRTdmdJbWcoc3ZnQnl0ZXMsIHRleHRPcHQpO1xuXG4gICAgICBjb25zdCBvdmVybGFwSW1nQnVmZmVyID0gYXdhaXQgb3ZlcmxhcEltZy5wbmcoKS50b0J1ZmZlcigpO1xuICAgICAgbGV0IG9wdE92ZXJsYXBJbWcgPSBzaGFycChvdmVybGFwSW1nQnVmZmVyKS5wbmcoKTtcbiAgICAgIGlmICgwIDwgb3B0LnJvdGF0ZSkge1xuICAgICAgICBvcHRPdmVybGFwSW1nID0gb3B0T3ZlcmxhcEltZy5yb3RhdGUob3B0LnJvdGF0ZSwgeyBiYWNrZ3JvdW5kOiAnIzAwMDAwMDAwJyB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd2F0ZXJtYXJrSW1nID0gYXdhaXQgdGhpcy5hdXRvUmVzaXplSW1nKG9wdE92ZXJsYXBJbWcsIGN0eCwgb3B0LCB0ZXh0T3B0KTtcbiAgICAgIGNvbnN0IG1hcmtNZXRhZGF0YSA9IGF3YWl0IHdhdGVybWFya0ltZy5tZXRhZGF0YSgpO1xuXG4gICAgICBjb25zdCBwb3MgPSB0aGlzLmNhbGN1bGF0ZUltZ1BvcyhvcHQsIG1ldGFkYXRhLCBtYXJrTWV0YWRhdGEpO1xuICAgICAgY29uc3Qgcm90YXRlT3ZlcmxhYkltZ0J1ZmZlciA9IGF3YWl0IHdhdGVybWFya0ltZy50b0J1ZmZlcigpO1xuICAgICAgY3R4LmltYWdlLmNvbXBvc2l0ZShbeyBpbnB1dDogcm90YXRlT3ZlcmxhYkltZ0J1ZmZlciwgdGlsZTogb3B0LmZpbGwsIGdyYXZpdHk6IG9wdC5nLCB0b3A6IHBvcy55LCBsZWZ0OiBwb3MueCB9XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc2l6ZU9wdCA9IHRoaXMuYXV0b0NhbGN1bGF0ZVJlc2l6ZShtZXRhZGF0YSwgb3B0LCB0ZXh0T3B0KTtcbiAgICAgIGxldCBidDogQnVmZmVyID0gc3ZnQnl0ZXM7XG4gICAgICBpZiAocmVzaXplT3B0Lm5lZWQpIHtcbiAgICAgICAgLy8gaGFyZCB0byByZXNpemUgdGhlIHN2ZyBkaXJlY3RseSwgc28gYXR0YWNoIGl0IG9uIGltYWdlLCB0aGVuIHJlc2l6ZSB0aGUgaW1hZ2VcbiAgICAgICAgbGV0IG92ZXJsYXBJbWcgPSB0aGlzLnRleHRTdmdJbWcoc3ZnQnl0ZXMsIHRleHRPcHQpO1xuICAgICAgICBjb25zdCBvdmVybGFwSW1nQnVmZmVyID0gYXdhaXQgb3ZlcmxhcEltZy5wbmcoKS50b0J1ZmZlcigpO1xuICAgICAgICBvdmVybGFwSW1nID0gc2hhcnAob3ZlcmxhcEltZ0J1ZmZlcikucG5nKCk7XG4gICAgICAgIG92ZXJsYXBJbWcgPSBvdmVybGFwSW1nLnJlc2l6ZShyZXNpemVPcHQud2lkdGgsIHJlc2l6ZU9wdC5oZWlnaHQpO1xuICAgICAgICBidCA9IGF3YWl0IG92ZXJsYXBJbWcudG9CdWZmZXIoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvcyA9IHRoaXMuY2FsY3VsYXRlUG9zKG9wdCwgbWV0YWRhdGEud2lkdGgsIG1ldGFkYXRhLmhlaWdodCwgcmVzaXplT3B0LndpZHRoLCByZXNpemVPcHQuaGVpZ2h0KTtcbiAgICAgIGN0eC5pbWFnZS5jb21wb3NpdGUoW3sgaW5wdXQ6IGJ0LCB0aWxlOiBvcHQuZmlsbCwgZ3Jhdml0eTogb3B0LmcsIHRvcDogcG9zLnksIGxlZnQ6IHBvcy54IH1dKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBpbWdXYXRlck1hcmsoY3R4OiBJSW1hZ2VDb250ZXh0LCBvcHQ6IFdhdGVybWFya09wdHMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBicyA9IGN0eC5idWZmZXJTdG9yZTtcblxuICAgIGNvbnN0IHdhdGVybWFya0ltZ0J1ZmZlciA9IChhd2FpdCBicy5nZXQob3B0LmltYWdlKSkuYnVmZmVyO1xuICAgIGxldCB3YXRlcm1hcmtJbWcgPSBzaGFycCh3YXRlcm1hcmtJbWdCdWZmZXIpLnBuZygpO1xuXG4gICAgaWYgKDAgPCBvcHQucm90YXRlKSB7XG4gICAgICB3YXRlcm1hcmtJbWcgPSBzaGFycChhd2FpdCB3YXRlcm1hcmtJbWcudG9CdWZmZXIoKSk7XG4gICAgICBjb25zdCBidCA9IGF3YWl0IHdhdGVybWFya0ltZy5yb3RhdGUob3B0LnJvdGF0ZSwgeyBiYWNrZ3JvdW5kOiAnI2ZmZmZmZicgfSkudG9CdWZmZXIoKTtcbiAgICAgIHdhdGVybWFya0ltZyA9IHNoYXJwKGJ0KTtcbiAgICB9XG4gICAgLy8gYXV0byBzY2FsZSB3YXJrbWFyayBzaXplXG4gICAgY29uc3QgbWV0YWRhdGEgPSBhd2FpdCBjdHguaW1hZ2UubWV0YWRhdGEoKTtcbiAgICBjb25zdCBtYXJrTWV0YWRhdGEgPSBhd2FpdCB3YXRlcm1hcmtJbWcubWV0YWRhdGEoKTtcbiAgICBpZiAob3B0LmF1dG8pIHtcbiAgICAgIC8vIGNoZWNrIHRoZSB3YXJrbWFyayBpbWFnZSBzaXplLCBpZiBiaWdnZXIgdGhhbiBiYWNrZ3JvdWQgaW1hZ2UsIG5lZWQgcmVzaXplIHRoZSBvdmVybGF5XG4gICAgICBsZXQgd2lkdGggPSBtYXJrTWV0YWRhdGEud2lkdGg7XG4gICAgICBsZXQgaGVpZ2h0ID0gbWFya01ldGFkYXRhLmhlaWdodDtcbiAgICAgIGxldCBuZWVkUmVzaXplID0gZmFsc2U7XG5cbiAgICAgIGlmIChtYXJrTWV0YWRhdGEud2lkdGggJiYgbWV0YWRhdGEud2lkdGggJiYgbWFya01ldGFkYXRhLndpZHRoID4gbWV0YWRhdGEud2lkdGgpIHtcbiAgICAgICAgd2lkdGggPSBtZXRhZGF0YS53aWR0aCAtIDE7XG4gICAgICAgIG5lZWRSZXNpemUgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAobWFya01ldGFkYXRhLmhlaWdodCAmJiBtZXRhZGF0YS5oZWlnaHQgJiYgbWFya01ldGFkYXRhLmhlaWdodCA+IG1ldGFkYXRhLmhlaWdodCkge1xuICAgICAgICBoZWlnaHQgPSBtZXRhZGF0YS5oZWlnaHQgLSAxO1xuICAgICAgICBuZWVkUmVzaXplID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZWVkUmVzaXplKSB7XG4gICAgICAgIHdhdGVybWFya0ltZyA9IHdhdGVybWFya0ltZy5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHBvcyA9IHRoaXMuY2FsY3VsYXRlSW1nUG9zKG9wdCwgbWV0YWRhdGEsIG1hcmtNZXRhZGF0YSk7XG5cbiAgICBjb25zdCBvdmVybGF5ID0gYXdhaXQgdGhpcy5leHRyYUltZ092ZXJsYXkoY3R4LCB3YXRlcm1hcmtJbWcsIG1hcmtNZXRhZGF0YSwgb3B0LCBwb3MpO1xuICAgIGN0eC5pbWFnZS5jb21wb3NpdGUoW292ZXJsYXldKTtcbiAgfVxuXG5cbiAgYXN5bmMgbWl4ZWRXYXRlck1hcmsoY3R4OiBJSW1hZ2VDb250ZXh0LCBvcHQ6IFdhdGVybWFya09wdHMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBicyA9IGN0eC5idWZmZXJTdG9yZTtcbiAgICBjb25zdCB0ZXh0T3B0ID0gdGhpcy5jYWxjdWxhdGVUZXh0U2l6ZShvcHQudGV4dCwgb3B0LnNpemUpO1xuICAgIGNvbnN0IHN2ZyA9IHRoaXMudGV4dFN2Z1N0cihvcHQsIHRleHRPcHQsIGZhbHNlLCBvcHQuc2hhZG93IC8gMTAwKTtcbiAgICBjb25zdCBzdmdCeXRlcyA9IEJ1ZmZlci5mcm9tKHN2Zyk7XG5cbiAgICBjb25zdCB3YXRlcm1hcmtJbWdCdWZmZXIgPSAoYXdhaXQgYnMuZ2V0KG9wdC5pbWFnZSkpLmJ1ZmZlcjtcbiAgICBjb25zdCB3YXRlcm1hcmtJbWcgPSBzaGFycCh3YXRlcm1hcmtJbWdCdWZmZXIpLnBuZygpO1xuICAgIGNvbnN0IGltZ01ldGFkYXRhID0gYXdhaXQgd2F0ZXJtYXJrSW1nLm1ldGFkYXRhKCk7XG4gICAgY29uc3QgaW1nVyA9IGltZ01ldGFkYXRhLndpZHRoID8gaW1nTWV0YWRhdGEud2lkdGggOiAwO1xuICAgIGNvbnN0IGltZ0ggPSBpbWdNZXRhZGF0YS5oZWlnaHQgPyBpbWdNZXRhZGF0YS5oZWlnaHQgOiAwO1xuICAgIGNvbnN0IGdyYXZpdHlPcHQgPSB0aGlzLmNhbGN1bGF0ZU1peGVkR3Jhdml0eShvcHQpO1xuICAgIGNvbnN0IHdidCA9IGF3YWl0IHdhdGVybWFya0ltZy50b0J1ZmZlcigpO1xuXG4gICAgY29uc3QgbWV0YWRhdGEgPSBhd2FpdCBjdHguaW1hZ2UubWV0YWRhdGEoKTtcblxuICAgIGNvbnN0IGV4cGVjdGVkV2lkdGggPSB0ZXh0T3B0LndpZHRoICsgaW1nVyArIG9wdC5pbnRlcnZhbDtcbiAgICBjb25zdCBleHBlY3RlZEhlaWdodCA9IE1hdGgubWF4KHRleHRPcHQuaGVpZ2h0LCBpbWdIKTtcblxuICAgIGxldCBvdmVybGFwSW1nID0gc2hhcnAoe1xuICAgICAgY3JlYXRlOiB7XG4gICAgICAgIHdpZHRoOiBleHBlY3RlZFdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGV4cGVjdGVkSGVpZ2h0LFxuICAgICAgICBjaGFubmVsczogNCxcbiAgICAgICAgYmFja2dyb3VuZDogeyByOiAwLCBnOiAwLCBiOiAwLCBhbHBoYTogMCB9LFxuICAgICAgfSxcbiAgICB9KS5jb21wb3NpdGUoW3sgaW5wdXQ6IHN2Z0J5dGVzLCBncmF2aXR5OiBncmF2aXR5T3B0LnRleHRHcmF2aXR5IH0sIHsgaW5wdXQ6IHdidCwgZ3Jhdml0eTogZ3Jhdml0eU9wdC5pbWdHcmF2aXR5IH1dKTtcbiAgICBsZXQgYWxXaWR0aCA9IGV4cGVjdGVkV2lkdGg7XG4gICAgbGV0IGFsSGVpZ2h0ID0gZXhwZWN0ZWRIZWlnaHQ7XG4gICAgbGV0IG5lZWRSZXNpemUgPSBmYWxzZTtcbiAgICBpZiAobWV0YWRhdGEud2lkdGggJiYgZXhwZWN0ZWRXaWR0aCA+IG1ldGFkYXRhLndpZHRoKSB7XG4gICAgICBhbFdpZHRoID0gTWF0aC5taW4oZXhwZWN0ZWRXaWR0aCwgbWV0YWRhdGEud2lkdGgpIC0gMTtcbiAgICAgIG5lZWRSZXNpemUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobWV0YWRhdGEuaGVpZ2h0ICYmIGV4cGVjdGVkSGVpZ2h0ID4gbWV0YWRhdGEuaGVpZ2h0KSB7XG4gICAgICBhbEhlaWdodCA9IE1hdGgubWluKGV4cGVjdGVkSGVpZ2h0LCBtZXRhZGF0YS5oZWlnaHQpIC0gMTtcbiAgICAgIG5lZWRSZXNpemUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobmVlZFJlc2l6ZSkge1xuICAgICAgb3ZlcmxhcEltZy5yZXNpemUoYWxXaWR0aCwgYWxIZWlnaHQpO1xuICAgIH1cbiAgICBjb25zdCBtYXJrTWV0YSA9IGF3YWl0IG92ZXJsYXBJbWcubWV0YWRhdGEoKTtcbiAgICBjb25zdCBwb3MgPSB0aGlzLmNhbGN1bGF0ZUltZ1BvcyhvcHQsIG1ldGFkYXRhLCBtYXJrTWV0YSk7XG4gICAgY29uc3Qgb3ZlcmxheSA9IGF3YWl0IHRoaXMuZXh0cmFJbWdPdmVybGF5KGN0eCwgb3ZlcmxhcEltZywgaW1nTWV0YWRhdGEsIG9wdCwgcG9zKTtcbiAgICBjdHguaW1hZ2UuY29tcG9zaXRlKFtvdmVybGF5XSk7XG4gIH1cblxuICBncmF2aXR5Q29udmVydChwYXJhbTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoWydub3J0aCcsICd3ZXN0JywgJ2Vhc3QnLCAnc291dGgnLCAnY2VudGVyJywgJ2NlbnRyZScsICdzb3V0aGVhc3QnLCAnc291dGh3ZXN0JywgJ25vcnRod2VzdCddLmluY2x1ZGVzKHBhcmFtKSkge1xuICAgICAgcmV0dXJuIHBhcmFtO1xuICAgIH0gZWxzZSBpZiAocGFyYW0gPT09ICdzZScpIHtcbiAgICAgIHJldHVybiAnc291dGhlYXN0JztcbiAgICB9IGVsc2UgaWYgKHBhcmFtID09PSAnc3cnKSB7XG4gICAgICByZXR1cm4gJ3NvdXRod2VzdCc7XG4gICAgfSBlbHNlIGlmIChwYXJhbSA9PT0gJ253Jykge1xuICAgICAgcmV0dXJuICdub3J0aHdlc3QnO1xuICAgIH0gZWxzZSBpZiAocGFyYW0gPT09ICduZScpIHtcbiAgICAgIHJldHVybiAnbm9ydGhlYXN0JztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudCgnV2F0ZXJtYXJrIHBhcmFtIFxcJ2dcXCcgbXVzdCBiZSBpbiBcXCdub3J0aFxcJywgXFwnd2VzdFxcJywgXFwnZWFzdFxcJywgXFwnc291dGhcXCcsIFxcJ2NlbnRlclxcJywgXFwnY2VudHJlXFwnLCBcXCdzb3V0aGVhc3RcXCcsIFxcJ3NvdXRod2VzdFxcJywgXFwnbm9ydGh3ZXN0XFwnJyk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlVGV4dFNpemUodGV4dDogc3RyaW5nLCBmb250U2l6ZTogbnVtYmVyKTogV2F0ZXJtYXJrVGV4dE9wdHMge1xuICAgIGxldCBjV2lkdGggPSAwO1xuICAgIGZvciAobGV0IHYgb2YgdGV4dCkge1xuICAgICAgY29uc3QgY2hhckNvZGUgPSB2LmNoYXJDb2RlQXQoMCk7XG4gICAgICBpZiAoY2hhckNvZGUgPiAyNTYpIHtcbiAgICAgICAgY1dpZHRoICs9IGZvbnRTaXplO1xuICAgICAgfSBlbHNlIGlmIChjaGFyQ29kZSA+IDk3KSB7XG4gICAgICAgIGNXaWR0aCArPSBmb250U2l6ZSAvIDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjV2lkdGggKz0gZm9udFNpemUgKiAwLjg7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB3aWR0aDogTWF0aC5yb3VuZChjV2lkdGggKyBtYXJnaW4pLFxuICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGZvbnRTaXplICogMS4yKSxcbiAgICB9O1xuICB9XG4gIHRleHRTdmdTdHIob3B0OiBXYXRlcm1hcmtPcHRzLCB0ZXh0T3B0OiBXYXRlcm1hcmtUZXh0T3B0cywgYXBwbHlPcGFjaXR5OiBib29sZWFuID0gdHJ1ZSwgc2hhZG93OiBudW1iZXIgPSAwKTogc3RyaW5nIHtcbiAgICBjb25zdCB4T2Zmc2V0ID0gTWF0aC5yb3VuZCh0ZXh0T3B0LndpZHRoIC8gMik7XG4gICAgY29uc3QgeU9mZnNldCA9IE1hdGgucm91bmQodGV4dE9wdC5oZWlnaHQgKiAwLjgpO1xuICAgIGNvbnN0IGNvbG9yID0gYCMke29wdC5jb2xvcn1gO1xuICAgIGNvbnN0IG9wYWNpdHkgPSBhcHBseU9wYWNpdHkgPyBvcHQudCAvIDEwMCA6IDE7XG4gICAgLy8gaHR0cHM6Ly9naXRsYWIuZ25vbWUub3JnL0dOT01FL2xpYnJzdmcvLS9ibG9iL21haW4vRkVBVFVSRVMubWRcbiAgICAvLyBodHRwczovL2dpdGxhYi5nbm9tZS5vcmcvR05PTUUvbGlicnN2Zy8tL21lcmdlX3JlcXVlc3RzLzUyOVxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9sb3ZlbGwvc2hhcnAvaXNzdWVzLzE0OTAjaXNzdWVjb21tZW50LTExNjI3NjAxNDNcbiAgICBjb25zdCBzdmcgPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAke3RleHRPcHQud2lkdGh9ICR7dGV4dE9wdC5oZWlnaHR9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIj5cbiAgICA8dGV4dCBmaWx0ZXI9XCJkcm9wLXNoYWRvdyhyZ2JhKDAsMCwwLCR7c2hhZG93fSkgMnB4IDBweCAycHgpXCIgZm9udC1zaXplPVwiJHtvcHQuc2l6ZX1cIiB4PVwiJHt4T2Zmc2V0fVwiIHk9XCIke3lPZmZzZXR9XCIgZmlsbD1cIiR7Y29sb3J9XCIgb3BhY2l0eT1cIiR7b3BhY2l0eX1cIiBmb250LWZhbWlseT1cIiR7b3B0LnR5cGV9XCI+JHtvcHQudGV4dH08L3RleHQ+XG4gICAgPC9zdmc+YDtcbiAgICByZXR1cm4gc3ZnO1xuICB9XG5cbiAgdGV4dFN2Z0ltZyhzdmdCeXRlczogQnVmZmVyLCB0ZXh0T3B0OiBXYXRlcm1hcmtUZXh0T3B0cyk6IHNoYXJwLlNoYXJwIHtcbiAgICBjb25zdCBvdmVybGFwSW1nID0gc2hhcnAoe1xuICAgICAgY3JlYXRlOiB7XG4gICAgICAgIHdpZHRoOiB0ZXh0T3B0LndpZHRoICsgbWFyZ2luLFxuICAgICAgICBoZWlnaHQ6IHRleHRPcHQuaGVpZ2h0ICsgbWFyZ2luLFxuICAgICAgICBjaGFubmVsczogNCxcbiAgICAgICAgYmFja2dyb3VuZDogeyByOiAwLCBnOiAwLCBiOiAwLCBhbHBoYTogMCB9LFxuICAgICAgfSxcbiAgICB9KS5jb21wb3NpdGUoW3sgaW5wdXQ6IHN2Z0J5dGVzIH1dKTtcblxuICAgIHJldHVybiBvdmVybGFwSW1nO1xuICB9XG5cbiAgY2FsY3VsYXRlSW1nUG9zKG9wdDogV2F0ZXJtYXJrT3B0cywgbWV0YWRhdGE6IHNoYXJwLk1ldGFkYXRhLCBtYXJrTWV0YWRhdGE6IHNoYXJwLk1ldGFkYXRhKTogV2F0ZXJtYXJrUG9zT3B0cyB7XG4gICAgcmV0dXJuIHRoaXMuY2FsY3VsYXRlUG9zKG9wdCwgbWV0YWRhdGEud2lkdGgsIG1ldGFkYXRhLmhlaWdodCwgbWFya01ldGFkYXRhLndpZHRoLCBtYXJrTWV0YWRhdGEuaGVpZ2h0KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVBvcyhvcHQ6IFdhdGVybWFya09wdHMsIHNvdXJjZVc/OiBudW1iZXIsIHNvdXJjZUg/OiBudW1iZXIsIG1hcmtXPzogbnVtYmVyLCBtYXJrSD86IG51bWJlcik6IFdhdGVybWFya1Bvc09wdHMge1xuICAgIGxldCBpbWdYID0gdW5kZWZpbmVkO1xuICAgIGxldCBpbWdZID0gdW5kZWZpbmVkO1xuICAgIGlmIChtYXJrVyAmJiBzb3VyY2VXICYmIG1hcmtIICYmIHNvdXJjZUgpIHtcbiAgICAgIGlmIChbJ2Vhc3QnLCAnd2VzdCcsICdjZW50ZXInXS5pbmNsdWRlcyhvcHQuZykpIHtcbiAgICAgICAgaW1nWSA9IE1hdGgucm91bmQoKHNvdXJjZUggLSBtYXJrSCkgLyAyKSArIG9wdC52b2Zmc2V0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY2hlY2tZID0gb3B0LnkgPyBvcHQueSA6IDA7XG4gICAgICAgIGlmIChvcHQuZy5zdGFydHNXaXRoKCdzb3V0aCcpKSB7XG4gICAgICAgICAgaW1nWSA9IHNvdXJjZUggLSBtYXJrSCAtIGNoZWNrWTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWdZID0gY2hlY2tZO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoWydub3J0aCcsICdzb3V0aCddLmluY2x1ZGVzKG9wdC5nKSkge1xuICAgICAgICBpbWdYID0gTWF0aC5yb3VuZCgoc291cmNlVyAtIG1hcmtXKSAvIDIpO1xuICAgICAgICBpZiAoIWltZ1kpIHtcbiAgICAgICAgICBpZiAob3B0LmcgPT09ICdub3J0aCcpIHtcbiAgICAgICAgICAgIGltZ1kgPSAwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbWdZID0gc291cmNlSCAtIG1hcmtIO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY2hlY2tYID0gb3B0LnggPyBvcHQueCA6IDA7XG4gICAgICAgIGlmIChvcHQuZy5lbmRzV2l0aCgnZWFzdCcpKSB7XG4gICAgICAgICAgaW1nWCA9IHNvdXJjZVcgLSBtYXJrVyAtIGNoZWNrWDtcbiAgICAgICAgfSBlbHNlIGlmIChvcHQuZyA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICBpbWdYID0gTWF0aC5yb3VuZCgoc291cmNlVyAtIG1hcmtXKSAvIDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltZ1ggPSBjaGVja1g7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGltZ1gsXG4gICAgICB5OiBpbWdZLFxuICAgIH07XG4gIH1cblxuICBjYWxjdWxhdGVNaXhlZEdyYXZpdHkob3B0OiBXYXRlcm1hcmtPcHRzKTogV2F0ZXJtYXJrTWl4ZWRHcmF2aXR5T3B0cyB7XG4gICAgbGV0IGltZ0dyYXZpdHkgPSAnd2VzdCc7XG4gICAgbGV0IHR4dEdyYXZpdHkgPSAnZWFzdCc7XG4gICAgaWYgKG9wdC5vcmRlciA9PT0gMSkge1xuICAgICAgaWYgKG9wdC5hbGlnbiA9PT0gMSkge1xuICAgICAgICBpbWdHcmF2aXR5ID0gJ2Vhc3QnO1xuICAgICAgICB0eHRHcmF2aXR5ID0gJ3dlc3QnO1xuICAgICAgfSBlbHNlIGlmIChvcHQuYWxpZ24gPT09IDIpIHtcbiAgICAgICAgaW1nR3Jhdml0eSA9ICdzb3V0aGVhc3QnO1xuICAgICAgICB0eHRHcmF2aXR5ID0gJ3NvdXRod2VzdCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWdHcmF2aXR5ID0gJ25vcnRoZWFzdCc7XG4gICAgICAgIHR4dEdyYXZpdHkgPSAnbm9ydGh3ZXN0JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdC5hbGlnbiA9PT0gMSkge1xuICAgICAgICBpbWdHcmF2aXR5ID0gJ3dlc3QnO1xuICAgICAgICB0eHRHcmF2aXR5ID0gJ2Vhc3QnO1xuICAgICAgfSBlbHNlIGlmIChvcHQuYWxpZ24gPT09IDIpIHtcbiAgICAgICAgaW1nR3Jhdml0eSA9ICdzb3V0aHdlc3QnO1xuICAgICAgICB0eHRHcmF2aXR5ID0gJ3NvdXRoZWFzdCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWdHcmF2aXR5ID0gJ25vcnRod2VzdCc7XG4gICAgICAgIHR4dEdyYXZpdHkgPSAnbm9ydGhlYXN0JztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGltZ0dyYXZpdHk6IGltZ0dyYXZpdHksXG4gICAgICB0ZXh0R3Jhdml0eTogdHh0R3Jhdml0eSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgYXV0b1Jlc2l6ZUltZyhzb3VyY2U6IHNoYXJwLlNoYXJwLCBjdHg6IElJbWFnZUNvbnRleHQsIG9wdDogV2F0ZXJtYXJrT3B0cywgdGV4dE9wdDogV2F0ZXJtYXJrVGV4dE9wdHMpOiBQcm9taXNlPHNoYXJwLlNoYXJwPiB7XG4gICAgaWYgKG9wdC5hdXRvKSB7XG5cbiAgICAgIGxldCB3ID0gdGV4dE9wdC53aWR0aDtcbiAgICAgIGxldCBoID0gdGV4dE9wdC5oZWlnaHQ7XG4gICAgICBsZXQgbmVlZFJlc2l6ZSA9IGZhbHNlO1xuICAgICAgY29uc3Qgb3ZlcmxhcEltZ01ldGEgPSBhd2FpdCBzb3VyY2UubWV0YWRhdGEoKTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgY3R4LmltYWdlLm1ldGFkYXRhKCk7XG5cbiAgICAgIGlmIChvdmVybGFwSW1nTWV0YS53aWR0aCAmJiBtZXRhZGF0YS53aWR0aCAmJiBvdmVybGFwSW1nTWV0YS53aWR0aCA+IG1ldGFkYXRhLndpZHRoKSB7XG4gICAgICAgIHcgPSBtZXRhZGF0YS53aWR0aCAtIDEwO1xuICAgICAgICBuZWVkUmVzaXplID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChvdmVybGFwSW1nTWV0YS5oZWlnaHQgJiYgbWV0YWRhdGEuaGVpZ2h0ICYmIG92ZXJsYXBJbWdNZXRhLmhlaWdodCA+IG1ldGFkYXRhLmhlaWdodCkge1xuICAgICAgICBoID0gbWV0YWRhdGEuaGVpZ2h0IC0gMTA7XG4gICAgICAgIG5lZWRSZXNpemUgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAobmVlZFJlc2l6ZSkge1xuICAgICAgICBjb25zdCBvdmVybGFwSW1nQnVmZmVyID0gYXdhaXQgc291cmNlLnRvQnVmZmVyKCk7XG4gICAgICAgIHNvdXJjZSA9IHNoYXJwKG92ZXJsYXBJbWdCdWZmZXIpO1xuICAgICAgICBzb3VyY2UgPSBzb3VyY2UucmVzaXplKHcsIGgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlO1xuXG4gIH1cblxuICBhdXRvQ2FsY3VsYXRlUmVzaXplKG1ldGFkYXRhOiBzaGFycC5NZXRhZGF0YSwgb3B0OiBXYXRlcm1hcmtPcHRzLCB0ZXh0T3B0OiBXYXRlcm1hcmtUZXh0T3B0cyk6IFdhdGVybWFya1RleHRSZXNpemVPcHRzIHtcbiAgICBpZiAob3B0LmF1dG8pIHtcbiAgICAgIGxldCB3ID0gdGV4dE9wdC53aWR0aDtcbiAgICAgIGxldCBoID0gdGV4dE9wdC5oZWlnaHQ7XG4gICAgICBsZXQgbmVlZFJlc2l6ZSA9IGZhbHNlO1xuICAgICAgaWYgKG1ldGFkYXRhLndpZHRoICYmIG1ldGFkYXRhLndpZHRoIDwgdGV4dE9wdC53aWR0aCkge1xuICAgICAgICB3ID0gbWV0YWRhdGEud2lkdGg7XG4gICAgICAgIG5lZWRSZXNpemUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKG1ldGFkYXRhLmhlaWdodCAmJiBtZXRhZGF0YS5oZWlnaHQgPCB0ZXh0T3B0LmhlaWdodCkge1xuICAgICAgICBoID0gbWV0YWRhdGEuaGVpZ2h0O1xuICAgICAgICBuZWVkUmVzaXplID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5lZWQ6IG5lZWRSZXNpemUsXG4gICAgICAgIHdpZHRoOiB3LFxuICAgICAgICBoZWlnaHQ6IGgsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbmVlZDogZmFsc2UsXG4gICAgICB3aWR0aDogdGV4dE9wdC53aWR0aCxcbiAgICAgIGhlaWdodDogdGV4dE9wdC5oZWlnaHQsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhSW1nT3ZlcmxheShjdHg6IElJbWFnZUNvbnRleHQsIG1hcmtJbWc6IHNoYXJwLlNoYXJwLCBtYXJrTWV0YWRhdGE6IHNoYXJwLk1ldGFkYXRhLFxuICAgIG9wdDogV2F0ZXJtYXJrT3B0cywgcG9zPzogV2F0ZXJtYXJrUG9zT3B0cyk6IFByb21pc2U8c2hhcnAuT3ZlcmxheU9wdGlvbnM+IHtcbiAgICBpZiAob3B0LnQgPCAxMDAgJiYgIW1hcmtNZXRhZGF0YS5oYXNBbHBoYSkge1xuICAgICAgLy8ganBlZyBvciBvdGhlciBubyBhbHBoYSBpbWFnZSwgd2UgY2hhbmdlIHRoZSBvcGFjaXR5IGJ5IGNoYW5nZSB0aGUgYWxwaGEgY2hhbm5lbFxuICAgICAgbWFya0ltZyA9IG1hcmtJbWcucmVtb3ZlQWxwaGEoKS5lbnN1cmVBbHBoYShvcHQudCAvIDEwMCk7XG4gICAgfVxuICAgIGNvbnN0IGJ0ID0gYXdhaXQgbWFya0ltZy5wbmcoKS50b0J1ZmZlcigpO1xuICAgIGNvbnN0IG92ZXJsYXk6IHNoYXJwLk92ZXJsYXlPcHRpb25zID0geyBpbnB1dDogYnQsIHRpbGU6IG9wdC5maWxsLCBncmF2aXR5OiBvcHQuZyB9O1xuXG4gICAgaWYgKHBvcykge1xuICAgICAgb3ZlcmxheS50b3AgPSBwb3MueTtcbiAgICAgIG92ZXJsYXkubGVmdCA9IHBvcy54O1xuICAgIH1cblxuICAgIGlmIChvcHQudCA8IDEwMCAmJiBtYXJrTWV0YWRhdGEuaGFzQWxwaGEpIHtcbiAgICAgIC8vIHBuZyBvciBvdGhlciBpbWFnZSB3aXRoIGFscGhhLCB3ZSBjaGFuZ2UgdGhlIG9wYWNpdHkgYnkgY2hhbmdlIHRoZSBjb21iaW5lZCBpbWFnZVxuICAgICAgY29uc3Qgb3ZlckZvclBuZyA9IHNoYXJwKGF3YWl0IGN0eC5pbWFnZS50b0J1ZmZlcigpKS5wbmcoKTtcbiAgICAgIGNvbnN0IG92ZXJCdWZmZXIgPSBhd2FpdCBvdmVyRm9yUG5nLmNvbXBvc2l0ZShbb3ZlcmxheV0pLnJlbW92ZUFscGhhKCkuZW5zdXJlQWxwaGEob3B0LnQgLyAxMDApLnRvQnVmZmVyKCk7XG4gICAgICBjb25zdCBvdmVybGF5Mjogc2hhcnAuT3ZlcmxheU9wdGlvbnMgPSB7IGlucHV0OiBvdmVyQnVmZmVyIH07XG4gICAgICByZXR1cm4gb3ZlcmxheTI7XG4gICAgfVxuICAgIHJldHVybiBvdmVybGF5O1xuICB9XG59XG4iXX0=