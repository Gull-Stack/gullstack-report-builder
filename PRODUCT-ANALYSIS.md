# Federal Retirement Report Calculator — Complete Product Analysis

## Competitors Analyzed
1. **FedRetireSoftware.com** (fedretireonline.com) — The incumbent. 50+ page report, $99/yr personal, $679/yr professional
2. **RetireReady Solutions** (retireready.com) — TRAK "The Retirement Analysis Kit" — advisor-focused SaaS
3. **FedCalc.com** — Simpler online calculator, CSRS/FERS focused
4. **OPM.gov** — Official government calculators (basic, no reports)
5. **MyFedBenefits** — Free basic calculators with upsell to advisor services

---

## WHAT THE REPORT ACTUALLY CALCULATES (57-page report structure from FedRetireSoftware)

### Report Sections (in order):
1. Cover Page (customizable — advisor branding)
2. Disclaimer
3. Benefits Analysis (overview)
4. **Federal Employee Benefits Summary** — master overview of all benefits
5. **Federal Income Analysis — Monthly** (current income vs first month in retirement)
6. **Annual Income — Government** (year-by-year from now through retirement + 30 years)
7. **Monthly Income — Government** (same, monthly view)
8. **Annual Income — Other Sources** (non-government income)
9. **Annual Income Summary — Other Sources**
10. **Monthly Income — Other Sources**
11. **Annual Expense — Government** (FEGLI, FEHB, survivor benefit costs, taxes)
12. **Monthly Expense — Government**
13. **Annual Expense — Other Sources**
14. **Annual Expense Summary — Other Sources**
15. **Monthly Expense — Other Sources**
16. **Annual Income/Expense — Government Sources** (net comparison)
17. **Monthly Income/Expense — Government Sources**
18. **Annual Income/Expense — Other Sources**
19. **Monthly Income/Expense — Other Sources**
20. **Annual Income/Expense — All Sources Combined**
21. **Monthly Income/Expense — All Sources Combined**
22. **Proposed & Delayed Retirement** (what-if: retire at different ages)
23. **Annuity and Survivor Benefit** (detailed breakdown)
24. **Retirement Annuity and Surviving Spouse Benefit**
25. **FERS Supplement and Estimated Social Security Benefits**
26. **CSRS Offset and Estimated Social Security Benefits**
27. **Thrift Savings Plan — Overview**
28. **TSP Disclaimer**
29. **TSP — Fund Allocation & Growth**
30. **TSP — Contributions and Hypothetical Savings** (year by year)
31. **TSP — Withdrawal Options**
32. **TSP — ROTH Contributions and Hypothetical**
33. **FEGLI — Current Coverage**
34. **FEGLI — Cost Over Time**
35. **FEGLI — Benefits at Different Ages**
36. **FEHB — Health Benefits Program**
37. **FEHB — Cost Projections**
38. **Long Term Care Insurance**
39. **Long Term Care Insurance — Government**
40. **Life Insurance Cost Analysis**
41. **FEGLI and Survivor Benefit Accumulated Cost**
42. **Input Data** (everything the user entered)
43. **Retirement Eligibility** (dates and requirements)
44. **Creditable Service** (detailed breakdown)
45. **High 3 Average** (salary computation)
46. **Military Service** (buyback calculations)
47. **Deposit** (civilian service deposit)
48. **Redeposit** (refunded service redeposit)

---

## REQUIRED INPUT DATA (Fact Finder)

### Personal Information
- Full name
- Date of birth
- Address
- Marital status
- Spouse date of birth (for survivor benefits)

### Employment Information
- Service Computation Date (SCD)
- Retirement system: FERS, CSRS, CSRS Offset, FERS Transfer
- Employee type: Regular, Law Enforcement Officer (LEO), Firefighter, Air Traffic Controller (ATC), Postal
- Current annual salary
- Annual salary increase estimate (%)
- Creditable service years/months
- Sick leave balance (hours)
- Planned retirement date

### TSP (Thrift Savings Plan)
- Current balances by fund: G, F, C, S, I, L (Traditional AND Roth separately)
- Annual contribution amount (Traditional)
- Annual contribution amount (Roth)
- Government match percentage/amount
- Catch-up contributions (if age 50+)
- Expected rate of return per fund
- Planned withdrawal age
- Withdrawal method: lump sum, monthly payments, life annuity, or combination

### FEGLI (Life Insurance)
- Basic coverage elected (yes/no)
- Option A: Standard ($10,000)
- Option B: Additional (1x-5x salary)
- Option C: Family (spouse + children)
- Current multiples elected

### FEHB (Health Benefits)
- Current plan name
- Self only vs Self & Family vs Self Plus One
- Current biweekly premium
- Estimated premium increase rate

### Social Security
- Estimated monthly benefit at age 62
- Estimated monthly benefit at FRA (Full Retirement Age)
- Planned SS start age

### Long Term Care Insurance (FLTCIP)
- Enrolled (yes/no)
- Current premium
- Daily benefit amount
- Benefit period

### Other Income Sources
- Pensions from other employers
- Spouse income
- Rental income
- Investment income
- Other taxable income
- Other non-taxable income

