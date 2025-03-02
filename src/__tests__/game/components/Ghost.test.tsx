import { render } from '@testing-library/react';

import Ghost from '@components/Ghost';

test('renders Ghost component', () => {
  const { getByText } = render(<Ghost id={1}/>);
  expect(getByText('Ghost')).toBeTruthy();
});
