import { IImageContext } from '.';
import { IActionOpts, ReadOnly } from '..';
import { BaseImageAction } from './_base';
export interface InterlaceOpts extends IActionOpts {
    interlace: boolean;
}
export declare class InterlaceAction extends BaseImageAction {
    readonly name: string;
    validate(params: string[]): ReadOnly<InterlaceOpts>;
    process(ctx: IImageContext, params: string[]): Promise<void>;
}