### Expenses
- Living expenses (summarized OR itemized):
  - Housing (mortgage/rent, property tax, insurance, HOA)
  - Utilities
  - Transportation
  - Food
  - Healthcare (out of pocket)
  - Insurance (auto, life, etc.)
  - Debt payments
  - Entertainment
  - Travel
  - Charitable giving
  - Other

### Tax Information
- Federal tax filing status
- Federal tax withholding amount OR estimated rate
- State of residence
- State tax withholding amount OR estimated rate

### Military Service (if applicable)
- Branch
- Active duty dates
- Military deposit paid (yes/no)
- Deposit amount owed

### Civilian Deposits/Redeposits
- Non-deduction service periods
- Deposit owed
- Redeposit owed (for refunded service)
- Interest calculations

---

## CORE ALGORITHMS & FORMULAS

### 1. FERS Basic Annuity
```
IF age >= 62 AND years_of_service >= 20:
    annuity = high_3_avg * 0.011 * years_of_service
ELSE:
    annuity = high_3_avg * 0.01 * years_of_service
```

### 2. CSRS Basic Annuity
```
first_5_years = high_3_avg * 0.015 * min(years_of_service, 5)
next_5_years = high_3_avg * 0.0175 * min(max(years_of_service - 5, 0), 5)
remaining_years = high_3_avg * 0.02 * max(years_of_service - 10, 0)
annuity = first_5_years + next_5_years + remaining_years
```

### 3. CSRS Offset Annuity
```
Same as CSRS, but reduced at age 62 by the amount of Social Security
benefit earned during CSRS Offset service
```

### 4. FERS Transfer Annuity (two components)
```
CSRS_component = CSRS formula applied to CSRS service years
FERS_component = FERS formula applied to FERS service years
total_annuity = CSRS_component + FERS_component
```

### 5. Special Provisions (LEO, Firefighter, ATC)
```
first_20_years = high_3_avg * 0.017 * min(years_of_service, 20)
remaining_years = high_3_avg * 0.01 * max(years_of_service - 20, 0)
annuity = first_20_years + remaining_years
```

### 6. High-3 Average Salary
```
Project salary forward from current:
for each year until retirement:
    salary = salary * (1 + annual_increase_rate)
high_3 = average of highest 3 consecutive years of basic pay
```

### 7. Creditable Service
```
total_service = civilian_service + military_service + sick_leave_credit
sick_leave_credit = sick_leave_hours / 2087 (hours per year)
Note: Fractional months dropped from total
```

### 8. Survivor Benefit
```
IF election == "50% survivor":
    cost = annuity * 0.10 (10% reduction)
    survivor_annuity = annuity * 0.50
ELIF election == "25% survivor":
    cost = annuity * 0.05 (5% reduction)
    survivor_annuity = annuity * 0.25
ELIF election == "none":
    cost = 0
    survivor_annuity = 0
```

### 9. FERS Supplement (Special Retirement Supplement)
```
Eligibility: FERS retirees who retire before age 62 (not MRA+10)
supplement = (estimated_SS_age_62 * years_of_FERS_service) / 40
Paid from retirement until age 62
Subject to earnings test
```

### 10. Social Security Estimate
```
Based on: 
- Estimated benefit at age 62 (user input or SSA estimate)
- COLA adjustments (configurable, default ~1.5%)
- Delayed retirement credits for claiming after 62
- Full Retirement Age varies by birth year (66-67)
```

### 11. COLA (Cost of Living Adjustment)
```
FERS:
    IF CPI_increase <= 2%: COLA = CPI_increase
    ELIF CPI_increase <= 3%: COLA = 2%
    ELSE: COLA = CPI_increase - 1%

CSRS:
    COLA = full CPI increase (no cap)
```

### 12. TSP Growth Projections
```
For each year until withdrawal:
    balance = (previous_balance + contributions + govt_match) * (1 + return_rate)
    
Per-fund projections using individual fund rates of return
Combined Traditional + Roth projections
```

### 13. TSP Withdrawal Options
```
Option 1: Single lump sum
Option 2: Monthly payments (fixed dollar or life expectancy based)
Option 3: Life annuity (MetLife rates)
Option 4: Combination of above
```

### 14. FEGLI Cost Calculations
```
Basic: Age-banded biweekly rates (published by OPM)
    Coverage = salary rounded up to nearest $1,000 + $2,000
    Reduces at 65: Option to keep 75%, 50%, 25%, or 0%
    
Option A: $10,000 flat, age-banded rates
    Reduces after 65
    
Option B: 1x-5x salary, age-banded rates
    No automatic reduction (but can elect)
    
Option C: $5,000 per spouse, $2,500 per child
    Age-banded rates per multiple
```

### 15. FEHB Projections
```
current_premium * (1 + premium_increase_rate) ^ years
Compare: employee share vs total premium
Note: Government continues to pay ~72% in retirement
```

### 16. MRA+10 Early Retirement Penalty
```
IF MRA+10 retirement:
    reduction_per_month = 5/12 of 1% (= 5% per year)
    months_under_62 = (62 - retirement_age) * 12
    total_reduction = months_under_62 * (5/12 * 0.01)
    
Can be eliminated by deferring annuity start
```

