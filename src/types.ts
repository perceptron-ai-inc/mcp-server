// Request/response types mirroring the remote Perceptron MCP server's types.rs

export type Modality = "image" | "video" | "audio";

/** Detection is spatial, so it does not accept audio. */
export type DetectModality = "image" | "video";

export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

export interface GenerationParams {
  /** @deprecated Use reasoning_effort */
  reasoning?: boolean;
  /** Any value other than "none" turns reasoning on */
  reasoning_effort?: ReasoningEffort;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export interface MediaParams<M = Modality> {
  media_url: string;
  modality: M;
}

export interface AudioInVideoParams {
  /** Also process the video's soundtrack. Only valid with modality "video" */
  enable_audio_in_video?: boolean;
}

export interface QuestionRequest extends GenerationParams, MediaParams, AudioInVideoParams {
  /** Uses the default Perceptron model if omitted */
  model?: string;
  question: string;
  output_format?: "point" | "box" | "polygon" | "clip";
}

export interface CaptionRequest extends GenerationParams, MediaParams, AudioInVideoParams {
  /** Uses the default Perceptron model if omitted */
  model?: string;
  /** Defaults to "concise" */
  style?: "concise" | "detailed";
  output_format?: "point" | "box" | "polygon" | "clip";
}

export interface OcrRequest extends GenerationParams {
  image_url: string;
  /** Uses the default Perceptron model if omitted */
  model?: string;
  mode: "plain" | "markdown" | "html";
  prompt?: string;
}

export interface DetectRequest extends GenerationParams, MediaParams<DetectModality> {
  /** Uses the default Perceptron model if omitted */
  model?: string;
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
