"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const debug_1 = require("./debug");
const default_1 = require("./default");
const processor_1 = require("./processor");
const image_1 = require("./processor/image");
const PROCESSOR_MAP = {
    [image_1.ImageProcessor.getInstance().name]: image_1.ImageProcessor.getInstance(),
};
function getProcessor(name) {
    const processor = PROCESSOR_MAP[name];
    if (!processor) {
        throw new processor_1.InvalidArgument('Can Not find processor');
    }
    return processor;
}
async function handler(event, context) {
    try {
        console.log('Lambda handler invoked with event:', JSON.stringify(event));
        
        // 处理API Gateway事件结构
        let path = '';
        let queryStringParameters = {};
        
        if (event.pathParameters && event.pathParameters.proxy) {
            path = '/' + event.pathParameters.proxy;
            queryStringParameters = event.queryStringParameters || {};
            console.log(`API Gateway event detected. Path: ${path}, Query parameters:`, queryStringParameters);
        } 
        // 处理CloudFront事件结构
        else if (event.Records && event.Records[0] && event.Records[0].cf) {
            const request = event.Records[0].cf.request;
            path = request.uri;
            
            // 解析查询字符串
            if (request.querystring) {
                const params = request.querystring.split('&');
                params.forEach(param => {
                    const [key, value] = param.split('=');
                    if (key && value) {
                        queryStringParameters[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                });
            }
            console.log(`CloudFront event detected. Path: ${path}, Query parameters:`, queryStringParameters);
        } 
        // 处理直接调用
        else if (event.path) {
            path = event.path;
            queryStringParameters = event.queryStringParameters || {};
            console.log(`Direct invocation detected. Path: ${path}, Query parameters:`, queryStringParameters);
        }
        else {
            console.error('Unknown event structure:', JSON.stringify(event));
            throw new Error('Unsupported event structure');
        }
        
        const { uri, actions } = (0, default_1.parseRequest)(path, queryStringParameters);
        console.log(`Processing request: uri=${uri}, actions=${JSON.stringify(actions)}`);
        
        const bs = (0, default_1.bufferStore)();
        
        let result;
        if (actions.length > 0) {
            const processor = getProcessor(actions[0]);
            const context = await processor.newContext(uri, actions, bs);
            result = await processor.process(context);
            
            // 记录处理结果
            console.log(`Image processed successfully: format=${result.type}, size=${result.data.length}`);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': result.type,
                },
                body: result.data.toString('base64'),
                isBase64Encoded: true,
            };
        }
        else {
            const { buffer, type } = await bs.get(uri);
            
            // 记录获取结果
            console.log(`Original image retrieved: format=${type}, size=${buffer.length}`);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': type,
                },
                body: buffer.toString('base64'),
                isBase64Encoded: true,
            };
        }
    }
    catch (err) {
        console.error('Error processing image:', err);
        console.log((0, debug_1.default)());
        
        return {
            statusCode: err.status || 500,
            body: JSON.stringify({
                status: err.status || 500,
                name: err.name || 'Error',
                message: err.message || 'Unknown error',
            }),
        };
    }
}
exports.handler = handler;