### 17. Deposit & Redeposit Calculations
```
Deposit (for non-deduction service):
    deposit = service_earnings * deposit_rate (varies by year)
    interest = compound interest from midpoint of service to payment
    
Redeposit (for refunded service):
    redeposit = original_deductions + interest
    Penalty if unpaid: actuarial reduction to CSRS component
```

### 18. Income Comparison (Key Report Feature)
```
Last paycheck analysis:
    gross_salary
    - retirement_contributions
    - TSP contributions
    - FICA/Medicare
    - federal_tax
    - state_tax
    - FEGLI premiums
    - FEHB premiums
    - dental/vision
    - FSA
    - other_deductions
    = net_take_home

First retirement check:
    annuity
    - survivor_benefit_cost
    - federal_tax (estimated)
    - state_tax (estimated)
    - FEGLI premiums (new rates)
    - FEHB premiums (full share)
    - dental/vision
    + FERS_supplement (if eligible)
    + Social_Security (if age eligible)
    + TSP_withdrawals (if planned)
    + other_income
    = net_retirement_income

DELTA = net_retirement_income - net_take_home
```

### 19. Retirement Eligibility Dates
```
FERS Regular:
    MRA + 10 years service (MRA = 55-57 based on birth year)
    Age 60 + 20 years service
    Age 62 + 5 years service

FERS Special Provisions (LEO/FF/ATC):
    Age 50 + 20 years service
    Any age + 25 years service

CSRS:
    Age 55 + 30 years
    Age 60 + 20 years
    Age 62 + 5 years
```

---

## WHAT MAKES THESE REPORTS ACCURATE

1. **OPM formulas are public** — all computation rules are published at opm.gov
2. **Age-banded FEGLI rates** — published annually by OPM
3. **COLA calculations** — use actual CPI data for historical, configurable for projections
4. **TSP fund data** — historical returns are public via tsp.gov
5. **Social Security rules** — SSA publishes all formulas, bend points, and delayed credit rates
6. **Tax tables** — IRS publishes annually
7. **The "secret sauce" is NOT the math** — it's packaging 50+ pages of projections into one coherent report that a financial advisor can walk through with a client

---

## COMPETITIVE PRICING
- FedRetireSoftware Personal Plus: $99/year
- FedRetireSoftware Professional: $679/year
- FedRetireSoftware Enterprise: Contact (multi-user, admin oversight)
- RetireReady TRAK: ~$1,200+/year (advisor license)
- FedCalc: Free basic / $99 premium
- OPM: Free (very basic, no report)

---

## BUILD STRATEGY FOR CAPITALWEALTH.COM

### What to Build
A web-based federal retirement benefits calculator that generates a comprehensive PDF report matching (and exceeding) the FedRetireSoftware 50+ page report.

### Tech Stack Recommendation
- **Frontend:** Next.js (React) — multi-step form wizard
- **Calculation Engine:** TypeScript/Node.js — all formulas server-side
- **PDF Generation:** React-PDF or Puppeteer (HTML → PDF)
- **Data Storage:** PostgreSQL (user accounts, saved calculations)
- **Hosting:** Vercel + Railway (matches existing stack)

### Phase 1: MVP (Core Calculator)
- FERS basic annuity calculation
- High-3 average salary projection
- Creditable service calculator (including sick leave)
- Retirement eligibility date calculator
- Survivor benefit options and costs
- FERS Supplement calculation
- Basic income comparison (last paycheck vs first retirement check)
- 10-page PDF report

### Phase 2: Full Report
- TSP growth projections (all funds, Traditional + Roth)
- TSP withdrawal options comparison
- FEGLI cost analysis through retirement
- FEHB cost projections
- Social Security integration
- COLA projections (year-by-year)
- Full 50+ page PDF report
- Annual income/expense tables (30+ year projections)

### Phase 3: Advanced
- CSRS, CSRS Offset, FERS Transfer support
- Special provisions (LEO, FF, ATC)
- Military service buyback calculator
- Deposit/redeposit calculations
- MRA+10 penalty analysis
- Delayed retirement comparison
- White-label advisor branding
- Multi-user/enterprise features

### Phase 4: Differentiators (Beat the Competition)
- **AI-powered recommendations** — "Based on your numbers, you should consider..."
- **What-if scenarios** — interactive sliders (retire at 58 vs 60 vs 62)
- **Modern UI** — their tools look like 2008. We build 2026.
- **Mobile-first** — they're desktop-only
- **API integration** — pull TSP balances automatically
- **Real-time COLA data** — auto-update from BLS
- **Comparison mode** — side-by-side retirement date scenarios
- **Advisor dashboard** — manage multiple clients
- **Automated updates** — re-run reports when rates change

---

## KEY DATA SOURCES (Free/Public)
- OPM.gov: All FERS/CSRS computation rules, FEGLI rates, eligibility rules
- TSP.gov: Fund performance data, contribution limits
- SSA.gov: Social Security formulas, bend points, FRA tables
- BLS.gov: CPI data for COLA projections
- IRS.gov: Tax tables, brackets, standard deductions
