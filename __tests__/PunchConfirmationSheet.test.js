import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import PunchConfirmationSheet from '../src/components/PunchConfirmationSheet';

jest.mock('../src/Helper/BottomSheetBase', () => {
  const React = require('react');
  return function BottomSheetBaseMock({ visible, children, ...props }) {
    if (!visible) return null;
    return React.createElement('BottomSheetBase', props, children);
  };
});

jest.mock('../src/Helper/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement(Text, props, children),
  };
});

describe('PunchConfirmationSheet component', () => {
  it('shows start-time confirmation with a safe, draggable bottom sheet', async () => {
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PunchConfirmationSheet
          visible
          action="in"
          currentTime="09:00 AM"
          onConfirm={() => {}}
          onCancel={() => {}}
        />,
      );
    });

    const sheet = renderer.root.findByType('BottomSheetBase');
    expect(sheet.props.isSnapPoint).toBe(true);
    expect(sheet.props.isScrollView).toBe(false);
    expect(sheet.props.snapPoints).toEqual(['48%']);
    expect(renderer.root.findByProps({ testID: 'punch-confirmation-content' }).props.style)
      .toMatchObject({ padding: 16 });
    const renderedTree = JSON.stringify(renderer.toJSON());
    expect(renderedTree).toContain('You are about to start your work time.');
    expect(renderedTree).toContain('09:00 AM');
  });

  it('uses stop-time copy and sends confirm/cancel events to the parent', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PunchConfirmationSheet
          visible
          action="out"
          currentTime="05:00 PM"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      );
    });

    const confirmButton = renderer.root.findByProps({ accessibilityLabel: 'Confirm punch out' });
    const cancelButton = renderer.root.findByProps({ accessibilityLabel: 'Cancel punch' });
    await ReactTestRenderer.act(() => confirmButton.props.onPress());
    await ReactTestRenderer.act(() => cancelButton.props.onPress());

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(renderer.toJSON())).toContain(
      'You are about to stop your work time.',
    );
  });

  it('does not render while closed', async () => {
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PunchConfirmationSheet visible={false} action="in" onConfirm={() => {}} onCancel={() => {}} />,
      );
    });
    expect(renderer.toJSON()).toBeNull();
  });
});
