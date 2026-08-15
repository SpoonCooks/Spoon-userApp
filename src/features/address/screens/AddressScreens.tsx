import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType, KeyboardTypeOptions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { IntroLoading } from '@features/loading';
import {
  ADDRESS_ACTION_DELETE,
  ADDRESS_ACTION_EDIT,
  ADDRESS_ADD_GLYPH,
  ADDRESS_CHANGE_AREA_ART,
  ADDRESS_LOCATION_GLYPH,
  ADDRESS_MAP_PIN,
  ADDRESS_OUT_OF_SERVICE_ART,
  BottomSheet,
  Button,
  EmptyState,
  Icon,
  IconButton,
  BANNER_AVATAR_GLYPH,
  QueryBoundary,
  ScreenHeader,
  Text,
  lightTheme,
} from '@ui';

import type {
  AddressDetailsViewModel,
  AddressEditViewModel,
  AddressListViewModel,
  AddressLocationViewModel,
  AddressOutOfServiceViewModel,
} from '../types';

/**
 * Address flow — Figma `68:214` (saved list), `53:31` (map / pin) and `60:655` (details form).
 *
 * All three share one screen header (`68:252` / `63:783` / `60:731`): a white bar with a 0.889pt
 * `#E2E8F0` underline, 16/12 padding, a 32pt back control and a Livvic Bold 16/24 title 14pt to
 * its right. It is STICKY on all three.
 *
 * Deviation, recorded in the audit: `53:37`'s map is an unbranded placeholder illustration in
 * Figma, not a provider render, and the map SDK is still an open engineering choice. The canvas
 * renders at the frame's `rgba(255,247,204,0.2)` with the real 46 × 43 pin on top; everything
 * around it — search bar, helper pill, resolved-address row and Confirm CTA — is the frame.
 *
 * Ruling R-4: serviceability is surfaced INLINE in the map step using the helper-pill treatment
 * the frame already provides. There is no separate rejection screen and none is invented. The
 * client never evaluates coverage — `serviceabilityMessage` is a server string.
 */

/* ------------------------------------------------------------------ saved list */

export interface SavedAddressesViewProps {
  readonly state: DataState<AddressListViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onAdd: () => void;
  readonly onSelect: (id: string) => void;
  /** NEW `68:214` — the row kebab, which raises the `228:1801` Edit / Delete sheet. */
  readonly onOpenActions: (id: string) => void;
}

