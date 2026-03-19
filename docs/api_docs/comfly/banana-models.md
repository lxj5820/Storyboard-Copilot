# Nano Banana 模型 API 文档

## 概述

Nano Banana 是基于 Google Gemini 专门优化的图像生成 API，支持 OpenAI 兼容格式。

## 与官方 Gemini 的区别

- **官方 gemini-2.5-flash-image-preview**: 官方API，没做任何处理，仅支持聊天接口，可能不会返回图片，返回的图片是 base64
- **nano-banana**: 基于官方模型专门画图优化的 API，支持 dalle 格式、返回 URL，失败不扣费，优化了支持设置图片比例
- **nano-banana-hd**: 高清版 4K 画质

## 支持的模型

| 模型名称 | 说明 |
|---------|------|
| nano-banana | 标准版 |
| nano-banana-pro | Pro 版 |
| nano-banana-2 | Nano Banana 2 代 |
| nano-banana-2-pro | Nano Banana 2 Pro 版 |
| gemini-3.1-flash-image-preview | Nano Banana 3.1 Flash |

## API 端点

### 文生图 (Generations)

**端点**: `POST {BASE_URL}/v1/images/generations`

**请求头**:
```
Authorization: Bearer {YOUR_API_KEY}
Content-Type: application/json
```

**请求体**:
```json
{
  "model": "nano-banana",
  "prompt": "一只可爱的猫",
  "response_format": "url",
  "aspect_ratio": "1:1"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型名称 |
| prompt | string | 是 | 提示词 |
| response_format | string | 否 | 返回格式: url 或 b64_json |
| aspect_ratio | string | 否 | 比例: 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 1:1, 4:5, 5:4, 21:9 |
| image | array | 否 | 参考图数组，url 或 b64_json |
| image_size | string | 否 | 仅 nano-banana-2 支持: 1K, 2K, 4K |

**支持的分辨率**:

标准版:
- 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 1:1, 4:5, 5:4, 21:9

Nano Banana 3.1 Flash 额外支持:
- 1:4, 4:1, 8:1, 1:8

**响应示例**:
```json
{
  "created": 1234567890,
  "data": [
    {
      "url": "https://example.com/image.png"
    }
  ]
}
```

---

### 图生图 (Edits)

**端点**: `POST {BASE_URL}/v1/images/edits`

**请求头**:
```
Authorization: Bearer {YOUR_API_KEY}
Content-Type: multipart/form-data
```

**请求体** (multipart/form-data):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型名称 |
| prompt | string | 是 | 提示词 |
| image | file | 是 | 参考图片 |
| response_format | string | 否 | 返回格式: url 或 b64_json |
| aspect_ratio | string | 否 | 比例 |

**支持的分辨率**:
- 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9

---

## 价格说明

| 模型 | 分辨率 | 价格 (USD/次) |
|------|--------|---------------|
| nano-banana | 1K | 0.08 |
| nano-banana | 2K | 0.12 |
| nano-banana | 4K | 0.16 |
| nano-banana-2 | 1K | 待定 |
| nano-banana-2 | 2K | 待定 |
| nano-banana-2 | 4K | 待定 |

具体价格请在设置页面查看或配置自定义价格。

---

## 注意事项

1. API Key 需要在请求头中传入: `Authorization: Bearer {YOUR_API_KEY}`
2. `response_format` 默认为 `url`，如需 base64 可设置为 `b64_json`
3. 失败不扣费
4. 支持设置图片比例，无需额外处理

## 官方文档

- [Google Gemini 图像生成文档](https://ai.google.dev/gemini-api/docs/image-generation)
