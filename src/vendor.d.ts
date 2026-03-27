declare module "qrcode-terminal" {
  const qrcodeTerminal: {
    generate(
      text: string,
      options?: { small?: boolean },
      callback?: (qr: string) => void,
    ): void;
  };
  export default qrcodeTerminal;
}

declare module "fluent-ffmpeg" {
  interface FfmpegCommand {
    setFfmpegPath(path: string): FfmpegCommand;
    seekInput(time: number): FfmpegCommand;
    frames(n: number): FfmpegCommand;
    outputOptions(opts: string[]): FfmpegCommand;
    output(path: string): FfmpegCommand;
    on(event: "end", cb: () => void): FfmpegCommand;
    on(event: "error", cb: (err: Error) => void): FfmpegCommand;
    run(): void;
  }
  function ffmpeg(input: string): FfmpegCommand;
  export default ffmpeg;
}

declare module "silk-wasm" {
  interface SilkDecResult {
    data: Uint8Array;
    duration: number;
  }
  interface SilkEncResult {
    data: ArrayBuffer;
  }
  export function encode(buf: ArrayBuffer, sampleRate: number): Promise<SilkEncResult>;
  export function decode(buf: ArrayBuffer, sampleRate?: number): Promise<SilkDecResult>;
}
