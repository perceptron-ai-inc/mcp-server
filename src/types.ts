// Request/response types mirroring the remote Perceptron MCP server's types.rs

export interface GenerationParams {
  reasoning?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export interface QuestionRequest extends GenerationParams {
  image_url: string;
  model: string;
  question: string;
  output_format?: "text" | "point" | "box" | "polygon";
}

export interface CaptionRequest extends GenerationParams {
  image_url: string;
  model: string;
  /** Defaults to "concise" */
  style?: "concise" | "detailed";
  output_format?: "text" | "point" | "box" | "polygon";
}

export interface OcrRequest extends GenerationParams {
  image_url: string;
  model: string;
  mode: "plain" | "markdown" | "html";
  prompt?: string;
}

export interface DetectRequest extends GenerationParams {
  image_url: string;
  model: string;
  classes?: string[];
}

// Upload/download types

export interface UploadFileRequest {
  file_name: string;
  content_type: string;
  content_length: number;
}

export interface GenerateUploadUrlsRequest {
  files: UploadFileRequest[];
}

export interface UploadUrlResponse {
  upload_url: string;
  object_key: string;
  file_name: string;
}

export interface GenerateUploadUrlsResponse {
  urls: UploadUrlResponse[];
  expires_in_seconds: number;
}

export interface GenerateDownloadUrlsRequest {
  object_keys: string[];
}

export interface DownloadUrlResponse {
  download_url: string;
  object_key: string;
}

export interface GenerateDownloadUrlsResponse {
  urls: DownloadUrlResponse[];
  expires_in_seconds: number;
}

// Model discovery types

export interface Model {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}
