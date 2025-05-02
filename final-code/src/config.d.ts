export interface IConfig {
    port: number;
    region: string;
    isProd: boolean;
    srcBucket: string;
    styleTableName: string;
    autoWebp: boolean;
    secretName: string;
    sharpQueueLimit: number;
}
declare const conf: IConfig;
export default conf;