export function SavedAddressesView({
  state,
  onRetry,
  onBack,
  onAdd,
  onSelect,
  onOpenActions,
}: SavedAddressesViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingFallback={<IntroLoading />}>
        {(list) => (
          <>
            <ScreenHeader title={list.title} onBack={onBack} testID="address-header" />

            <ScrollView contentContainerStyle={styles.listBody} testID="saved-addresses-screen">
              {/* `69:514` — an `#FFEF99` 41pt bar with the 28pt add mark on the right. */}
              <Pressable
                onPress={onAdd}
                accessibilityRole="button"
                accessibilityLabel={list.addCtaLabel}
                style={({ pressed }) => [styles.addCard, pressed ? styles.pressed : null]}
                testID="address-add"
              >
                <Text variant="title" color="textField">
                  {list.addCtaLabel}
                </Text>
                <Image
                  source={ADDRESS_ADD_GLYPH}
                  style={styles.addGlyph}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </Pressable>

              {list.addresses.length === 0 ? (
                <EmptyState
                  title={list.emptyTitle}
                  description={list.emptyDescription}
                  icon="pin"
                  actionLabel={list.addCtaLabel}
                  onAction={onAdd}
                  testID="address-empty"
                />
              ) : (
                /* `6:700` — white, 1pt `#E2E8F0`, 24pt radius, 15.889pt padding, 12pt gap. */
                <View style={styles.listCard} testID="address-list">
                  <Text variant="title" color="textField">
                    {list.sectionTitle}
                  </Text>

                  {list.addresses.map((address) => (
                    <View key={address.id} style={styles.addressRow}>
                      <Pressable
                        onPress={() => onSelect(address.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`${address.label}. ${address.line}`}
                        accessibilityState={{ selected: address.selected ?? false }}
                        style={({ pressed }) => [
                          styles.addressRowBody,
                          pressed ? styles.pressed : null,
                        ]}
                        testID={`address-row-${address.id}`}
                      >
                        <Text variant="bodyBold" color="textStrong">
                          {address.label}
                        </Text>
                        <Text variant="noteBody" color="textFieldLabel" numberOfLines={2}>
                          {address.line}
                        </Text>
                      </Pressable>

                      {/* NEW in `68:214` — a `#FFD600` kebab on the right of every row, which is
                          what opens the `228:1801` Edit / Delete sheet. It is three flat 3.35pt
                          dots in the node, so it is drawn rather than exported. */}
                      <Pressable
                        onPress={() => onOpenActions(address.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Options for ${address.label}`}
                        hitSlop={14}
                        style={({ pressed }) => [styles.rowMenu, pressed ? styles.pressed : null]}
                        testID={`address-row-menu-${address.id}`}
                      >
                        <View style={styles.rowMenuDot} />
                        <View style={styles.rowMenuDot} />
                        <View style={styles.rowMenuDot} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ map / pin */

export interface AddressLocationViewProps {
  readonly state: DataState<AddressLocationViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onConfirm: () => void;
  readonly onSearch?: (value: string) => void;
}

export function AddressLocationView({
  state,
  onRetry,
  onBack,
  onConfirm,
  onSearch,
}: AddressLocationViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingFallback={<IntroLoading />}>
        {(location) => (
          <View style={styles.flex} testID="address-location-screen">
            <ScreenHeader title={location.title} onBack={onBack} testID="address-header" />

            {/* `63:761` — the search bar sits in its own sticky bar below the header. */}
            <View style={styles.searchBar}>
              <Text variant="bodyStrong" color="textSecondary">
                {location.searchLabel}
              </Text>
              <View style={styles.searchField}>
                <Icon name="search" size={16} color="textSecondary" />
                <SearchInput
                  key={location.searchValue}
                  value={location.searchValue}
                  placeholder={location.searchPlaceholder}
                  {...(onSearch === undefined ? {} : { onChange: onSearch })}
                />
              </View>
            </View>

            {/* `53:33` — the map canvas. Provider unchosen; the pin is the real asset. */}
            <View style={styles.map} testID="address-map">
              <Image
                source={ADDRESS_MAP_PIN}
                style={styles.mapPin}
                resizeMode="contain"
                accessibilityLabel="Selected location"
              />
            </View>

            {/* `53:58` — the pinned panel. */}
            <View style={styles.locationPanel}>
              <View style={styles.locationTop}>
                {/* `63:779` — the helper pill, which R-4 also uses for the serviceability line. */}
                <View
                  style={styles.helperPill}
                  testID={
                    location.serviceabilityMessage === undefined
                      ? 'address-helper'
                      : 'address-serviceability'
                  }
                >
                  <Text variant="labelMedium" color="textPrimary" align="center">
                    {location.serviceabilityMessage ?? location.helperText}
                  </Text>
                </View>

                <View style={styles.resolvedRow}>
                  <Image
                    source={ADDRESS_LOCATION_GLYPH}
                    style={styles.locationGlyph}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                  <View style={styles.resolvedText}>
                    <Text variant="title" color="textPrimary" numberOfLines={1}>
                      {location.resolvedTitle}
                    </Text>
                    <Text variant="bodyLoose" color="textSecondary" numberOfLines={2}>
                      {location.resolvedLine}
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                label={location.confirmLabel}
                onPress={onConfirm}
                variant="primary"
                size="form"
                // The SERVER decides serviceability; this only reflects what it said.
                disabled={location.serviceabilityMessage !== undefined}
                style={styles.glowCta}
                testID="address-confirm"
              />
            </View>
          </View>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/**
 * The search field is seeded from the payload and then owned by the user. It is REMOUNTED (via a
 * `key` on the caller) when the server sends a different value, rather than syncing in an effect —
 * an effect would fight the user's typing on every refetch.
 */
function SearchInput({
  value,
  placeholder,
  onChange,
}: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange?: (next: string) => void;
}) {
  const [text, setText] = useState(value);

  return (
    <TextInput
      value={text}
      onChangeText={(next) => {
        setText(next);
        onChange?.(next);
      }}
      placeholder={placeholder}
      placeholderTextColor={lightTheme.colors.textPlaceholder}
      accessibilityLabel={placeholder}
      style={styles.searchInput}
      returnKeyType="search"
      testID="address-search"
    />
  );
}

/* ------------------------------------------------------------- edit sheet (228:1801) */

export interface AddressEditSheetProps {
  readonly visible: boolean;
  readonly edit: AddressEditViewModel;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

/**
 * `228:1801` — the Edit / Delete sheet raised from a saved address.
 *
 * It reuses the list's `6:700` card and `6:713` address row rather than restating them, because
 * the frame reuses those very nodes. Only the two action rows (`230:2080`, `230:2083`) are new.
 *
 * `headerVariant="screen"` is the frame's own header: `230:1925` is a 45pt band with a 32pt back
 * control 15pt clear of a Livvic Black 20/28 title and no hairline — the same header `143:317`
 * already established on the Extension sheet.
 */
export function AddressEditSheet({
  visible,
  edit,
  onClose,
  onEdit,
  onDelete,
}: AddressEditSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBack={onClose}
      title={edit.title}
      headerVariant="screen"
      backVariant="outlined"
      bodyStyle={styles.editSheetBody}
      testID="address-edit-sheet"
    >
      <View style={styles.listCard}>
        <Text variant="title" color="textField">
          {edit.cardTitle}
        </Text>

        {/* `6:712` — 21pt between the address block and the two actions. */}
        <View style={styles.editActions}>
          <View style={styles.addressRow}>
            <Text variant="bodyBold" color="textStrong">
              {edit.address.label}
            </Text>
            <Text variant="noteBody" color="textFieldLabel" numberOfLines={2}>
              {edit.address.line}
            </Text>
          </View>

          <AddressActionRow
            art={ADDRESS_ACTION_EDIT}
            label={edit.editLabel}
            onPress={onEdit}
            testID="address-edit-action"
          />
          <AddressActionRow
            art={ADDRESS_ACTION_DELETE}
            label={edit.deleteLabel}
            onPress={onDelete}
            testID="address-delete-action"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

/** `230:2080` / `230:2083` — a 28pt disc, 12pt clear of a Livvic Bold 14/20 label. */
function AddressActionRow({
  art,
  label,
  onPress,
  testID,
}: {
  readonly art: ImageSourcePropType;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.editActionRow, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {/* The 28pt node draws itself at `inset -14.29%`, so a 36pt image overflows a 28pt box. */}
      <View style={styles.editActionDisc}>
        <Image
          source={art}
          style={styles.editActionArt}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text variant="title" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

/* --------------------------------------------------- out of service (215:1472) */

export interface AddressOutOfServiceViewProps {
  readonly state: DataState<AddressOutOfServiceViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onOpenProfile?: () => void;
}

/**
 * `215:1472` "Page 16d- Address out of service".
 *
 * PRODUCT_DESIGN_CONFLICT with ruling R-4 — see `AddressOutOfServiceViewModel`. Built as drawn.
 *
 * The banner (`218:1536`) is a 45pt band carrying the address that was rejected and the account
 * avatar; the body (`221:1553`) centres a 215pt `#FFEF99` disc — a plain circle in the node, so
 * it is drawn, not exported — holding the 150 x 125 illustration, over a Black 20/25 headline and
 * a Medium 10/13.33 line measured at 307pt.
 *
 * The apology copy carries the frame's own double comma (recorded as D-30). It is rendered from
 * supplied copy, so a corrected string replaces it the moment the server sends one.
 */
export function AddressOutOfServiceView({
  state,
  onRetry,
  onBack,
  onOpenProfile,
}: AddressOutOfServiceViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingFallback={<IntroLoading />}>
        {(view) => (
          <View style={styles.flex} testID="address-out-of-service-screen">
            {/* `218:1536` — 45pt: back at 4/7, the address column at 47, the avatar at 302. */}
            <View style={styles.oosBanner}>
              <IconButton
                name="back"
                label="Back"
                variant="outlined"
                color="textSecondary"
                onPress={onBack}
                testID="address-oos-back"
              />
              <View style={styles.oosAddress}>
                <Text variant="label" color="textPrimary" numberOfLines={1}>
                  {view.addressLabel}
                </Text>
                <Text variant="micro" color="textPrimary" numberOfLines={1}>
                  {view.addressLine}
                </Text>
              </View>
              {/* `218:1547` — the same 41pt profile box Home draws: a 32pt ring over a 25pt
                  glyph. The photograph is remote when the account has one. */}
              <Pressable
                onPress={onOpenProfile}
                disabled={onOpenProfile === undefined}
                accessibilityRole="button"
                accessibilityLabel="Profile"
                hitSlop={12}
                style={styles.oosProfile}
                testID="address-oos-avatar"
              >
                {/* `218:1548` is a FLAT `#FFE666` circle, so it is drawn. The Home export of the
                    same node is pre-composited over that banner's `#F5FFCD` lime and would show
                    as a lime square on this white banner. */}
                <View style={styles.oosProfileRing} />
                <Image
                  source={
                    view.avatarUrl === undefined ? BANNER_AVATAR_GLYPH : { uri: view.avatarUrl }
                  }
                  style={styles.oosProfileGlyph}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </Pressable>
            </View>

            {/* `221:1553` — centred, 30pt between the art and the copy. */}
            <View style={styles.oosBody}>
              <View style={styles.oosDisc}>
                <Image
                  source={ADDRESS_OUT_OF_SERVICE_ART}
                  style={styles.oosArt}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <View style={styles.oosCopy}>
                <Text variant="headingOutcome" color="textPrimary" align="center">
                  {view.title}
                </Text>
                <Text variant="captionStrong" color="textPrimary" align="center">
                  {view.message}
                </Text>
              </View>
            </View>
          </View>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ details form */

export interface AddressDetailsViewProps {
  readonly state: DataState<AddressDetailsViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onChangeArea: () => void;
  readonly onSave: (draft: AddressDraft) => void;
}

/** What the form collects. Receiver details are persisted ON THE ADDRESS record (B-13). */
export interface AddressDraft {
  readonly flat: string;
  readonly building: string;
  readonly labelId: string | null;
  /** NEW in `60:655` — the free-text "Save as" name. Empty when the frame offers no such field. */
  readonly saveAs: string;
  readonly receiverName: string;
  readonly receiverPhone: string;
}

export function AddressDetailsView({
  state,
  onRetry,
  onBack,
  onChangeArea,
  onSave,
}: AddressDetailsViewProps) {
  return (
    <QueryBoundary state={state} onRetry={onRetry} loadingFallback={<IntroLoading />}>
      {(details) => <AddressDetailsForm {...{ details, onBack, onChangeArea, onSave }} />}
    </QueryBoundary>
  );
}

function AddressDetailsForm({
  details,
  onBack,
  onChangeArea,
  onSave,
}: {
  readonly details: AddressDetailsViewModel;
  readonly onBack: () => void;
  readonly onChangeArea: () => void;
  readonly onSave: (draft: AddressDraft) => void;
}) {
  // PREFILLED from the record and editable — an existing address opens with its receiver already
  // in the fields, which is the whole point of storing them per address (B-13).
  const [flat, setFlat] = useState(details.flatValue ?? '');
  const [building, setBuilding] = useState(details.buildingValue ?? '');
  const [labelId, setLabelId] = useState<string | null>(details.selectedLabelId ?? null);
  const [saveAs, setSaveAs] = useState(details.saveAsValue ?? '');
  const [receiverName, setReceiverName] = useState(details.receiverName ?? '');
  const [receiverPhone, setReceiverPhone] = useState(details.receiverPhone ?? '');

  return (
    <SafeAreaView style={styles.screenForm} edges={['top', 'left', 'right']}>
      <ScreenHeader title={details.title} onBack={onBack} divider={false} testID="address-header" />

      {/* `padding` on both platforms — see LoginScreen: `adjustResize` is inert under the
          edge-to-edge display, so an undefined Android behavior leaves the keyboard covering the
          receiver fields and the Save CTA. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          testID="address-details-screen"
        >
          <FormInput
            value={flat}
            onChangeText={setFlat}
            placeholder={details.flatPlaceholder}
            testID="address-flat"
          />
          <FormInput
            value={building}
            onChangeText={setBuilding}
            placeholder={details.buildingPlaceholder}
            testID="address-building"
          />

          {/* `63:802` — the area field with the 58 × 62 "Change" thumbnail beside it. */}
          <View style={styles.field}>
            <Text variant="bodyStrong" color="textSecondaryStrong">
              {details.areaTitle}
            </Text>
            <View style={styles.areaRow}>
              <View style={styles.areaValue}>
                <Text variant="bodyMedium" color="textPrimary">
                  {details.areaValue}
                </Text>
              </View>
              <Pressable
                onPress={onChangeArea}
                accessibilityRole="button"
                accessibilityLabel={details.changeLabel}
                hitSlop={8}
                style={({ pressed }) => [styles.changeArea, pressed ? styles.pressed : null]}
                testID="address-change-area"
              >
                <Image
                  source={ADDRESS_CHANGE_AREA_ART}
                  style={styles.changeAreaArt}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <Image
                  source={ADDRESS_MAP_PIN}
                  style={styles.changeAreaPin}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
                <Text variant="labelMedium" color="textSecondary" style={styles.changeAreaLabel}>
                  {details.changeLabel}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* `60:707` — Home · Parents · Friends · Others, supplied as data. */}
          <View style={styles.field}>
            <Text variant="bodyStrong" color="textSecondaryStrong">
              {details.labelTitle}
            </Text>
            <View
              style={styles.labelChips}
              accessibilityRole="radiogroup"
              accessibilityLabel={details.labelTitle}
            >
              {details.labelOptions.map((option) => {
                const selected = labelId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setLabelId(option.id)}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected, checked: selected }}
                    hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                    style={({ pressed }) => [
                      styles.labelChip,
                      selected ? styles.labelChipSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                    testID={`address-label-${option.id}`}
                  >
                    <Text variant="chipLabel" color="textPrimary" numberOfLines={1}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* NEW in `60:655` — a free-text "Save as" name for the address, under the chips. */}
          {details.saveAsPlaceholder === undefined ? null : (
            <FormInput
              value={saveAs}
              onChangeText={setSaveAs}
              placeholder={details.saveAsPlaceholder}
              testID="address-save-as"
            />
          )}

          {/* `64:4` — receiver name and phone, 5pt apart under one label. The frame now marks the
              section "(Optional)" in a lighter run beside the label. */}
          <View style={styles.receiver}>
            <Text variant="bodyStrong" color="textSecondaryStrong">
              {details.receiverTitle}
              {details.receiverOptionalLabel === undefined ? null : (
                <Text variant="body" color="textQuiet">
                  {` ${details.receiverOptionalLabel}`}
                </Text>
              )}
            </Text>
            <FormInput
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder={details.receiverNamePlaceholder}
              testID="address-receiver-name"
            />
            <FormInput
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              placeholder={details.receiverPhonePlaceholder}
              keyboardType="phone-pad"
              testID="address-receiver-phone"
            />
          </View>
        </ScrollView>

        {/* `60:728` — a `#FFD600` bar with the `#FEE685` glow. */}
        <View style={styles.formFooter}>
          <Button
            label={details.ctaLabel}
            onPress={() => onSave({ flat, building, labelId, saveAs, receiverName, receiverPhone })}
            variant="primary"
            size="form"
            style={styles.glowCta}
            testID="address-save"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  testID,
}: {
  readonly value: string;
  readonly onChangeText: (next: string) => void;
  readonly placeholder: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly testID: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={lightTheme.colors.textSecondaryStrong}
      accessibilityLabel={placeholder}
      style={styles.input}
      testID={testID}
      {...(keyboardType === undefined ? {} : { keyboardType })}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  /** `60:656` — the details step sits on `#F8FAFC`, unlike the other two. */
  /**
   * `60:655` — the address form sits on WHITE, not on the Meal Brief's `#F8FAFC`. Sampled off the
   * frame, the ground below the last field and around the CTA is (255,255,255); `surfaceForm` put
   * a grey band between "Phone no." and the CTA that the frame does not draw.
   */
  screenForm: { flex: 1, backgroundColor: lightTheme.colors.surface },
  /** `69:514` / `6:700` — the two blocks sit 16.22pt in with 12pt between them. */
  listBody: {
    paddingHorizontal: 16.22,
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.xl,
    gap: lightTheme.space.md,
  },
  /** `69:514` — `#FFEF99`, 41pt, 24pt radius, px 15.889 / pt 6 / pb 10. */
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
    minHeight: 41,
    paddingHorizontal: 15.889,
    paddingTop: lightTheme.space.s6,
    paddingBottom: lightTheme.space.s10,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    ...lightTheme.elevation.hairline,
  },
  addGlyph: { width: 28, height: 28 },
  /** `6:700` — white, 1pt `#E2E8F0`, 24pt radius, 15.889pt padding, 12pt gap. */
  listCard: {
    gap: lightTheme.space.md,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
  /* ---- `228:1801` address edit sheet ---- */
  /** `230:1924` — pt 10 / pb 16 / px 16, 10pt between the header band and the card. */
  editSheetBody: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.xs + 6,
    paddingBottom: lightTheme.space.lg,
    gap: lightTheme.space.xs + 6,
  },
  /** `6:712` — 21pt between the address block and each action row. */
  editActions: { gap: 21 },
  /** `230:2080` — a 28pt disc 12pt clear of its label. */
  editActionRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  editActionDisc: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  /** The node draws itself at `inset -14.29%`, i.e. a 36pt mark overflowing a 28pt box. */
  editActionArt: { width: 36, height: 36, margin: -4 },

  /* ---- `215:1472` address out of service ---- */
  /** `218:1536` — a 45pt banner: back, the address column, then the profile. */
  oosBanner: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingHorizontal: lightTheme.space.xs,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `218:1537` / `218:1538` — SemiBold 11/16.5 over Regular 9/13.5. */
  oosAddress: { flex: 1, minWidth: 0 },
  /** `218:1547` — a 41pt box holding a 32pt ring and a 25pt glyph. */
  oosProfile: { width: 41, height: 41, alignItems: 'center', justifyContent: 'center' },
  oosProfileRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  oosProfileGlyph: { width: 25, height: 25, borderRadius: 12.5 },
  /** `221:1553` — centred, pt 40 / pb 80 / px 16, 30pt between the art and the copy. */
  oosBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    paddingTop: 40,
    paddingBottom: 80,
    paddingHorizontal: lightTheme.space.lg,
  },
  /** `222:1557` — a plain `#FFEF99` 215pt circle in the node, so it is drawn, not exported. */
  oosDisc: {
    width: 215,
    height: 215,
    borderRadius: 107.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** `219:1551` — 150 x 125, with the frame's own crop baked into the export. */
  oosArt: { width: 150, height: 125 },
  /** `221:1556` — px 15 / py 10, 10pt between the headline and the line, measured at 307. */
  oosCopy: {
    alignItems: 'center',
    gap: lightTheme.space.xs + 6,
    maxWidth: 307,
    paddingHorizontal: 15,
    paddingVertical: lightTheme.space.xs + 6,
  },

  /** `6:713` — `rgba(255,247,204,0.7)` at a 16pt radius, 11.889pt padding, 1.165pt gap. */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
  },
  addressRowBody: { flex: 1, minWidth: 0, gap: 1.165 },
  /** The kebab ink measures 3.35pt per dot over a 12.55pt column — 1.25pt between dots. */
  rowMenu: { alignItems: 'center', justifyContent: 'center', gap: 1.25, paddingLeft: 8 },
  rowMenuDot: {
    width: 3.35,
    height: 3.35,
    borderRadius: 1.675,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  pressed: { opacity: 0.85 },
  /** `63:761` — a second sticky bar under the header, 3.99pt between label and field. */
  searchBar: {
    gap: 3.99,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    borderBottomWidth: lightTheme.stroke.hairline,
    borderBottomColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `53:64` — 1pt `#CAD5E2` at a 24pt radius, px 11.889 / py 7.889, `0 1 0 rgba(0,0,0,0.05)`. */
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderControl,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: lightTheme.colors.textSecondary,
    ...lightTheme.typography.bodyMedium,
  },
  /** `53:33` — a 461pt canvas at `rgba(255,247,204,0.2)`; it absorbs the spare height. */
  map: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceMapCanvas,
  },
  /** `63:782` — the 46 × 43 exported pin. */
  mapPin: { width: 46, height: 43 },
  /** `53:58` — `rgba(255,247,204,0.7)`, 16pt padding, 13pt gap. */
  locationPanel: {
    gap: 13,
    padding: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
  },
  locationTop: { gap: lightTheme.space.sm },
  /** `63:779` — `#FFEF99`, 20pt tall, 24pt radius, `0 0 4 rgba(0,0,0,0.1)`. */
  helperPill: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 20,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.xxs,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    ...lightTheme.elevation.hairline,
  },
  /** `63:771` — a 45pt row: the 37 × 45 mark then the resolved address. */
  resolvedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  locationGlyph: { width: 37, height: 45 },
  resolvedText: { flex: 1, minWidth: 0, gap: lightTheme.space.xs },
  /** `53:111` / `60:729` — the `#FEE685` glow under the address CTAs. */
  glowCta: { ...lightTheme.elevation.glow },
  /** `60:678` — white, px 16, pt 21, pb 16, 17pt between fields. */
  form: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: 21,
    paddingBottom: lightTheme.space.lg,
    gap: 17,
    backgroundColor: lightTheme.colors.surface,
  },
  formFooter: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.md,
    paddingBottom: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `60:701` — a 10pt gap between a field's label and its control. */
  field: { gap: lightTheme.space.s10 },
  /** `64:4` — the receiver block packs its two inputs 5pt apart. */
  receiver: { gap: 5 },
  areaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.md },
  /** `60:703` — the 57pt area field. */
  areaValue: {
    flex: 1,
    minWidth: 0,
    minHeight: 57,
    justifyContent: 'center',
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `63:807` — a 58 × 62 thumbnail with the pin over it and "Change" beneath. */
  changeArea: { width: 58, height: 62 },
  changeAreaArt: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 56,
    height: 59,
    borderRadius: lightTheme.radius.xs,
  },
  changeAreaPin: { position: 'absolute', left: 19, top: 12, width: 22, height: 22 },
  changeAreaLabel: { position: 'absolute', left: 8, top: 32 },
  /** `60:710` — four chips, 8pt apart, wrapping on a narrow column. */
  labelChips: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  /** `63:799` — 21pt tall, px 15.889 / py 5.889, 10pt radius, 1pt `#FFDE33`. */
  labelChip: {
    minHeight: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15.889,
    paddingVertical: 5.889,
    borderRadius: lightTheme.radius.r10,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderCtaSoft,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  /** `64:11` — the selected chip fills `#FFF7CC`; the outline does not change. */
  labelChipSelected: { backgroundColor: lightTheme.colors.surfaceAccent },
  /** `60:697` — 1pt `#CAD5E2` at a 12pt radius, px 11.889 / py 7.889. */
  input: {
    alignSelf: 'stretch',
    minHeight: 32,
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
    // `60:655` now outlines every input in `#FFD600`; it was `#CAD5E2` in the previous file.
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
    color: lightTheme.colors.textPrimary,
    ...lightTheme.typography.bodyMedium,
  },
});
