import { fireEvent, render, screen } from '@testing-library/react-native';
import { Modal } from 'react-native';

import { InfoDialog } from './InfoDialog';

const TAXES = {
  title: 'What is Taxes?',
  body: 'Taxes levied as per Govt. regulations, subject to change basis final service value.',
};

describe('InfoDialog', () => {
  it('renders nothing while closed', () => {
    render(<InfoDialog visible={false} onClose={jest.fn()} {...TAXES} />);

    expect(screen.queryByText(TAXES.title)).toBeNull();
  });

  it('renders title and body in its own modal by default', () => {
    render(<InfoDialog visible onClose={jest.fn()} {...TAXES} />);

    expect(screen.getByText(TAXES.title)).toBeTruthy();
    expect(screen.getByText(TAXES.body)).toBeTruthy();
    expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  });

  it('closes from the ✕ control', () => {
    const onClose = jest.fn();
    render(<InfoDialog visible onClose={onClose} {...TAXES} />);

    fireEvent.press(screen.getByTestId('info-dialog-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the backdrop and from the Android back button', () => {
    const onClose = jest.fn();
    render(<InfoDialog visible onClose={onClose} {...TAXES} />);

    fireEvent.press(screen.getByTestId('info-dialog-host-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);

    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders WITHOUT a modal in inline presentation, for layering over a sheet', () => {
    render(<InfoDialog visible presentation="inline" onClose={jest.fn()} {...TAXES} />);

    expect(screen.getByText(TAXES.title)).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
  });

  it('announces itself as an alert with the full message', () => {
    render(<InfoDialog visible presentation="inline" onClose={jest.fn()} {...TAXES} />);

    const card = screen.getByTestId('info-dialog');
    expect(card.props.accessibilityRole).toBe('alert');
    expect(card.props.accessibilityLabel).toBe(`${TAXES.title}. ${TAXES.body}`);
  });

  it('labels the close control for screen readers', () => {
    render(<InfoDialog visible presentation="inline" onClose={jest.fn()} {...TAXES} />);

    const close = screen.getByTestId('info-dialog-close');
    expect(close.props.accessibilityRole).toBe('button');
    expect(close.props.accessibilityLabel).toBe('Close');
  });
});
