import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import PunchConfirmationSheet from '../src/components/PunchConfirmationSheet';
import { getPunchConfirmationDecision } from '../src/screens/attendanceValidation';

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

describe('punch confirmation integration flow', () => {
  it('opens with the correct action and confirms clock-in only after explicit confirmation', async () => {
    const executeAction = jest.fn(action => action);
    const decision = () => getPunchConfirmationDecision({
      inTime: '',
      checkOutTime: '',
      verificationMode: 'direct',
    });
    let renderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PunchConfirmationSheet
          visible
          action="in"
          currentTime="09:00 AM"
          onConfirm={() => executeAction(decision())}
          onCancel={() => {}}
        />,
      );
    });

    expect(executeAction).not.toHaveBeenCalled();
    expect(JSON.stringify(renderer.toJSON())).toContain('Confirm punch in');

    await ReactTestRenderer.act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Confirm punch in' }).props.onPress();
    });
    expect(executeAction).toHaveBeenCalledWith('clock_in');
  });

  it('requires face recognition before allowing the confirmation flow to execute a punch', async () => {
    const executeAction = jest.fn();
    const decision = getPunchConfirmationDecision({
      inTime: '09:00',
      checkOutTime: '',
      verificationMode: 'face',
      faceAuthenticated: false,
    });
    let renderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PunchConfirmationSheet
          visible
          action="out"
          currentTime="05:00 PM"
          onConfirm={() => {
            if (decision === 'clock_out') executeAction('clock_out');
          }}
          onCancel={() => {}}
        />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Confirm punch out' }).props.onPress();
    });
    expect(decision).toBe('verify_face');
    expect(executeAction).not.toHaveBeenCalled();
  });
});
