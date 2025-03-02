import { render } from '@testing-library/react';
import Ghost from './Ghost';

test('renders Ghost component', () => {
  const { getByText } = render(<Ghost />);
  expect(getByText('Ghost')).toBeTruthy();
});
