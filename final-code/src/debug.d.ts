/// <reference types="node" />
import * as sharp from 'sharp';
export interface ISharpInfo {
    cache: sharp.CacheResult;
    simd: boolean;
    counters: sharp.SharpCounters;
    concurrency: number;
    versions: {
        vips: string;
        cairo?: string;
        croco?: string;
        exif?: string;
        expat?: string;
        ffi?: string;
        fontconfig?: string;
        freetype?: string;
        gdkpixbuf?: string;
        gif?: string;
        glib?: string;
        gsf?: string;
        harfbuzz?: string;
        jpeg?: string;
        lcms?: string;
        orc?: string;
        pango?: string;
        pixman?: string;
        png?: string;
        svg?: string;
        tiff?: string;
        webp?: string;
        avif?: string;
        heif?: string;
        xml?: string;
        zlib?: string;
    };
}
export interface IDebugInfo {
    os: {
        arch: string;
        cpus: number;
        loadavg: number[];
    };
    memoryStats: string;
    memoryUsage: NodeJS.MemoryUsage;
    resourceUsage: NodeJS.ResourceUsage;
    sharp: ISharpInfo;
}
export default function debug(): IDebugInfo;
