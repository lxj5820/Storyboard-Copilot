# 默认模型配置说明

## 配置文件格式

默认模型配置文件使用 JSON 格式，位于 `src/features/canvas/models/defaultModelsConfig.json`。

## 配置结构

```json
{
  "models": [
    {
      "id": "模型唯一标识符",
      "mediaType": "媒体类型",
      "displayName": "显示名称",
      "providerId": "提供商 ID",
      "description": "模型描述",
      "eta": "预计生成时间",
      "expectedDurationMs": "预计生成时间（毫秒）",
      "defaultAspectRatio": "默认宽高比",
      "defaultResolution": "默认分辨率",
      "aspectRatios": ["支持的宽高比列表"],
      "resolutions": [
        { "value": "分辨率值", "label": "分辨率标签" }
      ],
      "extraParamsSchema": [
        {
          "key": "参数键",
          "label": "参数标签",
          "labelKey": "国际化键",
          "type": "参数类型",
          "defaultValue": "默认值",
          "options": [
            { "value": "选项值", "label": "选项标签", "labelKey": "国际化键" }
          ]
        }
      ],
      "defaultExtraParams": {
        "参数键": "默认值"
      },
      "pricing": {
        "currency": "货币类型",
        "baseAmount": "基础价格",
        "resolutionMultipliers": {
          "分辨率值": 倍率
        }
      },
      "endpoints": {
        "generate": "文生图接口地址",
        "edit": "图生图接口地址"
      },
      "apiName": "API 名称"
    }
  ],
  "defaultModelId": "默认模型 ID"
}
```

## 配置项说明

### 顶层配置
- `models`: 默认模型列表
- `defaultModelId`: 默认使用的模型 ID

### 模型配置
- `id`: 模型唯一标识符，格式为 `provider/model-name`
- `mediaType`: 媒体类型，目前只支持 `image`
- `displayName`: 模型显示名称，将在界面中显示
- `providerId`: 提供商 ID，用于关联 API Key
- `description`: 模型描述，显示在模型详情中
- `eta`: 预计生成时间，如 "1min"
- `expectedDurationMs`: 预计生成时间（毫秒），用于进度显示
- `defaultAspectRatio`: 默认宽高比，如 "1:1"
- `defaultResolution`: 默认分辨率，如 "1K"
- `aspectRatios`: 支持的宽高比列表
- `resolutions`: 支持的分辨率列表，每个分辨率包含 `value`（值）和 `label`（显示标签）
- `extraParamsSchema`: 额外参数 schema，定义模型支持的额外参数
- `defaultExtraParams`: 额外参数默认值
- `pricing`: 价格配置，包括货币类型、基础价格和不同分辨率的倍率
- `endpoints`: API 端点配置，包括文生图和图生图接口地址
- `apiName`: API 名称，用于向提供商发送请求时指定模型

## 示例配置

```json
{
  "models": [
    {
      "id": "custom/nano-banana-2",
      "mediaType": "image",
      "displayName": "Nano Banana 2",
      "providerId": "custom",
      "description": "ai.comfly · Nano Banana 2 图像生成与编辑",
      "eta": "1min",
      "expectedDurationMs": 60000,
      "defaultAspectRatio": "1:1",
      "defaultResolution": "1K",
      "aspectRatios": ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"],
      "resolutions": [
        { "value": "0.5K", "label": "0.5K" },
        { "value": "1K", "label": "1K" },
        { "value": "2K", "label": "2K" },
        { "value": "4K", "label": "4K" }
      ],
      "extraParamsSchema": [
        {
          "key": "thinking_level",
          "label": "Thinking level",
          "labelKey": "modelParams.thinkingLevel",
          "type": "enum",
          "defaultValue": "off",
          "options": [
            { "value": "off", "label": "Off", "labelKey": "modelParams.thinkingDisabled" },
            { "value": "minimal", "label": "Minimal", "labelKey": "modelParams.thinkingMinimal" },
            { "value": "high", "label": "High", "labelKey": "modelParams.thinkingHigh" }
          ]
        }
      ],
      "defaultExtraParams": {
        "thinking_level": "off"
      },
      "pricing": {
        "currency": "USD",
        "baseAmount": 0.08,
        "resolutionMultipliers": {
          "0.5K": 0.75,
          "1K": 1,
          "2K": 1.5,
          "4K": 2
        }
      },
      "endpoints": {
        "generate": "https://ai.comfly.chat/v1/images/generations",
        "edit": "https://ai.comfly.chat/v1/images/edits"
      },
      "apiName": "nano-banana"
    }
  ],
  "defaultModelId": "custom/nano-banana-2"
}
```

## 如何修改配置

1. 打开 `src/features/canvas/models/defaultModelsConfig.json` 文件
2. 修改相应的配置项
3. 保存文件后，应用会自动加载新的配置

## 注意事项

- 配置文件中的 `id` 必须唯一
- `endpoints` 配置项会覆盖模型中的默认端点设置
- 价格配置会影响节点中显示的价格估算
- 修改配置后，需要重新启动应用才能生效