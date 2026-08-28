import { TextDecoder, TextEncoder } from 'node:util';

import '@testing-library/jest-dom';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const emptyRect: DOMRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON: () => ({}),
};

const emptyRectList = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;

Range.prototype.getClientRects = () => emptyRectList;
Range.prototype.getBoundingClientRect = () => emptyRect;

document.elementFromPoint = () => null;
