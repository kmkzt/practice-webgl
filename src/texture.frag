varying lowp vec4 vColor;

void main(void) {
  // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // set constatnt color.
  gl_FragColor = vColor;
}
