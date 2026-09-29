import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_TYPE, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';

import { colors, font, radius } from '@/theme';

const PLAN_LABEL: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.ANNUAL]: '年額プラン',
  [PACKAGE_TYPE.MONTHLY]: '月額プラン',
  [PACKAGE_TYPE.LIFETIME]: '買い切り',
  [PACKAGE_TYPE.WEEKLY]: '週額プラン',
};

/** Annual first, since it is the plan both paywalls recommend. */
export const defaultPackage = (offering: PurchasesOffering | null) =>
  offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
  offering?.availablePackages[0] ??
  null;

/** Radio-style plan cards with a "save N%" ribbon on the annual plan. */
export function PlanPicker({
  offering,
  selected,
  onSelect,
}: {
  offering: PurchasesOffering;
  selected: PurchasesPackage | null;
  onSelect: (pkg: PurchasesPackage) => void;
}) {
  const annual = offering.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
  const monthly = offering.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  const savings =
    annual && monthly ? Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100) : null;

  return (
    <>
      {offering.availablePackages.map((pkg) => {
        const active = selected?.identifier === pkg.identifier;
        const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
        return (
          <Pressable
            key={pkg.identifier}
            onPress={() => onSelect(pkg)}
            style={[styles.plan, active && { borderColor: colors.purple, backgroundColor: '#F7EEFF' }]}
          >
            {isAnnual && savings !== null && savings > 0 && (
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>おすすめ・{savings}%おトク</Text>
              </View>
            )}
            <View style={[styles.radio, active && { borderColor: colors.purple }]}>
              {active && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{PLAN_LABEL[pkg.packageType] ?? pkg.product.title}</Text>
              {pkg.product.introPrice && (
                <Text style={[font.small, { color: colors.purpleDark, fontWeight: '700' }]}>無料トライアルあり</Text>
              )}
            </View>
            <Text style={styles.price}>{pkg.product.priceString}</Text>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 6,
  },
  ribbon: {
    position: 'absolute',
    top: -12,
    right: 14,
    backgroundColor: '#28CDA5',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ribbonText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.purple },
  price: { fontSize: 17, fontWeight: '800', color: colors.text },
});
