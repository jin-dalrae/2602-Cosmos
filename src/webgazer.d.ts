declare module 'webgazer' {
  interface WebGazer {
    setRegression(type: string): WebGazer
    setGazeListener(callback: (data: { x: number; y: number } | null, elapsedTime: number) => void): WebGazer
    begin(): Promise<WebGazer>
    end(): void
    pause(): void
    resume(): void
    recordScreenPosition(x: number, y: number, type?: string): void
    showPredictionPoints(show: boolean): WebGazer
    showVideoPreview(show: boolean): WebGazer
    applyKalmanFilter(apply: boolean): WebGazer
  }
  const webgazer: WebGazer
  export default webgazer
}
