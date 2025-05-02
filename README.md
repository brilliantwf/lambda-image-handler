# Lambda Image Handler

这个CloudFormation模板部署了一个无服务器图像处理解决方案，允许您通过URL参数动态处理存储在S3存储桶中的图像。

## 功能

- 通过URL参数动态处理图像
- 支持多个源S3存储桶
- 支持WebP转换（针对支持的浏览器）
- 使用CloudFront进行全球内容分发
- 使用DynamoDB表存储图像处理样式
- 支持阿里云OSS图像处理参数格式

## 部署

要部署此堆栈：

```bash
aws cloudformation deploy \
  --template-file lambda-image-handler.template \
  --stack-name lambda-image-handler \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    BucketParam0=your-bucket-name \
    AutoWebpParam=Yes
```

## S3存储桶访问

此解决方案使用CloudFront Origin Access Identity (OAI)安全地访问您的S3存储桶。OAI在部署期间自动创建，并配置CloudFront分配使用它。

### 重要提示

S3存储桶必须在部署此堆栈之前已经存在。堆栈不会为您创建存储桶。

## 使用方法

部署后，您可以通过CloudFront URL访问您的图像：

```
https://<cloudfront-domain>/<image-path>?<processing-parameters>
```

### 标准参数格式
```
https://<cloudfront-domain>/image.jpg?width=300&height=200
```

### 阿里云OSS参数格式
```
https://<cloudfront-domain>/image.jpg?x-oss-process=image/resize,w_300/quality,q_90
```

## 支持的阿里云OSS参数格式

以下阿里云OSS参数格式在处理图片时工作正常：

1. 调整图片大小: `x-oss-process=image/resize,w_300`
2. 调整图片质量: `x-oss-process=image/resize,w_300/quality,q_90`
3. 固定大小调整: `x-oss-process=image/resize,m_fixed,w_300,h_200`
4. 裁剪图片: `x-oss-process=image/crop,w_100,h_100,x_10,y_10`
5. 旋转图片: `x-oss-process=image/rotate,90`
6. 格式转换: `x-oss-process=image/format,png`
7. 获取图片信息: `x-oss-process=image/info`
8. 文本水印: `x-oss-process=image/watermark,text_SGVsbG8gV29ybGQ=,size_40,color_FF0000,t_50,g_se`
9. 图片水印: `x-oss-process=image/watermark,image_bG9nby5wbmc=,t_70,g_se`

## 输出

堆栈提供以下输出：

- `StyleConfig`: 用于图像处理样式的DynamoDB表
- `ApiGw2Endpoint`: API Gateway端点URL
- `Bucket0`: S3存储桶路径
- `S3CanonicalUserId0`: CloudFront OAI的规范用户ID
- `DistUrl0`: CloudFront分配URL

## 版本

此解决方案基于Serverless Image Handler版本v6.5.0-api-adapter-0906。

## 最终代码和测试结果

- `final-code/`: 包含修复后的Lambda函数代码
- `TEST-REPORT.md`: 包含完整的测试报告和结果