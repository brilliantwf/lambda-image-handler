# Lambda Image Handler SVG文本水印功能实现

## 功能概述

本次实现了基于SVG的文本水印功能，替代了原有的基于ImageMagick的文本水印方案。新方案具有以下优势：

1. **更高质量的文本渲染**：SVG文本保持清晰的边缘，不会在任何大小下失真
2. **更灵活的样式选项**：支持阴影、旋转、多行文本等高级样式
3. **更好的Unicode支持**：更可靠地处理国际字符
4. **无需外部依赖**：不再依赖ImageMagick，减少了Lambda部署包的大小和复杂性

## 实现方法

1. 修改了`watermark.js`文件中的`textWaterMark`方法，使用SVG进行文本渲染
2. 添加了`escapeXml`方法，确保特殊字符不会破坏SVG结构
3. 实现了多行文本支持，通过分割文本并为每行创建单独的SVG文本元素
4. 添加了文本阴影支持，通过在主文本下方创建偏移的阴影文本
5. 实现了文本旋转功能，使用SVG的transform属性

## 使用方法

### 基本文本水印

```
https://your-cloudfront-domain.com/image.jpg?x-oss-process=image/watermark,text_SGVsbG8gV29ybGQ=,size_40,color_FF0000,t_50,g_se
```

这会在图像的右下角添加红色的"Hello World"文本，透明度为50%。

### 带阴影的文本水印

```
https://your-cloudfront-domain.com/image.jpg?x-oss-process=image/watermark,text_Q29weXJpZ2h0IMKpIDIwMjU=,size_30,color_FFFFFF,shadow_50,g_south
```

这会在图像底部中央添加带有50%不透明度阴影的白色"Copyright © 2025"文本。

### 旋转的文本水印

```
https://your-cloudfront-domain.com/image.jpg?x-oss-process=image/watermark,text_RFJBRlQ=,size_60,color_FF0000,t_30,rotate_45,g_center
```

这会在图像中心添加旋转45度的红色"DRAFT"文本，透明度为30%。

## 测试结果

测试了以下场景：

1. 基本文本水印：在图像右下角添加版权信息
2. 带阴影的文本水印：在图像中心添加带阴影的文本
3. 旋转的文本水印：在图像中心添加旋转45度的"DRAFT"标记
4. 多行文本水印：在图像左下角添加多行文本

所有测试都成功完成，生成的图像质量良好，文本清晰可读。

## 部署说明

1. 将修改后的`watermark.js`文件部署到Lambda函数中
2. 不需要额外的依赖，因为Sharp库已经支持SVG处理
3. 确保Lambda函数有足够的内存和超时设置，因为SVG处理可能需要额外的资源

## 注意事项

1. SVG文本使用系统字体，如果需要自定义字体，需要在SVG中嵌入字体数据
2. 非常大的文本或复杂的SVG可能会影响处理性能
3. 某些特殊Unicode字符可能需要额外处理
