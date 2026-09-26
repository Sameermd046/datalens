export interface SampleDataset {
  id: string;
  name: string;
  category: string;
  description: string;
  rowCount: number;
  columnCount: number;
  data: Record<string, any>[];
}

export const SAMPLE_SALES_DATA: Record<string, any>[] = [
  { order_id: "ORD-1001", order_date: "2026-01-05", customer_name: "Emma Watson", region: "North America", category: "Electronics", product: "Wireless Noise-Canceling Headphones", unit_price: 199.99, quantity: 2, discount_pct: 0.10, total_sales: 359.98, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1002", order_date: "2026-01-07", customer_name: "Liam Smith", region: "Europe", category: "Office Supplies", product: "Ergonomic Mesh Chair", unit_price: 249.50, quantity: 1, discount_pct: 0.05, total_sales: 237.02, payment_method: "PayPal", rating: 4 },
  { order_id: "ORD-1003", order_date: "2026-01-10", customer_name: "Sophia Chen", region: "Asia Pacific", category: "Electronics", product: "UltraWide 4K Monitor", unit_price: 499.00, quantity: 1, discount_pct: 0.15, total_sales: 424.15, payment_method: "Bank Transfer", rating: 5 },
  { order_id: "ORD-1004", order_date: "2026-01-12", customer_name: "Noah Johnson", region: "North America", category: "Furniture", product: "Electric Standing Desk", unit_price: 399.00, quantity: 2, discount_pct: 0.00, total_sales: 798.00, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1005", order_date: "2026-01-15", customer_name: "Olivia Brown ", region: "Europe", category: "Accessories", product: "Mechanical Keyboard RGB", unit_price: 129.99, quantity: 3, discount_pct: 0.10, total_sales: 350.97, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1006", order_date: "2026-01-18", customer_name: "Lucas Garcia", region: "Latin America", category: "Electronics", product: "USB-C Multiport Hub", unit_price: 49.99, quantity: 5, discount_pct: 0.20, total_sales: 199.96, payment_method: "PayPal", rating: 3 },
  { order_id: "ORD-1007", order_date: "2026-01-22", customer_name: "Ava Miller", region: "North America", category: "Office Supplies", product: "Steel Filing Cabinet", unit_price: 180.00, quantity: 1, discount_pct: 0.00, total_sales: 180.00, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1008", order_date: "2026-01-25", customer_name: "Ethan Davis", region: "Asia Pacific", category: "Electronics", product: "Smart Tablet 11-inch", unit_price: 599.00, quantity: 1, discount_pct: 0.05, total_sales: 569.05, payment_method: "Bank Transfer", rating: 5 },
  { order_id: "ORD-1009", order_date: "2026-01-29", customer_name: "Mia Martinez", region: "Europe", category: "Accessories", product: "Precision Wireless Mouse", unit_price: 69.95, quantity: 2, discount_pct: 0.00, total_sales: 139.90, payment_method: "PayPal", rating: 4 },
  { order_id: "ORD-1010", order_date: "2026-02-02", customer_name: "Alexander Wilson", region: "North America", category: "Furniture", product: "Leather Executive Armchair", unit_price: 349.00, quantity: 1, discount_pct: 0.10, total_sales: 314.10, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1011", order_date: "2026-02-05", customer_name: "Charlotte Anderson", region: "Europe", category: "Electronics", product: "Wireless Noise-Canceling Headphones", unit_price: 199.99, quantity: 1, discount_pct: 0.00, total_sales: 199.99, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1012", order_date: "2026-02-09", customer_name: "Benjamin Taylor", region: "Asia Pacific", category: "Office Supplies", product: "Heavy Duty Paper Shredder", unit_price: 119.50, quantity: 2, discount_pct: 0.15, total_sales: 203.15, payment_method: "Credit Card", rating: 3 },
  { order_id: "ORD-1013", order_date: "2026-02-12", customer_name: "Amelia Thomas", region: "Latin America", category: "Furniture", product: "Electric Standing Desk", unit_price: 399.00, quantity: 1, discount_pct: 0.05, total_sales: 379.05, payment_method: "PayPal", rating: 4 },
  { order_id: "ORD-1014", order_date: "2026-02-15", customer_name: "James Jackson", region: "North America", category: "Electronics", product: "UltraWide 4K Monitor", unit_price: 499.00, quantity: 2, discount_pct: 0.10, total_sales: 898.20, payment_method: "Bank Transfer", rating: 5 },
  { order_id: "ORD-1015", order_date: "2026-02-18", customer_name: "Harper White", region: "Europe", category: "Accessories", product: "Fast Charging Dock", unit_price: 89.00, quantity: null, discount_pct: 0.00, total_sales: 89.00, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1016", order_date: "2026-02-21", customer_name: "William Harris", region: "North America", category: "Office Supplies", product: "Ergonomic Footrest", unit_price: 45.00, quantity: 4, discount_pct: 0.20, total_sales: 144.00, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1017", order_date: "2026-02-25", customer_name: "Evelyn Martin", region: "Asia Pacific", category: "Electronics", product: "Smart Tablet 11-inch", unit_price: 599.00, quantity: 2, discount_pct: 0.10, total_sales: 1078.20, payment_method: "Bank Transfer", rating: 5 },
  { order_id: "ORD-1018", order_date: "2026-02-28", customer_name: "Lucas Garcia", region: "Latin America", category: "Electronics", product: "USB-C Multiport Hub", unit_price: 49.99, quantity: 3, discount_pct: 0.05, total_sales: 142.47, payment_method: "PayPal", rating: 4 },
  { order_id: "ORD-1019", order_date: "2026-03-03", customer_name: "Abigail Thompson", region: "Europe", category: "Furniture", product: "Ergonomic Mesh Chair", unit_price: 249.50, quantity: 2, discount_pct: 0.10, total_sales: 449.10, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1020", order_date: "2026-03-07", customer_name: "Henry Moore", region: "North America", category: "Accessories", product: "Mechanical Keyboard RGB", unit_price: 129.99, quantity: 1, discount_pct: 0.00, total_sales: 129.99, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1021", order_date: "2026-03-10", customer_name: "Emily Clark", region: "North America", category: "Electronics", product: "Wireless Noise-Canceling Headphones", unit_price: 199.99, quantity: 3, discount_pct: 0.15, total_sales: 509.97, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1022", order_date: "2026-03-14", customer_name: "Daniel Lewis", region: "Europe", category: "Office Supplies", product: "Steel Filing Cabinet", unit_price: 180.00, quantity: 2, discount_pct: 0.05, total_sales: 342.00, payment_method: "PayPal", rating: 4 },
  { order_id: "ORD-1023", order_date: "2026-03-18", customer_name: "Ella Robinson", region: "Asia Pacific", category: "Electronics", product: "UltraWide 4K Monitor", unit_price: 499.00, quantity: 1, discount_pct: 0.00, total_sales: 499.00, payment_method: "Bank Transfer", rating: 4 },
  { order_id: "ORD-1024", order_date: "2026-03-21", customer_name: "Matthew Walker", region: "Latin America", category: "Accessories", product: "Precision Wireless Mouse", unit_price: 69.95, quantity: 4, discount_pct: 0.10, total_sales: 251.82, payment_method: "Credit Card", rating: 3 },
  { order_id: "ORD-1025", order_date: "2026-03-25", customer_name: "Chloe Hall", region: "North America", category: "Furniture", product: "Electric Standing Desk", unit_price: 399.00, quantity: 1, discount_pct: 0.00, total_sales: 399.00, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1026", order_date: "2026-03-28", customer_name: "Jackson Allen", region: "Europe", category: "Electronics", product: "Smart Tablet 11-inch", unit_price: 599.00, quantity: 1, discount_pct: 0.20, total_sales: 479.20, payment_method: "PayPal", rating: 4 },
  { order_id: "ORD-1027", order_date: "2026-04-01", customer_name: "Aria Young", region: "North America", category: "Office Supplies", product: "Ergonomic Mesh Chair", unit_price: 249.50, quantity: 2, discount_pct: 0.00, total_sales: 499.00, payment_method: "Credit Card", rating: 5 },
  { order_id: "ORD-1028", order_date: "2026-04-05", customer_name: "Sebastian King", region: "Asia Pacific", category: "Accessories", product: "Fast Charging Dock", unit_price: 89.00, quantity: 2, discount_pct: 0.10, total_sales: 160.20, payment_method: "Bank Transfer", rating: 4 },
  { order_id: "ORD-1029", order_date: "2026-04-09", customer_name: "Grace Wright", region: "North America", category: "Electronics", product: "USB-C Multiport Hub", unit_price: 49.99, quantity: 6, discount_pct: 0.15, total_sales: 254.95, payment_method: "Credit Card", rating: 4 },
  { order_id: "ORD-1030", order_date: "2026-04-12", customer_name: "Logan Scott", region: "Europe", category: "Furniture", product: "Leather Executive Armchair", unit_price: 349.00, quantity: 2, discount_pct: 0.10, total_sales: 628.20, payment_method: "Credit Card", rating: 5 }
];

export const SAMPLE_EMPLOYEE_DATA: Record<string, any>[] = [
  { emp_id: "EMP-001", full_name: "Sarah Jenkins", department: "Engineering", job_title: "Senior Backend Engineer", hire_date: "2021-03-15", salary: 142000, performance_score: 4.8, experience_years: 8, remote_status: "Remote", education: "Master" },
  { emp_id: "EMP-002", full_name: "David Kim", department: "Product", job_title: "Product Manager", hire_date: "2022-06-01", salary: 128000, performance_score: 4.5, experience_years: 6, remote_status: "Hybrid", education: "Bachelor" },
  { emp_id: "EMP-003", full_name: "Elena Rostova", department: "Design", job_title: "Lead UI/UX Designer", hire_date: "2020-01-20", salary: 119000, performance_score: 4.9, experience_years: 9, remote_status: "Remote", education: "Bachelor" },
  { emp_id: "EMP-004", full_name: "Marcus Vance ", department: "Engineering", job_title: "DevOps Engineer", hire_date: "2023-02-10", salary: 135000, performance_score: 4.2, experience_years: 5, remote_status: "Hybrid", education: "Bachelor" },
  { emp_id: "EMP-005", full_name: "Priya Sharma", department: "Data Science", job_title: "Machine Learning Engineer", hire_date: "2022-11-15", salary: 155000, performance_score: 4.7, experience_years: 7, remote_status: "Remote", education: "PhD" },
  { emp_id: "EMP-006", full_name: "Lucas Moreau", department: "Marketing", job_title: "Growth Marketing Specialist", hire_date: "2023-07-01", salary: 89000, performance_score: 3.9, experience_years: 4, remote_status: "On-site", education: "Bachelor" },
  { emp_id: "EMP-007", full_name: "Aaliyah Brooks", department: "Sales", job_title: "Enterprise Account Exec", hire_date: "2021-09-01", salary: 110000, performance_score: 4.6, experience_years: 6, remote_status: "Remote", education: "Bachelor" },
  { emp_id: "EMP-008", full_name: "Hannah Schmidt", department: "Engineering", job_title: "Frontend Architect", hire_date: "2019-08-12", salary: 148000, performance_score: 4.8, experience_years: 10, remote_status: "Remote", education: "Master" },
  { emp_id: "EMP-009", full_name: "Carlos Mendez", department: "Customer Support", job_title: "Support Operations Lead", hire_date: "2022-04-18", salary: 74000, performance_score: 4.3, experience_years: 5, remote_status: "On-site", education: "Associate" },
  { emp_id: "EMP-010", full_name: "Maya Patel", department: "Data Science", job_title: "Senior BI Analyst", hire_date: "2021-01-10", salary: 118000, performance_score: 4.6, experience_years: 6, remote_status: "Hybrid", education: "Master" },
  { emp_id: "EMP-011", full_name: "Thomas Berg", department: "Sales", job_title: "Sales Director", hire_date: "2018-05-20", salary: 175000, performance_score: 4.9, experience_years: 12, remote_status: "Hybrid", education: "Master" },
  { emp_id: "EMP-012", full_name: "Zoe Chen", department: "Product", job_title: "Associate Product Manager", hire_date: "2024-01-15", salary: 92000, performance_score: 4.1, experience_years: 2, remote_status: "On-site", education: "Bachelor" },
  { emp_id: "EMP-013", full_name: "Robert Fox", department: "Engineering", job_title: "Full Stack Engineer", hire_date: "2023-04-01", salary: 122000, performance_score: 4.4, experience_years: 4, remote_status: "Remote", education: "Bachelor" },
  { emp_id: "EMP-014", full_name: "Fatima Al-Sayed", department: "Design", job_title: "Product Designer", hire_date: "2022-08-25", salary: 98000, performance_score: 4.5, experience_years: 4, remote_status: "Hybrid", education: "Master" },
  { emp_id: "EMP-015", full_name: "Arthur Pendelton", department: "Engineering", job_title: "VP of Engineering", hire_date: "2017-02-14", salary: 230000, performance_score: 4.9, experience_years: 16, remote_status: "Hybrid", education: "PhD" },
  { emp_id: "EMP-016", full_name: "Chloe Dupont", department: "Marketing", job_title: "Content Marketing Strategist", hire_date: "2023-09-10", salary: 82000, performance_score: 4.0, experience_years: 3, remote_status: "Remote", education: "Bachelor" },
  { emp_id: "EMP-017", full_name: "Kenji Sato", department: "Engineering", job_title: "Site Reliability Engineer", hire_date: "2021-11-01", salary: 138000, performance_score: 4.7, experience_years: 7, remote_status: "Remote", education: "Bachelor" },
  { emp_id: "EMP-018", full_name: "Jessica Ramos", department: "Sales", job_title: "Account Executive", hire_date: "2022-10-15", salary: 95000, performance_score: 4.3, experience_years: 4, remote_status: "On-site", education: "Bachelor" },
  { emp_id: "EMP-019", full_name: "Nico Mueller", department: "Data Science", job_title: "Data Engineer", hire_date: "2022-03-01", salary: 130000, performance_score: 4.4, experience_years: 5, remote_status: "Hybrid", education: "Master" },
  { emp_id: "EMP-020", full_name: "Emily Watson", department: "Human Resources", job_title: "People Operations Manager", hire_date: "2020-07-12", salary: 104000, performance_score: 4.7, experience_years: 7, remote_status: "Hybrid", education: "Bachelor" }
];

export const SAMPLE_CUSTOMER_DATA: Record<string, any>[] = [
  { customer_id: "CUST-8001", signup_date: "2024-03-10", plan_tier: "Enterprise", monthly_spend: 1450.00, tenure_months: 24, support_tickets: 3, satisfaction_score: 9.2, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8002", signup_date: "2024-05-18", plan_tier: "Professional", monthly_spend: 349.00, tenure_months: 18, support_tickets: 1, satisfaction_score: 8.7, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8003", signup_date: "2024-01-22", plan_tier: "Starter", monthly_spend: 49.00, tenure_months: 6, support_tickets: 7, satisfaction_score: 4.5, auto_renew: false, churn_status: "Churned" },
  { customer_id: "CUST-8004", signup_date: "2024-08-04", plan_tier: "Professional", monthly_spend: 399.00, tenure_months: 14, support_tickets: 2, satisfaction_score: 8.9, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8005", signup_date: "2023-11-15", plan_tier: "Enterprise", monthly_spend: 2100.00, tenure_months: 28, support_tickets: 5, satisfaction_score: 9.5, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8006", signup_date: "2024-09-01", plan_tier: "Starter", monthly_spend: 49.00, tenure_months: 4, support_tickets: 4, satisfaction_score: 5.1, auto_renew: false, churn_status: "Churned" },
  { customer_id: "CUST-8007", signup_date: "2024-02-14", plan_tier: "Professional", monthly_spend: 320.00, tenure_months: 16, support_tickets: 0, satisfaction_score: 9.0, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8008", signup_date: "2024-06-30", plan_tier: "Starter", monthly_spend: 79.00, tenure_months: 8, support_tickets: 2, satisfaction_score: 7.4, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8009", signup_date: "2023-09-12", plan_tier: "Enterprise", monthly_spend: 1850.00, tenure_months: 30, support_tickets: 4, satisfaction_score: 9.1, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8010", signup_date: "2024-04-05", plan_tier: "Professional", monthly_spend: 299.00, tenure_months: 12, support_tickets: 8, satisfaction_score: 4.8, auto_renew: false, churn_status: "Churned" },
  { customer_id: "CUST-8011", signup_date: "2024-07-20", plan_tier: "Starter", monthly_spend: 49.00, tenure_months: 5, support_tickets: 3, satisfaction_score: 6.8, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8012", signup_date: "2023-12-08", plan_tier: "Enterprise", monthly_spend: 2800.00, tenure_months: 26, support_tickets: 2, satisfaction_score: 9.8, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8013", signup_date: "2024-10-12", plan_tier: "Professional", monthly_spend: 380.00, tenure_months: 9, support_tickets: 1, satisfaction_score: 8.5, auto_renew: true, churn_status: "Active" },
  { customer_id: "CUST-8014", signup_date: "2024-01-05", plan_tier: "Starter", monthly_spend: 59.00, tenure_months: 7, support_tickets: 6, satisfaction_score: 4.1, auto_renew: false, churn_status: "Churned" },
  { customer_id: "CUST-8015", signup_date: "2024-03-28", plan_tier: "Professional", monthly_spend: 420.00, tenure_months: 15, support_tickets: 2, satisfaction_score: 8.8, auto_renew: true, churn_status: "Active" }
];

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "sales",
    name: "ecommerce_sales_2026.csv",
    category: "Retail & E-Commerce",
    description: "Multi-channel retail orders covering product categories, order values, units sold, discount margins, customer ratings, and global regions.",
    rowCount: SAMPLE_SALES_DATA.length,
    columnCount: Object.keys(SAMPLE_SALES_DATA[0]).length,
    data: SAMPLE_SALES_DATA
  },
  {
    id: "employee",
    name: "tech_enterprise_headcount.csv",
    category: "HR & People Analytics",
    description: "Enterprise headcount metrics with departments, compensation levels, performance ratings, experience years, education, and remote work distributions.",
    rowCount: SAMPLE_EMPLOYEE_DATA.length,
    columnCount: Object.keys(SAMPLE_EMPLOYEE_DATA[0]).length,
    data: SAMPLE_EMPLOYEE_DATA
  },
  {
    id: "customer",
    name: "saas_customer_retention.csv",
    category: "SaaS & Subscription",
    description: "Subscription accounts tracking plan tiers, recurring monthly revenues, tenure, support ticket frequency, customer satisfaction, and churn outcomes.",
    rowCount: SAMPLE_CUSTOMER_DATA.length,
    columnCount: Object.keys(SAMPLE_CUSTOMER_DATA[0]).length,
    data: SAMPLE_CUSTOMER_DATA
  }
];
