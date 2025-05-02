/// <reference types="node" />
import { ParsedUrlQuery } from 'querystring';
import { IProcessor } from './processor';
import { IBufferStore, IKVStore } from './store';
export declare function getProcessor(name: string): IProcessor;
export declare function bufferStore(p?: string): IBufferStore;
export declare function kvstore(): IKVStore;
export declare function parseRequest(uri: string, query: ParsedUrlQuery): {
    uri: string;
    actions: string[];
};
