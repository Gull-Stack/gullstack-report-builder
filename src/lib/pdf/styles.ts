// ============================================================
// Federal Retirement Report — PDF Stylesheet
// Aligned with capitalwealth.com brand system.
// ============================================================

import { StyleSheet, Font } from '@react-pdf/renderer';

// ---- Register brand fonts (Cormorant Garamond + Geist via Google Fonts) ----
// @react-pdf supports remote font URLs. We pull the same families used on
// capitalwealth.com so PDFs visually match the website.
// Cormorant Garamond TTF URLs pulled from Google Fonts CSS API (v21).
// Match what capitalwealth.com loads on its site.
Font.register({
  family: 'Cormorant Garamond',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9GnM.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd58jDOjw.ttf', fontWeight: 400, fontStyle: 'italic' },
  ],
});

// Body sans uses @react-pdf's built-in Helvetica family — no remote font
// fetch required (Manrope/Geist are not reliably available as TTFs from
// Google Fonts' v2 CDN, and missing italic variants caused crashes).

// Brand palette — matches capitalwealth.com CSS variables.
export const colors = {
  navy: '#16253C',          // --navy
  navyLight: '#15437a',     // --bg-secondary
  navyMid: '#1e3350',       // --bg-card
  blue: '#2b7bb9',          // --accent-primary
  blueHover: '#02528a',     // --accent-hover
  gold: '#C7A356',          // --accent-secondary
  goldLight: '#FDD25E',
  goldPale: '#fef9ee',
  brandGrey: '#7b868C',     // --brand-grey
  white: '#FFFFFF',
  offWhite: '#fafbfc',
  pageOff: '#f0f4fa',
  grayLight: '#E5E7EB',
  gray: '#6B7280',
  grayDark: '#374151',
  black: '#0F1A2A',
  green: '#059669',
  red: '#DC2626',
};

// Typography — bigger than before so the report is comfortable to read.
// Body uses Helvetica (built into @react-pdf, zero-fetch). Display uses
// Cormorant Garamond from Google Fonts to match capitalwealth.com.
const FONT_BODY = 'Helvetica';
const FONT_DISPLAY = 'Cormorant Garamond';

