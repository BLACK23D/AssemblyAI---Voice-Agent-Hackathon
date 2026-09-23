class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.chunk = new Int16Array(1200); this.offset = 0; }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (input) {
      for (let i = 0; i < input.length; i++) {
        this.chunk[this.offset++] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32767)));
        if (this.offset === this.chunk.length) {
          this.port.postMessage(this.chunk.buffer, [this.chunk.buffer]);
          this.chunk = new Int16Array(1200);
          this.offset = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
