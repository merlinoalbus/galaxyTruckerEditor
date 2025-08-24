declare module 'emoji-toolkit' {
  interface JoyPixels {
    imageType: 'png' | 'svg';
    sprites: boolean;
    path: string;
    toImage: (str: string) => string;
  }
  const joypixels: JoyPixels;
  export default joypixels;
}
