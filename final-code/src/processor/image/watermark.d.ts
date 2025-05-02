/// <reference types="node" />
import * as sharp from 'sharp';
import { IImageContext } from '.';
import { IActionOpts, ReadOnly, IProcessContext } from '..';
import { BaseImageAction } from './_base';
export interface WatermarkOpts extends IActionOpts {
    text: string;
    t: number;
    g: string;
    fill: boolean;
    rotate: number;
    size: number;
    color: string;
    image: string;
    auto: boolean;
    x?: number;
    y?: number;
    voffset: number;
    order: number;
    interval: number;
    align: number;
    type: string;
    shadow: number;
}
interface WatermarkTextOpts extends IActionOpts {
    width: number;
    height: number;
}
interface WatermarkTextResizeOpts extends IActionOpts {
    need: boolean;
    width: number;
    height: number;
}
interface WatermarkPosOpts extends IActionOpts {
    x?: number;
    y?: number;
}
interface WatermarkMixedGravityOpts extends IActionOpts {
    imgGravity: string;
    textGravity: string;
}
export declare class WatermarkAction extends BaseImageAction {
    readonly name: string;
    beforeNewContext(ctx: IProcessContext, params: string[]): void;
    validate(params: string[]): ReadOnly<WatermarkOpts>;
    process(ctx: IImageContext, params: string[]): Promise<void>;
    textWaterMark(ctx: IImageContext, opt: WatermarkOpts): Promise<void>;
    imgWaterMark(ctx: IImageContext, opt: WatermarkOpts): Promise<void>;
    mixedWaterMark(ctx: IImageContext, opt: WatermarkOpts): Promise<void>;
    gravityConvert(param: string): string;
    calculateTextSize(text: string, fontSize: number): WatermarkTextOpts;
    textSvgStr(opt: WatermarkOpts, textOpt: WatermarkTextOpts, applyOpacity?: boolean, shadow?: number): string;
    textSvgImg(svgBytes: Buffer, textOpt: WatermarkTextOpts): sharp.Sharp;
    calculateImgPos(opt: WatermarkOpts, metadata: sharp.Metadata, markMetadata: sharp.Metadata): WatermarkPosOpts;
    calculatePos(opt: WatermarkOpts, sourceW?: number, sourceH?: number, markW?: number, markH?: number): WatermarkPosOpts;
    calculateMixedGravity(opt: WatermarkOpts): WatermarkMixedGravityOpts;
    autoResizeImg(source: sharp.Sharp, ctx: IImageContext, opt: WatermarkOpts, textOpt: WatermarkTextOpts): Promise<sharp.Sharp>;
    autoCalculateResize(metadata: sharp.Metadata, opt: WatermarkOpts, textOpt: WatermarkTextOpts): WatermarkTextResizeOpts;
    extraImgOverlay(ctx: IImageContext, markImg: sharp.Sharp, markMetadata: sharp.Metadata, opt: WatermarkOpts, pos?: WatermarkPosOpts): Promise<sharp.OverlayOptions>;
}
export {};
