import { render } from '@testing-library/react';
import Ghost from '@components/Ghost';

test('renders Ghost component', () => {
  const { getByText } = render(<Ghost />);
  expect(getByText('Ghost')).toBeTruthy();
});
