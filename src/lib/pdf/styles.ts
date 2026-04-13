// ============================================================
// Federal Retirement Report — PDF Stylesheet
// ============================================================

import { StyleSheet } from '@react-pdf/renderer';

// Brand palette
export const colors = {
  navy: '#0A1628',
  navyLight: '#1A2A44',
  gold: '#C9A84C',
  goldLight: '#E8D9A0',
  white: '#FFFFFF',
  offWhite: '#F7F8FA',
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  grayDark: '#374151',
  black: '#111827',
  green: '#059669',
  red: '#DC2626',
  blue: '#2563EB',
};

const styles = StyleSheet.create({
  // ---- Page ----
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.black,
    backgroundColor: colors.white,
    paddingTop: 70,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

  // ---- Cover Page ----
  coverPage: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.navy,
    color: colors.white,
    paddingHorizontal: 50,
    paddingVertical: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverLogo: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
    marginBottom: 6,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 12,
    color: colors.goldLight,
    marginBottom: 50,
    textAlign: 'center',
    letterSpacing: 3,
  },
  coverDivider: {
    width: 80,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 50,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  coverClientName: {
    fontSize: 18,
    color: colors.goldLight,
    marginBottom: 40,
    textAlign: 'center',
  },
  coverDate: {
    fontSize: 11,
    color: colors.grayLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  coverAdvisor: {
    fontSize: 10,
    color: colors.grayLight,
    textAlign: 'center',
    marginTop: 2,
  },
  coverFooterBlock: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
  },
  coverDisclaimer: {
    fontSize: 7,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 1.4,
  },

  // ---- Header ----
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  headerBrand: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
  },
  headerSection: {
    fontSize: 9,
    color: colors.grayLight,
  },

  // ---- Footer ----
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 7,
    color: colors.gray,
  },
  pageNumber: {
    fontSize: 7,
    color: colors.gray,
  },

  // ---- Section Title ----
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 14,
  },

  // ---- Titles / Text ----
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.navyLight,
    marginBottom: 6,
    marginTop: 12,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.black,
    marginBottom: 4,
  },
  textSmall: {
    fontSize: 8,
    lineHeight: 1.4,
    color: colors.grayDark,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  link: {
    color: colors.blue,
    textDecoration: 'underline',
  },

  // ---- Summary Box ----
  summaryBox: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.grayDark,
    flex: 1,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    textAlign: 'right',
  },

  // ---- Highlight Box ----
  highlightBox: {
    backgroundColor: colors.navy,
    borderRadius: 4,
    padding: 14,
    marginBottom: 12,
  },
  highlightLabel: {
    fontSize: 8,
    color: colors.goldLight,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
  },

  // ---- Comparison Boxes ----
  comparisonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 4,
    padding: 10,
  },
  comparisonTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    marginBottom: 6,
  },

  // ---- Table ----
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'right',
    paddingHorizontal: 3,
  },
  tableHeaderCellLeft: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'left',
    paddingHorizontal: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayLight,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayLight,
    backgroundColor: colors.offWhite,
  },
  tableCell: {
    fontSize: 8,
    color: colors.black,
    textAlign: 'right',
    paddingHorizontal: 3,
  },
  tableCellLeft: {
    fontSize: 8,
    color: colors.black,
    textAlign: 'left',
    paddingHorizontal: 3,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    textAlign: 'right',
    paddingHorizontal: 3,
  },

  // ---- Status / Badge ----
  badge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
    color: colors.green,
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
    color: colors.red,
  },
  badgeGold: {
    backgroundColor: colors.goldLight,
    color: '#78600F',
  },

  // ---- Disclaimer ----
  disclaimer: {
    fontSize: 7.5,
    color: colors.gray,
    lineHeight: 1.5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.grayLight,
  },

  // ---- Two Column Layout ----
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },

  // ---- Spacer ----
  spacer: {
    height: 10,
  },
  spacerLg: {
    height: 20,
  },

  // ---- Divider ----
  divider: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginVertical: 10,
  },
  goldDivider: {
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: 10,
    width: 60,
  },
});

export default styles;
