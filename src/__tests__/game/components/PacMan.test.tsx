import { render } from '@testing-library/react';

import PacMan from '@components/PacMan';

test('renders PacMan component', () => {
  const { container } = render(<PacMan x={0} y={0} />);
  expect(container.firstChild).toBeTruthy();
});