const styles = StyleSheet.create({
  // ---- Page ----
  page: {
    fontFamily: FONT_BODY,
    fontSize: 11,
    color: colors.black,
    backgroundColor: colors.white,
    paddingTop: 75,
    paddingBottom: 55,
    paddingHorizontal: 50,
    lineHeight: 1.45,
  },

  // ---- Cover Page ----
  coverPage: {
    fontFamily: FONT_BODY,
    backgroundColor: colors.navy,
    color: colors.white,
    paddingHorizontal: 60,
    paddingVertical: 0,
    height: '100%',
  },
  coverEyebrow: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 90,
  },
  coverLogo: {
    fontSize: 38,
    fontFamily: FONT_DISPLAY,
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 4,
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.gold,
    alignSelf: 'center',
    marginVertical: 30,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: FONT_DISPLAY,
    color: colors.white,
    fontWeight: 400,
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 11,
    color: colors.goldLight,
    textAlign: 'center',
    letterSpacing: 3,
  },
  coverClient: {
    fontSize: 22,
    fontFamily: FONT_DISPLAY,
    fontStyle: 'italic',
    color: colors.gold,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 6,
  },
  coverDate: {
    fontSize: 11,
    color: '#cad4e2',
    marginBottom: 4,
    textAlign: 'center',
  },
  coverAdvisor: {
    fontSize: 11,
    color: '#cad4e2',
    textAlign: 'center',
    marginTop: 1,
  },
  coverDisclaimer: {
    fontSize: 8,
    color: '#8a98ad',
    textAlign: 'center',
    lineHeight: 1.5,
    marginHorizontal: 40,
  },

  // ---- Header / Footer ----
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
    paddingHorizontal: 50,
  },
  headerBrand: {
    fontSize: 11,
    fontFamily: FONT_DISPLAY,
    color: colors.gold,
    letterSpacing: 2,
  },
  headerSection: {
    fontSize: 10,
    color: '#cad4e2',
    fontFamily: FONT_BODY,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    borderTopWidth: 0.5,
    borderTopColor: colors.grayLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
  },
  footerText: {
    fontSize: 9,
    color: colors.gray,
    fontFamily: FONT_BODY,
  },
  pageNumber: {
    fontSize: 9,
    color: colors.gray,
    fontFamily: FONT_BODY,
  },

  // ---- Page section title (the big top-of-page heading) ----
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONT_DISPLAY,
    color: colors.navy,
    marginTop: 4,
    marginBottom: 12,
    letterSpacing: 0.4,
    lineHeight: 1.15,
  },
  sectionEyebrow: {
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 3,
    marginBottom: 4,
    fontFamily: FONT_BODY,
    fontWeight: 600,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 16,
    fontFamily: FONT_BODY,
    lineHeight: 1.5,
  },
  goldDivider: {
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 18,
    width: 50,
  },

  // ---- Body text ----
  text: {
    fontSize: 11,
    lineHeight: 1.55,
    color: colors.grayDark,
    marginBottom: 6,
    fontFamily: FONT_BODY,
  },
  textSmall: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.grayDark,
    fontFamily: FONT_BODY,
  },
  bold: {
    fontWeight: 700,
  },
  italic: {
    fontFamily: FONT_DISPLAY,
    fontStyle: 'italic',
  },

  // ---- Subhead (group label) ----
  groupLabel: {
    fontSize: 11,
    fontFamily: FONT_BODY,
    fontWeight: 700,
    color: colors.navy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
    alignSelf: 'flex-start',
    paddingRight: 12,
  },

  // ---- Summary row (label : value) ----
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eef0f3',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.grayDark,
    flex: 1,
    fontFamily: FONT_BODY,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.navy,
    textAlign: 'right',
    fontFamily: FONT_BODY,
  },

  // ---- Hero number block (for the headline annuity etc.) ----
  hero: {
    backgroundColor: colors.navy,
    paddingVertical: 24,
    paddingHorizontal: 28,
    marginBottom: 18,
    borderRadius: 4,
  },
  heroLabel: {
    fontSize: 10,
    color: colors.goldLight,
    letterSpacing: 2.5,
    fontFamily: FONT_BODY,
    fontWeight: 600,
    marginBottom: 6,
  },
  heroValue: {
    fontSize: 42,
    fontFamily: FONT_DISPLAY,
    color: colors.gold,
    lineHeight: 1.05,
  },
  heroCaption: {
    fontSize: 10,
    color: '#cad4e2',
    marginTop: 6,
    fontFamily: FONT_BODY,
  },

  // ---- 3 metric tiles row ----
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricTile: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.gray,
    letterSpacing: 1.5,
    fontFamily: FONT_BODY,
    fontWeight: 600,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    color: colors.navy,
  },

  // ---- Tables ----
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: FONT_BODY,
    fontWeight: 600,
    color: colors.white,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  tableHeaderCellLeft: {
    fontSize: 9,
    fontFamily: FONT_BODY,
    fontWeight: 600,
    color: colors.white,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eef0f3',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eef0f3',
    backgroundColor: colors.offWhite,
  },
  tableCell: {
    fontSize: 9.5,
    color: colors.grayDark,
    textAlign: 'right',
    paddingHorizontal: 4,
    fontFamily: FONT_BODY,
  },
  tableCellLeft: {
    fontSize: 9.5,
    color: colors.grayDark,
    textAlign: 'left',
    paddingHorizontal: 4,
    fontFamily: FONT_BODY,
  },

  // ---- Pull-quote / promise ----
  promise: {
    backgroundColor: colors.goldPale,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 14,
    marginVertical: 14,
  },
  promiseText: {
    fontSize: 12,
    fontFamily: FONT_DISPLAY,
    fontStyle: 'italic',
    color: colors.navy,
    lineHeight: 1.45,
  },

  // ---- Spacer / Divider ----
  spacer: { height: 12 },
  spacerLg: { height: 24 },
  divider: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginVertical: 12,
  },
});

export default styles;
