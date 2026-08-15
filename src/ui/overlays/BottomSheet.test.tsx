import { fireEvent, render, screen } from '@testing-library/react-native';
import { Modal, Text as RNText } from 'react-native';

import { BottomSheet } from './BottomSheet';
import { InfoDialog } from './InfoDialog';

/** The backdrop sits behind an `accessibilityViewIsModal` sheet, so it is hidden by design. */
function backdrop(testID = 'bottom-sheet-backdrop') {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function Sheet(props: Partial<React.ComponentProps<typeof BottomSheet>>) {
  return (
    <BottomSheet visible onClose={jest.fn()} title="Instant" {...props}>
      <RNText>sheet content</RNText>
    </BottomSheet>
  );
}

describe('BottomSheet — open and close', () => {
  it('renders nothing while closed', () => {
    render(
      <BottomSheet visible={false} onClose={jest.fn()}>
        <RNText>sheet content</RNText>
      </BottomSheet>,
    );

    expect(screen.queryByText('sheet content')).toBeNull();
  });

  it('renders the title, content and footer when open', () => {
    render(<Sheet footer={<RNText>footer</RNText>} />);

    expect(screen.getByText('Instant')).toBeTruthy();
    expect(screen.getByText('sheet content')).toBeTruthy();
    expect(screen.getByText('footer')).toBeTruthy();
  });

  it('closes on a backdrop tap', () => {
    const onClose = jest.fn();
    render(<Sheet onClose={onClose} />);

    fireEvent.press(backdrop());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores backdrop taps when dismissal is disabled', () => {
    const onClose = jest.fn();
    render(<Sheet onClose={onClose} dismissOnBackdropPress={false} />);

    fireEvent.press(backdrop());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides the backdrop from assistive tech — the sheet is the modal surface', () => {
    render(<Sheet />);

    // Sibling of a view marked accessibilityViewIsModal, so it must not be reachable.
    expect(screen.queryByTestId('bottom-sheet-backdrop')).toBeNull();
    expect(backdrop()).toBeTruthy();
  });

  it('exposes a back control for sheets that are steps in a stack', () => {
    const onBack = jest.fn();
    render(<Sheet onBack={onBack} title="Cancel booking" />);

    fireEvent.press(screen.getByTestId('bottom-sheet-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('BottomSheet — Android back button', () => {
  it('closes the sheet via the native onRequestClose hook', () => {
    const onClose = jest.fn();
    render(<Sheet onClose={onClose} />);

    // This is the prop the Android hardware back button drives.
    const modal = screen.UNSAFE_getByType(Modal);
    modal.props.onRequestClose();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes the DIALOG first when one is layered above the sheet', () => {
    const onClose = jest.fn();
    const onDialogClose = jest.fn();

    render(
      <Sheet onClose={onClose} dialog={<RNText>dialog</RNText>} onDialogClose={onDialogClose} />,
    );

    screen.UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onDialogClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('BottomSheet — dialog layering', () => {
  it('renders the dialog above the sheet inside ONE native modal', () => {
    render(<Sheet dialog={<RNText>dialog above</RNText>} onDialogClose={jest.fn()} />);

    expect(screen.getByText('dialog above')).toBeTruthy();
    expect(screen.getByTestId('bottom-sheet-dialog-layer')).toBeTruthy();
    // The sheet is still mounted behind the dialog, just unreachable by assistive tech.
    expect(screen.getByText('sheet content', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('sheet content')).toBeNull();
    // Nested native modals are the thing this design avoids.
    expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  });

  it('hides the sheet from assistive tech while the dialog is open', () => {
    const { rerender } = render(<Sheet />);
    expect(screen.getByTestId('bottom-sheet').props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByText('sheet content')).toBeTruthy();

    rerender(<Sheet dialog={<RNText>dialog</RNText>} onDialogClose={jest.fn()} />);

    const sheet = screen.getByTestId('bottom-sheet', { includeHiddenElements: true });
    expect(sheet.props.accessibilityViewIsModal).toBe(false);
    expect(sheet.props.accessibilityElementsHidden).toBe(true);
    expect(sheet.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('closes only the dialog when its own backdrop is tapped', () => {
    const onClose = jest.fn();
    const onDialogClose = jest.fn();

    render(
      <Sheet onClose={onClose} dialog={<RNText>dialog</RNText>} onDialogClose={onDialogClose} />,
    );

    fireEvent.press(backdrop('bottom-sheet-dialog-backdrop'));

    expect(onDialogClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('composes with InfoDialog — the taxes popup over the Instant sheet', () => {
    const onDialogClose = jest.fn();

    render(
      <Sheet
        dialog={
          <InfoDialog
            visible
            presentation="inline"
            onClose={onDialogClose}
            title="What is Taxes?"
            body="Taxes levied as per Govt. regulations."
          />
        }
        onDialogClose={onDialogClose}
      />,
    );

    expect(screen.getByText('What is Taxes?')).toBeTruthy();
    expect(screen.getByText('sheet content', { includeHiddenElements: true })).toBeTruthy();

    fireEvent.press(screen.getByTestId('info-dialog-close'));
    expect(onDialogClose).toHaveBeenCalledTimes(1);
  });
});
