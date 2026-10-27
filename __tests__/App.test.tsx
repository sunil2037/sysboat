/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import MainApp from '../src/Context/MainApp';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<MainApp />);
  });
});
