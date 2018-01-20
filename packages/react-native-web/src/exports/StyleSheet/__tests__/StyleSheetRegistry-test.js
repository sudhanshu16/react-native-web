/* eslint-env jasmine, jest */

import I18nManager from '../../I18nManager';
import StyleSheetRegistry from '../StyleSheetRegistry';

let styleSheetRegistry;

describe('apis/StyleSheet/StyleSheetRegistry', () => {
  beforeEach(() => {
    styleSheetRegistry = new StyleSheetRegistry();
  });

  test('register', () => {
    const style = { opacity: 0 };
    const id = styleSheetRegistry.register(style);
    expect(typeof id === 'number').toBe(true);
  });

  describe('resolve', () => {
    const styleA = { borderWidth: 0, borderColor: 'red', width: 100 };
    const styleB = {
      position: 'absolute',
      left: 50,
      pointerEvents: 'box-only'
    };
    const styleC = { width: 200 };

    const testResolve = (a, b, c) => {
      // no common properties, different resolving order, same result
      const resolve1 = styleSheetRegistry.resolve([a, b]);
      expect(resolve1).toMatchSnapshot();
      const resolve2 = styleSheetRegistry.resolve([b, a]);
      expect(resolve1).toEqual(resolve2);

      // common properties, different resolving order, different result
      const resolve3 = styleSheetRegistry.resolve([a, b, c]);
      expect(resolve3).toMatchSnapshot();
      const resolve4 = styleSheetRegistry.resolve([c, a, b]);
      expect(resolve4).toMatchSnapshot();
      expect(resolve3).not.toEqual(resolve4);
    };

    test('with register, resolves to className', () => {
      const a = styleSheetRegistry.register(styleA);
      const b = styleSheetRegistry.register(styleB);
      const c = styleSheetRegistry.register(styleC);
      testResolve(a, b, c);
    });

    test('with register before RTL, resolves to className', () => {
      const a = styleSheetRegistry.register({ left: '12.34%' });
      const b = styleSheetRegistry.register({ textAlign: 'left' });
      const c = styleSheetRegistry.register({ marginLeft: 10 });
      I18nManager.forceRTL(true);
      const resolved = styleSheetRegistry.resolve([a, b, c]);
      I18nManager.forceRTL(false);
      expect(resolved).toMatchSnapshot();
    });

    test('with register, resolves to mixed', () => {
      const a = styleA;
      const b = styleSheetRegistry.register(styleB);
      const c = styleSheetRegistry.register(styleC);
      testResolve(a, b, c);
    });

    test('without register, resolves to inline styles', () => {
      testResolve(styleA, styleB, styleC);
    });
  });

  describe('resolveStateful', () => {
    test('preserves unrelated class names', () => {
      const domStyleProps = { classList: ['unknown-class-1', 'unknown-class-2'], style: {} };
      const domStyleNextProps = styleSheetRegistry.resolveStateful({}, domStyleProps);
      expect(domStyleNextProps).toMatchSnapshot();
    });

    test('preserves unrelated inline styles', () => {
      const domStyleProps = { classList: [], style: { fontSize: '20px' } };
      const domStyleNextProps = styleSheetRegistry.resolveStateful({ opacity: 1 }, domStyleProps);
      expect(domStyleNextProps).toMatchSnapshot();
    });

    test('next class names have priority over current inline styles', () => {
      const domStyleProps = { classList: [], style: { opacity: 0.5 } };
      const nextStyle = styleSheetRegistry.register({ opacity: 1 });
      const domStyleNextProps = styleSheetRegistry.resolveStateful(nextStyle, domStyleProps);
      expect(domStyleNextProps).toMatchSnapshot();
    });

    test('next inline styles have priority over current inline styles', () => {
      // note: this also checks for correctly uppercasing the first letter of DOM vendor prefixes
      const domStyleProps = {
        classList: [],
        style: { opacity: 0.5, WebkitTransform: 'scale(1)', transform: 'scale(1)' }
      };
      const domStyleNextProps = styleSheetRegistry.resolveStateful(
        { opacity: 1, transform: [{ scale: 2 }] },
        domStyleProps
      );
      expect(domStyleNextProps).toMatchSnapshot();
    });
  });
});